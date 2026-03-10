# VidClaw AC Integration - Test Scenarios

## Full Workflow Test

### 1. Create Task (from issue tracker or manual)
```bash
curl -X POST http://localhost:3333/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "description": "User reports TOTP not working",
    "project": "createya-frontend",
    "priority": "high",
    "source": "createya",
    "sourceMessageId": "issue-123",
    "status": "todo"
  }'
```

### 2. Org Agent Picks Up Task (max 2 concurrent)
```bash
curl -X POST http://localhost:3333/api/tasks/{taskId}/pickup \
  -H "Content-Type: application/json" \
  -d '{"subagentId": "org"}'
```

### 3. Subagent Completes with Needs Review
```bash
curl -X POST http://localhost:3333/api/tasks/{taskId}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "result": "Fixed TOTP validation, tested with npm run test",
    "needsReview": true,
    "reviewComment": "Awaiting Artur review",
    "subagentId": "backend-dev"
  }'
```

### 4. Review Task (Org/Artur decision)

**Approve (Done):**
```bash
curl -X POST http://localhost:3333/api/tasks/{taskId}/review \
  -H "Content-Type: application/json" \
  -d '{
    "action": "done",
    "comment": "Approved, good fix"
  }'
```

**Request Rework:**
```bash
curl -X POST http://localhost:3333/api/tasks/{taskId}/review \
  -H "Content-Type: application/json" \
  -d '{
    "action": "rework",
    "comment": "Need to add edge case handling for expired tokens"
  }'
```

### 5. Check Queue Status
```bash
curl http://localhost:3333/api/tasks/queue
curl http://localhost:3333/api/tasks/capacity
```

## Expected Behaviors

1. **Max Concurrent:** If 2 tasks already in `in-progress` + `pickedUp`, new `pickup` returns 409
2. **Auto-requeue:** After `rework`, task goes back to `todo` with `orgComment` preserved
3. **Project Filter:** Tasks show project badge in UI
4. **History:** All `runHistory` entries include `reviewComment` for audit trail

## Integration with Issue Tracker

Start webhook handler:
```bash
node scripts/issue-webhook.js --port 3334
```

Configure your issue tracker to POST to:
```
http://your-server:3334/webhook/issue
```

Payload format:
```json
{
  "title": "Issue title",
  "description": "Issue description",
  "project": "project-slug",
  "priority": "high|medium|low",
  "source": "tracker-name",
  "sourceMessageId": "issue-id"
}
```
