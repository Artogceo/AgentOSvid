# VidClaw Webhook & Task Integration

## Источник: createya.issue-tracker → VidClaw
1. Issue tracker (например `createya`) вызывает VidClaw API при создании новой задачи/issue. Это делает колонку `Backlog/Inbox` единой точкой входа.
2. Payload должен содержать минимум:
   ```json
   {
     "title": "Название задачи",
     "description": "Текст составляет сотрудник",
     "project": "createya-frontend",
     "priority": "high",
     "skills": ["frontend", "review"],
     "source": "createya",
     "sourceMessageId": "issue-123",
     "channel": "createya-issues"
   }
   ```
3. Пример CURL:
   ```bash
   curl -X POST http://localhost:3333/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Фича Login","description":"Add TOTP","project":"createya","source":"createya","priority":"high"}'
   ```
4. VidClaw сохраняет `source`/`project` и ставит карточку в `Backlog` (или `Todo`, если `status=todo`). Орг забирает её через очередь (`/api/tasks/queue` → `pickup`).

## Отчёт субагента → Org
1. Когда мой subagent заканчивает работу, он вызывает:
   ```http
   POST /api/tasks/{id}/complete
   Content-Type: application/json
   {
     "result": "Сделал кнопку, npm run build",
     "needsReview": true,
     "reviewComment": "Жду подтверждения",
     "subagentId": "design-cdo"
   }
   ```
2. Задача перемещается в колонку `Needs Review`; Org видит `reviewComment` и кнопки `Сделано / Переделать`.
3. Org принимает решение через новый endpoint (или UI):
   - `POST /api/tasks/{id}/review` с `action: "done"` — переводит задачу в `Done`.
   - `POST /api/tasks/{id}/review` с `action: "rework"` и комментарием — возвращает в `Todo`, добавляя `orgComment`.

## Дополнительно
- При желании можно использовать `source` и `sourceMessageId`, чтобы связывать задачи с внешним issue (тексты, ссылки).
- Статус `project` ассигнует фильтрацию по Createya-проектам.
- Задачи из других каналов (например, ты или Стив нажимаете кнопку) тоже используют `/api/tasks` с `source: "manual"`.
