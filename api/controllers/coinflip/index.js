const asyncHandler = require("express-async-handler");
const coinflips = require("../../modules/coinflips.js");
const users = require("../../modules/users.js");
const inventorys = require("../../modules/inventorys.js");
const items = require("../../modules/items.js")
const history = require("../../modules/history.js")
const moment = require('moment');
const mongoose = require('mongoose');
const axios = require("axios");
const crypto = require('crypto');
const { coinflipwebh, taxer, taxedItemsWebh, taxes } = require("../../config.js");
const { addHistory, sendwebhook, updateuser, updatestats, level } = require("../transaction/index.js")

exports.getcoinflips = asyncHandler(async (req, res) => {
  try {

    const flips = await coinflips.find({
      $or: [
        { active: true }, 
        { 
          active: false, 
          end: { $gte: moment().subtract(1, 'minutes').toDate() }
        }
      ]
    }).sort({ value: -1 });

    res.status(200).json({ message: "OK", data: flips});
  } catch (e) {
    res.status(500).json({"message": "Internal Server Error"});
  }
});

function getResult(serverSeedHash, randomSeed) {
    const mod = `${serverSeedHash}-${randomSeed}`;
    const hashResult = crypto.createHash('sha256').update(mod).digest('hex');
    const decimalResult = parseInt(hashResult.substring(0, 8), 16);
    const maxValue = Math.pow(16, 8);
    return decimalResult / maxValue;
}

function getSide(normalizedResult, starterValue, joinerValue) {
    const totalValue = starterValue + joinerValue;
    const starterChance = starterValue / totalValue;
    const joinerChance = joinerValue / totalValue;
    return {
        side: normalizedResult < starterChance ? "heads" : "trails",
        chances: { starter: starterChance, joiner: joinerChance },
    };
}

exports.creatematch = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { items: clientItems, coin } = req.body;

      if (!clientItems?.length) return res.status(400).json({ message: "Select items!" });
      if (!["trails", "heads"].includes(coin)) return res.status(400).json({ message: "Invalid coin choice" });

      const inventoryIds = clientItems.map(i => i.inventoryid);
      if (new Set(inventoryIds).size !== clientItems.length) {
        return res.status(400).json({ message: "One or more items can't be used!" });
      }

      const user = await users.findOne({ userid: req.user.id }).session(session);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const inventoryItems = await inventorys.find({
        _id: { $in: inventoryIds },
        owner: user.userid,
        locked: false
      }).session(session);

      if (inventoryItems.length !== clientItems.length) {
        return res.status(400).json({ message: "Invalid items detected" });
      }

      const itemIds = inventoryItems.map(item => item.itemid);
      const dbItems = await items.find({ itemid: { $in: itemIds } }).session(session);

      const validItems = dbItems.filter(item => item.itemvalue >= 1);
      if (validItems.length !== new Set(itemIds).size) {
        return res.status(400).json({ message: "Invalid item values" });
      }

      const gameType = validItems[0].game;
      if (!validItems.every(item => item.game === gameType)) {
        return res.status(400).json({ message: "You cannot cross-join!" });
      }

      const itemMap = new Map(validItems.map(item => [item.itemid, item]));
      const totalItemValue = inventoryItems.reduce((acc, item) => 
        acc + (itemMap.get(item.itemid)?.itemvalue || 0), 0);

      await inventorys.deleteMany({ _id: { $in: inventoryIds } }).session(session);

      const validatedItems = inventoryItems.map(item => ({
        id: item._id,
        itemname: itemMap.get(item.itemid)?.itemname,
        itemimage: itemMap.get(item.itemid)?.itemimage || " ",
        itemid: item.itemid,
        inventoryid: item._id,
        itemvalue: itemMap.get(item.itemid)?.itemvalue,
        game: itemMap.get(item.itemid)?.game
      }));

      const savedCoinflip = await new coinflips({
        creatorid: user.userid,
        creatorcoin: coin,
        game: gameType,
        PlayerOne: {
          id: user.userid,
          username: user.username,
          thumbnail: user.thumbnail,
          coin,
          value: totalItemValue,
          items: validatedItems,
          chances: 1.0
        },
        PlayerTwo: null,
        requirements: {
          min: totalItemValue * 0.9,
          max: totalItemValue * 1.1,
          static: totalItemValue
        },
        winner: null,
        winnercoin: null,
        active: true,
        start: new Date(),
        end: null,
        serverSeedHash: null,
        randomSeed: null
      }).save({ session });

      await sendwebhook(
        coinflipwebh,
        `New R$${totalItemValue} Match Created`,
        `**${user.username}** created a R$${totalItemValue} match!`,
        [{
          name: "Items",
          value: validatedItems
            .map(item => `${item.itemname} - R$${item.itemvalue}`)
            .join("\n"),
          inline: false
        }],
        user.thumbnail
      );

      await session.commitTransaction()

      res.status(200).json({ 
        message: "Match created!", 
        data: savedCoinflip 
      });

      req.app.get("io").emit("NEW_COINFLIP", savedCoinflip);
      await Promise.all([
        await addHistory(user.userid, "Game Creation", `-${totalItemValue}`),
        await updatestats(req.app.get("io")),
        await updateuser(user.userid, req.app.get("io"))
      ]);
    });
  } catch (error) {
    if (error.message.includes("Write conflict")) {
      return res.status(400).json({ message: "One or more items can't be used!" });
    }
    console.error("Match creation error:", error);
    return res.status(500).json({ message: "Internal Server error" });
  } finally {
    session.endSession();
  }
});

exports.joinmatch = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let finalUpdate, taxedItems, allItems, totalJoinerValue, coinflip, user, winnerItems, winner;

  try {
      await session.withTransaction(async () => {
          const { items: userItems, gameid } = req.body;

          if (!userItems?.length || !Array.isArray(userItems) || !gameid) {
              return res.status(400).json({ message: "Invalid request parameters!" });
          }

          const inventoryIds = userItems.map(item => item.inventoryid);
          if (new Set(inventoryIds).size !== userItems.length) {
              return res.status(400).json({ message: "One or more items can't be used!" });
          }

          [coinflip, user] = await Promise.all([
              coinflips.findOne({ _id: gameid }).session(session),
              users.findOne({ userid: req.user.id }).session(session)
          ]);

          if (!coinflip || !user) {
              return res.status(400).json({ message: "Game or user not found!" });
          }

          if (!coinflip.active) {
              return res.status(400).json({ message: "Game not active!" });
          }

          if (coinflip.PlayerOne.id === user.userid) {
              return res.status(400).json({ message: "You cannot join your own game!" });
          }

          const inventoryItems = await inventorys.find({
              _id: { $in: inventoryIds },
              owner: user.userid,
              locked: false
          }).session(session);

          if (inventoryItems.length !== userItems.length) {
              return res.status(400).json({ message: "One or more items can't be used!" });
          }

          const itemIds = inventoryItems.map(item => item.itemid);
          const dbItems = await items.find({ itemid: { $in: itemIds } }).session(session);
          const validItems = dbItems.filter(item => item.itemvalue > 0);

          if (validItems.length !== new Set(itemIds).size) {
              return res.status(400).json({ message: "Invalid item values!" });
          }

          const gameType = validItems[0]?.game;
          if (!validItems.every(item => item.game === gameType) || gameType !== coinflip.game) {
              return res.status(400).json({ message: "You cannot cross join!" });
          }

          const itemMap = new Map(validItems.map(item => [item.itemid, item]));
          totalJoinerValue = inventoryItems.reduce((acc, item) =>
              acc + (itemMap.get(item.itemid)?.itemvalue || 0), 0);

          if (totalJoinerValue < coinflip.requirements.min || totalJoinerValue > coinflip.requirements.max) {
              return res.status(400).json({ message: "The selected value doesn't match!" });
          }

          const serverSeedHash = crypto.randomBytes(32).toString('hex');
          const randomSeed = crypto.randomBytes(16).toString('hex');
          const now = new Date();

          const updateResult = await coinflips.updateOne(
              { _id: gameid, active: true },
              {
                  $set: {
                      active: false,
                      end: now,
                      serverSeedHash,
                      randomSeed,
                      "requirements.static": coinflip.requirements.static + totalJoinerValue,
                      PlayerTwo: {
                          id: user.userid,
                          username: user.username,
                          thumbnail: user.thumbnail,
                          coin: coinflip.PlayerOne.coin === "trails" ? "heads" : "trails",
                          value: totalJoinerValue,
                          items: inventoryItems.map(item => ({
                              id: item._id,
                              itemname: itemMap.get(item.itemid)?.itemname,
                              itemvalue: itemMap.get(item.itemid)?.itemvalue,
                              itemid: item.itemid,
                              inventoryid: item._id,
                              itemimage: itemMap.get(item.itemid)?.itemimage || "null"
                          }))
                      }
                  }
              },
              { session }
          );

          if (updateResult.modifiedCount === 0) {
              return res.status(400).json({ message: "REPORT THIS!!!" });
          }

          await inventorys.deleteMany({ _id: { $in: inventoryIds } }).session(session);

          const coinflipResult = getResult(serverSeedHash, randomSeed);
          const { side: winningSide, chances } = getSide(
              coinflipResult,
              coinflip.PlayerOne.items.reduce((acc, item) => acc + item.itemvalue, 0),
              totalJoinerValue
          );

          winner = winningSide === coinflip.PlayerOne.coin ? "PlayerOne" : "PlayerTwo";
          allItems = [...coinflip.PlayerOne.items, ...inventoryItems.map(item => ({
              ...item.toObject(),
              itemname: itemMap.get(item.itemid)?.itemname,
              itemvalue: itemMap.get(item.itemid)?.itemvalue
          }))];

          const sortedItems = allItems.sort((a, b) => a.itemvalue - b.itemvalue);
          const taxedItemsCount = Math.floor(sortedItems.length * taxes);
          taxedItems = sortedItems.slice(0, taxedItemsCount);
          winnerItems = sortedItems.slice(taxedItemsCount);

          await inventorys.insertMany(
              taxedItems.map(item => ({
                  _id: item._id,
                  owner: taxer,
                  itemid: item.itemid,
                  locked: false,
              })),
              { session }
          );

          await Promise.all([
              users.findOneAndUpdate(
                  { userid: winner === "PlayerOne" ? coinflip.PlayerOne.id : user.userid },
                  [
                      {
                          $set: {
                              won: { $add: ["$won", totalJoinerValue] },
                              wager: { $add: ["$wager", totalJoinerValue] },
                          }
                      }
                  ],
                  { session, new: true }
              ),
              users.findOneAndUpdate(
                  { userid: winner === "PlayerOne" ? user.userid : coinflip.PlayerOne.id },
                  [
                      {
                          $set: {
                              lost: { $add: ["$lost", totalJoinerValue] },
                              wager: { $add: ["$wager", totalJoinerValue] },
                          }
                      }
                  ],
                  { session, new: true }
              )
          ]);

          finalUpdate = await coinflips.findOneAndUpdate(
              { _id: gameid },
              {
                  $set: {
                      winner: winner === "PlayerOne" ? coinflip.PlayerOne.id : user.userid,
                      winnercoin: winningSide,
                      "PlayerOne.chances": chances.starter,
                      "PlayerTwo.chances": chances.joiner
                  }
              },
              { session, new: true }
          );
      });

      res.status(200).json({ message: "Successfully joined match!", data: finalUpdate });

      const webhookTasks = [
          sendwebhook(
              coinflipwebh,
              "Coinflip Completed 🎉",
              `${user.username} joined ${coinflip.PlayerOne.username}'s match!`,
              [
                  {
                      name: "Result",
                      value: `${finalUpdate.PlayerOne.username} (${finalUpdate.PlayerOne.coin}) ${finalUpdate.winner === finalUpdate.PlayerOne.id ? "🥳" : "😭"}\n${user.username} (${finalUpdate.PlayerTwo.coin}) ${finalUpdate.winner === user.userid ? "🥳" : "😭"}`,
                      inline: false
                  },
                  {
                      name: "Items",
                      value: allItems.map(item => `${item.itemname} - R$${item.itemvalue}`).join("\n"),
                      inline: false
                  }
              ],
              "https://cdn.discordapp.com/icons/1253663005191962654/3d9be4c5c581964ce94050106273ed67.png"
          ),
          ...(taxedItems.length > 0 ? [
              sendwebhook(
                  taxedItemsWebh,
                  "Tax Collected 💰 (COINFLIP)",
                  `Taxed items from ${coinflip.PlayerOne.username} vs ${user.username} match`,
                  [
                      {
                          name: "Taxed Items",
                          value: taxedItems.map(item => `${item.itemname} - R$${item.itemvalue}`).join("\n"),
                          inline: false
                      }
                  ],
                  "https://cdn.discordapp.com/icons/1253663005191962654/3d9be4c5c581964ce94050106273ed67.png"
              )
          ] : []),
          addHistory(finalUpdate.winner, "Game Win", `+${totalJoinerValue}`),
          addHistory(user.userid, "Game Loss", `-${totalJoinerValue}`),
          level(finalUpdate.winner, coinflip.PlayerOne.value),
          level(user.userid, totalJoinerValue),
          updateuser(user.userid, req.app.get("io")),
          updatestats(req.app.get("io"))
      ];

      req.app.get("io").emit("COINFLIP_UPDATE", finalUpdate);
      await Promise.all(webhookTasks);

      setTimeout(async () => {
          try {
              await inventorys.insertMany(
                  winnerItems.map(item => ({
                      _id: item._id,
                      owner: winner === "PlayerOne" ? coinflip.PlayerOne.id : user.userid,
                      itemid: item.itemid,
                      locked: false
                  })),
                  { session }
              );
              await updateuser(finalUpdate.winner, req.app.get("io"));
              await updateuser(user.userid, req.app.get("io"));
          } catch (error) {
              console.error("Error in setTimeout callback:", error);
          } finally {
              session.endSession();
          }
      }, 3000);

      setTimeout(() => {
          req.app.get("io").emit("COINFLIP_CANCEL", {
              _id: finalUpdate._id,
              active: false
          });
          updatestats(req.app.get("io"));
      }, 60000);

  } catch (error) {
      if (error.message?.includes("aused by :: Write conflict")) {
          res.status(400).json({ message: 'One or more items cant be used!' });
      } else {
          console.error("cf join:", error);
          res.status(500).json({ message: "Internal Server Error" });
      }
  }
});
  
exports.cancelcoinflip = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.body.coinflipid) {
        return res.status(400).json({ message: "CoinFlip ID required!" });
      }

      const [user, flip] = await Promise.all([
        users.findOne({ userid: req.user.id }).session(session),
        coinflips.findOne({ _id: req.body.coinflipid }).session(session)
      ]);

      if (!user) {
        return res.status(401).json({ message: "User not found!" });
      }

      if (!flip) {
        return res.status(404).json({ message: "CoinFlip not found!" });
      }

      if (!flip.active) {
        return res.status(400).json({ message: "CoinFlip already completed!" });
      }

      if (flip.creatorid !== user.userid) {
        return res.status(403).json({ message: "Not your CoinFlip!" });
      }

      const updateResult = await coinflips.updateOne(
        { 
          _id: flip._id,
          active: true,
          creatorid: user.userid 
        },
        { $set: { active: false } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(409).json({ message: "CoinFlip being joined!" });
      }

      const itemsToRestore = flip.PlayerOne.items.map(item => ({
        _id: item.id,
        owner: user.userid,
        itemid: item.itemid,
        locked: false,
        createdAt: new Date()
      }));

      await inventorys.insertMany(itemsToRestore, { 
        session,
        ordered: false 
      }).catch(async error => {
        if (error.code !== 11000) throw error;
      });

      const updatedFlip = await coinflips.findById(flip._id);
      await session.commitTransaction()

      req.app.get("io").emit("COINFLIP_CANCEL", {
        _id: flip._id,
        active: false,
        updatedAt: new Date()
      });

      await Promise.all([
        updatestats(req.app.get("io")),
        addHistory(user.userid, "Game Cancel", `+${flip.requirements.static}`),
        updateuser(user.userid, req.app.get("io"))
      ]);

      return res.status(200).json({
        success: true,
        message: "CoinFlip canceled!",
        data: updatedFlip
      });
    });
  } catch (error) {
    console.error("CancelCoinFlip Error:", error);

    if (error.message.includes("WriteConflict")) {
      return res.status(409).json({ message: "CoinFlip being joined!" });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } finally {
    session.endSession();
  }
});

exports.historyme = asyncHandler(async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
  
  try {
    const flips = await coinflips.find({
      $and: [
        { $or: [
          { 'PlayerOne.id': req.user.id, "active": false },
          { 'PlayerTwo.id': req.user.id, "active": false }
        ]},
        { 'PlayerTwo.id': { $exists: true } }  
      ]
    })
    .sort({ end: -1 })  
    .limit(10)
    .lean(); 

    return res.status(200).json({ "message": "OK, LADY GAGA WE LOVE YOU # YOU'LL BE HERE FOREVER!", "history": flips });
  } catch {
    return res.status(500).json({ "message": "Internal Server Error" });
  }
});
