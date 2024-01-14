const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const { anokha_db, anokha_transactions_db } = require('../connection/poolConnection');
const otpTokenGenerator = require('../middleware/auth/otp/tokenGenerator');
const generateOTP = require("../middleware/auth/otp/otpGenerator");
const mailer = require('../middleware/mailer/mailer');


module.exports = {
    testConnection: async (req, res) => {
        res.status(200).json({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "User"
        });
        return;
    },

    

    
}