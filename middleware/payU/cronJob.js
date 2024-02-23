const cron = require('node-cron');
const verifyTransactions = require('./verifyTransactions');
const fs = require('fs');

const verifyTransactionsCronJob = () => {
    console.log("[MESSAGE]: PayU CRON reporting.")
    cron.schedule('0 0 0 * * *', async () => {
        fs.appendFileSync('./logs/cronJobLogs', `[${new Date().toLocaleString()}]: Cron Job Started\n`);
        try {
            await verifyTransactions();
        } catch (err) {
            console.log(err);
            fs.appendFileSync('./logs/cronJobErrorLogs', `[${new Date().toISOString()}]: ${err}\n\n`);
            return;
        }
    });
}

verifyTransactionsCronJob();

module.exports = verifyTransactionsCronJob;