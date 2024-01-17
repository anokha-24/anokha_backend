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
                    eventData.eventMarkdownDescription,
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
                    AND eventData.isGroup = "0"
                    ;`
                    
                    const query2 =`
                    SELECT
                    eventData.eventId,
                    eventData.eventName,
                    eventData.eventDescription,
                    eventData.eventMarkdownDescription,
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
                    AND eventData.isGroup = "1"
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
                        eventMarkdownDescription: event.eventMarkdownDescription,
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
                    eventData.eventMarkdownDescription,
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
                    AND eventData.isGroup = "0"
                    ;`

                    const query2 = `
                    SELECT
                    eventData.eventId,
                    eventData.eventName,
                    eventData.eventDescription,
                    eventData.eventMarkdownDescription,
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
                    AND eventData.isGroup = "1"
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
                            eventMarkdownDescription: event.eventMarkdownDescription,
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

    getAllEvents: [
        validateEventRequest,
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
                    if (req.body.isLoggedIn == "0") {
                        
                        await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ");
                        
                        const query = `SELECT
                        eventData.eventId,
                        eventData.eventName,
                        eventData.eventDescription,
                        eventData.eventMarkdownDescription,
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
                            eventMarkdownDescription: event.eventMarkdownDescription,
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
                            eventData.eventMarkdownDescription,
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
                            eventData.isGroup = "0"
                        ;`;
                        
                        const query2 = `
                        SELECT
                            eventData.eventId,
                            eventData.eventName,
                            eventData.eventDescription,
                            eventData.eventMarkdownDescription,
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
                            eventData.isGroup = "1";`;

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
                            eventMarkdownDescription: event.eventMarkdownDescription,
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
}