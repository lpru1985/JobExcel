# app/config.py
"""Конфигурация приложения. Читает переменные окружения или использует дефолты."""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Настройки приложения."""

    # База данных
    DATABASE_URL: str = "sqlite:///./data/sync_data.db"

    # Директории
    INCOMING_DIR: str = "./incoming_data"
    PROCESSED_DIR: str = "./processed"
    LOG_DIR: str = "./logs"

    # Воркер
    WATCH_INTERVAL: int = 30  # секунд между проверками

    # SSE
    SSE_TIMEOUT: int = 30  # секунд

    # Сервер
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Создаём директории при импорте
for dir_path in [settings.INCOMING_DIR, settings.PROCESSED_DIR, settings.LOG_DIR, "data"]:
    Path(dir_path).mkdir(parents=True, exist_ok=True)
