# VidClaw

A secure, self-hosted command center for managing your OpenClaw AI agent.

![Dark theme dashboard with Kanban board, usage tracking, and more](https://img.shields.io/badge/status-beta-orange) ![build](https://img.shields.io/badge/build-passing-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue)

## Features

- **🗂️ Kanban Task Board** — Backlog → Todo → In Progress → Done. Drag & drop, priorities, skill assignment. Your agent picks up tasks automatically via heartbeat or cron.
- **📊 Usage Tracking** — Real-time token usage and cost estimates parsed from session transcripts. Progress bars matching Anthropic's rate limit windows.
- **🔄 Model Switching** — Switch between Claude models directly from the dashboard. Hot-reloads via OpenClaw's config watcher.
- **📅 Activity Calendar** — Monthly view of agent activity, parsed from memory files and task history.
- **📁 Content Browser** — Browse workspace files with markdown preview, syntax highlighting, and download.
- **🧩 Skills Manager** — View all bundled/workspace skills, enable/disable them, create custom skills.
- **💜 Soul Editor** — Edit SOUL.md, IDENTITY.md, USER.md, AGENTS.md with version history and persona templates.
- **⚡ Task Execution** — Tasks execute automatically via cron (every 2 min) or heartbeat (every 30 min). Hit "Run Now" for immediate execution.

## Security

VidClaw binds to localhost only (`127.0.0.1:3333`) — no external network calls, all data stays on your machine.

Remote access is handled via **Tailscale Serve** (enabled by default on port 8443). Alternatively, use an SSH tunnel: `ssh -L 3333:localhost:3333 <user>@<server>`.

Then open `https://your-machine.your-tailnet.ts.net:8443` (Tailscale) or `http://localhost:3333` (SSH).

## Prerequisites

- OpenClaw installed and running
- Node.js >= 18
- Git

## Install

```bash
curl -fsSL vidclaw.com/install.sh | bash
```

Installs Node.js, git, Tailscale, and VidClaw in one command. Localhost only: add `--no-tailscale`.

## Update

```bash
./update.sh
```

## Usage

```bash
./start.sh       # start the service
./stop.sh        # stop the service
./status.sh      # check service status
./logs.sh        # view logs
```

## Development

```bash
./start.sh --dev
```

Starts the backend + Vite dev server with HMR.

## API

See [API.md](API.md) for the endpoint reference.

## Stack

React + Vite + Tailwind CSS / Express.js / JSON file storage

## License

MIT

---

Copyright (c) 2026 [woocassh](https://x.com/woocassh) · MIT License

## AC Integration (Org/Subagent Workflow)

This fork extends VidClaw with a structured task workflow for teams:

- **Org Agent**: Manages up to 2 concurrent tasks, writes technical specs
- **Subagents**: Execute tasks (design, backend, etc.)
- **Review Flow**: Tasks go through `needs_review` state with Done/Rework actions
- **Project Tracking**: Tasks tagged with project/source for multi-project management
- **Issue Tracker Integration**: Webhook endpoint for external issue trackers

### New API Endpoints

- `POST /api/tasks/:id/review` - Review task (`action: done|rework`, `comment`)
- Extended `POST /api/tasks/:id/complete` with `needsReview` flag
- Queue respects `maxConcurrent` setting (default: 2)

### Webhook Integration

Start the webhook handler:
```bash
node scripts/issue-webhook.js
```

Configure your issue tracker to POST issues to `http://localhost:3334/webhook/issue`

See [TEST_SCENARIOS.md](../TEST_SCENARIOS.md) for full workflow examples.
