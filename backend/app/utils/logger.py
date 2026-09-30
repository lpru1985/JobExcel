# app/utils/logger.py
"""Настройка логирования: файл + консоль."""

import logging
import sys
from pathlib import Path

from app.config import settings


def setup_logging() -> None:
    """Настраивает логирование в файл и stdout."""
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)

    log_format = "%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Рукотворные хендлеры
    file_handler = logging.FileHandler(
        log_dir / "sync.log",
        encoding="utf-8",
        mode="a",
    )
    console_handler = logging.StreamHandler(sys.stdout)

    file_handler.setLevel(logging.INFO)
    console_handler.setLevel(logging.INFO)

    file_handler.setFormatter(logging.Formatter(log_format, datefmt=date_format))
    console_handler.setFormatter(logging.Formatter(log_format, datefmt=date_format))

    # Корневой логгер
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # Уменьшаем шум от библиотек
    logging.getLogger("watchdog").setLevel(logging.WARNING)
    logging.getLogger("apscheduler").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    logging.info("Логирование инициализировано")
