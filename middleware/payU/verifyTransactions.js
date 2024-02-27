const [anokha_db,anokha_transactions_db] = require('../../connection/poolConnection');
const {payUKey, payUSalt,payUVerifyURL, db} = require('../../config/appConfig');
const { generateVerifyHash } = require('./util');
const fs = require('fs');


const verifyTransactions = async () => {
    console.log(`[MESSAGE]: Verifying Transactions at ${new Date().toLocaleString()}`);
    const transaction_db_connection = await anokha_transactions_db.promise().getConnection();
    const db_connection = await anokha_db.promise().getConnection();
    try {
        
        // Get all the transactions that are not verified
        await transaction_db_connection.query(`LOCK TABLES transactionData READ`)
        
        const [transactionD] = await transaction_db_connection.query(`SELECT * FROM transactionData WHERE transactionStatus = "0"`);
        const txnids = transactionD.map((transaction) => transaction.txnId).join("|");

        await transaction_db_connection.query(`UNLOCK TABLES`);



        // if there are no transactions to verify, return
        if (transactionD.length === 0) {
            return;
        }

        
        
        // communicate with payU to verify the transactions
        const hash = generateVerifyHash({ command: "verify_payment", var1: txnids });
        
        const response = await fetch(payUVerifyURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `key=${payUKey}&command=verify_payment&hash=${hash}&var1=${txnids}`
        });

        const data = await response.json();

        const transactionDetails = data.transaction_details;      




        // collect all the transactions that are success and failure
        const successTransactions = [''];
        const failureTransactions = [''];

        for (const txnid in transactionDetails) {
            
            if (transactionDetails[txnid].status === "success") {
                
                successTransactions.push(transactionDetails[txnid]);
            } 
            else if (transactionDetails[txnid].status === "failure") {
                
                failureTransactions.push(transactionDetails[txnid]);
            }
        }

        
        await transaction_db_connection.beginTransaction();
        await db_connection.beginTransaction();

        const successTransactionIds = successTransactions.map(obj => obj.txnid ? obj.txnid : '');
        const failureTransactionIds = failureTransactions.map(obj => obj.txnid ? obj.txnid : '');


        //set transaction statuses
        await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "1" WHERE txnId IN (?)`, [successTransactionIds]);
        await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "2" WHERE txnId IN (?)`, [failureTransactionIds]);

        
        
        //success passports
        const successPassports = successTransactions.filter( (txn) => typeof txn.txnid === 'string' && txn.txnid.charAt(4) === 'P').map((txn) => parseInt(txn.txnid.split('-')[2]));

        await db_connection.query('UPDATE studentData SET studentAccountStatus = "2" WHERE studentId IN (?)',[successPassports]);


        
        //success eventRegistrations

        await db_connection.query('UPDATE eventRegistrationData SET registrationStatus = "2" WHERE txnId IN (?)',[successTransactionIds]);


        //failure eventRegistrations

        // failureTransactions.forEach(async (txn) => {
            
        //     if(txn.txnid.charAt(4) === 'E') {
                
        //         if(txn.productinfo.substring(0,3)==='EIP') {
                    
        //             await db_connection.query('DELETE from eventRegistrationData WHERE txnId = ?',[txn.txnid]);
        //             await db_connection.query('UPDATE eventData SET eventRegistrations = eventRegistrations - 1 WHERE eventId = ?',[parseInt(txn.txnid.split('-')[3])]);
        //             await transaction_db_connection.query('UPDATE transactionData SET seatsReleased = ? WHERE txnId = ?',["1",txn.txnid]);

        //         }

        //         else if(txn.productinfo.substring(0,4)==='EGPI') {
        //             await db_connection.query('DELETE from eventRegistrationData WHERE txnId = ?',[txn.txnid]);
        //             await db_connection.query('UPDATE eventData SET eventRegistrations = eventRegistrations - 1 WHERE eventId = ?',[parseInt(txn.txnid.split('-')[3])]);
        //             await transaction_db_connection.query('UPDATE transactionData SET seatsReleased = ? WHERE txnId = ?',["1",txn.txnid]);

        //         }
            
        //     }

        // });

        //failure eventRegistrations

        const [releaseSeats] = await db_connection.query('SELECT eventId, SUM(totalMembers) FROM eventRegistrationData GROUP BY eventId WHERE txnId IN (?)',[failureTransactionIds]);

        await db_connection.query('DELETE from eventRegistrationData WHERE txnId IN (?)',[failureTransactionIds]);
        await db_connection.query('DELETE from eventRegistrationGroupData WHERE txnId IN (?)',[failureTransactionIds]);

        // releaseSeats.forEach(async (event) => {
        //     await db_connection.query('UPDATE eventData SET eventRegistrations = eventRegistrations - ? WHERE eventId = ?',[event['SUM(totalMembers)'],event.eventId]);
        // });

        let queryString = '';

        releaseSeats.forEach((e) => {
            queryString += `UPDATE eventData SET seatsFilled = seatsFilled - ${e['SUM(totalMembers)']} WHERE eventId = ${e.eventId};`;
        });

        await db_connection.query(queryString);

        //release expired seats

        const [expiredTxns] = await db_connection.query('SELECT txnId FROM transactionData WHERE transactionStatus = "0" AND expiryTime < CURRENT_TIMESTAMP');

        await db_connection.query('UPDATE transactionData SET transactionStatus = "2" WHERE txnId IN (?)',[expiredTxns]);

        const [expiredSeats] = await db_connection.query('SELECT eventId, SUM(totalMembers) FROM eventRegistrationData GROUP BY eventId WHERE txnId IN (?)',[expiredTxns]);

        await db_connection.query('DELETE from eventRegistrationData WHERE txnId IN (?)',[expiredTxns]);
        await db_connection.query('DELETE from eventRegistrationGroupData WHERE txnId IN (?)',[expiredTxns]);

        queryString = '';

        expiredSeats.forEach((e) => {
            queryString += `UPDATE eventData SET seatsFilled = seatsFilled - ${e['SUM(totalMembers)']} WHERE eventId = ${e.eventId};`;
        });
            
        await db_connection.query(queryString);

        await transaction_db_connection.commit();
        await db_connection.commit();


    } catch (err) {
        
        await transaction_db_connection.rollback();
        await db_connection.rollback();
        console.log(err);
        fs.appendFileSync('./logs/transactionErrorLogs.log', `[${new Date().toISOString()}]: ${err}\n\n`);
        return;
    
    } finally {
        
        await transaction_db_connection.query(`UNLOCK TABLES`);
        await db_connection.query(`UNLOCK TABLES`);
        transaction_db_connection.release();
        db_connection.release();

        console.log(`[MESSAGE]: Transactions verified at ${new Date().toLocaleString()}`);
    
    }
}

//verifyTransactions();

module.exports = verifyTransactions;