# app/database.py
"""Подключение к базе данных SQLAlchemy 2.0."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings
from app.models import Base

# Создаём engine
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

# Фабрика сессий
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_session() -> Session:
    """Получить сессию БД."""
    return SessionLocal()


def init_db() -> None:
    """Создать все таблицы."""
    Base.metadata.create_all(bind=engine)
