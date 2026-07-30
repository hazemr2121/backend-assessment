const HttpError = require('../../../utils/httpError');

const ALLOWED_FIELDS = ['title', 'status', 'completed'];
const TASK_STATUSES = ['todo', 'in-progress', 'done'];

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Body must be a JSON object.');
  }
}

function ensureNoUnknownFields(payload) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !ALLOWED_FIELDS.includes(field)
  );

  if (unknownFields.length > 0) {
    throw new HttpError(400, 'Body contains unsupported fields.', {
      unsupportedFields: unknownFields,
    });
  }
}

function normalizeTitleIfPresent(payload, normalized) {
  if (!Object.hasOwn(payload, 'title')) {
    return;
  }

  if (typeof payload.title !== 'string') {
    throw new HttpError(400, '"title" must be a string.');
  }

  const trimmedTitle = payload.title.trim();
  if (!trimmedTitle) {
    throw new HttpError(400, '"title" cannot be empty.');
  }

  normalized.title = trimmedTitle;
}

function normalizeCompletedIfPresent(payload, normalized) {
  if (!Object.hasOwn(payload, 'completed')) {
    return;
  }

  if (typeof payload.completed !== 'boolean') {
    throw new HttpError(400, '"completed" must be a boolean.');
  }

  normalized.completed = payload.completed;
}

function normalizeStatusIfPresent(payload, normalized) {
  if (!Object.hasOwn(payload, 'status')) {
    return;
  }

  if (typeof payload.status !== 'string' || !TASK_STATUSES.includes(payload.status)) {
    throw new HttpError(400, '"status" must be one of: todo, in-progress, done.');
  }

  normalized.status = payload.status;
}

function synchronizeStatusAndCompleted(normalized) {
  if (Object.hasOwn(normalized, 'status')) {
    const completedForStatus = normalized.status === 'done';

    if (
      Object.hasOwn(normalized, 'completed') &&
      normalized.completed !== completedForStatus
    ) {
      throw new HttpError(400, '"completed" must match the supplied "status".');
    }

    normalized.completed = completedForStatus;
    return;
  }

  if (Object.hasOwn(normalized, 'completed')) {
    normalized.status = normalized.completed ? 'done' : 'todo';
  }
}

function validateCreateTask(payload) {
  validatePayloadShape(payload);
  ensureNoUnknownFields(payload);

  const normalized = {};
  normalizeTitleIfPresent(payload, normalized);
  normalizeStatusIfPresent(payload, normalized);
  normalizeCompletedIfPresent(payload, normalized);
  synchronizeStatusAndCompleted(normalized);

  if (!Object.hasOwn(normalized, 'title')) {
    throw new HttpError(400, '"title" is required.');
  }

  if (!Object.hasOwn(normalized, 'status')) {
    normalized.status = 'todo';
    normalized.completed = false;
  }

  return normalized;
}

function validateUpdateTask(payload) {
  validatePayloadShape(payload);
  ensureNoUnknownFields(payload);

  const normalized = {};
  normalizeTitleIfPresent(payload, normalized);
  normalizeStatusIfPresent(payload, normalized);
  normalizeCompletedIfPresent(payload, normalized);
  synchronizeStatusAndCompleted(normalized);

  if (Object.keys(normalized).length === 0) {
    throw new HttpError(400, 'Provide at least one updatable field.');
  }

  return normalized;
}

module.exports = {
  validateCreateTask,
  validateUpdateTask,
};
