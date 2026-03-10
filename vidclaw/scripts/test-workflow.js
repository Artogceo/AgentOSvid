#!/usr/bin/env node
/**
 * VidClaw API Workflow Test Script
 * 
 * Tests the full task workflow:
 * 1. Create task via API
 * 2. Pickup task (check maxConcurrent limit)
 * 3. Complete with needsReview
 * 4. Review with done/rework actions
 */

const API_BASE = process.env.VIDCLAW_API || 'http://localhost:3333';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log('='.repeat(60), 'bright');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'bright');
}

function logResult(success, message) {
  const icon = success ? '✓' : '✗';
  const color = success ? 'green' : 'red';
  log(`  ${icon} ${message}`, color);
}

// HTTP helper
async function api(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// Test state
const state = {
  createdTasks: [],
  settings: null,
  testsPassed: 0,
  testsFailed: 0,
};

// Test 1: Get current settings (to check maxConcurrent)
async function testGetSettings() {
  logSection('TEST 1: Get Current Settings');
  
  const result = await api('GET', '/api/tasks/queue?limit=capacity');
  
  if (result.ok && result.data) {
    state.settings = {
      maxConcurrent: result.data.maxConcurrent,
      activeCount: result.data.activeCount,
      remainingSlots: result.data.remainingSlots,
    };
    logResult(true, `Retrieved settings: maxConcurrent=${result.data.maxConcurrent}, activeCount=${result.data.activeCount}`);
    return true;
  } else {
    logResult(false, `Failed to get settings: ${result.error || result.status}`);
    return false;
  }
}

// Test 2: Create a task
async function testCreateTask() {
  logSection('TEST 2: Create Task');
  
  const payload = {
    title: 'Test Task - Workflow Validation',
    description: 'This is a test task created by the automated test script to validate the full workflow.',
    priority: 'high',
    project: 'internal',
    status: 'todo',
    source: 'test-script',
  };
  
  const result = await api('POST', '/api/tasks', payload);
  
  if (result.ok && result.data && result.data.id) {
    state.createdTasks.push(result.data);
    logResult(true, `Created task with ID: ${result.data.id}`);
    log(`    Title: ${result.data.title}`, 'blue');
    log(`    Status: ${result.data.status}`, 'blue');
    return result.data;
  } else {
    logResult(false, `Failed to create task: ${result.error || JSON.stringify(result.data)}`);
    return null;
  }
}

// Test 3: List tasks and verify our task exists
async function testListTasks() {
  logSection('TEST 3: List Tasks');
  
  const result = await api('GET', '/api/tasks');
  
  if (result.ok && Array.isArray(result.data)) {
    const found = result.data.find(t => t.id === state.createdTasks[0]?.id);
    if (found) {
      logResult(true, `Found ${result.data.length} tasks, including our test task`);
      return true;
    } else {
      logResult(false, 'Test task not found in list');
      return false;
    }
  } else {
    logResult(false, `Failed to list tasks: ${result.error || result.status}`);
    return false;
  }
}

// Test 4: Pickup task (should succeed)
async function testPickupTask(taskId) {
  logSection('TEST 4: Pickup Task');
  
  const payload = {
    subagentId: `test-agent-${Date.now()}`,
  };
  
  const result = await api('POST', `/api/tasks/${taskId}/pickup`, payload);
  
  if (result.ok && result.data) {
    logResult(true, `Picked up task ${taskId}`);
    log(`    Status: ${result.data.status}`, 'blue');
    log(`    PickedUp: ${result.data.pickedUp}`, 'blue');
    log(`    SubagentId: ${result.data.subagentId}`, 'blue');
    return result.data;
  } else {
    logResult(false, `Failed to pickup task: ${result.error || JSON.stringify(result.data)}`);
    return null;
  }
}

// Test 5: Try to exceed maxConcurrent limit
async function testMaxConcurrentLimit() {
  logSection('TEST 5: Max Concurrent Limit Check');
  
  // Get current capacity
  const queueResult = await api('GET', '/api/tasks/queue?limit=capacity');
  const { maxConcurrent, activeCount, remainingSlots } = queueResult.data || {};
  
  log(`  Current: maxConcurrent=${maxConcurrent}, activeCount=${activeCount}, remainingSlots=${remainingSlots}`, 'blue');
  
  // Create multiple tasks to test the limit
  const tasksToCreate = maxConcurrent + 2;
  log(`  Creating ${tasksToCreate} additional tasks to test limit...`, 'yellow');
  
  const tasks = [];
  for (let i = 0; i < tasksToCreate; i++) {
    const result = await api('POST', '/api/tasks', {
      title: `Concurrent Test Task ${i + 1}`,
      description: 'Testing max concurrent limit',
      status: 'todo',
    });
    if (result.ok && result.data) {
      tasks.push(result.data);
      state.createdTasks.push(result.data);
    }
  }
  
  log(`  Created ${tasks.length} tasks`, 'blue');
  
  // Try to pickup all tasks
  let successfulPickups = 0;
  let failedPickups = 0;
  
  for (const task of tasks) {
    const result = await api('POST', `/api/tasks/${task.id}/pickup`, {
      subagentId: `test-agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    
    if (result.ok) {
      successfulPickups++;
    } else if (result.status === 409) {
      failedPickups++;
      log(`    ✓ Got 409 conflict for task ${task.id} (expected)`, 'green');
    } else {
      log(`    ✗ Unexpected error for task ${task.id}: ${result.status}`, 'red');
    }
  }
  
  log(`  Successful pickups: ${successfulPickups}, Failed (expected 409): ${failedPickups}`, 'blue');
  
  if (failedPickups > 0) {
    logResult(true, 'Max concurrent limit is enforced correctly');
    return true;
  } else if (maxConcurrent >= tasksToCreate + activeCount) {
    logResult(true, 'All pickups succeeded (limit not reached yet)');
    return true;
  } else {
    logResult(false, 'Limit not enforced as expected');
    return false;
  }
}

// Test 6: Complete task with needsReview
async function testCompleteWithNeedsReview(taskId) {
  logSection('TEST 6: Complete Task with NeedsReview');
  
  const payload = {
    result: 'Task completed successfully with some results that need review.',
    needsReview: true,
    reviewComment: 'Please review the output format before finalizing.',
  };
  
  const result = await api('POST', `/api/tasks/${taskId}/complete`, payload);
  
  if (result.ok && result.data) {
    const task = result.data;
    if (task.status === 'needs_review') {
      logResult(true, `Task marked as needs_review`);
      log(`    Status: ${task.status}`, 'blue');
      log(`    Review Comment: ${task.reviewComment}`, 'blue');
      log(`    Result: ${task.result?.substring(0, 50)}...`, 'blue');
      log(`    PickedUp: ${task.pickedUp}`, 'blue');
      log(`    SubagentId: ${task.subagentId}`, 'blue');
      return task;
    } else {
      logResult(false, `Expected status 'needs_review', got '${task.status}'`);
      return null;
    }
  } else {
    logResult(false, `Failed to complete task: ${result.error || JSON.stringify(result.data)}`);
    return null;
  }
}

// Test 7: Review task with 'done' action
async function testReviewDone(taskId) {
  logSection('TEST 7: Review Task with Done Action');
  
  const payload = {
    action: 'done',
    comment: 'Reviewed and approved. Great work!',
  };
  
  const result = await api('POST', `/api/tasks/${taskId}/review`, payload);
  
  if (result.ok && result.data) {
    const task = result.data;
    if (task.status === 'done') {
      logResult(true, `Task approved and marked as done`);
      log(`    Status: ${task.status}`, 'blue');
      log(`    CompletedAt: ${task.completedAt}`, 'blue');
      log(`    Review Comment: ${task.reviewComment}`, 'blue');
      return task;
    } else {
      logResult(false, `Expected status 'done', got '${task.status}'`);
      return null;
    }
  } else {
    logResult(false, `Failed to review task: ${result.error || JSON.stringify(result.data)}`);
    return null;
  }
}

// Test 8: Review task with 'rework' action
async function testReviewRework() {
  logSection('TEST 8: Review Task with Rework Action');
  
  // Create a new task to test rework
  const createResult = await api('POST', '/api/tasks', {
    title: 'Rework Test Task',
    description: 'Testing rework action',
    status: 'todo',
  });
  
  if (!createResult.ok || !createResult.data) {
    logResult(false, 'Failed to create task for rework test');
    return null;
  }
  
  const task = createResult.data;
  state.createdTasks.push(task);
  
  // Pickup task
  await api('POST', `/api/tasks/${task.id}/pickup`, { subagentId: 'test-rework-agent' });
  
  // Complete with needsReview
  await api('POST', `/api/tasks/${task.id}/complete`, {
    result: 'Initial result that needs rework.',
    needsReview: true,
  });
  
  // Now review with rework
  const payload = {
    action: 'rework',
    comment: 'Please fix the formatting and add more details.',
  };
  
  const result = await api('POST', `/api/tasks/${task.id}/review`, payload);
  
  if (result.ok && result.data) {
    const updatedTask = result.data;
    if (updatedTask.status === 'todo') {
      logResult(true, `Task sent back to todo for rework`);
      log(`    Status: ${updatedTask.status}`, 'blue');
      log(`    Org Comment: ${updatedTask.orgComment}`, 'blue');
      log(`    Review Comment: ${updatedTask.reviewComment}`, 'blue');
      log(`    PickedUp: ${updatedTask.pickedUp}`, 'blue');
      return updatedTask;
    } else {
      logResult(false, `Expected status 'todo', got '${updatedTask.status}'`);
      return null;
    }
  } else {
    logResult(false, `Failed to review task: ${result.error || JSON.stringify(result.data)}`);
    return null;
  }
}

// Test 9: Invalid review action
async function testInvalidReviewAction(taskId) {
  logSection('TEST 9: Invalid Review Action');
  
  const payload = {
    action: 'invalid-action',
    comment: 'This should fail',
  };
  
  const result = await api('POST', `/api/tasks/${taskId}/review`, payload);
  
  if (!result.ok && result.status === 400) {
    logResult(true, `Got expected 400 error for invalid action`);
    log(`    Error: ${result.data?.error || 'Unknown error'}`, 'blue');
    return true;
  } else {
    logResult(false, `Expected 400 error, got ${result.status}`);
    return false;
  }
}

// Test 10: Get task queue
async function testGetQueue() {
  logSection('TEST 10: Get Task Queue');
  
  const result = await api('GET', '/api/tasks/queue');
  
  if (result.ok && result.data && Array.isArray(result.data.tasks)) {
    logResult(true, `Retrieved task queue with ${result.data.tasks.length} tasks`);
    log(`    maxConcurrent: ${result.data.maxConcurrent}`, 'blue');
    log(`    activeCount: ${result.data.activeCount}`, 'blue');
    log(`    remainingSlots: ${result.data.remainingSlots}`, 'blue');
    return true;
  } else {
    logResult(false, `Failed to get queue: ${result.error || result.status}`);
    return false;
  }
}

// Test 11: Cleanup - delete test tasks
async function testCleanup() {
  logSection('TEST 11: Cleanup - Archive Test Tasks');
  
  let archivedCount = 0;
  
  for (const task of state.createdTasks) {
    const result = await api('DELETE', `/api/tasks/${task.id}`);
    if (result.ok) {
      archivedCount++;
    }
  }
  
  logResult(true, `Archived ${archivedCount}/${state.createdTasks.length} test tasks`);
  return archivedCount === state.createdTasks.length;
}

// Test 12: Complete without needsReview (should go directly to done)
async function testCompleteDirectlyToDone() {
  logSection('TEST 12: Complete Task Directly to Done');
  
  // Create a task
  const createResult = await api('POST', '/api/tasks', {
    title: 'Direct Complete Test Task',
    description: 'Testing direct completion without review',
    status: 'todo',
  });
  
  if (!createResult.ok || !createResult.data) {
    logResult(false, 'Failed to create task');
    return null;
  }
  
  const task = createResult.data;
  state.createdTasks.push(task);
  
  // Pickup task
  await api('POST', `/api/tasks/${task.id}/pickup`, { subagentId: 'test-direct-agent' });
  
  // Complete WITHOUT needsReview
  const result = await api('POST', `/api/tasks/${task.id}/complete`, {
    result: 'Task completed directly without review needed.',
    needsReview: false,
  });
  
  if (result.ok && result.data) {
    const updatedTask = result.data;
    if (updatedTask.status === 'done') {
      logResult(true, `Task completed directly to done status`);
      log(`    Status: ${updatedTask.status}`, 'blue');
      log(`    CompletedAt: ${updatedTask.completedAt}`, 'blue');
      return updatedTask;
    } else {
      logResult(false, `Expected status 'done', got '${updatedTask.status}'`);
      return null;
    }
  } else {
    logResult(false, `Failed to complete task: ${result.error || JSON.stringify(result.data)}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  log('', 'bright');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        VidClaw API Workflow Test Suite                     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`  API Endpoint: ${API_BASE}`, 'blue');
  log(`  Started: ${new Date().toISOString()}`, 'blue');
  
  const results = [];
  
  try {
    // Test 1: Get settings
    results.push({ name: 'Get Settings', passed: await testGetSettings() });
    
    // Test 2: Create task
    const createdTask = await testCreateTask();
    results.push({ name: 'Create Task', passed: !!createdTask });
    
    if (!createdTask) {
      log('CRITICAL: Cannot continue without task creation', 'red');
      process.exit(1);
    }
    
    // Test 3: List tasks
    results.push({ name: 'List Tasks', passed: await testListTasks() });
    
    // Test 4: Pickup task
    const pickedUpTask = await testPickupTask(createdTask.id);
    results.push({ name: 'Pickup Task', passed: !!pickedUpTask });
    
    // Test 5: Max concurrent limit
    results.push({ name: 'Max Concurrent Limit', passed: await testMaxConcurrentLimit() });
    
    // Test 6: Complete with needsReview
    const needsReviewTask = await testCompleteWithNeedsReview(createdTask.id);
    results.push({ name: 'Complete with NeedsReview', passed: !!needsReviewTask });
    
    // Test 7: Review with done
    const reviewedDoneTask = await testReviewDone(createdTask.id);
    results.push({ name: 'Review with Done', passed: !!reviewedDoneTask });
    
    // Test 8: Review with rework
    const reworkedTask = await testReviewRework();
    results.push({ name: 'Review with Rework', passed: !!reworkedTask });
    
    // Test 9: Invalid review action
    results.push({ name: 'Invalid Review Action', passed: await testInvalidReviewAction(createdTask.id) });
    
    // Test 10: Get queue
    results.push({ name: 'Get Task Queue', passed: await testGetQueue() });
    
    // Test 12: Complete directly to done
    const directDoneTask = await testCompleteDirectlyToDone();
    results.push({ name: 'Complete Directly to Done', passed: !!directDoneTask });
    
    // Test 11: Cleanup
    results.push({ name: 'Cleanup', passed: await testCleanup() });
    
  } catch (error) {
    log(`\nCRITICAL ERROR: ${error.message}`, 'red');
    console.error(error);
  }
  
  // Summary
  log('', 'bright');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    TEST SUMMARY                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  for (const result of results) {
    logResult(result.passed, result.name);
  }
  
  log('', 'bright');
  log(`Total: ${results.length} tests`, 'bright');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed === 0) {
    log('', 'bright');
    log('🎉 All tests passed!', 'green');
  } else {
    log('', 'bright');
    log(`⚠️ ${failed} test(s) failed`, 'red');
    process.exit(1);
  }
}

// Run tests
runTests();
