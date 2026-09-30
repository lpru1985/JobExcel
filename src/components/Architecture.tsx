import { useState } from 'react';
import { Code2, FolderTree, Database, Server, FileCode } from 'lucide-react';

const tabs = ['Архитектура', 'Структура', 'Модели БД', 'Синхронизация', 'Воркер', 'FastAPI', 'Frontend', 'Запуск'];

export function Architecture() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Архитектура и код бэкенда</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeTab === i
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
        <pre className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
          {getTabContent(activeTab)}
        </pre>
      </div>
    </div>
  );
}

function getTabContent(tab: number): string {
  switch (tab) {
    case 0: return architectureContent;
    case 1: return structureContent;
    case 2: return modelsContent;
    case 3: return syncContent;
    case 4: return workerContent;
    case 5: return apiContent;
    case 6: return frontendContent;
    case 7: return launchContent;
    default: return '';
  }
}

const architectureContent = `
┌─────────────────────────────────────────────────────────────────────┐
│                    АРХИТЕКТУРА СИСТЕМЫ ETL                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│  │  /incoming_  │────▶│   Watchdog   │────▶│  Sync Worker     │   │
│  │  data/       │     │   Observer   │     │  (APScheduler)   │   │
│  │  (Excel)     │     │              │     │                  │   │
│  └──────────────┘     └──────────────┘     └────────┬─────────┘   │
│                                                      │              │
│                                          ┌───────────▼───────────┐ │
│                                          │    Pandas +           │ │
│                                          │    SQLAlchemy 2.0     │ │
│                                          │                       │ │
│                                          │  1. Read Excel        │ │
│                                          │  2. Validate schema   │ │
│                                          │  3. Dedup by key      │ │
│                                          │  4. UPSERT logic      │ │
│                                          │  5. Soft Delete       │ │
│                                          │  6. Write sync_logs   │ │
│                                          └───────────┬───────────┘ │
│                                                      │              │
│  ┌──────────────┐     ┌──────────────┐     ┌────────▼──────────┐  │
│  │   Browser    │◀────│   FastAPI    │◀────│   SQLite/PG       │  │
│  │   (React)    │ SSE │   REST API   │     │   Database        │  │
│  │              │     │   + SSE      │     │                   │  │
│  │  • Dashboard │     │              │     │  • sync_records   │  │
│  │  • Data View │     │  /api/data   │     │  • sync_logs      │  │
│  │  • Logs      │     │  /api/logs   │     │  • sync_stats     │  │
│  │  • Toasts    │     │  /api/events │     │                   │  │
│  └──────────────┘     └──────────────┘     └───────────────────┘  │
│                                                                     │
│  ПАТТЕРН: Observer → Worker → DB → SSE → UI                        │
│  ТРАНЗАКЦИОННОСТЬ: Все операции в одной транзакции                  │
│  БЛОКИРОВКИ: Файл копируется в temp перед чтением                   │
└─────────────────────────────────────────────────────────────────────┘

КЛЮЧЕВЫЕ ПРИНЦИПЫ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Primary Key: "Номер УС" — уникальный бизнес-ключ
2. UPSERT: INSERT если нет в БД, UPDATE если есть
3. Soft Delete: is_deleted=True если нет в новом Excel
4. Транзакционность: rollback при любой ошибке
5. Уведомления: SSE для real-time push в браузер
6. Логирование: logging → файл + БД (sync_logs)
`;

const structureContent = `
excel_sync_project/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI приложение + SSE
│   ├── config.py               # Настройки (пути, интервалы)
│   ├── database.py             # SQLAlchemy engine, session
│   ├── models.py               # ORM модели (SyncRecord, SyncLog)
│   ├── schemas.py              # Pydantic схемы для API
│   ├── sync/
│   │   ├── __init__.py
│   │   ├── engine.py           # Ядро синхронизации (Pandas + SA)
│   │   ├── validator.py        # Валидация Excel-схемы
│   │   └── types.py            # Маппинг типов pandas → SQL
│   ├── worker/
│   │   ├── __init__.py
│   │   ├── watcher.py          # Watchdog observer
│   │   └── scheduler.py        # APScheduler задачи
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py           # REST endpoints
│   │   └── sse.py              # Server-Sent Events
│   └── utils/
│       ├── __init__.py
│       ├── file_ops.py         # Копирование файлов, блокировки
│       └── logger.py           # Настройка логирования
├── incoming_data/              # Директория для входящих Excel
├── processed/                  # Обработанные файлы (архив)
├── logs/                       # Лог-файлы
├── frontend/                   # Статический HTML/JS (или React build)
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── tests/
│   ├── test_sync_engine.py
│   ├── test_validator.py
│   └── test_api.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
`;

const modelsContent = `# app/models.py
"""SQLAlchemy 2.0 модели для системы синхронизации."""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
    Index, UniqueConstraint, func
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Базовый класс для всех моделей."""
    pass


class SyncRecord(Base):
    """
    Основная таблица с данными из Excel.
    Primary Business Key: номер_ус (столбец "Номер УС" в Excel)
    """
    __tablename__ = "sync_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    номер_ус: Mapped[str] = mapped_column(String(50), nullable=False, index=True, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Дополнительные поля (динамически из Excel)
    extra_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="JSON для доп. полей")
    
    # Soft Delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Аудит
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    source_file: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        UniqueConstraint("номер_ус", name="uq_nomor_us"),
        Index("ix_active_records", "is_deleted", "номер_ус"),
    )

    def __repr__(self) -> str:
        status = "ARCHIVED" if self.is_deleted else "ACTIVE"
        return f"<SyncRecord {self.номер_ус} [{status}]>"


class SyncLog(Base):
    """Таблица логов синхронизации."""
    __tablename__ = "sync_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(
        String(20), nullable=False,
        comment="INSERT | UPDATE | SOFT_DELETE | ERROR | START | COMPLETE"
    )
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    records_affected: Mapped[int] = mapped_column(Integer, default=0)
    
    # Для SSE уведомлений
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    __table_args__ = (
        Index("ix_logs_timestamp", "timestamp"),
        Index("ix_logs_action", "action"),
    )

    def __repr__(self) -> str:
        return f"<SyncLog {self.action} @ {self.timestamp}>"


class SyncStats(Base):
    """Агрегированная статистика (опционально, для быстрого доступа)."""
    __tablename__ = "sync_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sync_run_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    inserts: Mapped[int] = mapped_column(Integer, default=0)
    updates: Mapped[int] = mapped_column(Integer, default=0)
    soft_deletes: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[float] = mapped_column(nullable=True)
`;

const syncContent = `# app/sync/engine.py
"""
Ядро синхронизации: Pandas + SQLAlchemy.
Реализует UPSERT и SOFT DELETE по ключу "Номер УС".
"""

import logging
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from typing import Tuple, Set

import pandas as pd
from sqlalchemy import select, update, delete
from sqlalchemy.orm import Session

from app.models import SyncRecord, SyncLog
from app.sync.validator import validate_excel_schema

logger = logging.getLogger(__name__)

# Столбец-ключ для синхронизации
BUSINESS_KEY = "Номер УС"


class SyncEngine:
    """
    Движок синхронизации Excel → БД.
    
    Алгоритм:
    1. Копирует файл в temp (защита от PermissionError)
    2. Валидирует схему (проверяет наличие BUSINESS_KEY)
    3. Удаляет дубликаты по ключу (берёт последнюю строку)
    4. Выполняет UPSERT в транзакции
    5. Выполняет SOFT DELETE для отсутствующих записей
    6. Логирует все операции
    """

    def __init__(self, session: Session):
        self.session = session
        self.stats = {"inserts": 0, "updates": 0, "soft_deletes": 0, "errors": 0}
        self.notifications: list[dict] = []

    def process_file(self, file_path: Path) -> dict:
        """Главный метод обработки файла. Возвращает статистику."""
        temp_path = None
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

            # 5. Синхронизация в транзакции
            self._sync_data(df, source_file=file_path.name)

            # 6. Коммит транзакции
            self.session.commit()
            logger.info("Транзакция успешно закоммичена")

            return {
                "status": "success",
                "file": file_path.name,
                "stats": self.stats,
                "notifications": self.notifications,
            }

        except Exception as e:
            # Откат при ошибке
            self.session.rollback()
            logger.error(f"Ошибка синхронизации: {e}", exc_info=True)
            self._log_error(file_path.name, str(e))
            return {
                "status": "error",
                "file": file_path.name,
                "error": str(e),
                "stats": self.stats,
            }

        finally:
            # Очистка temp-файла
            if temp_path and Path(temp_path).exists():
                Path(temp_path).unlink()

    def _safe_copy(self, source: Path) -> str:
        """Копирует файл в temp для обхода PermissionError."""
        temp_dir = tempfile.mkdtemp(prefix="excel_sync_")
        temp_path = Path(temp_dir) / source.name
        shutil.copy2(source, temp_path)
        return str(temp_path)

    def _deduplicate(self, df: pd.DataFrame) -> pd.DataFrame:
        """Удаляет дубликаты по BUSINESS_KEY, оставляя последнюю строку."""
        if df[BUSINESS_KEY].duplicated().any():
            dup_count = df[BUSINESS_KEY].duplicated().sum()
            logger.warning(f"Найдено {dup_count} дубликатов по '{BUSINESS_KEY}'")
        return df.drop_duplicates(subset=[BUSINESS_KEY], keep="last")

    def _sync_data(self, df: pd.DataFrame, source_file: str) -> None:
        """Выполняет UPSERT + SOFT DELETE в рамках транзакции."""
        # Получаем все ключи из БД
        existing_records = self.session.execute(
            select(SyncRecord.номер_ус, SyncRecord.id)
        ).all()
        db_keys: Set[str] = {row[0] for row in existing_records}
        db_map: dict[str, int] = {row[0]: row[1] for row in existing_records}

        # Ключи из Excel
        excel_keys: Set[str] = set(df[BUSINESS_KEY].astype(str).tolist())

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
            self._add_notification("INSERT", str(row[BUSINESS_KEY]), str(row.get("Название", "")))
            self._log_action(source_file, "INSERT",
                f"Добавлена запись: {row[BUSINESS_KEY]}")

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
            self._log_action(source_file, "UPDATE",
                f"Обновлена запись: {key}")

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
            self._add_notification("SOFT_DELETE", key, "Отсутствует в новом файле")
            self._log_action(source_file, "SOFT_DELETE",
                f"Архивирована запись: {key} — отсутствует в новом файле")

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
`;

const workerContent = `# app/worker/watcher.py
"""
Фоновый мониторинг папки /incoming_data/ с помощью watchdog.
При обнаружении нового .xlsx файла — запускает синхронизацию.
"""

import logging
import time
from pathlib import Path
from typing import Callable

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileCreatedEvent

logger = logging.getLogger(__name__)


class ExcelFileHandler(FileSystemEventHandler):
    """Обработчик событий файловой системы для Excel-файлов."""

    def __init__(self, callback: Callable[[Path], None]):
        self.callback = callback
        self._processing: set[str] = set()

    def on_created(self, event: FileCreatedEvent) -> None:
        """Вызывается при создании нового файла."""
        if event.is_directory:
            return

        file_path = Path(event.src_path)

        # Фильтр: только Excel-файлы
        if file_path.suffix.lower() not in (".xlsx", ".xls"):
            return

        # Защита от повторной обработки
        if file_path.name in self._processing:
            return

        self._processing.add(file_path.name)
        logger.info(f"Обнаружен новый файл: {file_path.name}")

        # Ждём завершения записи файла (файл может ещё копироваться)
        self._wait_for_file_ready(file_path)

        try:
            self.callback(file_path)
        except Exception as e:
            logger.error(f"Ошибка обработки {file_path.name}: {e}")
        finally:
            self._processing.discard(file_path.name)

    def _wait_for_file_ready(self, path: Path, timeout: int = 30) -> None:
        """Ждёт, пока файл будет полностью записан (размер стабилен)."""
        prev_size = -1
        waited = 0
        while waited < timeout:
            try:
                current_size = path.stat().st_size
                if current_size == prev_size and current_size > 0:
                    return
                prev_size = current_size
            except OSError:
                pass
            time.sleep(1)
            waited += 1
        logger.warning(f"Таймаут ожидания готовности файла: {path.name}")


class FolderWatcher:
    """Управление watchdog observer."""

    def __init__(self, watch_dir: str, callback: Callable[[Path], None]):
        self.watch_dir = watch_dir
        self.handler = ExcelFileHandler(callback)
        self.observer = Observer()

    def start(self) -> None:
        """Запускает мониторинг папки."""
        Path(self.watch_dir).mkdir(parents=True, exist_ok=True)
        self.observer.schedule(self.handler, self.watch_dir, recursive=False)
        self.observer.start()
        logger.info(f"Мониторинг запущен: {self.watch_dir}")

    def stop(self) -> None:
        """Останавливает мониторинг."""
        self.observer.stop()
        self.observer.join()
        logger.info("Мониторинг остановлен")


# app/worker/scheduler.py
"""
APScheduler для периодической проверки (альтернатива watchdog).
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.sync.engine import SyncEngine
from app.database import get_session

import logging
logger = logging.getLogger(__name__)


def create_scheduler(watch_dir: str) -> BackgroundScheduler:
    """Создаёт планировщик фоновых задач."""
    scheduler = BackgroundScheduler()

    @scheduler.scheduled_job(
        IntervalTrigger(seconds=30),  # Каждые 30 секунд
        id="sync_check",
        replace_existing=True,
    )
    def check_and_sync():
        """Периодическая проверка папки и синхронизация."""
        watch_path = Path(watch_dir)
        excel_files = list(watch_path.glob("*.xlsx")) + list(watch_path.glob("*.xls"))

        if not excel_files:
            return

        logger.info(f"Найдено файлов для обработки: {len(excel_files)}")

        for file_path in excel_files:
            session = get_session()
            try:
                engine = SyncEngine(session)
                result = engine.process_file(file_path)

                if result["status"] == "success":
                    # Перемещаем обработанный файл
                    processed_dir = watch_path.parent / "processed"
                    processed_dir.mkdir(exist_ok=True)
                    file_path.rename(processed_dir / file_path.name)
                    logger.info(f"Файл обработан и перемещён: {file_path.name}")

            finally:
                session.close()

    return scheduler
`;

const apiContent = `# app/main.py
"""
FastAPI приложение с SSE для real-time уведомлений.
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, get_session, init_db
from app.worker.watcher import FolderWatcher
from app.sync.engine import SyncEngine
from app.api.routes import router as api_router

logger = logging.getLogger(__name__)

# Хранилище SSE-подключений
sse_clients: list[asyncio.Queue] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения."""
    # Startup
    init_db()
    logger.info("База данных инициализирована")

    # Запуск watchdog
    watcher = FolderWatcher(
        watch_dir=settings.INCOMING_DIR,
        callback=on_file_detected,
    )
    watcher.start()

    yield

    # Shutdown
    watcher.stop()
    logger.info("Приложение остановлено")


app = FastAPI(
    title="Excel ↔ DB Sync System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.mount("/static", StaticFiles(directory="frontend"), name="static")


def on_file_detected(file_path: Path) -> None:
    """Callback при обнаружении нового файла (вызывается из watchdog)."""
    session = get_session()
    try:
        sync_engine = SyncEngine(session)
        result = sync_engine.process_file(file_path)

        # Отправляем SSE уведомления всем подключённым клиентам
        if result.get("notifications"):
            for notification in result["notifications"]:
                broadcast_sse(notification)

        # Перемещаем обработанный файл
        if result["status"] == "success":
            processed_dir = Path(settings.INCOMING_DIR).parent / "processed"
            processed_dir.mkdir(exist_ok=True)
            file_path.rename(processed_dir / file_path.name)

    finally:
        session.close()


def broadcast_sse(data: dict) -> None:
    """Отправляет данные всем SSE-клиентам."""
    for queue in sse_clients:
        queue.put_nowait(data)


# app/api/sse.py
@app.get("/api/events")
async def sse_endpoint(request: Request) -> StreamingResponse:
    """SSE endpoint для real-time уведомлений."""

    async def event_generator() -> AsyncGenerator[str, None]:
        queue: asyncio.Queue = asyncio.Queue()
        sse_clients.append(queue)

        try:
            while True:
                # Проверяем, не отключился ли клиент
                if await request.is_disconnected():
                    break

                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps(data, ensure_ascii=False)}\\n\\n"
                except asyncio.TimeoutError:
                    # Keep-alive ping
                    yield ": ping\\n\\n"
        finally:
            sse_clients.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# app/api/routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_session
from app.models import SyncRecord, SyncLog

router = APIRouter()


@router.get("/data")
def get_records(
    include_archived: bool = False,
    search: str = "",
    session: Session = Depends(get_session),
):
    """Получить список записей."""
    query = select(SyncRecord)
    if not include_archived:
        query = query.where(SyncRecord.is_deleted == False)
    if search:
        query = query.where(
            SyncRecord.номер_ус.ilike(f"%{search}%") |
            SyncRecord.name.ilike(f"%{search}%")
        )
    records = session.execute(query).scalars().all()
    return [
        {
            "id": r.id,
            "nomorUS": r.номер_ус,
            "name": r.name,
            "address": r.address,
            "phone": r.phone,
            "status": "archived" if r.is_deleted else "active",
            "lastUpdated": r.updated_at.isoformat(),
            "isDeleted": r.is_deleted,
        }
        for r in records
    ]


@router.get("/logs")
def get_logs(limit: int = 50, session: Session = Depends(get_session)):
    """Получить логи синхронизации."""
    logs = session.execute(
        select(SyncLog).order_by(SyncLog.timestamp.desc()).limit(limit)
    ).scalars().all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "fileName": l.file_name,
            "action": l.action,
            "details": l.details,
            "recordsAffected": l.records_affected,
        }
        for l in logs
    ]


@router.get("/stats")
def get_stats(session: Session = Depends(get_session)):
    """Получить статистику."""
    total = session.execute(select(func.count(SyncRecord.id))).scalar() or 0
    active = session.execute(
        select(func.count(SyncRecord.id)).where(SyncRecord.is_deleted == False)
    ).scalar() or 0
    archived = total - active

    return {
        "totalRecords": total,
        "activeRecords": active,
        "archivedRecords": archived,
    }
`;

const frontendContent = `<!-- frontend/index.html -->
<!-- Простой Vanilla JS фронтенд с SSE -->
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Excel↔DB Sync Dashboard</title>
    <style>
        /* ... стили ... */
    </style>
</head>
<body>
    <div id="app">
        <header>
            <h1>📊 Excel ↔ DB Sync System</h1>
            <div id="status-indicator">
                <span class="dot"></span> Мониторинг активен
            </div>
        </header>
        
        <main>
            <section id="stats-panel"><!-- Карточки статистики --></section>
            <section id="data-table"><!-- Таблица данных --></section>
            <section id="sync-logs"><!-- Логи синхронизации --></section>
        </main>
    </div>

    <!-- Toast контейнер -->
    <div id="toast-container"></div>

    <script>
    // SSE подключение для real-time уведомлений
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        showToast(data);
        refreshData(); // Обновляем таблицу и логи
    };

    eventSource.onerror = function() {
        showToast({
            type: 'error',
            title: 'SSE Connection Lost',
            message: 'Переподключение...'
        });
        // Автоматическое переподключение
        setTimeout(() => location.reload(), 5000);
    };

    // Функция показа toast-уведомления
    function showToast(data) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = \`toast toast-\${data.type}\`;
        toast.innerHTML = \`
            <strong>\${data.title}</strong>
            <p>\${data.message}</p>
        \`;
        container.appendChild(toast);
        
        // Анимация появления
        requestAnimationFrame(() => toast.classList.add('show'));
        
        // Автоудаление через 5 секунд
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Загрузка данных при старте
    async function refreshData() {
        const [records, logs, stats] = await Promise.all([
            fetch('/api/data').then(r => r.json()),
            fetch('/api/logs').then(r => r.json()),
            fetch('/api/stats').then(r => r.json()),
        ]);
        renderTable(records);
        renderLogs(logs);
        renderStats(stats);
    }

    // Инициализация
    refreshData();
    setInterval(refreshData, 10000); // Обновление каждые 10 сек
    </script>
</body>
</html>
`;

const launchContent = `# requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
pandas==2.2.0
openpyxl==3.1.2
watchdog==3.0.0
apscheduler==3.10.4
python-multipart==0.0.6
pydantic==2.5.3
pydantic-settings==2.1.0

# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./sync_data.db"
    INCOMING_DIR: str = "./incoming_data"
    PROCESSED_DIR: str = "./processed"
    LOG_DIR: str = "./logs"
    WATCH_INTERVAL: int = 30  # секунд
    SSE_TIMEOUT: int = 30

settings = Settings()

# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.models import Base

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def get_session() -> Session:
    return SessionLocal()

def init_db():
    Base.metadata.create_all(bind=engine)

# app/utils/logger.py
import logging
import sys
from pathlib import Path
from app.config import settings

def setup_logging():
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        handlers=[
            logging.FileHandler(log_dir / "sync.log", encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )

# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p incoming_data processed logs frontend

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# docker-compose.yml
version: '3.8'
services:
  sync-app:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./incoming_data:/app/incoming_data
      - ./processed:/app/processed
      - ./logs:/app/logs
      - ./data:/app/data  # SQLite файл
    environment:
      - DATABASE_URL=sqlite:///./data/sync_data.db
    restart: unless-stopped

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ИНСТРУКЦИЯ ПО ЗАПУСКУ:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# 1. Локальный запуск:
#    $ pip install -r requirements.txt
#    $ mkdir -p incoming_data processed logs
#    $ uvicorn app.main:app --reload --port 8000
#
# 2. Docker:
#    $ docker-compose up -d
#
# 3. Тестирование:
#    - Поместите Excel-файл в ./incoming_data/
#    - Откройте http://localhost:8000 в браузере
#    - Наблюдайте уведомления в реальном времени
#
# 4. Формат Excel:
#    | Номер УС | Название      | Адрес          | Телефон        |
#    |----------|---------------|----------------|----------------|
#    | УС-001   | ООО "Тест"    | г. Москва      | +7(495)1234567 |
#    | УС-002   | ИП Иванов     | г. СПб         | +7(812)7654321 |
`;


