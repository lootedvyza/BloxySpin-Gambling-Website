const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userschema = new schema({
  userid: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  displayname: {
    type: String,
    required: true,
  },
  rank: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
  xp: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  history: {
    type: Array,
    required: true,
  },
  deposited: {
    type: Number,
    required: true,
  },
  wager: {
    type: Number,
    required: true,
  },
  won: {
    type: Number,
    required: true,
  },
  lost: {
    type: Number,
    required: true,
  },
  banned: {
    type: Boolean,
    required: true,
  },
  discordusername: {
    type: String,
    required: false,
    default: null,   
  },
  discordid: {
    type: Number,
    required: false,
    default: null,   
  },
});

const usermodel = mongoose.model("users", userschema);
module.exports = usermodel;
