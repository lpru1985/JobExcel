# app/schemas.py
"""Pydantic-схемы для API-ответов."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SyncRecordResponse(BaseModel):
    """Схема записи для API."""
    id: int
    nomorUS: str
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    status: str  # "active" | "archived"
    lastUpdated: str
    isDeleted: bool

    class Config:
        from_attributes = True


class SyncLogResponse(BaseModel):
    """Схема лога для API."""
    id: int
    timestamp: str
    fileName: str
    action: str
    details: Optional[str] = None
    recordsAffected: int


class SyncStatsResponse(BaseModel):
    """Схема статистики для API."""
    totalRecords: int
    activeRecords: int
    archivedRecords: int
    lastSyncTime: Optional[str] = None
    totalInserts: int = 0
    totalUpdates: int = 0
    totalSoftDeletes: int = 0
    totalErrors: int = 0


class SyncResultResponse(BaseModel):
    """Результат обработки файла."""
    status: str  # "success" | "error"
    file: str
    stats: dict
    error: Optional[str] = None
