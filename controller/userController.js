const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const otpTokenGenerator = require('../middleware/auth/otp/tokenGenerator');
const generateOTP = require("../middleware/auth/otp/otpGenerator");
const mailer = require('../middleware/mailer/mailer');
const appConfig = require('../config/appConfig');
const [tokenValidator,validateEventRequest] = require('../middleware/auth/login/tokenValidator');

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
            if(!await dataValidator.isValidStudentRequest(req.body.studentId)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    await db_connection.query("LOCK TABLES studentData READ, departmentData READ");
                    const query = `SELECT * FROM studentData WHERE studentId=?`;
                    const [student] = await db_connection.query(query,[req.body.studentId]);
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
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - studentProfile - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                    return;
                }
                finally{
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
            if(!await dataValidator.isValidStudentRequest(req.body.studentId)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!dataValidator.isValidEditStudentProfile(req.body)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    await db_connection.query("LOCK TABLES studentData WRITE");
                    const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentPhone =? AND studentId != ?",[req.body.studentPhone, req.body.studentId]); 
                    if(check.length>0){
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Phone Number Associated with Another Account!"
                        });
                        return;
                    }
                    const query = `UPDATE studentData SET studentFullName=?, studentPhone=?, studentCollegeName=?, studentCollegeCity=? WHERE studentId=?`;
                    await db_connection.query(query,[req.body.studentFullName,req.body.studentPhone,req.body.studentCollegeName,req.body.studentCollegeCity,req.body.studentId]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Edited Student Profile."
                    });
                    return;
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - editStudentProfile - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                    return;
                }
                finally{
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
            if(!await dataValidator.isValidStudentRequest(req.body.studentId)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!await dataValidator.isValidToggleStarredEventRequest(req)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    await db_connection.query("LOCK TABLES starredEvents WRITE");
                    if(req.body.isStarred=="1"){
                        [check] = await db_connection.query("SELECT * FROM starredEvents WHERE studentId=? AND eventId=?",[req.body.studentId,req.body.eventId]);
                        if(check.length>0){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": "Successfully Starred Event!"
                            });
                            return;
                        }
                        const query = `INSERT INTO starredEvents (studentId, eventId) VALUES (?, ?);`;
                        await db_connection.query(query,[req.body.studentId,req.body.eventId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Starred Event!"
                        });
                        return;
                    }
                    else if(req.body.isStarred=="0"){
                        const query = `DELETE FROM starredEvents WHERE studentId=? AND eventId=?;`;
                        await db_connection.query(query,[req.body.studentId,req.body.eventId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Unstarred Event!"
                        });
                        return;
                    }
                    else{
                        res.status(400).json({
                            "MESSAGE": "Invalid Request!"
                        });
                        return;
                    }
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - toggleStarredEvent - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally{
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            
            }
        }
    ],

    getStarredEvents:[
        tokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, starredEvents READ, eventRegistrationData READ, eventRegistrationGroupData READ");
                    
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
                    CASE
                        WHEN eventRegistrationData.studentId = ${req.body.studentId} THEN "1"
                        ELSE "0"
                    END AS isUserRegistered,
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
                    INNER JOIN starredEvents
                    ON starredEvents.eventId = eventData.eventId
                    LEFT JOIN eventRegistrationData
                    ON eventRegistrationData.eventId = eventData.eventId
                    WHERE starredEvents.studentId = ${req.body.studentId}
                    AND ( eventData.isGroup = "0" OR eventData.needGroupData = "0" )
                    ;`
                    
                    const query2 =`
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
                    CASE
                        WHEN eventRegistrationGroupData.studentId = ${req.body.studentId} THEN "1"
                        ELSE "0"
                    END AS isUserRegistered,
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
                    INNER JOIN starredEvents
                    ON starredEvents.eventId = eventData.eventId
                    LEFT JOIN eventRegistrationGroupData
                    ON eventRegistrationGroupData.eventId = eventData.eventId
                    WHERE starredEvents.studentId = ${req.body.studentId}
                    AND ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )
                    ;`;

                    const [rows] = await db_connection.query(query);
                    const [rows2] = await db_connection.query(query2);

                    const concat_rows = [...new Set([...rows, ...rows2])];

                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    
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
                        "MESSAGE": "Successfully Fetched Starred Events.",
                        "EVENTS": result
                    });
                    return;
                }
                catch(err){
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
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{

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
                catch(err){
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
            if (!dataValidator.isValidStudentRequest)
            {
                console.log("testerror");
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                const transaction_db_connection = await anokha_transactions_db.promise().getConnection();
                try{
                    //console.log("test0");
                    await db_connection.query("LOCK TABLES eventRegistrationData READ, eventRegistrationGroupData READ, eventData READ, studentData READ");
                    
                    const [event] = await db_connection.query("SELECT * FROM eventRegistrationData LEFT JOIN eventData ON eventRegistrationData.eventId = eventData.eventId WHERE registrationId = ?",[req.body.registrationId]);
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
                    if (event[0].eventStatus == "0"){
                        //console.log("test2");
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Event Cancelled from Anokha!"
                        });
                        return;
                    }
                    if(event[0].isGroup == "0" || event[0].needGroupData == "0"){
                        //console.log("test3");
                        const [registration] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE registrationId=? and studentId =? ",[req.body.registrationId,req.body.studentId]);
                        if (registration.length == 0) {
                            //console.log("test4");
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Invalid Request!"
                            });
                            return;
                        }
                        else{
                            //console.log("test5");
                            [student] = await db_connection.query("SELECT studentId, studentFullName, studentEmail, studentPhone, studentCollegeName, studentCollegeCity FROM studentData WHERE studentId=?",[req.body.studentId]);

                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            
                            let trasactionDetails;

                            if(registration[0].isMarketPlacePaymentMode == "1")
                            {
                                //console.log("test6");
                                await transaction_db_connection.query("LOCK TABLES marketPlaceTransactionData READ");
                                [trasactionDetails] = await transaction_db_connection.query('SELECT * FROM marketPlaceTransactionData WHERE txnId=?',[registration[0].txnId]);
                                transaction_db_connection.query('UNLOCK TABLES');
                            }
                            else if (registration[0].isMarketPlacePaymentMode == "0")
                            {
                                //console.log("test7");
                                await transaction_db_connection.query("LOCK TABLES transactionData READ");
                                [trasactionDetails] = await transaction_db_connection.query('SELECT * FROM transactionData WHERE txnId=?',[registration[0].txnId]);
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
                                "team":student
                            });
                            return;
                        }
                    }
                    else if (event[0].isGroup == "1" && event[0].needGroupData == "1"){
                        const [registration] = await db_connection.query(`
                        SELECT * FROM eventRegistrationGroupData
                        LEFT JOIN eventRegistrationData ON
                        eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId 
                        WHERE eventRegistrationGroupData.registrationId=? AND eventRegistrationGroupData.studentId =? `,[req.body.registrationId,req.body.studentId]);
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
                        else{
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
                            ,[req.body.registrationId]);
                            
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();

                            let trasactionDetails;

                            if(registration[0].isMarketPlacePaymentMode == "1")
                            {
                                await transaction_db_connection.query("LOCK TABLES marketPlaceTransactionData READ");
                                [trasactionDetails] = await transaction_db_connection.query('SELECT * FROM marketPlaceTransactionData WHERE txnId=?',[registration[0].txnId]);
                                transaction_db_connection.query('UNLOCK TABLES');
                            }
                            else if (registration[0].isMarketPlacePaymentMode == "0")
                            {
                                await transaction_db_connection.query("LOCK TABLES transactionData READ");
                                [trasactionDetails] = await transaction_db_connection.query('SELECT * FROM transactionData WHERE txnId=?',[registration[0].txnId]);
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
                catch(err){
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

    getAllEvents: [
        validateEventRequest,
        async (req, res) => {
            if (req.body.isLoggedIn == "1" && !await dataValidator.isValidStudentRequest(req.body.studentId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    if (req.body.isLoggedIn == "0") {
                        
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
                            "EVENTS": result
                        });
                        return;
                    }
                    else if (req.body.isLoggedIn == "1"){
                        
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
                            END AS isUserRegistered,
                            CASE
                                WHEN starredEvents.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isStarred
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
                            END AS isUserRegistered,
                            CASE
                                WHEN starredEvents.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isStarred
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
                            ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )`;

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
                            isUserRegistered: event.isUserRegistered,
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

                        res.status(200).json({
                            "MESSAGE": "Successfully Fetched All Events.",
                            "EVENTS": result
                        });
                        return;
                    }
                    else{
                        res.status(401).json({
                            "MESSAGE": "Unauthorized access. Warning."
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

            if(req.body.isLoggedIn=="0" || !dataValidator.isValidStudentRequest(req.body.studentId))
            {
                //console.log("testerror");
                const db_connection = await anokha_db.promise().getConnection();
                try{

                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, starredEvents READ, eventRegistrationData READ");

                    let [event] = await db_connection.query(`
                    SELECT * FROM eventData 
                    LEFT JOIN departmentData
                    ON eventData.eventDepartmentId = departmentData.departmentId
                    WHERE eventId=?`,[req.params.eventId]);
                    if(event.length==0 || event[0].eventStatus=="0"){
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Invalid Request!"
                        });
                        return;
                    }
                    else{
                        event = event[0];
                        const [tags] = await db_connection.query(`SELECT tagName, tagAbbreviation FROM eventTagData LEFT JOIN tagData ON eventTagData.tagId = tagData.tagId WHERE eventId=?`,[req.params.eventId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Fetched Event Data.",
                            "eventId":event.eventId,
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
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getEventData - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally{
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
            else if (req.body.isLoggedIn == "1" && dataValidator.isValidStudentRequest(req.body.studentId))
            {
                const db_connection = await anokha_db.promise().getConnection();
                try{

                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, starredEvents READ, eventRegistrationData READ");

                    let [event] = await db_connection.query(`
                    SELECT * FROM eventData 
                    LEFT JOIN departmentData
                    ON eventData.eventDepartmentId = departmentData.departmentId
                    WHERE eventId=?`,[req.params.eventId]);
                    if(event.length==0 || event[0].eventStatus=="0"){
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(400).json({
                            "MESSAGE": "Invalid Request!"
                        });
                        return;
                    }
                    else{
                        event = event[0];
                        const [tags] = await db_connection.query(`SELECT tagName, tagAbbreviation FROM eventTagData LEFT JOIN tagData ON eventTagData.tagId = tagData.tagId WHERE eventId=?`,[req.params.eventId]);
                        const [starred] = await db_connection.query("SELECT * FROM starredEvents WHERE studentId=? AND eventId=?",[req.body.studentId,req.params.eventId]); 
                        const [registration] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE studentId=? AND eventId=?",[req.body.studentId,req.params.eventId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Fetched Event Data.",
                            "eventId":event.eventId,
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
                            "isStarred": starred.length>0?"1":"0",
                            "isRegistered": registration.length>0?"1":"0",
                            "registrationId": registration.length>0?registration[0].registrationId:null,
                        });
                        return;
                    }
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getEventData - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                    return;
                }
                finally{
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],
}