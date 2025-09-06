const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const giveawaySchema = new Schema({
    starterid: {
        type: Number,
        required: true,
    },
    starterusername: {
        type: String,
        required: true,
    },
    entries: {
        type: Number,
        required: true,
    },
    item: [{
        id: { type: String, required: true },
        itemname: { type: String, required: true },
        itemimage: { type: String, required: true },
        itemid: { type: Number, required: true },
        itemvalue: { type: Number, required: true },
    }],
    winner: {
        type: String,
        required: false,
        default: null,
    },
    winnerid: {
        type: Number,
        required: false,
        default: null,
    },
    complete: { type: Boolean, required: true, default: false },
    enddate: { type: Date, required: true, default: Date.now },
});

const GiveawayModel = mongoose.model("giveaways", giveawaySchema);
module.exports = GiveawayModel;
