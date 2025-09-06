const asyncHandler = require("express-async-handler");
const users = require("../../modules/users.js");
//const coinflips = require("../../modules/coinflips.js");

const messages = [];
const lastMessageTime = {};
const mutedUsers = new Map();

exports.sendchat = asyncHandler(async (req, res, next, io) => {
  const { msgcontent } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ "message": "Unauthorized" });
  }

  if (!msgcontent || msgcontent.length < 1) {
    return res.status(400).json({ "message": "Your message is too short!" });
  }

  if (msgcontent.length > 60) {
    return res.status(400).json({ "message": "Your message is too long!" });
  }

  const now = Date.now();

  if (mutedUsers.has(userId)) {
    const { unmuteTime, duration } = mutedUsers.get(userId);
    if (now < unmuteTime) {
      const minutesLeft = Math.ceil((unmuteTime - now) / 60000);
      return res.status(403).json({ "message": `You are muted for another ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.` });
    } else {
      mutedUsers.delete(userId); 
    }
  }

  if (lastMessageTime[userId] && now - lastMessageTime[userId] < 3000) {
    return res.status(400).json({ "message": "You're sending messages too quickly!" });
  }

  const user = await users.findOne({ userid: userId }).select("username thumbnail rank level");
  if (!user) {
    return res.status(400).json({ "message": "User not found" });
  }
  if (user.level < 2) {
    return res.status(400).json({ "message": "Be at least level 2 to chat!" });
  }


  const messageData = {
    content: msgcontent,
    userid: userId,
    username: user.username,
    thumbnail: user.thumbnail || null,
    rank: user.rank,
    level: user.level,
    timestamp: new Date().toISOString().slice(11, 16), // "HH:MM"
  };

  messages.push(messageData);
  if (messages.length > 40) messages.shift();

  lastMessageTime[userId] = now;
  io.emit("MESSAGE", messageData);

  let systemResponse = null;
  if (msgcontent.startsWith("?") && (user.rank === "OWNER" || user.rank === "ADMIN")) {
    const [command, ...args] = msgcontent.split(" ");

    switch (command.toLowerCase()) {
      case "?mute": {
        const targetUser = args[0];
        const duration = parseInt(args[1], 10) || 30; 

        if (!targetUser) {
          systemResponse = "Please specify a user to mute.";
          break;
        }

        const userToMute = await users.findOne({ username: targetUser });
        if (!userToMute) {
          systemResponse = "The user does not exist!";
          break;
        }

        if (userToMute.userid === userId || userToMute.rank === "ADMIN") {
          systemResponse = "You cannot mute yourself or another admin.";
          break;
        }

        if (mutedUsers.has(userToMute.userid)) {
          systemResponse = "The user is already muted!";
          break;
        }

        mutedUsers.set(userToMute.userid, { unmuteTime: now + duration * 60 * 1000, duration });
        systemResponse = `${targetUser} has been muted for ${duration} minutes.`;
        break;
      }

      case "?unmute": {
        const targetUser = args[0];
        if (!targetUser) {
          systemResponse = "Please specify a user to unmute.";
          break;
        }

        const userToUnmute = await users.findOne({ username: targetUser });
        if (!userToUnmute) {
          systemResponse = "The user does not exist!";
          break;
        }

        if (userToUnmute.userid === userId || userToUnmute.rank === "ADMIN") {
          systemResponse = "You cannot unmute yourself or another ADMIN.";
          break;
        }

        if (!mutedUsers.has(userToUnmute.userid)) {
          systemResponse = "The user is not muted!";
          break;
        }

        mutedUsers.delete(userToUnmute.userid);
        systemResponse = `${targetUser} has been unmuted.`;

        break;
      }

      case "?ban": {
        const targetUser = args[0];
        if (!targetUser) {
          systemResponse = "Please specify a user to ban.";
          break;
        }

        const userToBan = await users.findOne({ username: targetUser });
        if (!userToBan) {
          systemResponse = "The user does not exist!";
          break;
        }

        if (userToBan.userid === userId || userToBan.rank === "ADMIN") {
          systemResponse = "You cannot ban yourself or another ADMIN.";
          break;
        }

        if (userToBan.banned) {
          systemResponse = "The user is already banned!";
          break;
        }

        userToBan.banned = true;
        await userToBan.save();

        systemResponse = `${targetUser} has been banned.`;
        break;
      }

      case "?unban": {
        const targetUser = args[0];
        if (!targetUser) {
          systemResponse = "Please specify a user to unban.";
          break;
        }

        const userToUnban = await users.findOne({ username: targetUser });
        if (!userToUnban) {
          systemResponse = "The user does not exist!";
          break;
        }

        if (userToUnban.userid === userId || userToUnban.rank === "ADMIN") {
          systemResponse = "You cannot unban yourself or another ADMIN.";
          break;
        }

        if (!userToUnban.banned) {
          systemResponse = "The user is not banned!";
          break;
        }

        userToUnban.banned = false;
        await userToUnban.save();

        systemResponse = `${targetUser} has been unbanned.`;
        break;
      }

      case "?rainbow": {
        io.emit("rainbow");
        systemResponse = "xd";
        break;
      }

      default:
        systemResponse = "Unknown command.";
    }
  }

  if (systemResponse) {
    messages.push({
      content: systemResponse,
      userid: 1,
      username: "BLOXYSPIN",
      thumbnail: "https://cdn.discordapp.com/icons/1253663005191962654/3d9be4c5c581964ce94050106273ed67.png?size=4096",
      rank: "ADMIN",
      level: 1,
      timestamp: new Date().toISOString().slice(11, 16),
    });

    io.emit("MESSAGE", {
      content: systemResponse,
      userid: 1,
      username: "BLOXYSPIN",
      thumbnail: "https://cdn.discordapp.com/icons/1253663005191962654/3d9be4c5c581964ce94050106273ed67.png?size=4096",
      rank: "OWNER",
      level: 1,
      timestamp: new Date().toISOString().slice(11, 16),
    });
  }

  return res.status(200).json({ "message": systemResponse || messageData });
});

exports.latestmessages = asyncHandler(async (req, res) => {
  return res.status(200).json({ "messages": messages });
});
