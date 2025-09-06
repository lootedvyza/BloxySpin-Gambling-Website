const { taxer, jackpotwebh, taxes, taxedItemsWebh } = require("../../config");
const Jackpot = require("../../modules/jackpots");
const users = require("../../modules/users");
const crypto = require("crypto");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const InventoryItem = require("../../modules/inventorys");
const JackpotEntry = require("../../modules/jackpotjoins");
const items = require("../../modules/items");
const { addHistory, sendwebhook, updateuser, updatestats, sendnoneembed, level } = require("../transaction/index.js");

function generateRandomSeed() {
  return crypto.randomBytes(16).toString("hex");
}

function generateGameResult(clientSeed, serverSeed, totalAmount) {
  const combinedSeed = clientSeed + serverSeed;
  const hash = crypto.createHash('sha256').update(combinedSeed).digest("hex");
  const randomValue = parseInt(hash.substring(0, 8), 16);
  return randomValue % (totalAmount + 1);
}

let jackpotTimeout = null;
let jackpotCooldown = 120;
let playing = false

// -------------------------------------------
// Start Jackpot Countdown
// -------------------------------------------
async function startJackpotCountdown(io) {
  if (jackpotTimeout) clearTimeout(jackpotTimeout);

  jackpotTimeout = setTimeout(async () => {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const activeJackpot = await Jackpot.findOne({ state: "rollingsoon" })
          .session(session)
          .exec();

        if (!activeJackpot) {
          console.log("no jackpot");
          return;
        }

        io.emit("JACKPOT_TIME_UPDATE", jackpotCooldown)

        if (jackpotCooldown <= 0) {
          playing = true
          io.emit("JACKPOT_TIME_UPDATE", "rolling...")
          await exports.lock_jackpot();
          await exports.play_jackpot({ app: { get: () => io } }, {}, () => {});
          setTimeout(() => exports.payflip({ app: { get: () => io } }, {}, () => {}), 10000);
          setTimeout(() => exports.close_jackpot({ app: { get: () => io } }, {}, () => {}), 10000);
          setTimeout(() => exports.create_jackpot({ app: { get: () => io } }, {}, () => {}), 15000);
          setTimeout(async () => await updatestats(io), 15000);
          setTimeout(() => playing = false, 15000)
          jackpotCooldown = 120;
          return;
        }

        jackpotCooldown -= 1;
        startJackpotCountdown(io);
      });
    } catch (error) {
      console.error("Jackpot Countdown Error:", error);
    } finally {
      session.endSession();
    }
  }, 1000);
}

async function startup(io) {
  const activeJackpots = await Jackpot.find({ 
    state: { $in: ["rollingsoon"] },
    endsAt: { $exists: true, $ne: null }
  }).exec();

  const otherjackts = await Jackpot.find({ "state": "Waiting" })

  if (activeJackpots.length == 0 && otherjackts.length === 0 ) {
    await exports.create_jackpot({ app: { get: () => io } })
  }

  for (const jackpot of activeJackpots) {
    const endsAt = jackpot.endsAt;
    const remainingTime = endsAt.getTime() - Date.now();
    jackpotCooldown = Math.floor(remainingTime / 1000);
    startJackpotCountdown(io)
  }
}

exports.startup = startup;

exports.join_jackpot = [
  asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        let recentJackpot = await Jackpot.findOne({ state: { $ne: "Ended" } })
          .session(session)
          .exec();

        if (!recentJackpot) {
          if (playing) return res.status(400).json({ "message": "jackpot is already rolling..." });
          const serverSeed = generateRandomSeed();
          const hashedServerSeed = crypto.createHash("sha256").update(serverSeed).digest("hex");

          const newJackpot = new Jackpot({
            value: 0,
            winnerusername: null,
            winnerid: null,
            serverSeed,
            hashedServerSeed,
            clientSeed: null,
            endsAt: null,
            result: null,
            inactive: false,
            state: "Created",
          });

          await newJackpot.save({ session });
          recentJackpot = newJackpot;
        }

        const recentEntry = await JackpotEntry.countDocuments({
          jackpotGame: recentJackpot._id,
        })
          .session(session)
          .exec();

        if (recentEntry > 50) {
          return res.status(401).json({ message: "jackpot is already full!" });
        }

        if (recentJackpot.state === "Rolling" || recentJackpot.state === "Locked") {
          return res.status(400).json({ message: "jackpot is already rolling!" });
        }

        const playerInfo = await users.findOne({ userid: req.user.id })
          .session(session)
          .exec();

        if (!playerInfo?.userid) {
          return res.status(404).json({ message: "Your account does not exist" });
        }

        if (req.body.chosenItems.length < 1) {
          return res.status(422).json({ message: "You must select at least 1 item" });
        }

        const inventoryIds = req.body.chosenItems.map(item => item.inventoryid);
        const uniqueInventoryIds = [...new Set(inventoryIds)];
        if (inventoryIds.length !== uniqueInventoryIds.length) {
          return res.status(422).json({ message: "One or more items can't be used!" });
        }

        const actualItems = [];
        const itemIdsToDelete = [];
        let choosenSum = 0;

        for (const chosenItem of req.body.chosenItems) {
          const exists = await InventoryItem.findOne({
            _id: chosenItem.inventoryid,
            locked: false,
            owner: req.user.id,
          })
            .session(session)
            .exec();

          if (!exists) {
            return res.status(422).json({ message: "Item doesn't exist" });
          }
          if (exists.locked) {
            return res.status(409).json({ message: "Cannot use a locked item" });
          }
          if (exists.owner.toString() !== req.user.id.toString()) {
            return res.status(409).json({ message: "Item does not belong to you" });
          }

          const item = await items.findOne({ itemid: exists.itemid })
            .session(session)
            .exec();
          choosenSum += item.itemvalue || 0;

          actualItems.push({
            _id: exists._id,
            itemid: item.itemid,
            itemimage: item.itemimage || " ",
            itemvalue: item.itemvalue || 0,
            itemname: item.itemname || "???",
          });

          itemIdsToDelete.push(exists._id);
        }

        const hasJoined = await JackpotEntry.findOne({
          jackpotGame: recentJackpot._id,
          joinerid: req.user.id,
        }).session(session);

        if (hasJoined) {
          return res.status(400).json({ message: "You can only join the jackpot once!" });
        }

        await InventoryItem.deleteMany({ _id: { $in: itemIdsToDelete } }).session(session);

        let updateData = { $inc: { value: choosenSum } };

        const entryCount = await JackpotEntry.countDocuments({
          jackpotGame: recentJackpot._id,
        }).session(session);

        if (entryCount === 0) {
          updateData.$set = { state: "Waiting" };
        } else {
          if (recentJackpot.state === "Waiting") {
            const endsAt = new Date(Date.now() + 120 * 1000);
            updateData.$set = {
              state: "rollingsoon",
              endsAt: endsAt,
            };
            jackpotCooldown = 120;
            startJackpotCountdown(req.app.get("io"));
          }
        }

        await Jackpot.updateOne(
          { _id: recentJackpot._id },
          updateData,
          { session }
        );

        const newEntry = new JackpotEntry({
          joinerid: req.user.id,
          value: choosenSum,
          items: actualItems,
          jackpotGame: recentJackpot._id,
          username: playerInfo.username,
          thumbnail: playerInfo.thumbnail,
        });

        await newEntry.save({ session });

        await users.updateOne(
          { userid: req.user.id },
          { $inc: { wager: choosenSum, lost: choosenSum } },
          { session }
        );

        if (playing) {
          return res.status(400).json({ "message": "jackpot is already rolling..." });
        }

        await session.commitTransaction();

        res.status(200).json({ message: "Successfully joined jackpot" });

        const jackpotDataResponse = await new Promise((resolve, reject) => {
          const reqCopy = { ...req };
          const resCopy = {
            status: () => ({ json: (data) => resolve(data) }),
            json: (data) => resolve(data),
          };
          exports.get_jackpot(reqCopy, resCopy, next).catch(reject);
        });

        req.app.get("io").emit("JACKPOT_UPDATE", jackpotDataResponse);
        addHistory(playerInfo.userid, "Jackpot", `-${choosenSum}`);
        level(playerInfo.userid, choosenSum)
        updateuser(playerInfo.userid, req.app.get("io"));
        updatestats(req.app.get("io"));
      });
    } catch (error) {
      console.error("Join Jackpot Error:", error);
      if (session.inTransaction()) {
        await session.abortTransaction().catch(err => console.error("Abort transaction error:", err));
      }
      return res.status(500).json({ message: "Internal server error" });
    } finally {
      session.endSession();
    }
  }),
];

exports.get_jackpot = asyncHandler(async (req, res, next) => {
  let activeJackpot = await Jackpot.findOne({ state: { $ne: "Ended" } })
    .sort({ createdAt: -1 })
    .exec();

  if ((!activeJackpot)) {
    return res.status(200).json({
      gameData: {},
      entries: 0,
    });
  }

  const jackpotEntries = await JackpotEntry.find({
    jackpotGame: activeJackpot._id 
  });

  return res.status(200).json({
    gameData: activeJackpot || {},
    entries: jackpotEntries || 0,
  });
});

exports.create_jackpot = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existingJackpot = await Jackpot.findOne({ state: { $ne: "Ended" } })
      .session(session)
      .exec();

    if (existingJackpot) {
      await session.abortTransaction();
      console.log("Jackpot already exists");
      return;
    }

    const serverSeed = generateRandomSeed();
    const hashedServerSeed = crypto
      .createHash("sha256")
      .update(serverSeed)
      .digest("hex");

    const newJackpot = new Jackpot({
      value: 0,
      winnerusername: null,
      winnerid: null,
      serverSeed,
      hashedServerSeed,
      clientSeed: null,
      endsAt: null,
      result: null,
      inactive: false,
      state: "Created",
    });

    await newJackpot.save({ session });
    await session.commitTransaction();

    console.log("Created new jackpot");
    const jackpotDataResponse = await new Promise((resolve, reject) => {
      const reqCopy = { ...req };
      const resCopy = {
        status: () => ({ json: (data) => resolve(data) }),
        json: (data) => resolve(data),
      };
      exports.get_jackpot(reqCopy, resCopy, next).catch(reject);
    });
    req.app.get("io").emit("JACKPOT_UPDATE", jackpotDataResponse);
    req.app.get("io").emit("JACKPOT_TIME_UPDATE", "0")

    sendnoneembed(jackpotwebh, `Created a new jackpot: ${newJackpot._id}, waiting for players to join!`);
  } catch (error) {
    await session.abortTransaction();
    console.error("Create Jackpot Error:", error);
  } finally {
    session.endSession();
  }
});

exports.close_jackpot = asyncHandler(async () => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const activeJackpot = await Jackpot.findOne({ state: { $ne: "Ended" } })
      .session(session)
      .exec();

    if (!activeJackpot) {
      await session.abortTransaction();
      console.error("No active jackpot to close");
      return;
    }

    await Jackpot.updateOne(
      { _id: activeJackpot._id },
      { state: "Ended" },
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Close Jackpot Error:", error);
  } finally {
    session.endSession();
  }
});

exports.play_jackpot = asyncHandler(async (req, res, next) => {
  console.log("ROLLING");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const activeJackpot = await Jackpot.findOne({ state: { $ne: "Ended" } })
      .session(session)
      .exec();

    if (!activeJackpot) {
      await session.abortTransaction();
      console.error("No active jackpot found");
      return;
    }

    const jackpotEntries = await JackpotEntry.find({
      jackpotGame: activeJackpot._id,
    }).session(session);

    const totalAmount = jackpotEntries.reduce(
      (total, entry) => total + entry.value,
      0
    );

    const clientSeed = crypto.randomBytes(16).toString("hex");
    const randomNumber = generateGameResult(
      clientSeed,
      activeJackpot.serverSeed,
      totalAmount
    );

    let cumulativeWeight = 0;
    let winnerEntry = null;
    for (const entry of jackpotEntries) {
      cumulativeWeight += entry.value;
      if (randomNumber <= cumulativeWeight) {
        winnerEntry = entry;
        break;
      }
    }

    if (!winnerEntry) {
      throw new Error("No winner determined");
    }

    await Jackpot.updateOne(
      { _id: activeJackpot._id },
      {
        winnerid: winnerEntry.joinerid,
        winnerusername: winnerEntry.username,
        clientSeed,
        result: randomNumber,
      },
      { session }
    );

    await session.commitTransaction();

    const jackpotDataResponse = await new Promise((resolve, reject) => {
      const reqCopy = { ...req };
      const resCopy = {
        status: () => ({ json: (data) => resolve(data) }),
        json: (data) => resolve(data),
      };
      exports.get_jackpot(reqCopy, resCopy, next).catch(reject);
    });

    req.app.get("io").emit("JACKPOT_UPDATE", jackpotDataResponse);

    const fields = [
      { name: "Winner", value: winnerEntry.username, inline: true },
      {
        name: "Players",
        value: jackpotEntries
          .map((entry) => `${entry.username} - R$${entry.value}`)
          .join("\n"),
        inline: false,
      },
    ];

    sendwebhook(
      jackpotwebh,
      "Jackpot Game completed!",
      `Jackpot game with ${jackpotEntries.length} players completed!`,
      fields
    );

    return res.status(200).json({ message: "Successfully joined jackpot", data: jackpotDataResponse });

  } catch (error) {
    await session.abortTransaction();
    console.error("Play Jackpot Error:", error);
  } finally {
    session.endSession();
  }
});

exports.payflip = asyncHandler(async (req, res, next) => {
  console.log("PAYING OUT");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const activeJackpot = await Jackpot.findOne({ state: { $ne: "Ended" } })
      .session(session)
      .exec();

    if (!activeJackpot) {
      await session.abortTransaction();
      console.error("No active jackpot found");
      return;
    }

    if (!activeJackpot.winnerid) {
      throw new Error("No winner determined");
    }

    const jackpotEntries = await JackpotEntry.find({
      jackpotGame: activeJackpot._id,
    }).session(session);

    const allItems = jackpotEntries.flatMap((entry) => entry.items);
    const sortedItems = allItems.sort((a, b) => a.itemvalue - b.itemvalue);
    const taxedItemsCount = Math.floor(sortedItems.length * taxes);
    const taxedItems = sortedItems.slice(0, taxedItemsCount); 
    const winnerItems = sortedItems.slice(taxedItemsCount);

    const taxedValue = taxedItems.reduce((sum, item) => sum + item.itemvalue, 0);

    for (const item of winnerItems) {
      const newItem = new InventoryItem({
        _id: item._id,
        itemid: item.itemid,
        owner: activeJackpot.winnerid,
        locked: false,
      });
      await newItem.save({ session });
    }

    if (taxedItems.length > 0) {
      const taxUser = await users.findOne({ userid: taxer }).session(session);
      if (taxUser) {
        for (const item of taxedItems) {
          const newItem = new InventoryItem({
            _id: item._id,
            itemid: item.itemid,
            owner: taxUser.userid,
            locked: false,
          });
          await newItem.save({ session });
        }
      }

      sendwebhook(
        taxedItemsWebh,
        "Tax Collected 💰 (JACKPOT)",
        `Taxed items from jackpot ${activeJackpot._id} with ${jackpotEntries.length} players, R$${activeJackpot.value}!`,
        [
          {
            name: "Taxed Items",
            value: taxedItems.map(item => `${item.itemname} - R$${item.itemvalue}`).join("\n"),
            inline: false
          }
        ],
        "https://cdn.discordapp.com/icons/1253663005191962654/3d9be4c5c581964ce94050106273ed67.png"
      );
    }

    await users.findOneAndUpdate(
      { userid: activeJackpot.winnerid },
      { $inc: { won: activeJackpot.value * 2 } }, 
      { session }
    );

    await session.commitTransaction();

    await updatestats(req.app.get("io"));
    await addHistory(
      activeJackpot.winnerid,
      "Jackpot Win",
      `+${activeJackpot.value - taxedValue}`
    );
    await updateuser(activeJackpot.winnerid, req.app.get("io"));

    await exports.close_jackpot(); 

  } catch (error) {
    await session.abortTransaction();
    await exports.close_jackpot(); 
    console.error("Play Jackpot Error:", error);
  } finally {
    session.endSession();
  }
});

exports.lock_jackpot = asyncHandler(async () => {
  console.log("LOCKING JACKPOT");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const activeJackpot = await Jackpot.findOne({ state: { $ne: "Ended" } })
      .session(session)
      .exec();

    if (!activeJackpot) {
      await session.abortTransaction();
      console.error("No active jackpot found");
      return 
    }

    activeJackpot.state = "Locked";
    await activeJackpot.save({ session });

    await session.commitTransaction();
    return
  } catch (error) {
    await session.abortTransaction();
    console.error("Lock Jackpot Error:", error);
    await exports.close_jackpot(); 
  } finally {
    session.endSession();
  }
});