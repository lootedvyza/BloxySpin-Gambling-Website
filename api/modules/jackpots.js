const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jackpotSchema = new Schema({
  value: { type: Number, required: true },
  winnerusername: { type: String },
  winnerid: { type: Number },
  serverSeed: { type: String, required: true },
  hashedServerSeed: { type: String, required: true },
  clientSeed: { type: String },
  endsAt: { type: Date },
  result: { type: Number },
  inactive: { type: Boolean,},
  state: { type: String, required: true },
  game: { type: String },
});

module.exports = mongoose.model("Jackpot", jackpotSchema);