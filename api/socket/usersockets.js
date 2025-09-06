const userSockets = new Map();

module.exports = {
  set: (userId, socketId) => {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId).push(socketId); 
  },
  get: (userId) => userSockets.get(userId) || [], 
  delete: (userId, socketId) => {
    if (userSockets.has(userId)) {
      const socketIds = userSockets.get(userId);
      const index = socketIds.indexOf(socketId);
      if (index !== -1) {
        socketIds.splice(index, 1); 
      }
      if (socketIds.length === 0) {
        userSockets.delete(userId); 
      }
    }
  },
  has: (userId) => userSockets.has(userId),
};
