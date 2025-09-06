const mongoose = require("mongoose");
const schema = mongoose.Schema;


const inventoryschema = new schema({
  itemid: {
    type: Number,
    required: true,
  },
  owner: {
    type: Number,
    required: true,
  },
  locked: {
    type: Boolean,
    required: true,
  }
})


const inventorymodel = mongoose.model("inventorys", inventoryschema);
module.exports = inventorymodel;