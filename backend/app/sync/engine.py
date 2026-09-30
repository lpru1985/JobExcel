# app/sync/engine.py
"""
Ядро синхронизации: Pandas + SQLAlchemy.
Реализует UPSERT и SOFT DELETE по ключу "Номер УС".
"""

import logging
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import SyncRecord, SyncLog
from app.sync.validator import validate_excel_schema

logger = logging.getLogger(__name__)

# Столбец-ключ для синхронизации (должен совпадать с заголовком в Excel)
BUSINESS_KEY = "Номер УС"


class SyncEngine:
    """
    Движок синхронизации Excel → БД.

    Алгоритм:
    1. Копирует файл в temp (защита от PermissionError).
    2. Валидирует схему (проверяет наличие BUSINESS_KEY).
    3. Удаляет дубликаты по ключу (берёт последнюю строку).
    4. Выполняет UPSERT в транзакции.
    5. Выполняет SOFT DELETE для отсутствующих записей.
    6. Логирует все операции.
    """

    def __init__(self, session: Session):
        self.session = session
        self.stats: dict[str, int] = {
            "inserts": 0,
            "updates": 0,
            "soft_deletes": 0,
            "errors": 0,
        }
        self.notifications: list[dict[str, str]] = []

    def process_file(self, file_path: Path) -> dict[str, Any]:
        """
        Главный метод обработки файла.

        Args:
            file_path: Путь к Excel-файлу.

        Returns:
            Словарь с результатом обработки (статус, статистика, уведомления).
        """
        temp_path: str | None = None
        start_time = datetime.utcnow()

        try:
            # 1. Копируем файл для защиты от блокировок
            temp_path = self._safe_copy(file_path)
            logger.info(f"Файл скопирован в temp: {temp_path}")

            # 2. Читаем Excel через Pandas
            df = pd.read_excel(temp_path, engine="openpyxl")
            logger.info(f"Прочитано строк: {len(df)}, столбцов: {list(df.columns)}")

            # 3. Валидация схемы
            validate_excel_schema(df, required_column=BUSINESS_KEY)

            # 4. Удаление дублей (берём последнюю строку)
            df = self._deduplicate(df)
            logger.info(f"После дедупликации: {len(df)} строк")

            # Логируем начало
            self._log_action(file_path.name, "START", f"Начало обработки файла {file_path.name}")

            # 5. Синхронизация в транзакции
            self._sync_data(df, source_file=file_path.name)

            # 6. Логируем завершение
            self._log_action(
                file_path.name, "COMPLETE",
                f"Синхронизация завершена. INSERT: {self.stats['inserts']}, "
                f"UPDATE: {self.stats['updates']}, SOFT_DELETE: {self.stats['soft_deletes']}"
            )

            # 7. Коммит транзакции
            self.session.commit()
            logger.info("Транзакция успешно закоммичена")

            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"Время обработки: {duration:.2f} сек")

            return {
                "status": "success",
                "file": file_path.name,
                "stats": self.stats,
                "notifications": self.notifications,
                "duration": duration,
            }

        except Exception as e:
            # Откат при ошибке
            self.session.rollback()
            logger.error(f"Ошибка синхронизации: {e}", exc_info=True)
            self._log_error(file_path.name, str(e))
            self.stats["errors"] += 1
            return {
                "status": "error",
                "file": file_path.name,
                "error": str(e),
                "stats": self.stats,
            }

        finally:
            # Очистка temp-файла
            if temp_path and Path(temp_path).exists():
                try:
                    Path(temp_path).unlink()
                    Path(temp_path).parent.rmdir()
                except OSError:
                    pass

    def _safe_copy(self, source: Path) -> str:
        """Копирует файл в temp для обхода PermissionError."""
        temp_dir = tempfile.mkdtemp(prefix="excel_sync_")
        temp_path = Path(temp_dir) / source.name
        shutil.copy2(str(source), str(temp_path))
        return str(temp_path)

    def _deduplicate(self, df: pd.DataFrame) -> pd.DataFrame:
        """Удаляет дубликаты по BUSINESS_KEY, оставляя последнюю строку."""
        if df[BUSINESS_KEY].duplicated().any():
            dup_count = int(df[BUSINESS_KEY].duplicated().sum())
            logger.warning(f"Найдено {dup_count} дубликатов по '{BUSINESS_KEY}'")
        return df.drop_duplicates(subset=[BUSINESS_KEY], keep="last")

    def _sync_data(self, df: pd.DataFrame, source_file: str) -> None:
        """Выполняет UPSERT + SOFT DELETE в рамках транзакции."""
        # Получаем все ключи из БД
        existing_records = self.session.execute(
            select(SyncRecord.номер_ус, SyncRecord.id)
        ).all()
        db_keys: set[str] = {str(row[0]) for row in existing_records}
        db_map: dict[str, int] = {str(row[0]): row[1] for row in existing_records}

        # Ключи из Excel
        excel_keys: set[str] = set(df[BUSINESS_KEY].astype(str).tolist())

        # === INSERT: новые записи ===
        new_keys = excel_keys - db_keys
        for _, row in df[df[BUSINESS_KEY].astype(str).isin(new_keys)].iterrows():
            record = SyncRecord(
                номер_ус=str(row[BUSINESS_KEY]),
                name=str(row.get("Название", "")),
                address=str(row.get("Адрес", "")),
                phone=str(row.get("Телефон", "")),
                source_file=source_file,
                is_deleted=False,
            )
            self.session.add(record)
            self.stats["inserts"] += 1
            self._add_notification(
                "INSERT", str(row[BUSINESS_KEY]),
                f"Добавлена запись: {row.get('Название', str(row[BUSINESS_KEY]))}"
            )
            self._log_action(
                source_file, "INSERT",
                f"Добавлена запись: {row[BUSINESS_KEY]}"
            )

        # === UPDATE: существующие записи ===
        common_keys = excel_keys & db_keys
        for _, row in df[df[BUSINESS_KEY].astype(str).isin(common_keys)].iterrows():
            key = str(row[BUSINESS_KEY])
            record_id = db_map[key]
            self.session.execute(
                update(SyncRecord)
                .where(SyncRecord.id == record_id)
                .values(
                    name=str(row.get("Название", "")),
                    address=str(row.get("Адрес", "")),
                    phone=str(row.get("Телефон", "")),
                    source_file=source_file,
                    is_deleted=False,  # Восстанавливаем если был archived
                    deleted_at=None,
                    updated_at=datetime.utcnow(),
                )
            )
            self.stats["updates"] += 1
            self._log_action(source_file, "UPDATE", f"Обновлена запись: {key}")

        # === SOFT DELETE: записи в БД, отсутствующие в Excel ===
        deleted_keys = db_keys - excel_keys
        for key in deleted_keys:
            record_id = db_map[key]
            self.session.execute(
                update(SyncRecord)
                .where(SyncRecord.id == record_id)
                .values(
                    is_deleted=True,
                    deleted_at=datetime.utcnow(),
                )
            )
            self.stats["soft_deletes"] += 1
            self._add_notification(
                "SOFT_DELETE", key,
                "Запись отсутствует в новом файле — архивирована"
            )
            self._log_action(
                source_file, "SOFT_DELETE",
                f"Архивирована запись: {key} — отсутствует в новом файле"
            )

        logger.info(
            f"Синхронизация: INSERT={self.stats['inserts']}, "
            f"UPDATE={self.stats['updates']}, "
            f"SOFT_DELETE={self.stats['soft_deletes']}"
        )

    def _add_notification(self, action: str, key: str, detail: str) -> None:
        """Формирует уведомление для SSE."""
        self.notifications.append({
            "type": "warning" if action == "SOFT_DELETE" else "success",
            "title": f"{action}: {key}",
            "message": detail,
        })

    def _log_action(self, file_name: str, action: str, details: str) -> None:
        """Записывает действие в sync_logs."""
        log = SyncLog(
            file_name=file_name,
            action=action,
            details=details,
            records_affected=1,
        )
        self.session.add(log)

    def _log_error(self, file_name: str, error: str) -> None:
        """Записывает ошибку в sync_logs."""
        log = SyncLog(
            file_name=file_name,
            action="ERROR",
            details=error,
            records_affected=0,
        )
        self.session.add(log)
        self.session.commit()
