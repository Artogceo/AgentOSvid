# AgentOSvid / VidClaw TMS

**Task Management System (TMS)** — автоматизированная система управления задачами для AI-агентов на базе OpenClaw и VidClaw.

## 🎯 Что это

Интеграция VidClaw (UI) + OpenClaw (оркестрация) для управления workflow задач через автоматическое распределение между агентами:
- **Орг** (оркестратор) — принимает задачи, пишет ТЗ, спавнит исполнителей
- **Исполнители** (Марк, Джони, Паша) — выполняют задачи
- **Ревью** — проверка результатов с возможностью доработки

## 📊 Архитектура системы

```
┌─────────────────────────────────────────────────────────────────┐
│  VIDCLAW (localhost:3333)                                       │
│  ├─ Kanban UI: Backlog → Todo → In Progress → Needs Review → Done│
│  ├─ API: /api/tasks, /api/tasks/queue, /api/tasks/:id/review    │
│  ├─ Раздел "Команда": управление агентами (/agents)             │
│  └─ Webhook: приём задач из внешних трекеров                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CRON JOBS (автоматика)                                         │
│  ├─ vidclaw-orchestrator-v2 — каждые 5 мин                      │
│  │   └─ Проверка очереди → Pickup → TZ → Spawn                  │
│  └─ vidclaw-stale-recovery-v2 — каждые 10 мин                   │
│      └─ Проверка зависших задач → Retry (3x) → Needs Review     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ sessions_spawn
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ORG AGENT (workspace-org)                                      │
│  ├─ Читает задачу из VidClaw                                    │
│  ├─ Пишет ТЗ (tz) в задачу                                     │
│  ├─ Выбирает исполнителя (backend/design/architect)             │
│  └─ Спавнит субагента через sessions_spawn                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUBAGENTS (Марк/Джони/Паша)                                    │
│  └─ Выполняют задачу → Обновляют статус → Needs Review          │
└─────────────────────────────────────────────────────────────────┘
```

## ✅ Реализованные фичи

### 1. Task Management Core ✅
- [x] Создание задач с выбором проекта (Createya, Agent Console, Hybrid)
- [x] Приоритеты: Low, Medium, High, Critical
- [x] Жизненный цикл: todo → in-progress → needs_review → done
- [x] Поле TZ (техническое задание) — отображается в любых статусах
- [x] Счетчик попыток (attempts) — виден в UI как бейдж

### 2. Org Workflow ✅
- [x] Максимум 2 задачи одновременно (maxConcurrent)
- [x] Автоматический pickup задач из очереди
- [x] Автоматическая запись ТЗ (tz) перед спавном
- [x] Автоматический spawn исполнителей

### 3. Review Flow ✅
- [x] Кнопки Done/Rework в колонке needs_review
- [x] Rework работает с/без комментария
- [x] При rework задача возвращается в todo с orgComment
- [x] TZ остаётся видимым после rework

### 4. Retry Mechanism ✅
- [x] 3 попытки выполнения задачи
- [x] При зависании >10 мин — автовозврат в todo (попытка+1)
- [x] После 3 попыток — отправка в needs_review
- [x] История попыток сохраняется

### 5. Team/Agents Section ✅
- [x] Страница /agents со списком 5 агентов
- [x] Статусы агентов (active/offline) с автообновлением
- [x] Просмотр документов (SOUL.md, AGENTS.md)
- [x] Настройка модели для каждого агента

### 6. UI Enhancements ✅
- [x] Бейджи: project, TZ, attempts
- [x] Полный диалог создания задачи (не quick-add)
- [x] Поддержка аттачментов (до 5MB)

### 7. Cron Automation ✅
- [x] `vidclaw-orchestrator-v2` — каждые 5 мин
- [x] `vidclaw-stale-recovery-v2` — каждые 10 мин
- [x] Модель: `kimi-coding/k2p5`

### 8. Webhook Integration ✅
- [x] Handler: `scripts/issue-webhook.js`
- [x] Endpoint: `POST /webhook/issue`
- [x] Поддержка project, priority, source

## 🔧 Настройка

### Крон-джобы

```bash
# Список активных кронов
openclaw cron list

# Добавить оркестратор
openclaw cron add --name vidclaw-orchestrator-v2 \
  --schedule "every:5m" \
  --model kimi-coding/k2p5 \
  --task "Оркестратор VidClaw: проверь очередь..."

# Добавить recovery
openclaw cron add --name vidclaw-stale-recovery-v2 \
  --schedule "every:10m" \
  --model kimi-coding/k2p5 \
  --task "Проверь зависшие задачи..."
```

### Структура workspace

```
~/.openclaw/
├── workspace-kon/           # Текущий workspace
│   ├── vidclaw/            # UI + Backend
│   │   ├── src/            # React frontend
│   │   ├── server/         # Express API
│   │   └── data/           # tasks.json, settings.json
│   ├── workspace-org/      # Org agent workspace
│   │   ├── SOUL.md         # Инструкции для Орга
│   │   ├── AGENTS.md       # Конфигурация субагентов
│   │   └── IDENTITY.md     # Кто такой Орг
│   ├── memory/             # Daily notes
│   └── MEMORY.md           # Long-term memory
└── workspace/              # Старый workspace (Стив)
```

## 📋 Workflow

### Создание задачи
1. Пользователь создаёт задачу в VidClaw UI
2. Заполняет: Title, Description, Project, Priority
3. Задача появляется в колонке **Todo**

### Автоматическая обработка
1. **Cron** (каждые 5 мин) проверяет очередь
2. Если есть слоты — **Org** забирает задачу (pickup)
3. Org пишет **ТЗ** в поле `tz`
4. Org спавнит **исполнителя** (Марк/Джони/Паша)

### Выполнение
1. Исполнитель получает ТЗ через `sessions_spawn`
2. Выполняет работу
3. Обновляет задачу: `status=needs_review`, `needsReview=true`
4. Пишет отчёт в `result`

### Ревью
1. Задача в колонке **Needs Review**
2. Пользователь видит: ТЗ, отчёт, бейджи
3. **Done** — задача переходит в done
4. **Rework** — задача возвращается в todo (attempts+1)

### Retry
1. Если задача зависла (>10 мин) — **recovery cron**
2. Увеличивает `attempts`
3. Если <3 — возвращает в todo
4. Если ≥3 — отправляет в needs_review

## 🔌 API Endpoints

### Tasks
```
GET    /api/tasks              # Список всех задач
GET    /api/tasks/queue        # Очередь (только todo)
GET    /api/tasks/queue?limit=capacity  # С учетом слотов
POST   /api/tasks              # Создать задачу
POST   /api/tasks/:id/pickup   # Взять в работу (проверка maxConcurrent)
POST   /api/tasks/:id/complete # Завершить (needsReview?)
POST   /api/tasks/:id/review   # Ревью (action: done/rework)
PATCH  /api/tasks/:id          # Обновить поля (tz, attempts, etc.)
```

### Agents
```
GET    /api/memory/sessions           # Список активных сессий
GET    /api/workspace-file?name=SOUL.md  # Чтение документов
GET    /api/models                    # Доступные модели
POST   /api/model                     # Переключить модель
```

## 📁 Важные файлы

| Файл | Назначение |
|------|-----------|
| `vidclaw/data/tasks.json` | Хранение задач |
| `vidclaw/data/settings.json` | maxConcurrent, timezone |
| `workspace-org/SOUL.md` | Инструкции для Орга |
| `workspace-org/AGENTS.md` | Конфиг Марк/Джони/Паша |
| `ROADMAP.md` | План разработки |
| `TEST_SCENARIOS.md` | Тестовые сценарии |

## 🚨 Известные проблемы

1. **Крон видит тестовые задачи, а не реальные**
   - Причина: изолированная сессия крона
   - Статус: Исследуется

2. **Ошибка валидации tools в cron**
   - Проявляется: "24 validation errors"
   - Решение: пересоздание крона с правильным форматом

## 📝 Обновление документации

При изменении системы:
1. Обновить этот README
2. Обновить `ROADMAP.md`
3. Обновить `API.md` (если меняли endpoints)
4. Закоммитить изменения

## 🔗 Репозиторий

`https://github.com/Artogceo/AgentOSvid`

## 📅 Последнее обновление

2026-03-10 — Добавлен раздел "Команда", retry механизм, TZ visibility, cron automation v2
