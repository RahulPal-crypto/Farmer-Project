const Notification = require("../models/Notification");

const createNotification = async (data) => {
  return await Notification.create(data);
};

module.exports = {
  createNotification,
};
