const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const botsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  pfp: {
    type: String,
    required: true
  },
  userid: {
    type: Number,
    required: true,
  },
  link: {
    type: String,
    required: true
  },
  game: {
    type: String,
    required: true
  },
  online: {
    type: Boolean,
    required: true
  }
})

const botsModel = mongoose.model("bots", botsSchema);
module.exports = botsModel;