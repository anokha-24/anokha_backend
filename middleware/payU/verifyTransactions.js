const [anokha_db,anokha_transactions_db] = require('../../connection/poolConnection');
const {payUKey, payUSalt,payUVerifyURL} = require('../../config/appConfig');
const { generateVerifyHash } = require('./util');
const fs = require('fs');


const verifyTransactions = async () => {
    const transaction_db_connection = await anokha_transactions_db.promise().getConnection();
    const db_connection = await anokha_db.promise().getConnection();
    try {
        // Get all the transactions that are not verified
        await transaction_db_connection.query(`LOCK TABLES transactionData READ`)
        const [transactionD] = await transaction_db_connection.query(`SELECT * FROM transactionData WHERE transactionStatus = "0"`);
        const txnids = transactionD.map((transaction) => transaction.txnid).join("|");
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
            // console.log(transactionDetails[txnid]);
            if (transactionDetails[txnid].status === "success") {
                successTransactions.push(txnid);
            } else if (transactionDetails[txnid].status === "failure") {
                failureTransactions.push(txnid);
            }
        }

        console.log(successTransactions);
        console.log(failureTransactions);
        console.log(transactionDetails);

        let updatedTransactions = [];

        await transaction_db_connection.beginTransaction();
        await db_connection.beginTransaction();

        await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "1" WHERE txnId IN (?)`, [successTransactions]);
        await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "2" WHERE txnId IN (?)`, [failureTransactions]);
        await transaction_db_connection.query(`UPDATE marketPlaceTransactionData SET transactionStatus = "1" WHERE txnId IN (?)`, [successTransactions]);
        await transaction_db_connection.query(`UPDATE marketPlaceTransactionData SET transactionStatus = "2" WHERE txnId IN (?)`, [failureTransactions]);

        //sample working query
        //UPDATE anokha.studentData SET studentAccountStatus = '2' WHERE studentId IN (SELECT userId FROM transactionData WHERE txnId IN ('simpletransactionid') AND productinfo LIKE 'T%');

        await db_connection.query(`UPDATE studentData SET studentAccountStatus = '2' WHERE userId IN (SELECT stuentId FROM transactionData WHERE txnId IN (?) AND productinfo LIKE 'P%')`, [successTransactions]);

        await db_connection.query(`UPDATE eventRegistrationData SET registrationStatus = '2' WHERE userId IN (SELECT stuentId FROM transactionData WHERE txnId IN (?) AND productinfo LIKE 'E%')`, [successTransactions]);



        await transaction_db_connection.commit();
        await db_connection.commit();

        /*
        There are 3 cases:
        1. Some transactions are success and some are failure (successTransactions.length > 0 && failureTransactions.length > 0)
        2. All transactions are success (successTransactions.length > 0 && failureTransactions.length === 0)
        3. All transactions are failure (successTransactions.length === 0 && failureTransactions.length > 0)
        */

        // if (successTransactions.length > 0 && failureTransactions.length > 0) {
        //     await transaction_db_connection.query(`LOCK TABLES transactionData WRITE`);

        //     // Update Transactions table
        //     await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "1" WHERE txnid IN (?)`, [successTransactions]);
        //     await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "2" WHERE txnid IN (?)`, [failureTransactions]);

        //     [updatedTransactions] = await transaction_db_connection.query(`SELECT * FROM transactionData WHERE txnid IN (?)`, [successTransactions + failureTransactions]);

        //     await transaction_db_connection.query(`UNLOCK TABLES`);

        // } 
        // else if (successTransactions.length > 0 && failureTransactions.length === 0) {
        //     await transaction_db_connection.query(`LOCK TABLES transactionData WRITE`);

        //     // Update Transactions table
        //     await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "1" WHERE txnid IN (?)`, [successTransactions]);
        //     [updatedTransactions] = await transaction_db_connection.query(`SELECT * FROM transactionData WHERE txnid IN (?)`, [successTransactions]);

        //     await transaction_db_connection.query(`UNLOCK TABLES`);
        // } 
        // else if (successTransactions.length === 0 && failureTransactions.length > 0) {
        //     await transaction_db_connection.query(`LOCK TABLES transactionData WRITE`);

        //     // Update Transactions table
        //     await transaction_db_connection.query(`UPDATE transactionData SET transactionStatus = "2" WHERE txnid IN (?)`, [failureTransactions]);
        //     [updatedTransactions] = await transaction_db_connection.query(`SELECT * FROM transactionData WHERE txnid IN (?)`, [failureTransactions]);

        //     await transaction_db_connection.query(`UNLOCK TABLES`);
        // }

        // transaction_db_connection.release();

        // // After updating the transactions table, update the registrationFeeData and eventRegistrationData tables and userAccountStatus in userData table

        // const registrationFeePaidUserIDs = [];
        // const registrationFeePaidUsers = [];
        // const eventRegistrationData = [];

        // for (const transaction of updatedTransactions) {
        //     /*
        //     {
        //     txnid: 'TXN-2-1704275064662',
        //     userId: 2,
        //     amount: 359,
        //     productinfo: '(1,1,299)-(0,1,60)',
        //     firstname: 'Ajoy Shetty',
        //     email: 'shettyajoy@gmail.com',
        //     phone: '8870014773',
        //     transactionStatus: '2',
        //     createdAt: 2024-01-03T10:26:46.000Z,
        //     lastUpdatedAt: 2024-01-03T10:26:48.000Z
        //     }
        //     */

        //     const { txnid, userId, amount, productinfo, firstname, email, phone, transactionStatus } = transaction;

        //     // only success transactions
        //     if (transactionStatus === '1') {

        //         // only one event registration. User would've already paid the registration FEE.
        //         if (productinfo.indexOf("-") === -1) {
        //             const pinfo = [productinfo];
        //             const [eventId, eventQuantity, eventPrice] = pinfo[0].substring(1, pinfo[0].length - 1).split(",");
        //             eventRegistrationData.push({
        //                 eventId, 
        //                 userId, 
        //                 eventQuantity, 
        //                 txnid
        //             });
        //             continue;
        //         }


        //         // multiple event registrations.
        //         const eventRegistrationDataString = productinfo.split("-");

        //         // If the user is paying registration fee for the first time, productinfo last element will be (0,1,60)
        //         if (eventRegistrationDataString[eventRegistrationDataString.length - 1] === "(0,1,60)") {
        //             registrationFeePaidUserIDs.push(userId);
        //             registrationFeePaidUsers.push({ userId, txnid });
        //             eventRegistrationDataString.pop();
        //         }

        //         // Collect all the event registration data. 
        //         for (const eventRegistrationDataA of eventRegistrationDataString) {
        //             const [eventId, eventQuantity, eventPrice] = eventRegistrationDataA.substring(1, eventRegistrationDataA.length).split(",");

        //             eventRegistrationData.push({
        //                 eventId,
        //                 userId,
        //                 eventQuantity,
        //                 txnid
        //             });
        //         }
        //     }
        // }

        // // if we have any data to update in the database, update it
        // if ((registrationFeePaidUserIDs.length > 0 && registrationFeePaidUsers.length > 0) || eventRegistrationData.length > 0) {
        //     const pragathi_db_connection = await pragathi_db.promise().getConnection();
        //     try {
        //         if (registrationFeePaidUserIDs.length > 0 && registrationFeePaidUsers.length > 0) {
        //             console.log(registrationFeePaidUserIDs);
        //             console.log(registrationFeePaidUsers);
        //             // update registration status of users
        //             await pragathi_db_connection.query(`LOCK TABLES userData WRITE, registrationFeeData WRITE`);
        //             await pragathi_db_connection.query(`INSERT INTO registrationFeeData (userId, transactionId) VALUES ?`, [registrationFeePaidUsers.map((user) => [user.userId, user.txnid])]);
        //             await pragathi_db_connection.query(`UPDATE userData SET userAccountStatus = "1" WHERE userId IN (?)`, [registrationFeePaidUserIDs]);
        //             await pragathi_db_connection.query(`UNLOCK TABLES`);
        //         }

        //         if (eventRegistrationData.length > 0) {
        //             console.log(eventRegistrationData);
        //             // update event registration data
        //             await pragathi_db_connection.query(`LOCK TABLES eventRegistrations WRITE, eventData WRITE`);

        //             await pragathi_db_connection.query(`INSERT INTO eventRegistrations (eventId, userId, totalMembers, transactionId) VALUES ?`, [eventRegistrationData.map((event) => [event.eventId, event.userId, event.eventQuantity, event.txnid])]);

        //             for(const event of eventRegistrationData) {
        //                 await pragathi_db_connection.query(`UPDATE eventData SET noOfRegistrations = noOfRegistrations + ? WHERE eventId = ?`, [event.eventQuantity, event.eventId]);
        //             }

        //             await pragathi_db_connection.query(`UNLOCK TABLES`);
        //         }
            // } catch (err) {

            //     console.log(err);
            //     fs.appendFileSync('./logs/transactionErrorLogs', `[${new Date().toISOString()}]: ${err}\n\n`);
            //     return;
            // } finally {
            //     await transaction_db_connection.query(`UNLOCK TABLES`);
            //     transaction_db_connection.release();
            // }

            // if (eventRegistrationData.length > 0) {
            //     // Send Mail
            //     eventRegistrationData.forEach((eventR) => {
            //         mailUtility.sendEventRegistrationCompleteMail()
            //     })
            // }

            // console.log(registrationFeePaidUserIDs);
            // console.log(registrationFeePaidUsers);
            // console.log(eventRegistrationData);
        // }

        // return;
    } catch (err) {
        await transaction_db_connection.rollback();
        await db_connection.rollback();
        console.log(err);
        fs.appendFileSync('./logs/transactionErrorLogs', `[${new Date().toISOString()}]: ${err}\n\n`);
        return;
    } finally {
        await transaction_db_connection.query(`UNLOCK TABLES`);
        await db_connection.query(`UNLOCK TABLES`);
        transaction_db_connection.release();
        db_connection.release();
    }
}

module.exports = verifyTransactions;