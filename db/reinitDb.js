const fs = require('fs');

const reinitDb = (db, dbName) => {
    try {
        if (dbName === "anokha") {
            fs.readFile('./db/reinitAnokha.sql', 'utf8', (err, data) => {
                if (err) {
                    console.log(`[ERROR]: ${err}`);
                    fs.appendFileSync('./logs/db.log', `${new Date().toLocaleString} | [ERROR]: ${err}\n`)
                } else {
                    db.query(data, (err, result) => {
                        if (err) {
                            console.log(`[ERROR]: ${dbName} failed to reinitialize.`);
                            console.log(`[ERROR]: ${err}`);
                            fs.appendFileSync('./logs/db.log', `${new Date().toLocaleString} | [ERROR]: ${err}\n`)
                        } else {
                            console.log(`[MESSAGE]: ${dbName} reinitialized.`);
                        }
                    });
                }
            });
        } else if (dbName === "anokha_transactions") {
            fs.readFile('./db/reinitAnokhaTransactions.sql', 'utf8', (err, data) => {
                if (err) {
                    console.log(`[ERROR]: ${err}`);
                    fs.appendFileSync('./logs/db.log', `${new Date().toLocaleString} | [ERROR]: ${err}\n`)
                } else {
                    db.query(data, (err, result) => {
                        if (err) {
                            console.log(`[ERROR]: ${dbName} failed to reinitialize.`);
                            console.log(`[ERROR]: ${err}`);
                            fs.appendFileSync('./logs/db.log', `${new Date().toLocaleString} | [ERROR]: ${err}\n`)
                        } else {
                            console.log(`[MESSAGE]: ${dbName} reinitialized.`);
                        }
                    });
                }
            });
        }
    } catch (err) {
        console.log(`[ERROR]: ${dbName} failed to reinitialize.`);
        console.log(`[ERROR]: ${err}`);
        fs.appendFileSync('./logs/db.log', `${new Date().toLocaleString} | [ERROR]: ${err}\n`)
    }
}

module.exports = reinitDb;