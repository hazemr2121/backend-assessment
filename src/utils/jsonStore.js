const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const writeQueues = new Map();

async function readJsonArray(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]\n', 'utf-8');
      return [];
    }

    throw error;
  }
}

async function writeJsonArray(filePath, data) {
  if (!Array.isArray(data)) {
    throw new TypeError('JSON store only supports arrays.');
  }

  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${randomUUID()}.tmp`
  );

  await fs.writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  await fs.rename(temporaryPath, filePath);
}

function updateJsonArray(filePath, update) {
  const previousUpdate = writeQueues.get(filePath) || Promise.resolve();
  const currentUpdate = previousUpdate
    .catch(() => undefined)
    .then(async () => {
      const data = await readJsonArray(filePath);
      const result = await update(data);
      await writeJsonArray(filePath, data);
      return result;
    });

  writeQueues.set(filePath, currentUpdate);
  currentUpdate.finally(() => {
    if (writeQueues.get(filePath) === currentUpdate) {
      writeQueues.delete(filePath);
    }
  }).catch(() => undefined);

  return currentUpdate;
}

module.exports = {
  readJsonArray,
  writeJsonArray,
  updateJsonArray,
};
