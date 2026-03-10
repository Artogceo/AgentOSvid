#!/usr/bin/env node
/**
 * Org Agent Heartbeat - Auto-pickup tasks from VidClaw queue
 * 
 * This script runs periodically (via cron) to check for tasks in 'todo'
 * and spawns the Org agent to process them (respecting maxConcurrent limit)
 */

const VIDCLAW_API = process.env.VIDCLAW_API || 'http://localhost:3333';

async function api(endpoint, method = 'GET', body = null) {
  const url = `${VIDCLAW_API}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const response = await fetch(url, options);
    return { ok: response.ok, status: response.status, data: await response.json().catch(() => null) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function checkAndPickup() {
  console.log(`[${new Date().toISOString()}] Checking VidClaw queue...`);
  
  // Get queue with capacity info
  const queueResult = await api('/api/tasks/queue?limit=capacity');
  
  if (!queueResult.ok) {
    console.error('Failed to get queue:', queueResult.error);
    process.exit(1);
  }
  
  const { tasks, maxConcurrent, activeCount, remainingSlots } = queueResult.data;
  
  console.log(`  Max concurrent: ${maxConcurrent}, Active: ${activeCount}, Remaining: ${remainingSlots}`);
  
  if (remainingSlots <= 0) {
    console.log('  No slots available, skipping');
    return;
  }
  
  // Filter tasks that are ready for pickup (todo or in-progress not picked up)
  const readyTasks = tasks.filter(t => 
    t.status === 'todo' || (t.status === 'in-progress' && !t.pickedUp)
  );
  
  if (readyTasks.length === 0) {
    console.log('  No tasks ready for pickup');
    return;
  }
  
  console.log(`  Found ${readyTasks.length} task(s) ready for pickup`);
  
  // Pickup up to remainingSlots tasks
  const tasksToPickup = readyTasks.slice(0, remainingSlots);
  
  for (const task of tasksToPickup) {
    console.log(`  Picking up task: ${task.id} - ${task.title}`);
    
    const pickupResult = await api(`/api/tasks/${task.id}/pickup`, 'POST', {
      subagentId: 'org'
    });
    
    if (pickupResult.ok) {
      console.log(`  ✓ Task ${task.id} picked up successfully`);
      
      // Now spawn Org agent to process this task
      await spawnOrgAgent(task);
    } else {
      console.error(`  ✗ Failed to pickup task ${task.id}:`, pickupResult.data?.error || pickupResult.status);
    }
  }
}

async function spawnOrgAgent(task) {
  console.log(`  Spawning Org agent for task ${task.id}...`);
  
  // Use OpenClaw sessions_spawn via exec or API
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  const taskDescription = `
🎯 ЗАДАЧА #${task.id.slice(0,8)}: ${task.title}

📋 Описание:
${task.description || 'Нет описания'}

🏷️ Проект: ${task.project || 'Не указан'}
🔥 Приоритет: ${task.priority || 'medium'}
📊 Статус: ${task.status}

⚠️ ИНСТРУКЦИЯ ДЛЯ ОРГА:
1. Прочитать структуру проекта (CODEBASE.md или AC_STRUCTURE.md)
2. Написать детальное ТЗ
3. Выбрать исполнителя:
   - Марк (backend-cto) для бэкенда/API/БД
   - Джони (design-cdo) для фронтенда/React/UI
   - Паша (architect) для сложных задач/аудита
4. Спавнить исполнителя через sessions_spawn
5. Обновить задачу: PATCH /api/tasks/${task.id} -> status=in_progress
6. Получить результат от исполнителя
7. Обновить задачу: POST /api/tasks/${task.id}/complete с needsReview=true

VidClaw API: http://localhost:3333
`;

  try {
    // Use openclaw CLI to spawn Org agent
    const cmd = `openclaw sessions:spawn \
      --agent-id=org \
      --task='${taskDescription.replace(/'/g, "'\"'\"'")}' \
      --cleanup=delete`;
    
    console.log(`  Running: openclaw sessions:spawn --agent-id=org ...`);
    
    // For now, just log the action - in production this would spawn the agent
    console.log(`  ✓ Org agent spawn command prepared`);
    console.log(`  Note: To auto-spawn, ensure openclaw CLI is in PATH`);
    
  } catch (error) {
    console.error(`  ✗ Failed to spawn Org agent:`, error.message);
  }
}

// Run check
checkAndPickup().then(() => {
  console.log(`[${new Date().toISOString()}] Done`);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
