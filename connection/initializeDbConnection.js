const mysql = require('mysql2');

const appConfig = require('../config/appConfig');

const establishConnection = () => {
    const anokha_db = mysql.createConnection(appConfig.db.anokha_db);

    const anokha_transactions_db = mysql.createConnection(appConfig.db.anokha_transactions_db);

    anokha_db.connect((err) => {
        if (err) {
            console.log("[ERROR]: Failed to connect to anokha_db.");
            console.log(err);
        }
        else {
            console.log("[MESSAGE]: Connected to anokha_db.");
        }
    });

    anokha_transactions_db.connect((err) => {
        if (err) {
            console.log("[ERROR]: Failed to connect to anokha_transactions_db.");
            console.log(err);
        }
        else {
            console.log("[MESSAGE]: Connected to anokha_transactions_db.");
        }
    });

    return [anokha_db, anokha_transactions_db];
}

module.exports = establishConnection;