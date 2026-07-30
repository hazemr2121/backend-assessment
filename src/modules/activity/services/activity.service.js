const path = require('node:path');

const { createId } = require('../../../utils/id');
const { readJsonArray, updateJsonArray } = require('../../../utils/jsonStore');

const ACTIVITY_FILE_PATH = path.resolve(__dirname, '../../../../data/activity.json');

async function getAllActivity() {
  return readJsonArray(ACTIVITY_FILE_PATH);
}

async function createActivity(payload) {
  const activity = {
    id: createId(),
    action: payload.action,
    info: payload.info,
    when: new Date().toISOString(),
  };

  await updateJsonArray(ACTIVITY_FILE_PATH, (activities) => {
    activities.push(activity);
  });

  return activity;
}

module.exports = {
  getAllActivity,
  createActivity,
};
