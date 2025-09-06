const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const axios = require("axios");
const users = require("../../modules/users.js");
const inventorys = require("../../modules/inventorys.js");
const items = require("../../modules/items.js");
const history = require("../../modules/history.js");
const giveaways = require("../../modules/giveaways.js");
const coinflips = require("../../modules/coinflips.js");
const giveawayjoins = require("../../modules/giveawayjoins.js");
const { giveawaywebh } = require("../../config.js");
const { sendwebhook, addHistory, updateuser } = require("../transaction/index.js");
const moment = require('moment');

const rollwinner = async (giveawayid) => {
    if (!giveawayid) {
        return "Something went wrong";
    }

    try {
        const giveaway = await giveaways.findOne({ "_id": giveawayid });

        if (!giveaway) {
            return "Something went wrong";
        }

        if (giveaway.winner) {
            return "Something went wrong";
        }

        const entries = await giveawayjoins.find({ "giveawayid": giveawayid });

        if (!entries || entries.length === 0) {
            return "No participants";
        }

        const randomIndex = Math.floor(Math.random() * entries.length);
        const winner = entries[randomIndex];

        const winnerUser = await users.findOne({ "userid": winner.userid });

        if (!winnerUser) {
            return "Something went wrong";
        }

        if (!giveaway.item || giveaway.item.length === 0 || !giveaway.item[0]) {
            return "Something went wrong";
        }

        const itemInventory = new inventorys({
            _id: giveaway.item[0].id,
            itemid: giveaway.item[0].itemid,
            owner: winnerUser.userid,
            locked: false,
        });

        await itemInventory.save();

        giveaway.winner = winnerUser.userid;
        giveaway.winnerid = winnerUser.userid,
        giveaway.winnerusername = winnerUser.username;
        giveaway.complete = true;

        await giveaway.save();

        const res = await sendwebhook(giveawaywebh, "BloxySpin Giveaway Concluded!", `A new **${giveaway.item[0].itemname}** giveaway has been concluded!`, [
            {
                name: "Host",
                value: `\`\`\`${giveaway.starterusername}\`\`\``,
                inline: false
            },
            {
                name: "Item",
                value: `\`\`\`${giveaway.item[0].itemname} - R$${giveaway.item[0].itemvalue}\`\`\``,
                inline: false
            },
            {
                name: "Winner",
                value: `\`\`\`${winnerUser.username}\`\`\``,
                inline: false
            },
        ], giveaway.item[0].itemimage);

        return `Winner: ${winnerUser.username}`;

    } catch (error) {
        console.log(`gw roller: ${error}`);
        return "Something went wrong";
    }
};

async function onstartup(io) {
  try {
      const incompleteGiveaways = await giveaways.find({ complete: false });

      for (const giveaway of incompleteGiveaways) {
          const endDate = new Date(giveaway.enddate);
          const now = new Date();

          if (endDate <= now) {
              const winneres = await rollwinner(giveaway._id);
              giveaway.winner = winneres || "something went wrong...";
              giveaway.complete = true;

              await giveaway.save();
              io.emit("GIVEAWAY_UPDATE", giveaway);
              await updateuser(giveaway.winnerid, io);
              setTimeout(async () => {
                const activegiveaways = await giveaways.find({
                    $or: [
                        { complete: false },
                        {
                            endeddate: { $gte: moment().subtract(1, 'minutes').toDate() }
                        }
                    ]
                });
                io.emit("GIVEAWAY_DONE", { giveaways: activegiveaways });
            }, 62000);
          } else {
              const timeRemaining = endDate - now;
              setTimeout(async () => {
                  const winneres = await rollwinner(giveaway._id);
                  giveaway.winner = winneres || "something went wrong...";
                  giveaway.complete = true;

                  await giveaway.save();
                  io.emit("GIVEAWAY_UPDATE", giveaway);
                  await updateuser(giveaway.winnerid, io);
                  setTimeout(async () => {
                    const activegiveaways = await giveaways.find({
                        $or: [
                            { complete: false },
                            {
                                endeddate: { $gte: moment().subtract(1, 'minutes').toDate() }
                            }
                        ]
                    });
                    io.emit("GIVEAWAY_DONE", { giveaways: activegiveaways });
                }, 62000);
              }, timeRemaining);
          }
      }
  } catch (error) {
      console.error(`Error during onstartup: ${error}`);
  }
}

exports.startup = onstartup;

exports.getgiveaways = asyncHandler(async (req, res) => {
    try {
        const activegiveaways = await giveaways.find({
            $or: [
                { complete: false },
                {
                    endeddate: { $gte: moment().subtract(1, 'minutes').toDate() }
                }
            ]
        });

        return res.status(200).json({ message: "OK", giveaways: activegiveaways });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

exports.giveaway = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
  
    try {
      await session.withTransaction(async () => {
        const { items: clientItems, time } = req.body;
  
        if (!clientItems || !Array.isArray(clientItems) || clientItems.length === 0) {
          return res.status(400).json({ message: "Please select items!" });
        }
  
        const user = await users.findOne({ userid: req.user.id }).session(session);
        if (!user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
  
        if (!time || typeof time !== 'number' || time < 1 || time > 60) {
          return res.status(400).json({ message: "Time must be a number between 1 and 60 minutes!" });
        }
  
        const validatedItems = [];
        let totalItemValue = 0;
  
        for (const item of clientItems) {
          const inventoryItem = await inventorys
            .findOne({ _id: item.inventoryid, owner: req.user.id, locked: false })
            .session(session);
  
          if (!inventoryItem) {
            return res.status(400).json({ message: "One or more items can't be used!" });
          }
  
          const dbItem = await items.findOne({ itemid: inventoryItem.itemid }).session(session);
          if (!dbItem) {
            return res.status(400).json({ message: "One or more items can't be used!" });
          }
  
          totalItemValue += dbItem.itemvalue;
  
          await inventorys.deleteOne({ _id: inventoryItem._id }).session(session);
  
          validatedItems.push({
            id: inventoryItem.id,
            itemname: dbItem.itemname,
            itemimage: dbItem.itemimage,
            itemid: dbItem.itemid,
            itemvalue: dbItem.itemvalue,
            game: dbItem.game,
          });
        }
  
        const endDate = new Date();
        endDate.setMinutes(endDate.getMinutes() + time);
  
        const giveawaysToSave = validatedItems.map((validatedItem) => {
          return new giveaways({
            starterid: req.user.id,
            starterusername: user.username,
            entries: 0,
            item: {
              id: validatedItem.id,
              itemname: validatedItem.itemname,
              itemimage: validatedItem.itemimage || " ",
              itemvalue: validatedItem.itemvalue,
              itemid: validatedItem.itemid,
            },
            winner: null,
            winnerid: null,
            complete: false,
            enddate: endDate,
          });
        });
  
        await giveaways.insertMany(giveawaysToSave, { session });
  
        giveawaysToSave.forEach((giveaway) => {
          req.app.get("io").emit("NEW_GIVEAWAY", giveaway);
  
          sendwebhook(
            giveawaywebh,
            "BloxySpin Giveaway Created",
            `A new **${giveaway.item[0].itemname}** giveaway has been created in BloxySpin. Join now at https://bloxyspin.com/`,
            [
              {
                name: "Host",
                value: `\`\`${user.username}\`\``,
                inline: false,
              },
              {
                name: "Item",
                value: `\`\`${giveaway.item[0].itemname} - R$${giveaway.item[0].itemvalue}\`\``,
                inline: false,
              },
              {
                name: "Value",
                value: `\`\`${giveaway.item[0].itemvalue}\`\``,
                inline: false,
              },
              {
                name: "Giveaway End Time",
                value: `<t:${Math.floor(endDate.getTime() / 1000)}:R>`,
                inline: false,
              },
            ],
            giveaway.item[0].itemimage
          );
  
          setTimeout(async () => {
            const giveawayy = await giveaways.findOne({ _id: giveaway._id });
            if (!giveawayy) return;
  
            const winneres = await rollwinner(giveaway._id);
            giveawayy.winner = winneres || "something went wrong...";
            giveawayy.complete = true;
  
            await giveawayy.save();
            req.app.get("io").emit("GIVEAWAY_UPDATE", giveawayy);
            await updateuser(giveaway.winnerid, req.app.get("io"));
  
            setTimeout(async () => {
              const activegiveaways = await giveaways.find({
                $or: [
                  { complete: false },
                  {
                    endeddate: { $gte: moment().subtract(1, 'minutes').toDate() }
                  }
                ]
              });
              req.app.get("io").emit("GIVEAWAY_DONE", { giveaways: activegiveaways });
            }, 62000);
  
          }, time * 60000);
        });

        await session.commitTransaction()

        await addHistory(user.userid, "Giveaway", `-${totalItemValue}`);
        await updateuser(user.userid, req.app.get("io"));
  
        return res.status(200).json({ message: "Successfully started the giveaway!!" });
      });
    } catch (error) {
      if (error.message.includes("aused by :: Write conflict during plan execution and yielding is disabled. :: Please retry your operation or multi-document transaction.")) {
        return res.status(400).json({ message: 'One or more items can\'t be used!' });
      } else {
        console.error("Error during giveaway:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    } finally {
      session.endSession();
    }
  });

exports.joingiveaway = asyncHandler(async (req, res) => {
    try {
        const { giveawayid } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await users.findOne({ "userid": req.user.id });

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!giveawayid) {
            return res.status(400).json({ message: "No giveaway specified" });
        }

        const giveaway = await giveaways.findOne({ "_id": giveawayid });

        if (!giveaway || giveaway.complete) {
            return res.status(400).json({ message: "Giveaway not found or already completed" });
        }

        const entry = await giveawayjoins.findOne({ "userid": req.user.id, "giveawayid": giveawayid });

        if (entry) {
            return res.status(400).json({ message: "You have already joined this giveaway" });
        }

        if (user.level < 2) {
            return res.status(400).json({ message: "you must be at least level 2 to do that!" });
        }

        const entryuser = new giveawayjoins({
            userid: req.user.id,
            giveawayid: giveawayid,
        });

        await entryuser.save();

        giveaway.entries += 1;
        await giveaway.save();

        req.app.get("io").emit("GIVEAWAY_UPDATE", giveaway);

        return res.status(200).json({ message: "Successfully joined the giveaway!" });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});