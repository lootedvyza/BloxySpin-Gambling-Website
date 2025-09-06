const mongoose = require("mongoose");
const schema = mongoose.Schema;
const withdrawsschema = new schema({
  itemid: {
    type: Number,
    required: true,
  },
  itemname: {
    type: String,
    required: true,
  },
  game: {
    type: String,
    required: true,
  },
  userid: {
    type: Number,
    required: true,
  }
})
const withdrawsmodel = mongoose.model("withdraws", withdrawsschema);
module.exports = withdrawsmodel;