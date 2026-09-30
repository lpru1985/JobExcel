# app/api/routes.py
"""REST-эндпоинты API."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_session
from app.models import SyncRecord, SyncLog

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/data")
def get_records(
    include_archived: bool = Query(False, description="Включить архивные записи"),
    search: str = Query("", description="Поиск по Номер УС или названию"),
    limit: int = Query(100, ge=1, le=1000),
    session: Session = Depends(get_session),
) -> list[dict]:
    """Получить список записей из БД."""
    query = select(SyncRecord)

    if not include_archived:
        query = query.where(SyncRecord.is_deleted == False)

    if search:
        query = query.where(
            SyncRecord.номер_ус.ilike(f"%{search}%") |
            SyncRecord.name.ilike(f"%{search}%")
        )

    query = query.order_by(SyncRecord.updated_at.desc()).limit(limit)
    records = session.execute(query).scalars().all()

    return [
        {
            "id": r.id,
            "nomorUS": r.номер_ус,
            "name": r.name,
            "address": r.address,
            "phone": r.phone,
            "status": "archived" if r.is_deleted else "active",
            "lastUpdated": r.updated_at.isoformat() if r.updated_at else None,
            "isDeleted": r.is_deleted,
        }
        for r in records
    ]


@router.get("/logs")
def get_logs(
    limit: int = Query(50, ge=1, le=500),
    action: Optional[str] = Query(None, description="Фильтр по типу действия"),
    session: Session = Depends(get_session),
) -> list[dict]:
    """Получить логи синхронизации."""
    query = select(SyncLog)

    if action:
        query = query.where(SyncLog.action == action.upper())

    query = query.order_by(SyncLog.timestamp.desc()).limit(limit)
    logs = session.execute(query).scalars().all()

    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "fileName": log.file_name,
            "action": log.action,
            "details": log.details,
            "recordsAffected": log.records_affected,
        }
        for log in logs
    ]


@router.get("/stats")
def get_stats(session: Session = Depends(get_session)) -> dict:
    """Получить агрегированную статистику."""
    total = session.execute(select(func.count(SyncRecord.id))).scalar() or 0
    active = session.execute(
        select(func.count(SyncRecord.id)).where(SyncRecord.is_deleted == False)
    ).scalar() or 0
    archived = total - active

    # Статистика по логам
    total_inserts = session.execute(
        select(func.sum(SyncLog.records_affected)).where(SyncLog.action == "INSERT")
    ).scalar() or 0
    total_updates = session.execute(
        select(func.sum(SyncLog.records_affected)).where(SyncLog.action == "UPDATE")
    ).scalar() or 0
    total_soft_deletes = session.execute(
        select(func.sum(SyncLog.records_affected)).where(SyncLog.action == "SOFT_DELETE")
    ).scalar() or 0
    total_errors = session.execute(
        select(func.count(SyncLog.id)).where(SyncLog.action == "ERROR")
    ).scalar() or 0

    # Последняя синхронизация
    last_sync = session.execute(
        select(SyncLog.timestamp)
        .where(SyncLog.action == "COMPLETE")
        .order_by(SyncLog.timestamp.desc())
        .limit(1)
    ).scalar()

    return {
        "totalRecords": total,
        "activeRecords": active,
        "archivedRecords": archived,
        "lastSyncTime": last_sync.isoformat() if last_sync else None,
        "totalInserts": int(total_inserts),
        "totalUpdates": int(total_updates),
        "totalSoftDeletes": int(total_soft_deletes),
        "totalErrors": int(total_errors),
    }


@router.get("/health")
def health_check() -> dict:
    """Проверка работоспособности API."""
    return {"status": "ok", "service": "excel-sync-api"}
