# VidClaw → AC Integration Roadmap

## ✅ Completed

### 1. Модель задачи и поля ✅
- [x] Добавлены поля: `project`, `orgComment`, `reviewComment`, `source`, `org`
- [x] Обновлены TypeScript типы (`api.ts`)
- [x] API поддерживает создание/обновление с новыми полями

### 2. Орг-агент и лимит параллельных задач ✅
- [x] `maxConcurrent` ограничение в 2 задачи через `settings.json`
- [x] `pickupTask` проверяет лимит перед взятием (409 если занято)
- [x] `/api/tasks/queue` возвращает `remainingSlots`
- [x] UI индикатор слотов в колонке In Progress

### 3. UI-карточки, статусы и комментарии ✅
- [x] Добавлена колонка `Needs Review`
- [x] Бейджи `project`/`source`/`org` на карточках
- [x] Отображение `orgComment`/`reviewComment` в карточке и диалоге
- [x] Кнопки `Done`/`Rework` для задач в `needs_review`
- [x] Цветовая индикация комментариев

### 4. История и комментарии ✅
- [x] `runHistory` сохраняет `reviewComment`
- [x] Activity логирует `task_review` события
- [x] При `rework` задача возвращается в `todo` с `orgComment`

### 5. Интеграция issue tracker → VidClaw ✅
- [x] Webhook handler: `scripts/issue-webhook.js`
- [x] Endpoint `POST /webhook/issue` принимает задачи из внешних трекеров
- [x] Поддержка `project`, `priority`, `source`, `sourceMessageId`

### 6. Орг-ограничения и очереди ✅
- [x] Heartbeat/cron проверяет `remainingSlots`
- [x] Автоматический pickup следующей задачи при освобождении слота
- [x] Логика возврата в `todo` через `rework`

### 7. Документация и тесты ✅
- [x] Обновлен `API.md` с новыми endpoints
- [x] `WEBHOOK.md` — инструкция по интеграции
- [x] `TEST_SCENARIOS.md` — тестовые сценарии
- [x] `README.md` — раздел AC Integration
- [x] Сборка проходит (`npm run build`)

---

## Новые API Endpoints

```
POST /api/tasks/:id/review
Body: { action: "done" | "rework", comment?: string }

Extended POST /api/tasks/:id/complete
Body: { ..., needsReview?: boolean, reviewComment?: string }
```

## Запуск

```bash
# VidClaw
cd vidclaw && ./start.sh --service-mode direct

# Webhook handler (в отдельном терминале)
node scripts/issue-webhook.js --port 3334
```

## Workflow

1. Issue tracker → POST `/webhook/issue` → задача в `todo`
2. Org agent → `pickup` (макс 2 одновременно) → `in-progress`
3. Subagent выполняет → `complete` с `needsReview=true` → `needs_review`
4. Орг/Артур → кнопка `Done`/`Rework` → `done` или обратно в `todo`
5. При `rework` комментарий сохраняется в `orgComment` для субагента

---

## 🆕 Updates 2026-03-10

### Phase 4: Team/Agents Section ✅
- [x] Created `/agents` route
- [x] AgentsPage component with all 5 agents (Mark, Johnny, Pasha, Org, Steve)
- [x] Agent status display (active/offline with real-time updates)
- [x] Document viewer (SOUL.md, AGENTS.md)
- [x] Model configuration per agent

### Phase 5: UI/UX Fixes ✅
- [x] TZ (technical specification) visible in all task statuses
- [x] Fixed "Rework" button (now works with or without comment)
- [x] Attempts counter badge in task cards
- [x] Full task dialog on "+" button (replaced quick-add)

### Phase 6: Cron Automation ✅
- [x] `vidclaw-orchestrator-v2` — every 5 minutes
- [x] `vidclaw-stale-recovery-v2` — every 10 minutes  
- [x] Auto-retry logic (max 3 attempts)
- [x] Auto-escalation to `needs_review` after max attempts
- [x] Activity logging for all automated actions
