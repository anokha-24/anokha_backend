const mysql = require('mysql2');

const establishConnection = () => {
    const anokha_db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'anokha',
        multipleStatements: true
    });

    const anokha_transactions_db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'anokha_transactions',
        multipleStatements: true
    });

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