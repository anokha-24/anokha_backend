const [anokha_db,anokha_transactions_db] = require('../../connection/poolConnection');
const {payUKey, payUSalt,payUVerifyURL, db} = require('../../config/appConfig');
const { generateVerifyHash } = require('./util');
const fs = require('fs');


const verifyTransactions = async () => {
    console.log(`[MESSAGE]: Verifying Transactions at ${new Date().toLocaleString()}`);
    const transaction_db_connection = await anokha_transactions_db.promise().getConnection();
    const db_connection = await anokha_db.promise().getConnection();

    let rollbackFlag = "0";
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
        const successTransactions = [];
        const failureTransactions = [];

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

        rollbackFlag = "1";

        const successTransactionIds = successTransactions.map(obj => obj.txnid ? obj.txnid : '');
        const failureTransactionIds = failureTransactions.map(obj => obj.txnid ? obj.txnid : '');


        //set transaction statuses
        if(successTransactionIds.length > 0){
            await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "1" WHERE txnId IN (?)`, [successTransactionIds]);
        }
        
        if(failureTransactionIds.length > 0){
            await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "2" WHERE txnId IN (?)`, [failureTransactionIds]);
        }
        
        
        //success passports
        const successPassports = successTransactions.filter( (txn) => typeof txn.txnid === 'string' && txn.txnid.charAt(4) === 'P').map((txn) => parseInt(txn.txnid.split('-')[2]));

        if (successPassports.length > 0) {

            await db_connection.query('UPDATE studentData SET studentAccountStatus = "2" WHERE studentId IN (?)',[successPassports]);
        
        }

        
        //success eventRegistrations
        if(successTransactionIds.length > 0){
            await db_connection.query('UPDATE eventRegistrationData SET registrationStatus = "2" WHERE txnId IN (?)',[successTransactionIds]);
        }


        //failure eventRegistrations
        if(failureTransactionIds.length > 0){
            
            const [releaseSeats] = await db_connection.query('SELECT eventId, SUM(totalMembers) FROM eventRegistrationData WHERE txnId IN (?) GROUP BY eventId',[failureTransactionIds]);

            
            //order important foreign key constraints
            
            await db_connection.query('DELETE from eventRegistrationGroupData WHERE txnId IN (?)',[failureTransactionIds]);
            await db_connection.query('DELETE from eventRegistrationData WHERE txnId IN (?)',[failureTransactionIds]);

            let queryString = '';

            releaseSeats.forEach((e) => {
                queryString += `UPDATE eventData SET seatsFilled = seatsFilled - ${e['SUM(totalMembers)']} WHERE eventId = ${e.eventId};`;
            });

            await db_connection.query(queryString);

        }
       
       
        //release expired seats

        let [result] = await transaction_db_connection.query('SELECT txnId FROM transactionData WHERE transactionStatus = "0" AND expiryTime < CURRENT_TIMESTAMP');

        const expiredTxns = result.map((obj) => obj.txnId);

        if(expiredTxns.length > 0){
            await transaction_db_connection.query('UPDATE transactionData SET transactionStatus = "2" WHERE txnId IN (?)',[expiredTxns]);

            const [expiredSeats] = await db_connection.query('SELECT eventId, SUM(totalMembers) FROM eventRegistrationData WHERE txnId IN (?) GROUP BY eventId',[expiredTxns]);

            
            //order important foreign key constraints
            
            await db_connection.query('DELETE from eventRegistrationGroupData WHERE txnId IN (?)',[expiredTxns]);
            await db_connection.query('DELETE from eventRegistrationData WHERE txnId IN (?)',[expiredTxns]);
            

            queryString = '';

            expiredSeats.forEach((e) => {
                queryString += `UPDATE eventData SET seatsFilled = seatsFilled - ${e['SUM(totalMembers)']} WHERE eventId = ${e.eventId};`;
            });
                
            await db_connection.query(queryString);
        }

        await transaction_db_connection.commit();
        await db_connection.commit();


    } catch (err) {
        
        if(rollbackFlag === "1"){
            await transaction_db_connection.rollback();
            await db_connection.rollback();
        }
        
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