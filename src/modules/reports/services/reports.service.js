const tasksService = require('../../tasks/services/tasks.service');
const activityService = require('../../activity/services/activity.service');

const RECENT_ACTIVITY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TASK_STATUSES = new Set(['todo', 'in-progress', 'done']);

function isRecentActivity(activity, now) {
  const timestamp = Date.parse(activity.when);
  return Number.isFinite(timestamp) && timestamp >= now - RECENT_ACTIVITY_WINDOW_MS && timestamp <= now;
}

function getTaskStatus(task) {
  if (TASK_STATUSES.has(task.status)) {
    return task.status;
  }

  return task.completed ? 'done' : 'todo';
}

async function getTasksSummary() {
  const [tasks, activities] = await Promise.all([
    tasksService.getAllTasks(),
    activityService.getAllActivity(),
  ]);
  const now = Date.now();
  const byStatus = { todo: 0, 'in-progress': 0, done: 0 };

  for (const task of tasks) {
    byStatus[getTaskStatus(task)] += 1;
  }

  return {
    total: tasks.length,
    byStatus,
    recentActivityCount: activities.filter((activity) => isRecentActivity(activity, now)).length,
  };
}

module.exports = {
  getTasksSummary,
};
