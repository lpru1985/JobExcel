# 📊 Excel ↔ DB Sync System

Система автоматической синхронизации Excel-файлов с базой данных.

## 🏗 Архитектура

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│ /incoming_   │────▶│   Watchdog   │────▶│  Sync Worker     │
│ data/        │     │   Observer   │     │  (Pandas + SA)   │
│ (Excel)      │     │              │     │                  │
└──────────────┘     └──────────────┘     └────────┬─────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │   SQLite / PG       │
                                         │   Database          │
                                         └──────────┬──────────┘
                                                    │
┌──────────────┐     ┌──────────────┐              │
│   Browser    │◀────│   FastAPI    │◀─────────────┘
│   (React)    │ SSE │   REST API   │
└──────────────┘     └──────────────┘
```

## 📁 Структура проекта

```
project/
├── backend/                 # Python бэкенд
│   ├── app/
│   │   ├── main.py         # FastAPI + SSE + запуск воркеров
│   │   ├── config.py       # Настройки
│   │   ├── database.py     # SQLAlchemy engine
│   │   ├── models.py       # ORM модели
│   │   ├── schemas.py      # Pydantic схемы
│   │   ├── sync/
│   │   │   ├── engine.py   # Ядро синхронизации (UPSERT + Soft Delete)
│   │   │   └── validator.py# Валидация Excel
│   │   ├── worker/
│   │   │   ├── watcher.py  # Watchdog мониторинг папки
│   │   │   └── scheduler.py# APScheduler
│   │   ├── api/
│   │   │   └── routes.py   # REST endpoints
│   │   └── utils/
│   │       └── logger.py   # Логирование
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
├── dist/                    # Собранный фронтенд (React)
├── incoming_data/           # Сюда кладутся Excel-файлы
├── processed/               # Обработанные файлы
├── logs/                    # Логи
└── data/                    # SQLite база
```

---

## 🚀 ИНСТРУКЦИЯ ПО ЗАПУСКУ

### Вариант 1: Локальный запуск (рекомендуется для разработки)

#### Предварительные требования
- **Python 3.11+** — [скачать](https://www.python.org/downloads/)
- **Node.js 18+** (только если нужно пересобрать фронтенд) — [скачать](https://nodejs.org/)

#### Шаг 1: Распакуйте релиз

```bash
# Если скачали .zip:
unzip excel-sync-system-v1.0.zip
cd excel-sync-system

# Если клонировали из GitHub:
git clone https://github.com/your-username/excel-sync-system.git
cd excel-sync-system
```

#### Шаг 2: Установите Python-зависимости

```bash
cd backend

# Создайте виртуальное окружение (рекомендуется)
python -m venv venv

# Активируйте:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

#### Шаг 3: Создайте директории

```bash
# Из корня проекта:
mkdir -p incoming_data processed logs data
```

#### Шаг 4: Запустите сервер

```bash
# Из папки backend/
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Или:
```bash
python app/main.py
```

#### Шаг 5: Откройте в браузере

- **API документация (Swagger):** http://localhost:8000/docs
- **Фронтенд (React):** Откройте файл `dist/index.html` в браузере или используйте Live Server

> 💡 Для фронтенда можно использовать любой статический сервер:
> ```bash
> # Если есть Python:
> cd dist && python -m http.server 3000
> # Если есть Node.js:
> npx serve dist
> ```

#### Шаг 6: Тестирование синхронизации

1. Создайте Excel-файл с данными:

| Номер УС | Название | Адрес | Телефон |
|----------|----------|-------|---------|
| УС-001 | ООО "Тест" | г. Москва | +7(495)1234567 |
| УС-002 | ИП Иванов | г. СПб | +7(812)7654321 |

2. Положите файл в папку `incoming_data/`
3. Наблюдайте логи в консоли и уведомления на фронтенде
4. Обработанный файл переместится в `processed/`

---

### Вариант 2: Docker (рекомендуется для продакшена)

#### Предварительные требования
- **Docker** и **Docker Compose** — [скачать](https://docs.docker.com/get-docker/)

```bash
cd backend

# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

---

### Вариант 3: Только бэкенд (без фронтенда)

```bash
cd backend
pip install -r requirements.txt
python app/main.py
```

API будет доступен на http://localhost:8000

Полезные эндпоинты:
- `GET /api/data` — список записей
- `GET /api/logs` — логи синхронизации
- `GET /api/stats` — статистика
- `GET /api/events` — SSE поток уведомлений
- `POST /api/sync/manual` — ручная синхронизация
- `GET /docs` — Swagger документация

---

## ⚙️ Конфигурация

Создайте файл `.env` в папке `backend/`:

```env
DATABASE_URL=sqlite:///./data/sync_data.db
INCOMING_DIR=./incoming_data
PROCESSED_DIR=./processed
LOG_DIR=./logs
WATCH_INTERVAL=30
HOST=0.0.0.0
PORT=8000
```

---

## 📋 Формат Excel-файла

Обязательный столбец: **Номер УС** (Primary Business Key)

| Номер УС | Название | Адрес | Телефон |
|----------|----------|-------|---------|
| УС-001 | ООО "Тест" | г. Москва | +7(495)123-45-67 |
| УС-002 | ИП Иванов | г. СПб | +7(812)765-43-21 |

### Правила обработки:
- ✅ **INSERT** — если "Номер УС" из Excel отсутствует в БД → добавляется новая строка
- ✅ **UPDATE** — если "Номер УС" совпадает → данные обновляются
- ✅ **SOFT DELETE** — если "Номер УС" есть в БД, но отсутствует в новом файле → `is_deleted = True`
- ✅ **Дубликаты** — если в Excel есть дубли "Номер УС", берётся последняя строка
- ✅ **Блокировки** — файл копируется в temp перед чтением (защита от PermissionError)
- ✅ **Транзакционность** — все операции в одной транзакции, rollback при ошибке

---

## 🔧 Пересборка фронтенда (опционально)

Если нужно внести изменения в React-фронтенд:

```bash
# Из корня проекта
npm install
npm run dev     # Режим разработки
npm run build   # Сборка в dist/
```

---

## 🐛 Troubleshooting

| Проблема | Решение |
|----------|---------|
| `ModuleNotFoundError` | Активируйте venv и переустановите зависимости |
| `PermissionError` при чтении Excel | Закройте файл в Excel, система автоматически копирует в temp |
| Файл не обрабатывается | Проверьте, что столбец "Номер УС" существует в файле |
| SSE не работает | Убедитесь, что CORS разрешён (по умолчанию — `*`) |
| Порт 8000 занят | Измените `PORT` в `.env` или используйте `--port` |

---

## 📝 Лицензия

MIT
