const asyncHandler = require("express-async-handler");
const { jwt_secret, botlogs } = require("../../config.js");
const users = require("../../modules/users.js");
const inventorys = require("../../modules/inventorys.js");
const items = require("../../modules/items.js");
const withdraws = require("../../modules/withdraws.js");
const botss = require("../../modules/bots.js");
const { addHistory, sendwebhook, updateuser } = require("../transaction/index.js");
const axios = require("axios");

const userCodes = {};

exports.real = asyncHandler((req, res, next) => {
  const token = req.headers["authorization"];
  if (token !== jwt_secret) return res.status(401).json({ message: "Invalid authorization" });
  next();
});

exports.Getmethod = asyncHandler(async (req, res) => {
  const { userId, game } = req.body;
  if (!userId || !game) return res.status(400).json({ method: "USERNOTFOUND" });

  const user = await users.findOne({ userid: userId }, { _id: 0, banned: 1, username: 1 });
  if (!user || user.banned) return res.status(400).json({ method: "USERNOTFOUND" });

  const code = userCodes[userId] || "NO_CODE";
  const userWithdraws = await withdraws.find({ userid: userId, game }, { itemid: 1, itemname: 1 });

  if (!userWithdraws.length) return res.status(200).json({ method: "Deposit", code });

  let withdrawals = [];
  let gemsAdded = 0;
  const itemIds = userWithdraws.filter(w => w.itemid !== 0).map(w => w.itemid);
  let itemsMap = {};

  if (itemIds.length) {
    const itemsData = await items.find({ itemid: { $in: itemIds } }, { _id: 0, itemid: 1, itemname: 1 });
    itemsData.forEach(item => itemsMap[item.itemid] = item.itemname);
  }

  await Promise.all(userWithdraws.map(async (withdraw) => {
    const itemName = withdraw.itemid !== 0 ? itemsMap[withdraw.itemid] || withdraw.itemname : withdraw.itemname;
    if (itemName === "50m gems") gemsAdded += 50_000_000;
    else withdrawals.push(itemName);
  }));

  return res.status(200).json({ method: "Withdraw", pets: withdrawals, code, gems: gemsAdded });
});

exports.Deposit = asyncHandler(async (req, res) => {
  const { userId, pets: itemList = [], game, gems = 0 } = req.body;
  if (!userId) return res.status(400).json({ method: "USERNOTFOUND", message: "Username is required" });

  const user = await users.findOne({ userid: userId });
  if (!user) return res.status(400).json({ method: "USERNOTFOUND", message: `User '${userId}' not found` });

  const depositResults = [];
  const itemValues = {};
  const itemCounts = {};
  let totalValue = 0;

  if (gems > 0) {
    const userGems = Math.floor(gems / 50000000);
    const gemItem = await items.findOne({ itemname: "50m gems" });
    if (!gemItem) {
      depositResults.push({ itemName: "50m gems", status: "failed", reason: "Item not found" });
    } else {
      const gemValue = gemItem.itemvalue || 50000000;
      totalValue += gemValue * userGems;
      itemValues["50m gems"] = gemValue;
      itemCounts["50m gems"] = userGems;

      const gemInventoryItems = Array(userGems).fill({
        owner: user.userid,
        itemid: gemItem.itemid,
        locked: false,
      });
      await inventorys.insertMany(gemInventoryItems);
      depositResults.push({ itemName: "50m gems", status: "success", quantity: userGems });
    }
  }

  if (itemList.length > 0) {
    const uniqueItems = {};

    for (const itemName of itemList) {
      if (itemName === "???") {
        depositResults.push({ itemName, status: "skipped", reason: "Unknown item" });
        continue;
      }
      uniqueItems[itemName] = (uniqueItems[itemName] || 0) + 1;
    }

    const itemQueries = Object.keys(uniqueItems).map(itemName =>
      items.findOne({ itemname: itemName, game }).then(item => ({ itemName, item }))
    );
    const foundItems = await Promise.all(itemQueries);

    const inventoryItems = [];
    for (const { itemName, item } of foundItems) {
      if (!item) {
        depositResults.push({ itemName, status: "failed", reason: "Item not found" });
        continue;
      }
      const count = uniqueItems[itemName];
      totalValue += (item.itemvalue || 0) * count;
      itemValues[itemName] = item.itemvalue || "Unknown";
      itemCounts[itemName] = count;

      for (let i = 0; i < count; i++) {
        inventoryItems.push({ owner: user.userid, itemid: item.itemid, locked: false });
      }
      depositResults.push({ itemName, status: "success", quantity: count });
    }

    if (inventoryItems.length > 0) {
      await inventorys.insertMany(inventoryItems);
    }
  }

  const formattedItems = Object.entries(itemCounts)
    .map(([item, count]) => `${item} x${count} - R$${itemValues[item] || "Unknown"}`)
    .join("\n") || "None";

  await sendwebhook(
    botlogs,
    "We got a new deposit!",
    `${user.username} has just deposited R$${totalValue}`,
    [{ name: "Items", value: formattedItems }],
    user.thumbnail
  );

  await addHistory(user.userid, "Deposit", `+ ${totalValue}`);
  await updateuser(user.userid, req.app.get("io"));

  return res.status(200).json({ message: "Deposit process completed", depositResults });
});

exports.withdrawed = asyncHandler(async (req, res) => {
  const { userId, pets = [], gems = 0 } = req.body;
  if (!userId || !Array.isArray(pets)) return res.status(400).json({ method: "INVALID_REQUEST" });

  const user = await users.findOne({ userid: userId });
  if (!user) return res.status(400).json({ method: "USERNOTFOUND" });

  try {
    const userWithdraws = await withdraws.find({ userid: userId });
    if (userWithdraws.length === 0) return res.status(200).json({ message: "No pending withdrawals" });

    const itemCounts = {};
    pets.forEach(pet => { itemCounts[pet] = (itemCounts[pet] || 0) + 1; });

    const originalGemsToRemove = Math.floor(gems / 50000000);
    let totalGemsToRemove = originalGemsToRemove;

    let remainingWithdrawals = [...userWithdraws];
    const unmatchedPets = [];
    const idsToDelete = [];

    for (const pet in itemCounts) {
      let count = itemCounts[pet];
      let index;
      while (count > 0 && (index = remainingWithdrawals.findIndex(w => w.itemname === pet)) !== -1) {
        const [withdrawal] = remainingWithdrawals.splice(index, 1);
        idsToDelete.push(withdrawal._id);
        count--;
      }
      if (count > 0) unmatchedPets.push(`${pet} x${count}`);
    }

    const gemWithdrawals = remainingWithdrawals.filter(w => w.itemname === "50m gems");
    let processedGems = 0;
    while (totalGemsToRemove > 0 && gemWithdrawals.length > 0) {
      const withdrawal = gemWithdrawals.pop();
      idsToDelete.push(withdrawal._id);
      totalGemsToRemove--;
      processedGems++;
    }
    remainingWithdrawals = remainingWithdrawals.filter(w => w.itemname !== "50m gems").concat(gemWithdrawals);

    if (idsToDelete.length > 0) {
      await withdraws.deleteMany({ _id: { $in: idsToDelete } });
    }

    const itemsListParts = [];
    Object.entries(itemCounts).forEach(([item, count]) => {
      if (count > 0) itemsListParts.push(`${item} x${count}`);
    });

    if (processedGems > 0) {
      itemsListParts.push(`50m gems x${processedGems}`);
    }

    const itemsList = itemsListParts.join("\n") || "None";

    let webhookMessage = `${user.username} has just withdrawn some items!`;
    if (unmatchedPets.length > 0) {
      webhookMessage += `\nUnmatched items: ${unmatchedPets.join(", ")}`;
    }

    await sendwebhook(
      botlogs,
      "A new withdrawal was confirmed!",
      webhookMessage,
      [{ name: "Items", value: itemsList }],
      user.thumbnail
    );

    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "CONFLICT" });
  }
});

exports.GetSupported = asyncHandler(async (req, res) => {
  try {
    const supports = await items.find({ itemvalue: { $gte: 1 } }, 'itemname').lean();
    res.status(200).json({ "success": "OK", "items": supports.map(item => item.itemname) });
  } catch (_) {
    return res.status(200).json({ "success": "N/A", "items": [] });
  }
});


exports.bots = asyncHandler(async (req, res) => {
  const { game } = req.params;
  if (!game || !req.user?.id) return res.status(401).json({ message: "Unauthorized" });

  const getcode = () => {
    const wordList = ["Roblox", "wow", "Fun", "Game", "Old", "Times", "Cool", "Yes", "No", "Okay", "hola", "como", "nice", "tree", "car", "crow", "owl", "dragon"];
    return `${wordList.sort(() => Math.random() - 0.5).slice(0, 2).join(" ")}`;
  };

  const bots = await botss.find({ game });
  delete userCodes[req.user.id];

  const code = getcode();
  userCodes[req.user.id] = code;

  return res.json({ message: "OK", bots, code });
});
