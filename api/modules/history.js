const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const historyschema = new Schema({
  userid: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
  }
})

const historyModel = mongoose.model("history", historyschema);
module.exports = historyModel;