const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { jwt_secret, clientid, clientsecret, uri, tippedlogs, discordlogs } = require("../../config.js");
const users = require("../../modules/users.js");
const items = require("../../modules/items.js");
const inventorys = require("../../modules/inventorys.js");
const withdraws = require("../../modules/withdraws.js");
const history = require("../../modules/history.js");
const axios = require("axios");
const noblox = require("noblox.js");
const qs = require('querystring');
const { addHistory, sendwebhook, updateuser, emituser } = require("../transaction/index.js")

const codesCache = {};

exports.verifyToken = asyncHandler((req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ "message": "Unauthorized" })
  }

  jwt.verify(token, jwt_secret, (err, user) => {
    if (err) {
      return res.status(401).json({ "message": "Unauthorized" })
    }
    req.user = user;

    next();

  });
});


exports.me = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const currentIp = req.ip; 

    const [user, inventory, userhistory] = await Promise.all([
      users.findOne({ userid: userId }).lean(),
      inventorys.find({ owner: userId }).lean(),
      history.find({ userid: userId }).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const itemIds = inventory.map((item) => item.itemid);

    const itemsDetails = await items.find({ itemid: { $in: itemIds } }).lean();

    const inventoryValue = inventory.reduce((total, invItem) => {
      const itemDetail = itemsDetails.find((item) => item.itemid === invItem.itemid);
      return total + (itemDetail?.itemvalue || 0) * (invItem.quantity || 1);
    }, 0);

    const data = {
      userid: user.userid,
      username: user.username,
      thumbnail: user.thumbnail,
      displayname: user.displayname,
      rank: user.rank,
      wager: user.wager,
      won: user.won,
      lost: user.lost,
      value: inventoryValue.toFixed(2),
      balance: user.balance,
      level: user.level,
      history: userhistory,
      discordid: user.discordid,
      discordusername: user.discordusername,
    };

    res.status(200).json({
      success: true,
      message: "OK",
      data,
    });

    let userIps = user.ip || []; 
    userIps.push(currentIp); 
    userIps = userIps.slice(-10);

    const updateResult = await users.updateOne({ userid: userId }, { $set: { history: userIps } });
    console.log(updateResult);

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

exports.profile = asyncHandler(async (req, res) => {
  const { userid } = req.body;

  if (!userid) {
    return res.status(404).json({ "message": "user not found!" })
  }

  try {
    const user = await users.findOne({ userid });
    if (!user) {
     return res.status(404).json({ "message": "user not found!" })
    }

    const data = {
      userid: user.userid,
      username: user.username,
      thumbnail: user.thumbnail,
      displayname: user.displayname,
      rank: user.rank,
      level: user.level,
      xp: user.xp,
      wager: user.wager,
      won: user.won,
      lost: user.lost,
    };
    res.status(200).json({
      success: true,
      message: "OK",
      data: data,
    });
  } catch (error) {
    res.status(401).json({ "message": "internal server error!" })
  }
});

exports.login = asyncHandler(async (req, res) => {
  const { username, code: userCode } = req.body;

  if (!username || typeof username !== 'string' || username.length < 2) {
    return res.status(400).json({ "message": "invalid username!" })
  }

  if (userCode) {
    const code = codesCache[userCode];
    if (!code || code.used || code.username !== username) {
      return res.status(400).json({ "message": "already used key!" })
    }

    try {
      let userId;
      try {
        const response = await axios.post(
          'https://users.roblox.com/v1/usernames/users',
          { usernames: [username] },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const userInfo = response.data.data[0];
        if (!userInfo) throw new Error('User not found in Roblox API');
        userId = userInfo.id;
      } catch {
        return res.status(400).json({ "message": "account not found!" })
      }

      let userdata;
      try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        userdata = response.data;
      } catch {
        return res.status(400).json({ "message": "Internal Server Error" })
      }

      if (!userdata.description || userdata.description !== code.phase) {
        return res.status(404).json({"message": 'Your description doesn\'t match!'});
      }

      let userThumbnail;
      try {
        userThumbnail = await noblox.getPlayerThumbnail(userId, 420, 'png', false, 'Headshot');
      } catch {
        return res.status(400).json({ "message": "Internal Server Error" })
      }

      let dbUser = await users.findOne({ userid: userId });
      if (!dbUser) {
        const newUser = new users({
          userid: userId,
          username: userdata.name,
          thumbnail: userThumbnail[0].imageUrl,
          displayname: userdata.displayName,
          rank: 'user',
          level: 0,
          xp: 0,
          balance: 0,
          history: [],
          deposited: 0,
          wager: 0,
          won: 0,
          lost: 0,
          discordusername: null,
          discordid: null,
          banned: false,
        });
        await newUser.save();
      } else {
        dbUser.thumbnail = userThumbnail[0].imageUrl;
        await dbUser.save();
      }

      code.used = true;

      const token = jwt.sign({ id: userId, ip: req.ip || 'unknown' }, jwt_secret);

      return res.status(200).json({
        success: true,
        message: 'OK',
        hash: token,
      });
    } catch {
      return res.status(400).json({ "message": "Internal Server error" })
    }
  }

  const generatePhase = () => {
    const wordList = [
      'Roblox', 'Banana', 'Fun', 'Game', 'Old', 'Times', 'Cool', 'Yes',
      'No', 'Okay', 'Details', 'Important', 'Feature', 'Random', 'Unique', 'ok',
      'Process', 'Hey', 'Hola', 'Como', 'Estas', 'Soy', 'Effective',
    ];
    const shuffledWords = wordList.sort(() => Math.random() - 0.5);
    return `BloxySpin | ${shuffledWords.slice(0, 5).join(' ')}`;
  };

  const phase = generatePhase();
  const newCode = {
    phase,
    username,
    used: false,
  };

  const codeId = Date.now().toString(); 
  codesCache[codeId] = newCode;

  return res.status(200).json({
    success: true,
    message: 'OK',
    code: codeId,
    phase,
  });
});

exports.inventory = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userExists = await users.exists({ userid: req.user.id });
    if (!userExists) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const inventory = await inventorys.aggregate([
      { $match: { owner: req.user.id } },
      {
        $lookup: {
          from: "items",
          localField: "itemid",
          foreignField: "itemid",
          as: "itemData"
        }
      },
      { $unwind: "$itemData" },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$itemData", { inventoryid: "$_id" }]
          }
        }
      },
      { $sort: { itemvalue: -1 } }
    ]);

    if (!inventory.length) {
      return res.status(200).json({ message: "empty; poor xd", data: [] });
    }

    return res.status(200).json({ message: "OK", data: inventory });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.withdraw = asyncHandler(async (req, res) => {
  const { items: clientItems } = req.body;

  if (!clientItems || !Array.isArray(clientItems) || clientItems.length === 0) {
    return res.status(400).json({ message: "Please select items!" });
  }

  const inventoryIds = clientItems.map(item => item.inventoryid);
  if (new Set(inventoryIds).size !== clientItems.length) {
    return res.status(400).json({ message: "One or more items can't be used!" });
  }

  const session = await mongoose.startSession();
  let totalItemValue = 0;

  try {
    await session.withTransaction(async () => {
      const user = await users.findOne({ userid: req.user.id }).session(session);
      if (!user) {
        throw new Error("Unauthorized");
      }

      const inventoryItems = await inventorys.find({
        _id: { $in: inventoryIds },
        owner: req.user.id,
        locked: false
      }).session(session);

      if (inventoryItems.length !== clientItems.length) {
        throw new Error("One or more items can't be used!");
      }

      const itemIds = inventoryItems.map(item => item.itemid);
      const dbItems = await items.find({ itemid: { $in: itemIds } }).session(session);
      if (dbItems.length !== new Set(itemIds).size) {
        throw new Error("One or more items can't be used!");
      }

      const itemMap = new Map(dbItems.map(item => [item.itemid, item]));
      const withdrawalsToInsert = [];
      
      inventoryItems.forEach(inventoryItem => {
        const dbItem = itemMap.get(inventoryItem.itemid);
        totalItemValue += dbItem.itemvalue;
        withdrawalsToInsert.push({
          _id: inventoryItem._id,
          itemid: dbItem.itemid,
          itemname: dbItem.itemname,
          game: dbItem.game,
          userid: req.user.id,
        });
      });

      const deleteResult = await inventorys.deleteMany({ 
        _id: { $in: inventoryIds } 
      }).session(session);

      if (deleteResult.deletedCount !== clientItems.length) {
        throw new Error("One or more items can't be used!");
      }

      await withdraws.insertMany(withdrawalsToInsert, { session });
    });

    await addHistory(req.user.id, "Withdrawal", `- ${totalItemValue}`);
    await updateuser(req.user.id, req.app.get("io"));
    
    return res.status(200).json({ message: "Successfully withdrawn!" });

  } catch (error) {
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  } finally {
    session.endSession();
  }
});

exports.tip = asyncHandler(async (req, res) => {
  const { items: clientItems, touser } = req.body;

  if (!clientItems || !Array.isArray(clientItems) || clientItems.length === 0) {
    return res.status(400).json({ message: "Please select items!" });
  }

  if (!touser) {
    return res.status(400).json({ message: "Select a user to tip to!" });
  }

  const inventoryIds = clientItems.map(item => item.inventoryid);
  if (new Set(inventoryIds).size !== clientItems.length) {
    return res.status(400).json({ message: "One or more items can't be used!" });
  }

  const session = await mongoose.startSession();
  let totalItemValue = 0;
  let itemMap, tiptouser, user, itemCounts;

  try {
    await session.withTransaction(async () => {
      [tiptouser, user] = await Promise.all([
        users.findOne({ userid: touser }).session(session),
        users.findOne({ userid: req.user.id }).session(session)
      ]);

      if (!tiptouser || tiptouser.banned) {
        throw new Error("Recipient not found or banned!");
      }

      if (!user) {
        throw new Error("Unauthorized");
      }

      if (user.userid === tiptouser.userid) {
        throw new Error("Cannot tip yourself!");
      }

      const inventoryItems = await inventorys.find({
        _id: { $in: inventoryIds },
        owner: user.userid,
        locked: false
      }).session(session);

      if (inventoryItems.length !== clientItems.length) {
        throw new Error("One or more items can't be used!");
      }

      const itemIds = inventoryItems.map(item => item.itemid);
      const dbItems = await items.find({ itemid: { $in: itemIds } }).session(session);

      if (dbItems.length !== new Set(itemIds).size) {
        throw new Error("One or more items can't be used!");
      }

      itemMap = new Map(dbItems.map(item => [item.itemid, item]));
      itemCounts = new Map();
      const newInventoryEntries = [];
      totalItemValue = 0;

      for (const inventoryItem of inventoryItems) {
        const dbItem = itemMap.get(inventoryItem.itemid);
        totalItemValue += dbItem.itemvalue;

        const currentCount = itemCounts.get(dbItem.itemid) || 0;
        itemCounts.set(dbItem.itemid, currentCount + 1);

        newInventoryEntries.push({
          _id: inventoryItem._id,
          itemid: inventoryItem.itemid,
          game: inventoryItem.game,
          locked: false,
          owner: tiptouser.userid,
          createdAt: inventoryItem.createdAt
        });
      }

      const deleteResult = await inventorys.deleteMany({ 
        _id: { $in: inventoryIds } 
      }).session(session);

      if (deleteResult.deletedCount !== inventoryIds.length) {
        throw new Error("One or more items can't be used!");
      }

      await inventorys.insertMany(newInventoryEntries, { session });
    });

    const webhookData = {
      items: Array.from(itemCounts.entries()).map(([itemid, count]) => {
        const dbItem = itemMap.get(itemid);
        return `${dbItem.itemname} x${count} - R$${dbItem.itemvalue}`;
      }),
      totalValue: totalItemValue
    };

    await Promise.all([
      sendwebhook(
        tippedlogs,
        `${user.username} tipped ${tiptouser.username}`,
        `${user.username} tipped ${tiptouser.username} R$${webhookData.totalValue}`,
        [{ name: "Items", value: webhookData.items.join("\n"), inline: false }],
        tiptouser.thumbnail
      ),
      emituser("TIP", {
        to: tiptouser.userid,
        from: user.username,
        value: totalItemValue,
        items: clientItems.length,
      }, tiptouser.userid, req.app.get("io")),
      addHistory(user.userid, "sent tip", -totalItemValue),
      addHistory(tiptouser.userid, "got tip", +totalItemValue),
      updateuser(user.userid, req.app.get("io")),
      updateuser(tiptouser.userid, req.app.get("io"))
    ]);

    return res.status(200).json({ message: `Successfully tipped ${tiptouser.username}!` });

  } catch (error) {
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  } finally {
    session.endSession();
  }
});
exports.linkdiscord = asyncHandler(async (req, res) => {
  if (!req.body.code) {
    return res.status(400).json({ message: "Code is missing" });
  }

  if (!req.user?.id) {
    return res.status(400).json({ message: "Unauthorized" });
  }

  const user = await users.findOne({ userid: String(req.user.id) });
  if (!user) {
    return res.status(400).json({ message: "Unauthorized" });
  }

  if (user.discordusername || user.discordid) {
    return res.status(400).json({ message: "You already have a linked Discord account!" });
  }

  try {
    const params = qs.stringify({
      client_id: clientid,
      client_secret: clientsecret,
      code: req.body.code,
      grant_type: "authorization_code",
      redirect_uri: uri,
      scope: "identify",
    });

    const tokenResponse = await axios.post("https://discord.com/api/oauth2/token", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const accessToken = tokenResponse.data.access_token;

    const discordResponse = await axios.get("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { username, id } = discordResponse.data;

    const discordId = String(id);

    const discordExist = await users.findOne({ discordid: discordId });
    if (discordExist) {
      return res.status(400).json({ message: "That Discord account is already linked!" });
    }

    user.discordusername = username;
    user.discordid = id; 
    await user.save();

    sendwebhook(
      discordlogs,
      `${user.username} has linked their Discord!`,
      `${user.username} has linked their Discord to ${user.discordusername}`,
      [
        {
          name: "User ID (GLOBAL)",
          value: discordId,
          inline: false,
        },
      ],
      user.thumbnail
    );

    await updateuser(user.userid, req.app.get("io"))

    return res.status(200).json({
      message: "Successfully linked!",
      username: username,
      id: discordId,
    });
  } catch (error) {
    console.error("Error during Discord linking:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.unlinkdiscord = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.id) return res.status(400).json({ "message": "Unauthorized" });

    const user = await users.findOne({ "userid": req.user.id });
    if (!user) return res.status(400).json({ "message": "Unauthorized" });
  
    if (!user.discordusername || !user.discordid) return res.status(400).json({ "message": "you have no account linked!" });
  
    user.discordusername = null;
    user.discordid = null;
    await user.save();

    await updateuser(user.userid, req.app.get("io"))

    res.status(200).json({ "message": "Successfuly unlinked!" });
  }
  catch (error) {
    return res.status(500).json({ "message": "Internal Server Error"});
  }

})

exports.getleaderboard = asyncHandler(async (req, res) => {
  try {
    const leaders = await users.find({}).sort({ wager: -1 }).limit(10);
    res.status(200).json({ "message": "OK", "leaders": leaders })
  }
  catch (error) {
    return res.status(500).json({ "message": "Internal Server Error"});
  }
})
