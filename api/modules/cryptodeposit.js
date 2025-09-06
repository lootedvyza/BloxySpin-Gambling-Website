const mongoose = require("mongoose");
const schema = mongoose.Schema;

const cryptodepositschema = new schema({
    userid: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    paid: {
        type: Boolean,
        required: false,
        default: null,
    },
    amount: {
        type: Number,
        required: false,
        default: null,
    },
    method: {
        type: String,
        required: true,
    },
    createdate: {
        type: Date,
        required: false,
        default: null,
    },
});

const cryptodepositmodel = mongoose.model("cryptodeposit", cryptodepositschema);

module.exports = cryptodepositmodel;
