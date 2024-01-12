const mysql = require('mysql2');
const appConfig = require('../config/appConfig');

const anokha_db = mysql.createPool(appConfig.pool_db.anokha_db);
const anokha_transactions_db = mysql.createPool(appConfig.pool_db.anokha_transactions_db);

module.exports = [
    anokha_db,
    anokha_transactions_db
];