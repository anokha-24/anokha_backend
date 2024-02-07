const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const otpTokenGenerator = require('../middleware/auth/otp/tokenGenerator');
const generateOTP = require("../middleware/auth/otp/otpGenerator");
const mailer = require('../middleware/mailer/mailer');
const appConfig = require('../config/appConfig');
const [tokenValidator, validateEventRequest] = require('../middleware/auth/login/tokenValidator');
const { generateHash } = require("../middleware/payU/util");

const validator = require("validator");
const redisClient = require('../connection/redis');

module.exports = {
    testConnection: async (req, res) => {
        res.status(200).json({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "User/Student"
        });
        return;
    },


    getStudentProfile: [
        tokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    await db_connection.query("LOCK TABLES studentData READ");
                    const query = `SELECT * FROM studentData WHERE studentId=?`;
                    const [student] = await db_connection.query(query, [req.body.studentId]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Fetched Student Profile.",
                        "studentFullName": student[0].studentFullName,
                        "studentEmail": student[0].studentEmail,
                        "studentPhone": student[0].studentPhone,
                        "needPassport": student[0].needPassport,
                        "studentAccountStatus": student[0].studentAccountStatus,
                        "studentCollegeName": student[0].studentCollegeName,
                        "studentCollegeCity": student[0].studentCollegeCity,
                        "isInCampus": student[0].isInCampus
                    });
                    return;
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - studentProfile - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }

    ],

    /*
    {
        "studentFullName":"Abhinav Ramakrishnan",
        "studentPhone":"9597347594",
        "studentCollegeName":"Amrita Vishwa Vidyapeetham",
        "studentCollegeCity":"Coimbatore"
    }
    */
    editStudentProfile: [
        tokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if (!dataValidator.isValidEditStudentProfile(req.body)) {
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    await db_connection.query("LOCK TABLES studentData WRITE");
                    const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentPhone =? AND studentId != ?", [req.body.studentPhone, req.body.studentId]);
                    if (check.length > 0) {
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Phone Number Associated with Another Account!"
                        });
                        return;
                    }
                    const query = `UPDATE studentData SET studentFullName=?, studentPhone=?, studentCollegeName=?, studentCollegeCity=? WHERE studentId=?`;
                    await db_connection.query(query, [req.body.studentFullName, req.body.studentPhone, req.body.studentCollegeName, req.body.studentCollegeCity, req.body.studentId]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Edited Student Profile."
                    });
                    return;
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - editStudentProfile - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }

    ],

    /*
    {
        eventId: 1,
        isStarred:"<0/1>"
    }
    */
    toggleStarredEvent: [
        tokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if (!await dataValidator.isValidToggleStarredEventRequest(req)) {
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    await db_connection.query("LOCK TABLES starredEvents WRITE");
                    if (req.body.isStarred == "1") {
                        [check] = await db_connection.query("SELECT * FROM starredEvents WHERE studentId=? AND eventId=?", [req.body.studentId, req.body.eventId]);
                        if (check.length > 0) {
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": "Successfully Starred Event!"
                            });
                            return;
                        }
                        const query = `INSERT INTO starredEvents (studentId, eventId) VALUES (?, ?);`;
                        await db_connection.query(query, [req.body.studentId, req.body.eventId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Starred Event!"
                        });
                        return;
                    }
                    else if (req.body.isStarred == "0") {
                        const query = `DELETE FROM starredEvents WHERE studentId=? AND eventId=?;`;
                        await db_connection.query(query, [req.body.studentId, req.body.eventId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Unstarred Event!"
                        });
                        return;
                    }
                    else {
                        res.status(400).json({
                            "MESSAGE": "Invalid Request!"
                        });
                        return;
                    }
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - toggleStarredEvent - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }

            }
        }
    ],

    getStarredEvents: [
        tokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    await db_connection.query("LOCK TABLES eventData READ, eventRegistrationData READ, starredEvents READ, eventRegistrationGroupData READ, departmentData READ, tagData READ, eventTagData READ");
                    const query = `
                        SELECT
                            eventData.eventId,
                            eventData.eventName,
                            eventData.eventDescription,
                            eventData.eventDate,
                            eventData.eventTime,
                            eventData.eventVenue,
                            eventData.eventImageURL,
                            eventData.eventPrice,
                            eventData.maxSeats,
                            eventData.seatsFilled,
                            eventData.minTeamSize,
                            eventData.maxTeamSize,
                            eventData.isWorkshop,
                            eventData.isTechnical,
                            eventData.isGroup,
                            eventData.needGroupData,
                            eventData.isPerHeadPrice,
                            eventData.isRefundable,
                            eventData.eventStatus,
                            departmentData.departmentName,
                            departmentData.departmentAbbreviation,
                            tagData.tagName,
                            tagData.tagAbbreviation,
                            CASE
                                WHEN eventRegistrationData.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isRegistered
                        FROM
                            eventData
                            LEFT JOIN departmentData 
                            ON eventData.eventDepartmentId = departmentData.departmentId
                            INNER JOIN eventTagData
                            ON eventTagData.eventId = eventData.eventId
                            LEFT JOIN tagData 
                            ON eventTagData.tagId = tagData.tagId
                            LEFT JOIN
                            eventRegistrationData ON eventData.eventId = eventRegistrationData.eventId
                            AND eventRegistrationData.studentId = ${req.body.studentId}
                        LEFT JOIN
                            starredEvents ON eventData.eventId = starredEvents.eventId
                            AND starredEvents.studentId = ${req.body.studentId}
                        WHERE
                            ( eventData.isGroup = "0" OR eventData.needGroupData = "0" )
                        AND
                            starredEvents.studentId = ${req.body.studentId}
                        AND
                            (tagData.isActive != "0" OR tagData.isActive IS NULL)
                        ;`;

                    const query2 = `
                        SELECT
                            eventData.eventId,
                            eventData.eventName,
                            eventData.eventDescription,
                            eventData.eventDate,
                            eventData.eventTime,
                            eventData.eventVenue,
                            eventData.eventImageURL,
                            eventData.eventPrice,
                            eventData.maxSeats,
                            eventData.seatsFilled,
                            eventData.minTeamSize,
                            eventData.maxTeamSize,
                            eventData.isWorkshop,
                            eventData.isTechnical,
                            eventData.isGroup,
                            eventData.needGroupData,
                            eventData.isPerHeadPrice,
                            eventData.isRefundable,
                            eventData.eventStatus,
                            departmentData.departmentName,
                            departmentData.departmentAbbreviation,
                            tagData.tagName,
                            tagData.tagAbbreviation,
                            CASE
                                WHEN eventRegistrationGroupData.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isRegistered
                        FROM
                            eventData
                            LEFT JOIN departmentData 
                            ON eventData.eventDepartmentId = departmentData.departmentId
                            INNER JOIN eventTagData
                            ON eventTagData.eventId = eventData.eventId
                            LEFT JOIN tagData 
                            ON eventTagData.tagId = tagData.tagId
                        LEFT JOIN
                            eventRegistrationGroupData ON eventData.eventId = eventRegistrationGroupData.registrationId
                            AND eventRegistrationGroupData.studentId = ${req.body.studentId}
                        LEFT JOIN
                            starredEvents ON eventData.eventId = starredEvents.eventId
                            AND starredEvents.studentId = ${req.body.studentId}
                        WHERE
                            ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )
                        AND
                            starredEvents.studentId = ${req.body.studentId}
                        AND
                            (tagData.isActive != "0" OR tagData.isActive IS NULL)`;

                    await db_connection.query('LOCK TABLES eventData READ, eventRegistrationData READ, starredEvents READ, eventRegistrationGroupData READ, departmentData READ, tagData READ, eventTagData READ');


                    const [rows] = await db_connection.query(query);
                    const [rows2] = await db_connection.query(query2);

                    const concat_rows = [...new Set([...rows, ...rows2])];

                    await db_connection.query("UNLOCK TABLES");

                    //console.log("test");

                    const aggregatedDataMap = new Map();

                    // Iterate through each event object
                    concat_rows.forEach((event) => {
                        // Check if the eventId already exists in the map
                        if (aggregatedDataMap.has(event.eventId)) {
                            // If yes, push the current event data to the existing array
                            const existingData = aggregatedDataMap.get(event.eventId);
                            existingData.tags.push({
                                tagName: event.tagName,
                                tagAbbreviation: event.tagAbbreviation,
                            });
                        } else {
                            // If no, create a new array with the current event data
                            aggregatedDataMap.set(event.eventId, {
                                eventId: event.eventId,
                                eventName: event.eventName,
                                eventDescription: event.eventDescription,
                                eventDate: event.eventDate,
                                eventTime: event.eventTime,
                                eventVenue: event.eventVenue,
                                eventImageURL: event.eventImageURL,
                                eventPrice: event.eventPrice,
                                maxSeats: event.maxSeats,
                                seatsFilled: event.seatsFilled,
                                minTeamSize: event.minTeamSize,
                                maxTeamSize: event.maxTeamSize,
                                isWorkshop: event.isWorkshop,
                                isTechnical: event.isTechnical,
                                isGroup: event.isGroup,
                                needGroupData: event.needGroupData,
                                isPerHeadPrice: event.isPerHeadPrice,
                                isRefundable: event.isRefundable,
                                eventStatus: event.eventStatus,
                                departmentName: event.departmentName,
                                departmentAbbreviation: event.departmentAbbreviation,
                                isRegistered: event.isRegistered,
                                tags: [{
                                    tagName: event.tagName,
                                    tagAbbreviation: event.tagAbbreviation,
                                }],
                            });
                        }
                    });

                    // Convert the map values to an array
                    const result = Array.from(aggregatedDataMap.values());

                    // let finalData = [];

                    // for (let i = 0; i < result.length; i++) {
                    //     if (result[i].isStarred == "1") {
                    //         finalData.push(result[i]);
                    //     }
                    // }

                    //console.log(result);

                    res.status(200).json({
                        "MESSAGE": "Successfully Fetched Starred Events.",
                        "EVENTS": result
                    });
                    return;
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getStarredEvents - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],

    getRegisteredEvents: [
        tokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {

                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, eventRegistrationData READ, eventRegistrationGroupData READ");

                    const query = `
                    SELECT
                    eventData.eventId,
                    eventData.eventName,
                    eventData.eventDescription,
                    eventData.eventDate,
                    eventData.eventTime,
                    eventData.eventVenue,
                    eventData.eventImageURL,
                    eventData.eventPrice,
                    eventData.maxSeats,
                    eventData.seatsFilled,
                    eventData.minTeamSize,
                    eventData.maxTeamSize,
                    eventData.isWorkshop,
                    eventData.isTechnical,
                    eventData.isGroup,
                    eventData.needGroupData,
                    eventData.isPerHeadPrice,
                    eventData.isRefundable,
                    eventData.eventStatus,
                    "1" AS isOwnRegistration,
                    eventRegistrationData.registrationId AS registrationId,
                    eventRegistrationData.txnId AS txnId,
                    departmentData.departmentName,
                    departmentData.departmentAbbreviation,
                    tagData.tagName,
                    tagData.tagAbbreviation
                    FROM eventData
                    LEFT JOIN departmentData
                    ON eventData.eventDepartmentId = departmentData.departmentId
                    INNER JOIN eventTagData
                    ON eventTagData.eventId = eventData.eventId
                    LEFT JOIN tagData
                    ON eventTagData.tagId = tagData.tagId
                    INNER JOIN eventRegistrationData
                    ON eventRegistrationData.eventId = eventData.eventId
                    WHERE eventRegistrationData.studentId = ${req.body.studentId}
                    AND ( eventData.isGroup = "0" OR eventData.needGroupData = "0" )
                    AND (tagData.isActive != "0" OR tagData.isActive IS NULL)
                    ;`

                    const query2 = `
                    SELECT
                    eventData.eventId,
                    eventData.eventName,
                    eventData.eventDescription,
                    eventData.eventDate,
                    eventData.eventTime,
                    eventData.eventVenue,
                    eventData.eventImageURL,
                    eventData.eventPrice,
                    eventData.maxSeats,
                    eventData.seatsFilled,
                    eventData.minTeamSize,
                    eventData.maxTeamSize,
                    eventData.isWorkshop,
                    eventData.isTechnical,
                    eventData.isGroup,
                    eventData.needGroupData,
                    eventData.isPerHeadPrice,
                    eventData.isRefundable,
                    eventData.eventStatus,
                    eventRegistrationGroupData.isOwnRegistration AS isOwnRegistration,
                    eventRegistrationGroupData.registrationId AS registrationId,
                    eventRegistrationGroupData.txnId AS txnId,
                    departmentData.departmentName,
                    departmentData.departmentAbbreviation,
                    tagData.tagName,
                    tagData.tagAbbreviation
                    FROM eventData
                    LEFT JOIN departmentData
                    ON eventData.eventDepartmentId = departmentData.departmentId
                    INNER JOIN eventTagData
                    ON eventTagData.eventId = eventData.eventId
                    LEFT JOIN tagData
                    ON eventTagData.tagId = tagData.tagId
                    INNER JOIN eventRegistrationGroupData
                    ON eventRegistrationGroupData.eventId = eventData.eventId
                    WHERE eventRegistrationGroupData.studentId = ${req.body.studentId}
                    AND ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )
                    AND (tagData.isActive != "0" OR tagData.isActive IS NULL)
                    ;`

                    const [rows] = await db_connection.query(query);
                    const [rows2] = await db_connection.query(query2);

                    const concat_rows = [...new Set([...rows, ...rows2])];

                    await db_connection.query("UNLOCK TABLES");

                    const aggregatedDataMap = new Map();

                    // Iterate through each event object
                    concat_rows.forEach((event) => {
                        // Check if the eventId already exists in the map
                        if (aggregatedDataMap.has(event.eventId)) {
                            // If yes, push the current event data to the existing array
                            const existingData = aggregatedDataMap.get(event.eventId);
                            existingData.tags.push({
                                tagName: event.tagName,
                                tagAbbreviation: event.tagAbbreviation,
                            });
                        } else {
                            // If no, create a new array with the current event data
                            aggregatedDataMap.set(event.eventId, {
                                eventId: event.eventId,
                                eventName: event.eventName,
                                eventDescription: event.eventDescription,
                                eventDate: event.eventDate,
                                eventTime: event.eventTime,
                                eventVenue: event.eventVenue,
                                eventImageURL: event.eventImageURL,
                                eventPrice: event.eventPrice,
                                maxSeats: event.maxSeats,
                                seatsFilled: event.seatsFilled,
                                minTeamSize: event.minTeamSize,
                                maxTeamSize: event.maxTeamSize,
                                isWorkshop: event.isWorkshop,
                                isTechnical: event.isTechnical,
                                isGroup: event.isGroup,
                                needGroupData: event.needGroupData,
                                isPerHeadPrice: event.isPerHeadPrice,
                                isRefundable: event.isRefundable,
                                eventStatus: event.eventStatus,
                                registrationId: event.registrationId,
                                txnId: event.txnId,
                                departmentName: event.departmentName,
                                departmentAbbreviation: event.departmentAbbreviation,
                                isOwnRegistration: event.isOwnRegistration,
                                tags: [{
                                    tagName: event.tagName,
                                    tagAbbreviation: event.tagAbbreviation,
                                }],
                            });
                        }
                    });

                    // Convert the map values to an array
                    const result = Array.from(aggregatedDataMap.values());

                    //console.log(result);

                    res.status(200).json({
                        "MESSAGE": "Successfully Fetched Registered Events.",
                        "EVENTS": result
                    });
                    return;


                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getRegisteredEvents - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],

    /*
    {
        "registrationId": 1
    }
    */
    registeredEventData: [
        tokenValidator,
        async (req, res) => {
            if (!dataValidator.isValidStudentRequest) {
                console.log("testerror");
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                const transaction_db_connection = await anokha_transactions_db.promise().getConnection();
                try {
                    //console.log("test0");
                    await db_connection.query("LOCK TABLES eventRegistrationData READ, eventRegistrationGroupData READ, eventData READ, studentData READ");

                    const [event] = await db_connection.query("SELECT * FROM eventRegistrationData LEFT JOIN eventData ON eventRegistrationData.eventId = eventData.eventId WHERE registrationId = ?", [req.body.registrationId]);
                    //console.log("test0.1",event.length,event);
                    if (event.length == 0) {
                        //console.log("test1");
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Invalid Request!"
                        });
                        return;
                    }
                    if (event[0].eventStatus == "0") {
                        //console.log("test2");
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Event Cancelled from Anokha!"
                        });
                        return;
                    }
                    if (event[0].isGroup == "0" || event[0].needGroupData == "0") {
                        //console.log("test3");
                        const [registration] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE registrationId=? and studentId =? ", [req.body.registrationId, req.body.studentId]);
                        if (registration.length == 0) {
                            //console.log("test4");
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Invalid Request!"
                            });
                            return;
                        }
                        else {
                            //console.log("test5");
                            [student] = await db_connection.query("SELECT studentId, studentFullName, studentEmail, studentPhone, studentCollegeName, studentCollegeCity FROM studentData WHERE studentId=?", [req.body.studentId]);

                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();

                            let trasactionDetails;

                            if (registration[0].isMarketPlacePaymentMode == "1") {
                                //console.log("test6");
                                await transaction_db_connection.query("LOCK TABLES marketPlaceTransactionData READ");
                                [trasactionDetails] = await transaction_db_connection.query('SELECT * FROM marketPlaceTransactionData WHERE txnId=?', [registration[0].txnId]);
                                transaction_db_connection.query('UNLOCK TABLES');
                            }
                            else if (registration[0].isMarketPlacePaymentMode == "0") {
                                //console.log("test7");
                                await transaction_db_connection.query("LOCK TABLES transactionData READ");
                                [trasactionDetails] = await transaction_db_connection.query('SELECT * FROM transactionData WHERE txnId=?', [registration[0].txnId]);
                                transaction_db_connection.query('UNLOCK TABLES');
                            }

                            transaction_db_connection.release();

                            //console.log("test8",trasactionDetails);

                            res.status(200).json({
                                "MESSAGE": "Successfully Fetched Registered Event Data.",
                                "txnId": trasactionDetails[0].txnId,
                                "isMarketPlacePaymentMode": registration[0].isMarketPlacePaymentMode,
                                "transactionStatus": trasactionDetails[0].transactionStatus,
                                "transactionAmount": trasactionDetails[0].amount,
                                "transactionTime": trasactionDetails[0].createdAt,
                                "team": student
                            });
                            return;
                        }
                    }
                    else if (event[0].isGroup == "1" && event[0].needGroupData == "1") {
                        const [registration] = await db_connection.query(`
                        SELECT * FROM eventRegistrationGroupData
                        LEFT JOIN eventRegistrationData ON
                        eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId 
                        WHERE eventRegistrationGroupData.registrationId=? AND eventRegistrationGroupData.studentId =? `, [req.body.registrationId, req.body.studentId]);
                        //console.log("test3",registration);
                        if (registration.length == 0) {
                            //console.log("test4");
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Invalid Request!"
                            });
                            return;
                        }
                        else {
                            const [team] = await db_connection.query(`
                            SELECT eventRegistrationGroupData.studentId,
                            eventRegistrationGroupData.roleDescription,
                            eventRegistrationGroupData.isOwnRegistration,
                            studentData.studentFullName,
                            studentData.studentEmail,
                            studentData.studentPhone,
                            studentData.studentCollegeName,
                            studentData.studentCollegeCity
                            FROM eventRegistrationGroupData
                            LEFT JOIN studentData
                            ON eventRegistrationGroupData.studentId = studentData.studentId
                            WHERE eventRegistrationGroupData.registrationId=?`
                                , [req.body.registrationId]);

                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();

                            let trasactionDetails;

                            if (registration[0].isMarketPlacePaymentMode == "1") {
                                await transaction_db_connection.query("LOCK TABLES marketPlaceTransactionData READ");
                                [trasactionDetails] = await transaction_db_connection.query('SELECT * FROM marketPlaceTransactionData WHERE txnId=?', [registration[0].txnId]);
                                transaction_db_connection.query('UNLOCK TABLES');
                            }
                            else if (registration[0].isMarketPlacePaymentMode == "0") {
                                await transaction_db_connection.query("LOCK TABLES transactionData READ");
                                [trasactionDetails] = await transaction_db_connection.query('SELECT * FROM transactionData WHERE txnId=?', [registration[0].txnId]);
                                transaction_db_connection.query('UNLOCK TABLES');
                            }
                            transaction_db_connection.release();
                            res.status(200).json({
                                "MESSAGE": "Successfully Fetched Registered Event Data.",
                                "txnId": trasactionDetails[0].txnId,
                                "isMarketPlacePaymentMode": registration[0].isMarketPlacePaymentMode,
                                "transactionStatus": trasactionDetails[0].transactionStatus,
                                "transactionAmount": trasactionDetails[0].amount,
                                "transactionTime": trasactionDetails[0].createdAt,
                                "team": team
                            });
                            return;

                        }
                    }
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - registeredEventData - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    await transaction_db_connection.query("UNLOCK TABLES");
                    transaction_db_connection.release();
                }
            }
        }
    ],

    //to add only the tags that have isActive = '1' 
    getAllEventsJSVersion: [
        validateEventRequest,
        async (req, res) => {
            if (req.body.isLoggedIn == "1" && !await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }

            const db_connection = await anokha_db.promise().getConnection();

            try {
                if (req.body.isLoggedIn === "0") {
                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ");

                    const query = `SELECT
                        eventData.eventId,
                        eventData.eventName,
                        eventData.eventDescription,
                        eventData.eventDate,
                        eventData.eventTime,
                        eventData.eventVenue,
                        eventData.eventImageURL,
                        eventData.eventPrice,
                        eventData.maxSeats,
                        eventData.seatsFilled,
                        eventData.minTeamSize,
                        eventData.maxTeamSize,
                        eventData.isWorkshop,
                        eventData.isTechnical,
                        eventData.isGroup,
                        eventData.needGroupData,
                        eventData.isPerHeadPrice,
                        eventData.isRefundable,
                        eventData.eventStatus,
                        departmentData.departmentName,
                        departmentData.departmentAbbreviation,
                        tagData.tagName,
                        tagData.tagAbbreviation
                        FROM eventData 
                        LEFT JOIN departmentData 
                        ON eventData.eventDepartmentId = departmentData.departmentId
                        INNER JOIN eventTagData
                        ON eventTagData.eventId = eventData.eventId
                        LEFT JOIN tagData 
                        ON eventTagData.tagId = tagData.tagId
                        ;`;

                    const [rows] = await db_connection.query(query);

                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();

                    const aggregatedDataMap = new Map();

                    // Iterate through each event object
                    rows.forEach((event) => {
                        // Check if the eventId already exists in the map
                        if (aggregatedDataMap.has(event.eventId)) {
                            // If yes, push the current event data to the existing array
                            const existingData = aggregatedDataMap.get(event.eventId);
                            existingData.tags.push({
                                tagName: event.tagName,
                                tagAbbreviation: event.tagAbbreviation,
                            });
                        } else {
                            // If no, create a new array with the current event data
                            aggregatedDataMap.set(event.eventId, {
                                eventId: event.eventId,
                                eventName: event.eventName,
                                eventDescription: event.eventDescription,
                                eventDate: event.eventDate,
                                eventTime: event.eventTime,
                                eventVenue: event.eventVenue,
                                eventImageURL: event.eventImageURL,
                                eventPrice: event.eventPrice,
                                maxSeats: event.maxSeats,
                                seatsFilled: event.seatsFilled,
                                minTeamSize: event.minTeamSize,
                                maxTeamSize: event.maxTeamSize,
                                isWorkshop: event.isWorkshop,
                                isTechnical: event.isTechnical,
                                isGroup: event.isGroup,
                                needGroupData: event.needGroupData,
                                isPerHeadPrice: event.isPerHeadPrice,
                                isRefundable: event.isRefundable,
                                eventStatus: event.eventStatus,
                                departmentName: event.departmentName,
                                departmentAbbreviation: event.departmentAbbreviation,
                                tags: [{
                                    tagName: event.tagName,
                                    tagAbbreviation: event.tagAbbreviation,
                                }],
                            });
                        }
                    });

                    // Convert the map values to an array
                    const result = Array.from(aggregatedDataMap.values());

                    //console.log(result);
                    res.status(200).json({
                        "MESSAGE": "Successfully Fetched All Events.",
                        "MODE": "0",
                        "EVENTS": result
                    });
                    return;
                } else {

                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, eventRegistrationData READ, eventRegistrationGroupData READ, starredEvents READ");

                    const [registeredEventData] = await db_connection.query(`SELECT eventId, registrationId FROM eventRegistrationData WHERE studentId = ${req.body.studentId} AND registrationStatus = "2"`);

                    const [registeredByTeamEventData] = await db_connection.query(`SELECT eventId, registrationId FROM eventRegistrationGroupData WHERE studentId = ${req.body.studentId}`);

                    const [starredEventData] = await db_connection.query(`SELECT eventId FROM starredEvents WHERE studentId = ${req.body.studentId}`);

                    const registeredEventDataDict = {}, registeredByTeamEventDataDict = {}, starredEventDataDict = {}, registrationIdDict = {};

                    registeredEventData.forEach((event) => {
                        registeredEventDataDict[event.eventId] = 1;
                        registrationIdDict[event.eventId] = event.registrationId;
                    });

                    registeredByTeamEventData.forEach((event) => {
                        registeredByTeamEventDataDict[event.eventId] = 1;
                        registrationIdDict[event.eventId] = event.registrationId;
                    });

                    starredEventData.forEach((event) => {
                        starredEventDataDict[event.eventId] = 1;
                    });

                    const query = `SELECT
                        eventData.eventId,
                        eventData.eventName,
                        eventData.eventDescription,
                        eventData.eventDate,
                        eventData.eventTime,
                        eventData.eventVenue,
                        eventData.eventImageURL,
                        eventData.eventPrice,
                        eventData.maxSeats,
                        eventData.seatsFilled,
                        eventData.minTeamSize,
                        eventData.maxTeamSize,
                        eventData.isWorkshop,
                        eventData.isTechnical,
                        eventData.isGroup,
                        eventData.needGroupData,
                        eventData.isPerHeadPrice,
                        eventData.isRefundable,
                        eventData.eventStatus,
                        departmentData.departmentName,
                        departmentData.departmentAbbreviation,
                        tagData.tagName,
                        tagData.tagAbbreviation
                        FROM eventData 
                        LEFT JOIN departmentData 
                        ON eventData.eventDepartmentId = departmentData.departmentId
                        INNER JOIN eventTagData
                        ON eventTagData.eventId = eventData.eventId
                        LEFT JOIN tagData 
                        ON eventTagData.tagId = tagData.tagId
                        ;`;

                    const [rows] = await db_connection.query(query);

                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();

                    const aggregatedDataMap = new Map();

                    // Iterate through each event object
                    rows.forEach((event) => {
                        // Check if the eventId already exists in the map
                        if (aggregatedDataMap.has(event.eventId)) {
                            // If yes, push the current event data to the existing array
                            const existingData = aggregatedDataMap.get(event.eventId);
                            existingData.tags.push({
                                tagName: event.tagName,
                                tagAbbreviation: event.tagAbbreviation,
                            });
                        } else {
                            // If no, create a new array with the current event data
                            aggregatedDataMap.set(event.eventId, {
                                eventId: event.eventId,
                                eventName: event.eventName,
                                eventDescription: event.eventDescription,
                                eventDate: event.eventDate,
                                eventTime: event.eventTime,
                                eventVenue: event.eventVenue,
                                eventImageURL: event.eventImageURL,
                                eventPrice: event.eventPrice,
                                maxSeats: event.maxSeats,
                                seatsFilled: event.seatsFilled,
                                minTeamSize: event.minTeamSize,
                                maxTeamSize: event.maxTeamSize,
                                isWorkshop: event.isWorkshop,
                                isTechnical: event.isTechnical,
                                isGroup: event.isGroup,
                                needGroupData: event.needGroupData,
                                isPerHeadPrice: event.isPerHeadPrice,
                                isRefundable: event.isRefundable,
                                eventStatus: event.eventStatus,
                                departmentName: event.departmentName,
                                departmentAbbreviation: event.departmentAbbreviation,
                                tags: [{
                                    tagName: event.tagName,
                                    tagAbbreviation: event.tagAbbreviation,
                                }],
                            });
                        }
                    });

                    // Convert the map values to an array
                    const result = Array.from(aggregatedDataMap.values());

                    for (let i = 0; i < result.length; i++) {
                        if (registeredEventDataDict[result[i].eventId] == 1 && registeredByTeamEventDataDict[result[i].eventId] == 1) {
                            result[i].isOwnRegistration = "1";
                            result[i].registrationId = registrationIdDict[result[i].eventId];
                        }
                        if (registeredByTeamEventDataDict[result[i].eventId] == 1 && registeredEventDataDict[result[i].eventId] != 1) {
                            result[i].isOwnRegistration = "0";
                            result[i].registrationId = registrationIdDict[result[i].eventId];
                        }

                        if (starredEventDataDict[result[i].eventId] == 1) {
                            result[i].isStarred = "1";
                        }
                        if (starredEventDataDict[result[i].eventId] != 1) {
                            result[i].isStarred = "0";
                        }
                    }

                    res.status(200).json({
                        "MESSAGE": "Successfully Fetched All Events.",
                        "MODE": "1",
                        "EVENTS": result
                    });
                    return;

                }
            } catch (error) {
                console.log(error);
                const time = new Date();
                fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getAllEventsJSVersion - ${error}\n`);
                res.status(500).json({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            } finally {
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
            }
        }
    ],

    getAllEvents: [
        validateEventRequest,
        async (req, res) => {
            if (req.body.isLoggedIn == "1" && !await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    if (req.body.isLoggedIn == "0") {

                        try{
                            const events = await redisClient.get('allEvents');
                            if(events != null){
                                db_connection.release();
                                //await redisClient.disconnect()
                                res.status(200).json({
                                    "MESSAGE": "Successfully Fetched All Events.",
                                    "MODE": "0",
                                    "EVENTS": JSON.parse(events)
                                });
                                return;
                            }
                            else{
                                await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ");

                                const query = `SELECT
                                eventData.eventId,
                                eventData.eventName,
                                eventData.eventDescription,
                                eventData.eventDate,
                                eventData.eventTime,
                                eventData.eventVenue,
                                eventData.eventImageURL,
                                eventData.eventPrice,
                                eventData.maxSeats,
                                eventData.seatsFilled,
                                eventData.minTeamSize,
                                eventData.maxTeamSize,
                                eventData.isWorkshop,
                                eventData.isTechnical,
                                eventData.isGroup,
                                eventData.needGroupData,
                                eventData.isPerHeadPrice,
                                eventData.isRefundable,
                                eventData.eventStatus,
                                departmentData.departmentName,
                                departmentData.departmentAbbreviation,
                                tagData.tagName,
                                tagData.tagAbbreviation
                                FROM eventData 
                                LEFT JOIN departmentData
                                ON eventData.eventDepartmentId = departmentData.departmentId
                                LEFT JOIN eventTagData
                                ON eventTagData.eventId = eventData.eventId
                                LEFT JOIN tagData
                                ON eventTagData.tagId = tagData.tagId
                                WHERE tagData.isActive != "0" OR tagData.isActive IS NULL
                                ;`;


                                const [rows] = await db_connection.query(query);

                                //console.log(rows);

                                await db_connection.query("UNLOCK TABLES");
                                db_connection.release();

                                const aggregatedDataMap = new Map();

                                // Iterate through each event object
                                rows.forEach((event) => {
                                    // Check if the eventId already exists in the map
                                    if (aggregatedDataMap.has(event.eventId)) {
                                        // If yes, push the current event data to the existing array
                                        const existingData = aggregatedDataMap.get(event.eventId);
                                        existingData.tags.push({
                                            tagName: event.tagName,
                                            tagAbbreviation: event.tagAbbreviation,
                                        });
                                    } else {
                                        // If no, create a new array with the current event data
                                        aggregatedDataMap.set(event.eventId, {
                                            eventId: event.eventId,
                                            eventName: event.eventName,
                                            eventDescription: event.eventDescription,
                                            eventDate: event.eventDate,
                                            eventTime: event.eventTime,
                                            eventVenue: event.eventVenue,
                                            eventImageURL: event.eventImageURL,
                                            eventPrice: event.eventPrice,
                                            maxSeats: event.maxSeats,
                                            seatsFilled: event.seatsFilled,
                                            minTeamSize: event.minTeamSize,
                                            maxTeamSize: event.maxTeamSize,
                                            isWorkshop: event.isWorkshop,
                                            isTechnical: event.isTechnical,
                                            isGroup: event.isGroup,
                                            needGroupData: event.needGroupData,
                                            isPerHeadPrice: event.isPerHeadPrice,
                                            isRefundable: event.isRefundable,
                                            eventStatus: event.eventStatus,
                                            departmentName: event.departmentName,
                                            departmentAbbreviation: event.departmentAbbreviation,
                                            tags: [{
                                                tagName: event.tagName,
                                                tagAbbreviation: event.tagAbbreviation,
                                            }],
                                        });
                                    }
                                });

                                // Convert the map values to an array
                                const result = Array.from(aggregatedDataMap.values());

                                //console.log(result);
                                await redisClient.setex('allEvents',600, JSON.stringify(result));
                                //await redisClient.disconnect()

                                // MODE 0 - Not Logged In
                                res.status(200).json({
                                    "MESSAGE": "Successfully Fetched All Events.",
                                    "MODE": "0",
                                    "EVENTS": result
                                });
                                return;
                            }
                        }
                        catch(err){
                            console.log(err);
                            const time = new Date();
                            fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getAllEvents - ${err}\n`);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }
                        finally{
                            //await redisClient.disconnect()
                            await db_connection.query('UNLOCK TABLES');
                            db_connection.release()
                        }

                    }
                    else if (req.body.isLoggedIn == "1") {

                        const query = `
                        SELECT
                            eventData.eventId,
                            eventData.eventName,
                            eventData.eventDescription,
                            eventData.eventDate,
                            eventData.eventTime,
                            eventData.eventVenue,
                            eventData.eventImageURL,
                            eventData.eventPrice,
                            eventData.maxSeats,
                            eventData.seatsFilled,
                            eventData.minTeamSize,
                            eventData.maxTeamSize,
                            eventData.isWorkshop,
                            eventData.isTechnical,
                            eventData.isGroup,
                            eventData.needGroupData,
                            eventData.isPerHeadPrice,
                            eventData.isRefundable,
                            eventData.eventStatus,
                            departmentData.departmentName,
                            departmentData.departmentAbbreviation,
                            tagData.tagName,
                            tagData.tagAbbreviation,
                            CASE
                                WHEN eventRegistrationData.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isRegistered,
                            CASE
                                WHEN starredEvents.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isStarred
                        FROM
                            eventData
                            LEFT JOIN departmentData 
                            ON eventData.eventDepartmentId = departmentData.departmentId
                            LEFT JOIN eventTagData
                            ON eventTagData.eventId = eventData.eventId
                            LEFT JOIN tagData 
                            ON eventTagData.tagId = tagData.tagId
                            LEFT JOIN
                            eventRegistrationData ON eventData.eventId = eventRegistrationData.eventId
                            AND eventRegistrationData.studentId = ${req.body.studentId}
                        LEFT JOIN
                            starredEvents ON eventData.eventId = starredEvents.eventId
                            AND starredEvents.studentId = ${req.body.studentId}
                        WHERE
                            ( eventData.isGroup = "0" OR eventData.needGroupData = "0" )
                        AND
                            ( tagData.isActive != "0" OR tagData.isActive IS NULL )
                        ;`;

                        const query2 = `
                        SELECT
                            eventData.eventId,
                            eventData.eventName,
                            eventData.eventDescription,
                            eventData.eventDate,
                            eventData.eventTime,
                            eventData.eventVenue,
                            eventData.eventImageURL,
                            eventData.eventPrice,
                            eventData.maxSeats,
                            eventData.seatsFilled,
                            eventData.minTeamSize,
                            eventData.maxTeamSize,
                            eventData.isWorkshop,
                            eventData.isTechnical,
                            eventData.isGroup,
                            eventData.needGroupData,
                            eventData.isPerHeadPrice,
                            eventData.isRefundable,
                            eventData.eventStatus,
                            departmentData.departmentName,
                            departmentData.departmentAbbreviation,
                            tagData.tagName,
                            tagData.tagAbbreviation,
                            CASE
                                WHEN eventRegistrationGroupData.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isRegistered,
                            CASE
                                WHEN starredEvents.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isStarred
                        FROM
                            eventData
                            LEFT JOIN departmentData 
                            ON eventData.eventDepartmentId = departmentData.departmentId
                            LEFT JOIN eventTagData
                            ON eventTagData.eventId = eventData.eventId
                            LEFT JOIN tagData 
                            ON eventTagData.tagId = tagData.tagId
                        LEFT JOIN
                            eventRegistrationGroupData ON eventData.eventId = eventRegistrationGroupData.registrationId
                            AND eventRegistrationGroupData.studentId = ${req.body.studentId}
                        LEFT JOIN
                            starredEvents ON eventData.eventId = starredEvents.eventId
                            AND starredEvents.studentId = ${req.body.studentId}
                        WHERE
                            ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )
                        AND
                            ( tagData.isActive != "0" OR tagData.isActive IS NULL)
                        ;`;

                        await db_connection.query('LOCK TABLES eventData READ, eventRegistrationData READ, starredEvents READ, eventRegistrationGroupData READ, departmentData READ, tagData READ, eventTagData READ');


                        const [rows] = await db_connection.query(query);
                        const [rows2] = await db_connection.query(query2);

                        const concat_rows = [...new Set([...rows, ...rows2])];

                        await db_connection.query("UNLOCK TABLES");

                        //console.log("test");

                        const aggregatedDataMap = new Map();

                        // Iterate through each event object
                        concat_rows.forEach((event) => {
                            // Check if the eventId already exists in the map
                            if (aggregatedDataMap.has(event.eventId)) {
                                // If yes, push the current event data to the existing array
                                const existingData = aggregatedDataMap.get(event.eventId);
                                existingData.tags.push({
                                    tagName: event.tagName,
                                    tagAbbreviation: event.tagAbbreviation,
                                });
                            } else {
                                // If no, create a new array with the current event data
                                aggregatedDataMap.set(event.eventId, {
                                    eventId: event.eventId,
                                    eventName: event.eventName,
                                    eventDescription: event.eventDescription,
                                    eventDate: event.eventDate,
                                    eventTime: event.eventTime,
                                    eventVenue: event.eventVenue,
                                    eventImageURL: event.eventImageURL,
                                    eventPrice: event.eventPrice,
                                    maxSeats: event.maxSeats,
                                    seatsFilled: event.seatsFilled,
                                    minTeamSize: event.minTeamSize,
                                    maxTeamSize: event.maxTeamSize,
                                    isWorkshop: event.isWorkshop,
                                    isTechnical: event.isTechnical,
                                    isGroup: event.isGroup,
                                    needGroupData: event.needGroupData,
                                    isPerHeadPrice: event.isPerHeadPrice,
                                    isRefundable: event.isRefundable,
                                    eventStatus: event.eventStatus,
                                    departmentName: event.departmentName,
                                    departmentAbbreviation: event.departmentAbbreviation,
                                    isRegistered: event.isRegistered,
                                    isStarred: event.isStarred,
                                    tags: [{
                                        tagName: event.tagName,
                                        tagAbbreviation: event.tagAbbreviation,
                                    }],
                                });
                            }
                        });

                        // Convert the map values to an array
                        const result = Array.from(aggregatedDataMap.values());

                        //console.log(result);

                        // MODE 1 - Logged In
                        res.status(200).json({
                            "MESSAGE": "Successfully Fetched All Events.",
                            "MODE": "1",
                            "EVENTS": result
                        });
                        return;
                    }
                    else {
                        res.status(401).json({
                            "MESSAGE": "Unauthorized access. Warning."
                        });
                        return;
                    }
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getAllEvents - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],

    getEventData: [
        validateEventRequest,
        async (req, res) => {

            req.params.eventId = parseInt(req.params.eventId);
            //console.log(req.body.isLoggedIn, req.body.studentId);

            if (req.body.isLoggedIn == "0" || !dataValidator.isValidStudentRequest(req.body.studentId)) {
                //console.log("testerror");
                const db_connection = await anokha_db.promise().getConnection();
                try {

                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, starredEvents READ, eventRegistrationData READ");

                    let [event] = await db_connection.query(`
                    SELECT * FROM eventData 
                    LEFT JOIN departmentData
                    ON eventData.eventDepartmentId = departmentData.departmentId
                    WHERE eventId=?`, [req.params.eventId]);
                    if (event.length == 0 || event[0].eventStatus == "0") {
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Invalid Request!"
                        });
                        return;
                    }
                    else {
                        event = event[0];
                        const [tags] = await db_connection.query(`SELECT tagName, tagAbbreviation FROM eventTagData LEFT JOIN tagData ON eventTagData.tagId = tagData.tagId WHERE eventId=?`, [req.params.eventId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        //MODE: 0 - Not Logged In, 1 - Logged In
                        res.status(200).json({
                            "MESSAGE": "Successfully Fetched Event Data.",
                            "MODE": "0",
                            "eventId": event.eventId,
                            "eventName": event.eventName,
                            "eventDescription": event.eventDescription,
                            "eventMarkdownDescription": event.eventMarkdownDescription,
                            "eventDate": event.eventDate,
                            "eventTime": event.eventTime,
                            "eventVenue": event.eventVenue,
                            "eventImageURL": event.eventImageURL,
                            "eventPrice": event.eventPrice,
                            "maxSeats": event.maxSeats,
                            "seatsFilled": event.seatsFilled,
                            "minTeamSize": event.minTeamSize,
                            "maxTeamSize": event.maxTeamSize,
                            "isWorkshop": event.isWorkshop,
                            "isTechnical": event.isTechnical,
                            "isGroup": event.isGroup,
                            "needGroupData": event.needGroupData,
                            "isPerHeadPrice": event.isPerHeadPrice,
                            "isRefundable": event.isRefundable,
                            "eventStatus": event.eventStatus,
                            "departmentName": event.departmentName,
                            "departmentAbbreviation": event.departmentAbbreviation,
                            "tags": tags
                        });
                        return;
                    }
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getEventData - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
            else if (req.body.isLoggedIn == "1" && dataValidator.isValidStudentRequest(req.body.studentId)) {
                const db_connection = await anokha_db.promise().getConnection();
                try {

                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, starredEvents READ, eventRegistrationData READ, eventRegistrationGroupData READ");

                    let [event] = await db_connection.query(`
                    SELECT * FROM eventData 
                    LEFT JOIN departmentData
                    ON eventData.eventDepartmentId = departmentData.departmentId
                    WHERE eventId=?`, [req.params.eventId]);
                    if (event.length == 0 || event[0].eventStatus == "0") {
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Invalid Request!"
                        });
                        return;
                    }
                    else {
                        event = event[0];
                        const [tags] = await db_connection.query(`SELECT tagName, tagAbbreviation FROM eventTagData LEFT JOIN tagData ON eventTagData.tagId = tagData.tagId WHERE eventId=?`, [req.params.eventId]);
                        const [starred] = await db_connection.query("SELECT * FROM starredEvents WHERE studentId=? AND eventId=?", [req.body.studentId, req.params.eventId]);
                        let registration;
                        if (event.isGroup == "0" || event.needGroupData == "0") {
                            [registration] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE studentId=? AND eventId=?", [req.body.studentId, req.params.eventId]);
                        }
                        else if (event.isGroup == "1" && event.needGroupData == "1") {
                            [registration] = await db_connection.query("SELECT * FROM eventRegistrationGroupData WHERE studentId=? AND eventId=?", [req.body.studentId, req.params.eventId]);
                        }
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        //MODE: 0 - Not Logged In, 1 - Logged In
                        res.status(200).json({
                            "MESSAGE": "Successfully Fetched Event Data.",
                            "MODE": "1",
                            "eventId": event.eventId,
                            "eventName": event.eventName,
                            "eventDescription": event.eventDescription,
                            "eventMarkdownDescription": event.eventMarkdownDescription,
                            "eventDate": event.eventDate,
                            "eventTime": event.eventTime,
                            "eventVenue": event.eventVenue,
                            "eventImageURL": event.eventImageURL,
                            "eventPrice": event.eventPrice,
                            "maxSeats": event.maxSeats,
                            "seatsFilled": event.seatsFilled,
                            "minTeamSize": event.minTeamSize,
                            "maxTeamSize": event.maxTeamSize,
                            "isWorkshop": event.isWorkshop,
                            "isTechnical": event.isTechnical,
                            "isGroup": event.isGroup,
                            "needGroupData": event.needGroupData,
                            "isPerHeadPrice": event.isPerHeadPrice,
                            "isRefundable": event.isRefundable,
                            "eventStatus": event.eventStatus,
                            "departmentName": event.departmentName,
                            "departmentAbbreviation": event.departmentAbbreviation,
                            "tags": tags,
                            "isStarred": starred.length > 0 ? "1" : "0",
                            "isRegistered": registration.length > 0 ? "1" : "0",
                            "registrationId": registration.length > 0 ? registration[0].registrationId : null,
                        });
                        return;
                    }
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getEventData - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],

    /*
    {
        "eventId": "integer",
        "totalMembers": "integer",
        "isMarketPlacePaymentMode": "<0/1>",
        "teamMembers": [], // list of email strings. Send only when team data is necessary, (ONLY FOR isGroup = '1' and needGroupData = '1')
        "memberRoles": [], // list of role strings (CAN BE ANYTHING). Send only when team data is necessary, (ONLY FOR isGroup = '1' and needGroupData = '1')
        "teamName": "", // Send only team data is necessary, (ONLY FOR isGroup = '1' and needGroupData = '1')

    }
    */
    registerForEventStepOne: [
        tokenValidator,
        async (req, res) => {
            // Validate Student Login
            if (!await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }

            // VALIDATE PARAMETER DATA TYPES AND FORMAT

            if (!dataValidator.isValidEventRegistration(req)) {
                res.status(400).json({
                    "MESSAGE": "Invalid Registration Details!"
                });
                return;
            }

            const db_connection = await anokha_db.promise().getConnection();
            const transaction_db_connection = await anokha_transactions_db.promise().getConnection();

            try {

                await transaction_db_connection.query("LOCK TABLES transactionData READ");

                // check for any pending payments
                const [tT2] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE userId = ? AND transactionStatus = '0'", [req.body.studentId]);

                if (tT2.length > 0) {
                    res.status(400).json({
                        "MESSAGE": "You have made an attempt to register for an event that is still in pending state. Go to your profile -> Transactions and then click on verify now to proceed!"
                    });
                    return;
                }

                await transaction_db_connection.query("UNLOCK TABLES");



                await db_connection.query("LOCK TABLES eventData READ, eventRegistrationData READ, eventRegistrationGroupData READ, studentData READ");

                const [studentData] = await db_connection.query("SELECT * FROM studentData WHERE studentId = ?", [req.body.studentId]);

                // does the event exist
                const [eventData] = await db_connection.query("SELECT * from eventData WHERE eventId = ?", [req.body.eventId]);

                if (!(eventData.length > 0)) {
                    res.status(400).json({
                        "MESSAGE": "Event not found!"
                    });
                    return;
                }

                // DATE EXECEEDED LOGIC PENDING

                if (!(eventData[0].eventStatus === "1")) {
                    res.status(400).json({
                        "MESSAGE": "Registrations closed for this event!"
                    });
                    return;
                }

                if (!(req.body.totalMembers >= eventData[0].minTeamSize && req.body.totalMembers <= eventData[0].maxTeamSize)) {
                    res.status(400).json({
                        "MESSAGE": "Invalid Team Size!"
                    });
                    return;
                }

                if (!(eventData[0].maxSeats - eventData[0].seatsFilled >= req.body.totalMembers)) {
                    res.status(400).json({
                        "MESSAGE": "Registrations closed! Seats are full!"
                    });
                    return;
                }

                // Event Registration Check
                const [regData] = await db_connection.query('SELECT * FROM eventRegistrationData WHERE studentId = ? AND eventId = ?', [req.body.studentId, req.body.eventId]);
                const [eventRegGroupData] = await db_connection.query('SELECT * FROM eventRegistrationGroupData WHERE studentId = ? AND eventId = ?', [req.body.studentId, req.body.eventId]);


                if (regData.length > 0) {
                    res.status(400).json({
                        "MESSAGE": "You have already registered for the event or the registration is pending! Complete it before moving forward for another attempt!"
                    });
                    return;
                }

                if (eventRegGroupData.length > 0) {
                    res.status(400).json({
                        "MESSAGE": "You are already in a group for the same event or the registration is pending! Complete it before moving forward for another attempt!!"
                    });
                    return;
                }

                if (studentData[0].studentAccountStatus !== "2") {
                    res.status(400).json({
                        "MESSAGE": "Failed to register. You need to buy a passport to register for events!"
                    });
                    return;
                }

                await db_connection.query("UNLOCK TABLES");

                if (req.body.isMarketPlacePaymentMode === "0") {
                    // payU

                    const txnId = `TXN-${req.body.studentId.toString()}-${req.body.eventId.toString()}-${new Date().getTime()}`;
                    let amount = 0;
                    let productinfo = "";
                    let firstname = studentData[0].studentFullName;
                    let email = studentData[0].studentEmail;
                    let phone = studentData[0].studentPhone;


                    // INDIVIDUAL REGISTRATION
                    if (eventData[0].isGroup === "0") {
                        // Adding GST
                        amount = eventData[0].eventPrice + Math.ceil(eventData[0].eventPrice * 0.18);
                        productinfo = `EIP-${req.body.studentId}-${req.body.eventId}-${req.body.totalMembers}-${amount}`;

                        // Inserting into transactionData as PENDING

                        await transaction_db_connection.query("LOCK TABLES transactionData WRITE");

                        const [tDataTest] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE txnId = ?", [txnId]);

                        if (tDataTest.length > 0) {
                            res.status(400).json({
                                "MESSAGE": "Duplicate Transaction Attempt!"
                            });
                            return;
                        }

                        const [insertTransactionData] = await transaction_db_connection.query("INSERT INTO transactionData (txnId, userId, amount, productinfo, firstname, email, phone, transactionStatus)  VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);

                        if (insertTransactionData.affectedRows !== 1) {
                            console.log("Failed to INSERT transactionData.");
                            console.log([txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        await transaction_db_connection.query("UNLOCK TABLES");

                        // INSERTING INTO eventRegistrationData as PENDING: LOCKING THE SEATS

                        await db_connection.query("LOCK TABLES eventRegistrationData WRITE, eventData WRITE");

                        const [insertEventRegistrationData] = await db_connection.query("INSERT INTO eventRegistrationData (eventId, studentId, isMarketPlacePaymentMode, txnId, totalMembers, totalAmountPaid, teamName, registrationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);

                        if (insertEventRegistrationData.affectedRows !== 1) {
                            console.log("Failed to INSERT insertEventRegistrationData.");
                            console.log([req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        const [eventDataUpdate] = await db_connection.query("UPDATE eventData SET seatsFilled = ? WHERE eventId = ?", [eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);

                        if (eventDataUpdate.affectedRows !== 1) {
                            console.log("Failed to UPDATE eventData.");
                            console.log([eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        await db_connection.query("UNLOCK TABLES");

                        const hash = generateHash({
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email
                        });

                        // DONE. Move to Transaction from frontend.

                        res.status(200).send({
                            "MESSAGE": "Proceed to pay. Seats Locked for 5 mins.",
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email,
                            "phone": phone,
                            "surl": `${appConfig.surlPrefix}/${txnId}`,
                            "furl": `${appConfig.furlPrefix}/${txnId}`,
                            "hash": hash
                        });
                        return;



                    } else if (eventData[0].isGroup === "1" && eventData[0].needGroupData === "0") {

                        if (eventData[0].isPerHeadPrice === "1") {
                            amount = (eventData[0].eventPrice * eventData[0].totalMembers) + Math.ceil((eventData[0].eventPrice * eventData[0].totalMembers) * 0.18);
                        } else if (eventData[0].isPerHeadPrice === "0") {
                            amount = eventData[0].eventPrice + Math.ceil(eventData[0].eventPrice * 0.18);
                        }
                        productinfo = `EGPI-${req.body.studentId}-${req.body.eventId}-${req.body.totalMembers}-${amount}`;

                        // Inserting into transactionData as PENDING

                        await transaction_db_connection.query("LOCK TABLES transactionData WRITE");

                        const [tDataTest] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE txnId = ?", [txnId]);

                        if (tDataTest.length > 0) {
                            res.status(400).json({
                                "MESSAGE": "Duplicate Transaction Attempt!"
                            });
                            return;
                        }

                        const [insertTransactionData] = await transaction_db_connection.query("INSERT INTO transactionData (txnId, userId, amount, productinfo, firstname, email, phone, transactionStatus)  VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);

                        if (insertTransactionData.affectedRows !== 1) {
                            console.log("Failed to INSERT transactionData.");
                            console.log([txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        await transaction_db_connection.query("UNLOCK TABLES");

                        // INSERTING INTO eventRegistrationData as PENDING: LOCKING THE SEATS

                        await db_connection.query("LOCK TABLES eventRegistrationData WRITE, eventData WRITE");

                        const [insertEventRegistrationData] = await db_connection.query("INSERT INTO eventRegistrationData (eventId, studentId, isMarketPlacePaymentMode, txnId, totalMembers, totalAmountPaid, teamName, registrationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);

                        if (insertEventRegistrationData.affectedRows !== 1) {
                            console.log("Failed to INSERT insertEventRegistrationData.");
                            console.log([req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        const [eventDataUpdate] = await db_connection.query("UPDATE eventData SET seatsFilled = ? WHERE eventId = ?", [eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);

                        if (eventDataUpdate.affectedRows !== 1) {
                            console.log("Failed to UPDATE eventData.");
                            console.log([eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        await db_connection.query("UNLOCK TABLES");

                        const hash = generateHash({
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email
                        });

                        // DONE. Move to Transaction from frontend.

                        res.status(200).send({
                            "MESSAGE": "Proceed to pay. Seats Locked for 5 mins.",
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email,
                            "phone": phone,
                            "surl": `${appConfig.surlPrefix}/${txnId}`,
                            "furl": `${appConfig.furlPrefix}/${txnId}`,
                            "hash": hash
                        });
                        return;


                    } else if (eventData[0].isGroup === "1" && eventData[0].needGroupData === "1") {

                        // teamMembers, memberRoles, teamName

                        if (eventData[0].isPerHeadPrice === "1") {
                            amount = (eventData[0].eventPrice * eventData[0].totalMembers) + Math.ceil((eventData[0].eventPrice * eventData[0].totalMembers) * 0.18);
                        } else if (eventData[0].isPerHeadPrice === "0") {
                            amount = eventData[0].eventPrice + Math.ceil(eventData[0].eventPrice * 0.18);
                        }
                        productinfo = `EGPT-${req.body.studentId}-${req.body.eventId}-${req.body.totalMembers}-${amount}`;

                        if (!(typeof (req.body.teamName) === "string" && req.body.teamName.length > 0 && req.body.teamName.length < 255)) {
                            res.status(400).json({
                                "MESSAGE": "Failed to Register. Invalid Team Name"
                            });
                            return;
                        }

                        if (!(typeof (req.body.teamMembers) === "object" && req.body.teamMembers.length === req.body.totalMembers - 1 && Array.isArray(req.body.teamMembers))) {
                            res.status(400).json({
                                "MESSAGE": "Failed to Register. Team Data invalid."
                            });
                            return;
                        }

                        if (!(typeof (req.body.memberRoles) === "object" && req.body.memberRoles.length === req.body.teamMembers.length && Array.isArray(req.body.memberRoles))) {
                            res.status(400).json({
                                "MESSAGE": "Failed to Register. Role Data invalid."
                            });
                            return;
                        }

                        let seenStudents = {};
                        seenStudents[studentData[0].studentEmail] = true;

                        for (let i = 0; i < req.body.teamMembers.length; i++) {
                            if (!(typeof (req.body.teamMembers[i]) === "string" && req.body.teamMembers[i].length > 0 && req.body.teamMembers[i].length < 255)) {
                                res.status(400).json({
                                    "MESSAGE": "Failed to Register. Team Data invalid email."
                                });
                                return;
                            }

                            if (validator.isEmail(req.body.teamMembers[i]) === false) {
                                res.status(400).json({
                                    "MESSAGE": "Failed to Register. Team Data invalid email."
                                });
                                return;
                            }

                            if (!(typeof (req.body.memberRoles[i]) === "string" && req.body.memberRoles[i].length > 0 && req.body.memberRoles[i].length < 255)) {
                                res.status(400).json({
                                    "MESSAGE": "Failed to Register. Team Data invalid role."
                                });
                                return;
                            }

                            if (seenStudents[req.body.teamMembers[i]] === true) {
                                res.status(400).json({
                                    "MESSAGE": "Duplicate team members!"
                                });
                                return; 
                            }

                            seenStudents[req.body.teamMembers[i]] = true;
                        }

                        // check if team members are not already registered for the same event and does have a passport.

                        await db_connection.query("LOCK TABLES studentData READ, eventRegistrationData READ, eventRegistrationGroupData READ");

                        const [studentDataCheck] = await db_connection.query("SELECT * FROM studentData WHERE studentAccountStatus = '2' AND studentEmail IN (?)", [req.body.teamMembers]);

                        if (studentDataCheck.length !== req.body.teamMembers.length) {
                            res.status(400).json({
                                "MESSAGE": "Failed to Register. One of your teammates do not have a passport yet or you gave a wrong email!"
                            });
                            return;
                        }

                        let studentIds = [];
                        for (let i = 0; i < studentDataCheck.length; i++) {
                            studentIds.push(studentDataCheck[i].studentId);
                        }

                        const [eventRegistrationCheck] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE eventId = ? AND studentId IN (?)", [req.body.eventId, studentIds]);

                        if (eventRegistrationCheck.length > 0) {
                            res.status(400).json({
                                "MESSAGE": "Failed to Register. One of your teammates have already registered for the same event."
                            });
                            return;
                        }

                        const [eventRegistrationGroupCheck] = await db_connection.query("SELECT * FROM eventRegistrationGroupData WHERE eventId = ? AND studentId IN (?)", [req.body.eventId, studentIds]);

                        if (eventRegistrationGroupCheck.length > 0) {
                            res.status(400).json({
                                "MESSAGE": "Failed to Register. One of your teammates is already part of another team!"
                            });
                            return;
                        }

                        await db_connection.query("UNLOCK TABLES");

                        // Team Members Verified.

                        // Inserting into transactionData as PENDING

                        await transaction_db_connection.query("LOCK TABLES transactionData WRITE");

                        const [tDataTest] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE txnId = ?", [txnId]);

                        if (tDataTest.length > 0) {
                            res.status(400).json({
                                "MESSAGE": "Duplicate Transaction Attempt!"
                            });
                            return;
                        }

                        const [insertTransactionData] = await transaction_db_connection.query("INSERT INTO transactionData (txnId, userId, amount, productinfo, firstname, email, phone, transactionStatus)  VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);

                        if (insertTransactionData.affectedRows !== 1) {
                            console.log("Failed to INSERT transactionData.");
                            console.log([txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        await transaction_db_connection.query("UNLOCK TABLES");


                        // INSERTING INTO eventRegistrationData as PENDING: LOCKING THE SEATS

                        await db_connection.query("LOCK TABLES eventRegistrationData WRITE, eventData WRITE, eventRegistrationGroupData WRITE");

                        const [insertEventRegistrationData] = await db_connection.query("INSERT INTO eventRegistrationData (eventId, studentId, isMarketPlacePaymentMode, txnId, totalMembers, totalAmountPaid, teamName, registrationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, req.body.teamName, "1"]);

                        if (insertEventRegistrationData.affectedRows !== 1) {
                            console.log("Failed to INSERT insertEventRegistrationData.");
                            console.log([req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        // INSERTING INTO eventRegistrationGroupData.
                        const [insertGroupData] = await db_connection.query("INSERT INTO eventRegistrationGroupData (registrationId, txnId, studentId, eventId, roleDescription, isOwnRegistration) VALUES (?, ?, ?, ?, ?, ?)", [insertEventRegistrationData.insertId, txnId, req.body.studentId, req.body.eventId, "TEAM LEAD", "1"]);

                        if (insertGroupData.affectedRows !== 1) {
                            console.log("Failed to INSERT insertGroupData.");
                            console.log([insertEventRegistrationData.insertId, txnId, req.body.studentId, req.body.eventId, "TEAM LEAD", "1"]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        for (let i = 0; i < req.body.teamMembers.length; i++) {
                            const [insertTeamData] = await db_connection.query("INSERT INTO eventRegistrationGroupData (registrationId, txnId, studentId, eventId, roleDescription, isOwnRegistration) VALUES (?, ?, ?, ?, ?, ?)", [insertEventRegistrationData.insertId, txnId, studentIds[i], req.body.eventId, req.body.memberRoles[i], "0"]);

                            if (insertTeamData.affectedRows !== 1) {
                                console.log("Failed to INSERT insertTeamData.");
                                console.log([insertEventRegistrationData.insertId, txnId, studentIds[i], req.body.eventId, req.body.memberRoles[i], "0"]);
                                res.status(500).json({
                                    "MESSAGE": "Internal Server Error. Contact Web Team"
                                });
                                return;
                            }
                        }

                        // Update eventData seatsFilled. Lock for 5 mins.

                        const [eventDataUpdate] = await db_connection.query("UPDATE eventData SET seatsFilled = ? WHERE eventId = ?", [eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);

                        if (eventDataUpdate.affectedRows !== 1) {
                            console.log("Failed to UPDATE eventData.");
                            console.log([eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);
                            res.status(500).json({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                            return;
                        }

                        await db_connection.query("UNLOCK TABLES");

                        const hash = generateHash({
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email
                        });

                        // DONE. Move to Transaction from frontend.

                        res.status(200).send({
                            "MESSAGE": "Proceed to pay. Seats Locked for 5 mins.",
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email,
                            "phone": phone,
                            "surl": `${appConfig.surlPrefix}/${txnId}`,
                            "furl": `${appConfig.furlPrefix}/${txnId}`,
                            "hash": hash
                        });
                        return;
                    }
                } else {
                    res.status(400).send({
                        "MESSAGE": "MarketPlace Payment mode coming soon. Kindly use PayU till then!",
                    });
                    return;
                }

                // GROUP REGISTRATION DONE. 
                // MARKETPLACE IMPLEMENTATION PENDING;


            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidEventRegistration - ${err}\n`);
                await db_connection.query("UNLOCK TABLES");
                await transaction_db_connection.query("UNLOCK TABLES");
                db_connection.release();
                transaction_db_connection.release();
                res.status(500).json({
                    "MESSAGE": "Internal Server Error. Contact Web Team"
                });
                return;

            } finally {
                await db_connection.query("UNLOCK TABLES");
                await transaction_db_connection.query("UNLOCK TABLES");
                db_connection.release();
                transaction_db_connection.release();
            }


        }
    ],
}