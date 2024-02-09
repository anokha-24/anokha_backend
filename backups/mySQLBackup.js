require('dotenv').config({ path: '.env.local' })
const cron = require('node-cron');
const fs = require('fs');

const mysqlBackupCronJob = () => {
    console.log("[MESSAGE]: MySQL Backup CRON reporting.")
    cron.schedule('0 0 * * * *', async () => {
        try {
            const { exec } = require('child_process');
            exec(`mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASS} ${process.env.DB_NAME} > backups/${process.env.DB_NAME}.sql`, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    fs.appendFileSync('./logs/backup/errorLogs.log', `[${new Date().toISOString()}]: ${err}\n`);
                    return;
                }
                console.log(`[${new Date().toLocaleString()}]: MySQL ${process.env.DB_NAME} Backup Completed`)
                fs.appendFileSync('./logs/backup/backupLogs.log', `[${new Date().toLocaleString()}]: MySQL ${process.env.DB_NAME} Backup Completed\n`);
            });
            exec(`mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASS} ${process.env.TXN_DB_NAME} > backups/${process.env.TXN_DB_NAME}.sql`, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    fs.appendFileSync('./logs/backup/errorLogs.log', `[${new Date().toISOString()}]: ${err}\n`);
                    return;
                }
                console.log(`[${new Date().toLocaleString()}]: MySQL ${process.env.TXN_DB_NAME} Backup Completed`)
                fs.appendFileSync('./logs/backup/backupLogs.log', `[${new Date().toLocaleString()}]: MySQL ${process.env.TXN_DB_NAME} Completed\n`);
            });
        } catch (err) {
            console.log(err);
            fs.appendFileSync('./logs/backup/errorLogs.log', `[${new Date().toISOString()}]: ${err}\n`);
            return;
        }
    });
}

mysqlBackupCronJob();

//module.exports = mysqlBackupCronJob;