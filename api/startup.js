const jackpotController = require("./controllers/jackpot/index");
const giveawayController = require("./controllers/giveaway/index")

exports.startup = (io) => {
    console.log("starting")
    jackpotController.startup(io)
    giveawayController.startup(io)
}