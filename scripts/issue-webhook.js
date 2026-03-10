#!/usr/bin/env node
/**
 * Issue Tracker Webhook Handler for VidClaw
 * 
 * Receives issues from external trackers (like Createya) and creates
 * tasks in VidClaw inbox.
 * 
 * Usage:
 *   node issue-webhook.js --port 3334
 *   
 * Or integrate with your issue tracker's webhook system:
 *   POST http://localhost:3334/webhook/issue
 *   {
 *     "title": "Bug in login",
 *     "description": "User can't log in with TOTP",
 *     "project": "createya-frontend",
 *     "priority": "high",
 *     "source": "createya",
 *     "sourceMessageId": "issue-123"
 *   }
 */

const http = require('http');
const { URL } = require('url');

const VIDCLAW_URL = process.env.VIDCLAW_URL || 'http://localhost:3333';
const PORT = process.env.PORT || 3334;

async function createTask(payload) {
  const response = await fetch(`${VIDCLAW_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      project: payload.project || 'unknown',
      priority: payload.priority || 'medium',
      skills: payload.skills || [],
      source: payload.source || 'webhook',
      sourceMessageId: payload.sourceMessageId || null,
      status: 'todo',
      channel: payload.channel || null,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (url.pathname === '/webhook/issue' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        console.log(`[${new Date().toISOString()}] Received issue: ${payload.title}`);
        
        const task = await createTask(payload);
        console.log(`[${new Date().toISOString()}] Created task: ${task.id}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, taskId: task.id }));
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error:`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', vidclawUrl: VIDCLAW_URL }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Issue Tracker Webhook Handler listening on port ${PORT}`);
  console.log(`Forwarding to VidClaw at ${VIDCLAW_URL}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  POST http://localhost:${PORT}/webhook/issue - Create task from issue`);
  console.log(`  GET  http://localhost:${PORT}/health - Health check`);
});
