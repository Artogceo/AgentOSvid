# Деплой VidClaw на домен AC

## Текущая структура AC
- **Домен:** `https://lemony-lorean-strategically.ngrok-free.dev`
- **Frontend:** Next.js на порту 3000 (pm2: `ac-frontend`)
- **Backend:** FastAPI на порту 8000 (pm2: `ac-backend`)
- **Туннель:** ngrok → порт 3000
- **БД:** PostgreSQL `localhost/agent_console`

## План миграции на VidClaw

### 1. Остановить AC
```bash
pm2 stop ac-frontend ac-backend
pm2 delete ac-frontend ac-backend
```

### 2. Настроить VidClaw
VidClaw уже настроен:
- Работает на порту 3333
- Подключен к `workspace-org` (Орг агент)
- maxConcurrent: 2
- Review workflow: done/rework
- Webhook для Createya готов

### 3. Обновить ngrok
Изменить `start-ngrok-ac.sh`:
```bash
exec /opt/homebrew/bin/ngrok http --config /Users/arturoganesan/.ngrok-bro/ngrok.yml --url=lemony-lorean-strategically.ngrok-free.dev 3333
```

### 4. Запустить VidClaw через pm2
Добавить в ecosystem.config.js:
```javascript
{
  name: 'vidclaw',
  script: 'npm',
  args: 'run start',
  cwd: '/Users/arturoganesan/.openclaw/workspace-kon/vidclaw',
  autorestart: true,
  env: { NODE_ENV: 'production', PORT: 3333 },
  log_file: '/Users/arturoganesan/.pm2/logs/vidclaw-combined.log'
}
```

### 5. Перезапустить ngrok
```bash
pm2 restart ngrok-ac
```

## Проверка после деплоя
- Открыть `https://lemony-lorean-strategically.ngrok-free.dev`
- Проверить создание задачи
- Проверить pickup с лимитом 2
- Проверить review workflow
