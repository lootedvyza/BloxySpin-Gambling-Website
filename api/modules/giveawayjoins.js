const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const giveawayjoins = new Schema({
    userid: {
        type: Number,
        required: true,
    },
    giveawayid: {
        type: String,
        required: true,
    }
});

const GiveawayJoins = mongoose.model("giveawaysjoins", giveawayjoins);
module.exports = GiveawayJoins;
