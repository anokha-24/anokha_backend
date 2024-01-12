const mysql = require('mysql2');
const connectionLimit = 12;

const anokha_db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'anokha',
    waitForConnections: true,
    connectionLimit: connectionLimit,
    queueLimit: 0
});

const anokha_transactions_db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'anokha_transactions',
    waitForConnections: true,
    connectionLimit: connectionLimit,
    queueLimit: 0
});

module.exports = [
    anokha_db,
    anokha_transactions_db
];