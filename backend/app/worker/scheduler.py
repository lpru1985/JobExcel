# app/worker/scheduler.py
"""
APScheduler для периодической проверки папки (альтернатива watchdog).
"""

import logging
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.database import get_session
from app.sync.engine import SyncEngine

logger = logging.getLogger(__name__)


def create_scheduler(callback_on_success: callable = None) -> BackgroundScheduler:
    """
    Создаёт планировщик фоновых задач.

    Args:
        callback_on_success: Функция, вызываемая при успешной обработке файла.
    """
    scheduler = BackgroundScheduler()

    @scheduler.scheduled_job(
        IntervalTrigger(seconds=settings.WATCH_INTERVAL),
        id="sync_check",
        replace_existing=True,
    )
    def check_and_sync() -> None:
        """Периодическая проверка папки и синхронизация."""
        watch_path = Path(settings.INCOMING_DIR)
        excel_files = list(watch_path.glob("*.xlsx")) + list(watch_path.glob("*.xls"))

        if not excel_files:
            return

        logger.info(f"[Scheduler] Найдено файлов для обработки: {len(excel_files)}")

        for file_path in excel_files:
            session = get_session()
            try:
                sync_engine = SyncEngine(session)
                result = sync_engine.process_file(file_path)

                if result["status"] == "success":
                    # Перемещаем обработанный файл
                    processed_dir = Path(settings.PROCESSED_DIR)
                    processed_dir.mkdir(exist_ok=True)
                    dest = processed_dir / file_path.name
                    # Если файл с таким именем уже есть — добавляем суффикс
                    counter = 1
                    while dest.exists():
                        dest = processed_dir / f"{file_path.stem}_{counter}{file_path.suffix}"
                        counter += 1
                    file_path.rename(dest)
                    logger.info(f"[Scheduler] Файл обработан и перемещён: {file_path.name}")

                    if callback_on_success and result.get("notifications"):
                        for notification in result["notifications"]:
                            callback_on_success(notification)

            except Exception as e:
                logger.error(f"[Scheduler] Ошибка: {e}", exc_info=True)
            finally:
                session.close()

    return scheduler
