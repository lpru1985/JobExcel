# app/main.py
"""
FastAPI приложение — точка входа.
Запускает сервер, watchdog, SSE для real-time уведомлений.
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, get_session
from app.worker.watcher import FolderWatcher
from app.worker.scheduler import create_scheduler
from app.sync.engine import SyncEngine
from app.api.routes import router as api_router
from app.utils.logger import setup_logging

logger = logging.getLogger(__name__)

# Хранилище SSE-подключений (каждый клиент — очередь)
sse_clients: list[asyncio.Queue] = []


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
            processed_dir = Path(settings.PROCESSED_DIR)
            processed_dir.mkdir(exist_ok=True)
            dest = processed_dir / file_path.name
            counter = 1
            while dest.exists():
                dest = processed_dir / f"{file_path.stem}_{counter}{file_path.suffix}"
                counter += 1
            file_path.rename(dest)
            logger.info(f"Файл обработан и перемещён: {file_path.name}")

    except Exception as e:
        logger.error(f"Ошибка обработки файла: {e}", exc_info=True)
    finally:
        session.close()


def broadcast_sse(data: dict) -> None:
    """Отправляет данные всем SSE-клиентам."""
    for queue in sse_clients:
        try:
            queue.put_nowait(data)
        except asyncio.QueueFull:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения (startup/shutdown)."""
    # === STARTUP ===
    setup_logging()
    init_db()
    logger.info("=" * 60)
    logger.info("Excel ↔ DB Sync System — запуск")
    logger.info(f"База данных: {settings.DATABASE_URL}")
    logger.info(f"Мониторинг: {settings.INCOMING_DIR}")
    logger.info("=" * 60)

    # Запуск watchdog
    watcher = FolderWatcher(
        watch_dir=settings.INCOMING_DIR,
        callback=on_file_detected,
    )
    watcher.start()

    # Запуск планировщика (альтернативный/дополнительный механизм)
    scheduler = create_scheduler(callback_on_success=broadcast_sse)
    scheduler.start()
    logger.info(f"Scheduler запущен (интервал: {settings.WATCH_INTERVAL}с)")

    yield

    # === SHUTDOWN ===
    logger.info("Остановка приложения...")
    watcher.stop()
    scheduler.shutdown(wait=False)
    logger.info("Приложение остановлено")


# Создание FastAPI приложения
app = FastAPI(
    title="Excel ↔ DB Sync System",
    description="Система синхронизации Excel-файлов с базой данных",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутер API
app.include_router(api_router, prefix="/api")


# SSE endpoint
@app.get("/api/events")
async def sse_endpoint(request: Request) -> StreamingResponse:
    """Server-Sent Events для real-time уведомлений."""

    async def event_generator() -> AsyncGenerator[str, None]:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        sse_clients.append(queue)
        logger.info(f"SSE клиент подключён. Всего: {len(sse_clients)}")

        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=settings.SSE_TIMEOUT)
                    yield f" {json.dumps(data, ensure_ascii=False)}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive ping
                    yield ": ping\n\n"
        finally:
            sse_clients.remove(queue)
            logger.info(f"SSE клиент отключён. Осталось: {len(sse_clients)}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# Ручной запуск синхронизации (для тестирования)
@app.post("/api/sync/manual")
async def manual_sync() -> JSONResponse:
    """Ручной запуск синхронизации — обрабатывает все файлы в incoming_data/."""
    watch_path = Path(settings.INCOMING_DIR)
    excel_files = list(watch_path.glob("*.xlsx")) + list(watch_path.glob("*.xls"))

    if not excel_files:
        return JSONResponse({"status": "info", "message": "Нет файлов для обработки"})

    results = []
    for file_path in excel_files:
        session = get_session()
        try:
            sync_engine = SyncEngine(session)
            result = sync_engine.process_file(file_path)
            results.append(result)

            if result["status"] == "success":
                processed_dir = Path(settings.PROCESSED_DIR)
                processed_dir.mkdir(exist_ok=True)
                file_path.rename(processed_dir / file_path.name)

                # SSE уведомления
                if result.get("notifications"):
                    for notification in result["notifications"]:
                        broadcast_sse(notification)

        finally:
            session.close()

    return JSONResponse({"status": "ok", "processed": len(results), "results": results})


# Главная страница
@app.get("/")
async def root() -> dict:
    return {
        "service": "Excel ↔ DB Sync System",
        "version": "1.0.0",
        "endpoints": {
            "data": "/api/data",
            "logs": "/api/logs",
            "stats": "/api/stats",
            "events": "/api/events (SSE)",
            "health": "/api/health",
            "manual_sync": "POST /api/sync/manual",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
