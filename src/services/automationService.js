const dailyChecklistJob = require('../jobs/dailyChecklistJob');
const notificationService = require('./notificationService');

const runAutomations = async (condominiumId) => {
  const checklistResult = await dailyChecklistJob.runManually(condominiumId);
  return {
    checklists: checklistResult,
    executedAt: new Date().toISOString(),
  };
};

const getUnreadNotifications = async (userId, condominiumId) => {
  return notificationService.getUserNotifications(userId, condominiumId, {
    read: false,
    limit: 50,
    offset: 0,
  });
};

const markNotificationAsRead = async (notificationId, userId) => {
  const id = Number(notificationId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  try {
    return await notificationService.markAsRead(id, userId);
  } catch (error) {
    if (error.message && error.message.includes('não encontrada')) {
      return null;
    }
    throw error;
  }
};

module.exports = {
  runAutomations,
  getUnreadNotifications,
  markNotificationAsRead,
};
