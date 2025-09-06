const asyncHandler = require("express-async-handler");
const coinflips = require("../../modules/coinflips.js");
const Jackpot = require("../../modules/jackpots.js");
const moment = require("moment");

exports.getvalue = asyncHandler(async (req, res) => {
    try {
        const flips = await coinflips.find({
            $or: [
                { active: true },
                { active: false, end: { $gte: moment().subtract(1, 'minutes').toDate() } }
            ]
        });

        const coinflipsvalues = flips.reduce((sum, flip) => sum + (flip.requirements?.static || 0), 0);

        const activeJackpot = await Jackpot.findOne({ state: { $ne: "Ended" } }).exec();

        return res.status(200).json({ 
            coinflip: coinflipsvalues, 
            jackpot: activeJackpot ? activeJackpot.value : 0, 
            giveaway: 0, 
            BALANCE_RAIN: "???" 
        });
    } catch (error) {
        console.error("Error in getvalue:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
