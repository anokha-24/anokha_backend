const cron = require('node-cron');
const verifyTransactions = require('./verifyTransactions');
const fs = require('fs');

const verifyTransactionsCronJob = () => {
    console.log("[MESSAGE]: PayU CRON reporting.")
    cron.schedule('*/10 * * * *', async () => {
        fs.appendFileSync('./logs/cronJobLogs.log', `[${new Date().toLocaleString()}]: Cron Job Started\n`);
        try {
            await verifyTransactions();
        } catch (err) {
            console.log(err);
            fs.appendFileSync('./logs/cronJobErrorLogs.log', `[${new Date().toISOString()}]: ${err}\n\n`);
            return;
        }
    });
}

verifyTransactionsCronJob();

module.exports = verifyTransactionsCronJob;