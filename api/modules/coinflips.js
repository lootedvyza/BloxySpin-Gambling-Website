const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const coinflipSchema = new Schema({
  creatorid: { type: Number, required: true },
  creatorcoin: { type: String, required: true },
  game: { type: String, required: true },
  PlayerOne: {
    id: { type: Number, required: true },
    username: { type: String, required: true },
    thumbnail: { type: String, required: true },
    coin: { type: String, required: true },
    value: { type: Number, required: true },
    chances: { type: Number, required: true },
    items: [
      {
        id: { type: String, required: true },
        itemname: { type: String, required: true },
        itemvalue: { type: Number, required: true },
        itemid: { type: Number, required: true },
        inventoryid: { type: String, required: true },
        itemimage: { type: String, required: true },
      },
    ],
  },
  PlayerTwo: {
    id: { type: Number },
    username: { type: String },
    thumbnail: { type: String },
    coin: { type: String },
    value: { type: Number, required: false },
    chances: { type: Number },
    items: [
      {
        id: { type: String, required: true },
        itemname: { type: String },
        itemvalue: { type: Number, required: true },
        itemid: { type: Number },
        inventoryid: { type: String },
        itemimage: { type: String },
      },
    ],
  },
  requirements: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    static: { type: Number, required: true },
  },
  winner: { type: Number, default: null },
  winnercoin: { type: String, default: null },
  active: { type: Boolean, default: true },
  start: { type: Date, required: true },
  end: { type: Date, default: null },
  serverSeedHash: { type: String, required: false },
  randomSeed: { type: String, required: false },
});

module.exports = mongoose.model("Coinflips", coinflipSchema);
