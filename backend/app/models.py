# app/models.py
"""SQLAlchemy 2.0 модели для системы синхронизации Excel ↔ БД."""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
    Index, UniqueConstraint, func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""
    pass


class SyncRecord(Base):
    """
    Основная таблица с данными из Excel.
    Primary Business Key: номер_ус (столбец "Номер УС" в Excel).
    """
    __tablename__ = "sync_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    номер_ус: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True, unique=True,
        comment="Бизнес-ключ из столбца 'Номер УС' в Excel"
    )
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="Название организации")
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Адрес")
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="Телефон")
    extra_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="JSON для доп. полей из Excel")

    # Soft Delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="Флаг архивации")
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, comment="Дата архивации")

    # Аудит
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    source_file: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="Имя исходного файла")

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
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(
        String(20), nullable=False,
        comment="INSERT | UPDATE | SOFT_DELETE | ERROR | START | COMPLETE"
    )
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    records_affected: Mapped[int] = mapped_column(Integer, default=0)
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    __table_args__ = (
        Index("ix_logs_timestamp", "timestamp"),
        Index("ix_logs_action", "action"),
    )

    def __repr__(self) -> str:
        return f"<SyncLog {self.action} @ {self.timestamp}>"


class SyncStats(Base):
    """Агрегированная статистика по запускам синхронизации."""
    __tablename__ = "sync_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sync_run_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    inserts: Mapped[int] = mapped_column(Integer, default=0)
    updates: Mapped[int] = mapped_column(Integer, default=0)
    soft_deletes: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[Optional[float]] = mapped_column(nullable=True)
