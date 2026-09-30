# app/worker/watcher.py
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
        logger.info(f"[Watchdog] Обнаружен новый файл: {file_path.name}")

        # Ждём завершения записи файла
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
                    logger.info(f"Файл готов к обработке: {path.name}")
                    return
                prev_size = current_size
            except OSError:
                pass
            time.sleep(1)
            waited += 1
        logger.warning(f"Таймаут ожидания готовности файла: {path.name}")


class FolderWatcher:
    """Управление watchdog observer для мониторинга папки."""

    def __init__(self, watch_dir: str, callback: Callable[[Path], None]):
        self.watch_dir = watch_dir
        self.handler = ExcelFileHandler(callback)
        self.observer = Observer()

    def start(self) -> None:
        """Запускает мониторинг папки."""
        Path(self.watch_dir).mkdir(parents=True, exist_ok=True)
        self.observer.schedule(self.handler, self.watch_dir, recursive=False)
        self.observer.start()
        logger.info(f"[Watchdog] Мониторинг запущен: {self.watch_dir}")

    def stop(self) -> None:
        """Останавливает мониторинг."""
        self.observer.stop()
        self.observer.join(timeout=5)
        logger.info("[Watchdog] Мониторинг остановлен")
