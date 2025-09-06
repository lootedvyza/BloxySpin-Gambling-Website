const mongoose = require("mongoose");
const schema = mongoose.Schema;


const itemschema = new schema({
  itemid: {
    type: Number,
    required: true,
  },
  itemname: {
    type: String,
    required: true,
  },
  itemvalue: {
    type: Number,
    required: true,
  },
  itemimage: {
    type: String,
    required: true
  },
  game: {
    type: String,
    required: true
  }
})


const itemmodel = mongoose.model("items", itemschema);
module.exports = itemmodel;