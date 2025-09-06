// obv never finished

const asyncHandler = require("express-async-handler");
const axios = require("axios");
const users = require("../../modules/users.js");
const cryptodeposit = require("../../modules/cryptodeposit.js");
const config = require("../../config.js");

async function checkPayment(newDeposit) {
    let paid = false;
    let paidAmount = 0.00; 
    while (!paid) {
        try {
            const response = await axios.post(`https://apirone.com/api/v3/wallet/${config.crypto[newDeposit.method].walletid}`);
            if (response.status !== 200) continue;

            const money = response.data.balance;
            if (money > newDeposit.startMoney) {
                const user = await users.findOne({ "userid": newDeposit.userid });
                if (!user || user.banned) return { "success": false, "message": "Unknown user!" };

                user.balance += money;
                await user.save();
                paid = true;
                return { "success": true, "message": "Successfully deposited!" };
            }
        } catch (error) {
            console.error(error);
            continue;
        }

        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

exports.create = asyncHandler(async (req, res) => {
    try {
        if (!req.user?.id) return res.status(400).json({ "message": "Unauthorized" });

        const user = await users.findOne({ "userid": req.user.id });
        if (!user) return res.status(400).json({ "message": "Unauthorized" });

        if (!req.body.method || !config.crypto[req.body.method]) return res.status(400).json({ "message": "Method not supported" });

        const createAddressResponse = await axios.post(`https://apirone.com/api/v2/wallets/${config.crypto[req.body.method].walletid}/addresses`);

        if (createAddressResponse.status === 200) {
            const address = createAddressResponse.data.address;
            const newDeposit = new cryptodeposit({
                userid: req.user.id,
                address: address,
                paid: false,
                amount: null,
                method: req.body.method,
                createdate: new Date()
            });

            await newDeposit.save();

            res.status(200).json({ "message": "OK", "address": address, "success": true });

            checkPayment(newDeposit);
        } else {
            res.status(500).json({ "message": "Internal server error" });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ "message": "Internal server error" });
    }
});
