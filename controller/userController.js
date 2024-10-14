const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const otpTokenGenerator = require('../middleware/auth/otp/tokenGenerator');
const generateOTP = require("../middleware/auth/otp/otpGenerator");
const mailer = require('../middleware/mailer/mailer');
const appConfig = require('../config/appConfig');
const [tokenValidator, validateEventRequest] = require('../middleware/auth/login/tokenValidator');
const { generateHash, generateVerifyHash } = require("../middleware/payU/util");

const validator = require("validator");
//const redisClient = require('../connection/redis');

module.exports = {
    
    testConnection: async (req, res) => {
        
        return res.status(200).send({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "User/Student"
        });
    },

    qrRedirect: async (req, res) => {
        const dynamicConfigs = JSON.parse(fs.readFileSync('./config/dynamicConfigs.json'));
        return res.redirect(appConfig.BASE_URL+dynamicConfigs.qrRedirectURL);
    },

    getPassportContent: async(req, res) => {
        return res.status(200).send({
            "amount": 300,
            "title": "Anokha Passport",
            "description": "The Anokha passport serves as the exclusive entry ticket, granting access to the Anokha tech fest. All students, excluding those from Amrita Vishwa Vidyapeetham Coimbatore campus, must acquire a passport prior to event and workshop registration. Coimbatore campus students, however, need not purchase a passport but must register using their Amrita email-id. The passport, priced at ₹300 (including GST), ensures entry to the tech fest, while separate registration fees apply to events and workshops. Instead of physical copies, a QR code provided upon passport purchase must be presented for entry throughout the three days of the tech fest.",
            "imageUrl": "https://i.imgur.com/iQy8GLM.jpg",
        });
    },


    getStudentProfile: [
        tokenValidator,
        
        async (req, res) => {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }

                    
                    
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const query = `SELECT * FROM studentData WHERE studentId=?`;
                    
                    const [student] = await db_connection.query(query, [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
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
                }
                
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - studentProfile - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
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
            
            if (!dataValidator.isValidEditStudentProfile(req.body)) {
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            }
            
            else {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }

                    
                    
                    await db_connection.query("LOCK TABLES studentData WRITE");
                    
                    const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentPhone =? AND studentId != ?", [req.body.studentPhone, req.body.studentId]);
                    
                    if (check.length > 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Phone Number Associated with Another Account!"
                        });
                    }
                    
                    
                    if( studentData[0].needPassport == "0")
                    {
                        const query = `UPDATE studentData SET studentFullName=?, studentPhone=?  WHERE studentId=?`;

                        await db_connection.query(query, [req.body.studentFullName, req.body.studentPhone, req.body.studentId]);

                        await db_connection.query("UNLOCK TABLES");

                        return res.status(200).send({
                            "MESSAGE": "Successfully Edited Student Profile."
                        });
                                            
                    }
                    
                    
                    const query = `UPDATE studentData SET studentFullName=?, studentPhone=?, studentCollegeName=?, studentCollegeCity=? WHERE studentId=?`;
                    
                    await db_connection.query(query, [req.body.studentFullName, req.body.studentPhone, req.body.studentCollegeName, req.body.studentCollegeCity, req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Edited Student Profile."
                    });
                }
                
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - editStudentProfile - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
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
            
            if (!dataValidator.isValidToggleStarredEventRequest(req)) {
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            }
            
            else {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {
                    
                    //check if the request is valid
                    await db_connection.query("LOCK TABLES eventData READ");
                    
                    const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId=?", [req.body.eventId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (event.length === 0 || (req.body.isStarred != "0" && req.body.isStarred != "1")) {
                        //db_connection.release();
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }

                    
                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }


                    await db_connection.query("LOCK TABLES starredEvents WRITE");
                    
                    if (req.body.isStarred == "1") {
                        
                        [check] = await db_connection.query("SELECT * FROM starredEvents WHERE studentId=? AND eventId=?", [req.body.studentId, req.body.eventId]);
                        
                        if (check.length > 0) {
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(200).send({
                                "MESSAGE": "Successfully Starred Event!"
                            });
                        }
                        
                        const query = `INSERT INTO starredEvents (studentId, eventId) VALUES (?, ?);`;
                        
                        await db_connection.query(query, [req.body.studentId, req.body.eventId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Starred Event!"
                        });
                    }
                    
                    else if (req.body.isStarred == "0") {
                        
                        const query = `DELETE FROM starredEvents WHERE studentId=? AND eventId=?;`;
                        
                        await db_connection.query(query, [req.body.studentId, req.body.eventId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Unstarred Event!"
                        });
                    }
                    
                    else {
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }
                }
                
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - toggleStarredEvent - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
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
            
                const db_connection = await anokha_db.promise().getConnection();
                
                try {

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }


                    
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
                                WHEN eventRegistrationData.studentId = ${req.body.studentId} 
                                AND eventRegistrationData.registrationStatus = "2" THEN "1"
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
                        AND 
                            starredEvents.studentId = ${req.body.studentId}
                        ;`;


                        const query2 = 
                        `
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
                                WHEN eventRegistrationGroupData.studentId = ${req.body.studentId} 
                                AND eventRegistrationData.registrationStatus = "2" THEN "1"
                                ELSE "0"
                            END AS isRegistered,
                            CASE
                                WHEN starredEvents.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isStarred
                        FROM
                            eventData 
                        LEFT JOIN eventRegistrationGroupData
                            ON eventRegistrationGroupData.eventId = eventData.eventId
                            AND eventRegistrationGroupData.studentId = ${req.body.studentId}
                        LEFT JOIN eventRegistrationData
                            ON eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId    
                        LEFT JOIN departmentData 
                            ON eventData.eventDepartmentId = departmentData.departmentId
                        LEFT JOIN eventTagData
                            ON eventTagData.eventId = eventData.eventId
                        LEFT JOIN tagData 
                            ON eventTagData.tagId = tagData.tagId
                        LEFT JOIN starredEvents 
                            ON eventData.eventId = starredEvents.eventId
                            AND starredEvents.studentId = ${req.body.studentId}
                        WHERE
                            ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )
                        AND
                            ( tagData.isActive != "0" OR tagData.isActive IS NULL )
                        AND 
                            starredEvents.studentId = ${req.body.studentId}
                        ;`;
                        
                        
                        const query3 = 
                        `
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
                                WHEN eventRegistrationGroupData.studentId = ${req.body.studentId} 
                                AND eventRegistrationData.registrationStatus = "2" THEN "1"
                                ELSE "0"
                            END AS isRegistered,
                            CASE
                                WHEN starredEvents.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isStarred
                        FROM
                            eventData 
                        RIGHT JOIN eventRegistrationGroupData
                            ON eventRegistrationGroupData.eventId = eventData.eventId
                            AND eventRegistrationGroupData.studentId = ${req.body.studentId}
                        LEFT JOIN eventRegistrationData
                            ON eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId    
                        LEFT JOIN departmentData 
                            ON eventData.eventDepartmentId = departmentData.departmentId
                        LEFT JOIN eventTagData
                            ON eventTagData.eventId = eventData.eventId
                        LEFT JOIN tagData 
                            ON eventTagData.tagId = tagData.tagId
                        LEFT JOIN starredEvents 
                            ON eventData.eventId = starredEvents.eventId
                            AND starredEvents.studentId = ${req.body.studentId}
                        WHERE
                            ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )
                        AND
                            ( tagData.isActive != "0" OR tagData.isActive IS NULL )
                        AND 
                            starredEvents.studentId = ${req.body.studentId}
                        ;`;
                        
                    const [rows] = await db_connection.query(query);
                    const [rows2] = await db_connection.query(query2);
                    const [rows3] = await db_connection.query(query3);

                    const concat_rows = [...new Set([...rows, ...rows3, ...rows2])];

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

                    
                    // let finalData = [];

                    // for (let i = 0; i < result.length; i++) {
                    //     if (result[i].isStarred == "1") {
                    //         finalData.push(result[i]);
                    //     }
                    // }

                    //console.log(result);

                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Fetched Starred Events.",
                        "EVENTS": result
                    });
                }
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getStarredEvents - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
    ],

    getRegisteredEvents: [
        tokenValidator,
        async (req, res) => {
            
                const db_connection = await anokha_db.promise().getConnection();
                
                try {

                    await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, eventRegistrationData READ, eventRegistrationGroupData READ");

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }


                    
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
                    AND eventRegistrationData.registrationStatus = "2"
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
                    LEFT JOIN eventRegistrationData
                    ON eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId
                    WHERE eventRegistrationGroupData.studentId = ${req.body.studentId}
                    AND eventRegistrationData.registrationStatus = "2"
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

                    return res.status(200).send({
                        "MESSAGE": "Successfully Fetched Registered Events.",
                        "EVENTS": result
                    });


                }
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getRegisteredEvents - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                }
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
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
            
                const db_connection = await anokha_db.promise().getConnection();
                const transaction_db_connection = await anokha_transactions_db.promise().getConnection();
                try {
                    
                    
                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query(`SELECT studentAccountStatus FROM studentData WHERE studentId=?`, [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }



                    await db_connection.query("LOCK TABLES eventRegistrationData READ, eventRegistrationGroupData READ, eventData READ, studentData READ");

                    const [event] = await db_connection.query(`SELECT * FROM eventRegistrationData LEFT JOIN eventData ON eventRegistrationData.eventId = eventData.eventId WHERE registrationId = ? AND registrationStatus = "2"`, [req.body.registrationId]);
                    
                    if (event.length == 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }
                    
                    if (event[0].eventStatus == "0") {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Event Cancelled from Anokha!"
                        });
                    }
                    
                    
                    if (event[0].isGroup == "0" || event[0].needGroupData == "0") {
                        
                        const [registration] = await db_connection.query(`SELECT * FROM eventRegistrationData WHERE registrationId=? and studentId =? AND registrationStatus = "2"`, [req.body.registrationId, req.body.studentId]);
                        
                        if (registration.length == 0) {
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Invalid Request!"
                            });
                        }
                        
                        else {
                            
                            const [student] = await db_connection.query("SELECT studentId, studentFullName, studentEmail, studentPhone, studentCollegeName, studentCollegeCity FROM studentData WHERE studentId=?", [req.body.studentId]);

                            await db_connection.query("UNLOCK TABLES");
                            
    
                            let transactionDetails;

                            if (registration[0].isMarketPlacePaymentMode == "1") {
                                
                                await transaction_db_connection.query("LOCK TABLES marketPlaceTransactionData READ");
                                
                                [transactionDetails] = await transaction_db_connection.query('SELECT * FROM marketPlaceTransactionData WHERE txnId=?', [registration[0].txnId]);
                                
                                await transaction_db_connection.query('UNLOCK TABLES');
                            }
                            
                            
                            else if (registration[0].isMarketPlacePaymentMode == "0") {
                                
                                await transaction_db_connection.query("LOCK TABLES transactionData READ");
                                
                                [transactionDetails] = await transaction_db_connection.query('SELECT * FROM transactionData WHERE txnId=?', [registration[0].txnId]);
                                
                                await transaction_db_connection.query('UNLOCK TABLES');
                            }

                            
                            return res.status(200).send({
                                "MESSAGE": "Successfully Fetched Registered Event Data.",
                                "txnId": transactionDetails[0].txnId,
                                "isMarketPlacePaymentMode": registration[0].isMarketPlacePaymentMode,
                                "transactionStatus": transactionDetails[0].transactionStatus,
                                "transactionAmount": transactionDetails[0].amount,
                                "transactionTime": transactionDetails[0].createdAt,
                                "team": student
                            });
                        }
                    }
                    
                    else if (event[0].isGroup == "1" && event[0].needGroupData == "1") {
                        
                        const [registration] = await db_connection.query(`
                        
                        SELECT * FROM eventRegistrationGroupData
                        LEFT JOIN eventRegistrationData ON
                        eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId 
                        WHERE eventRegistrationGroupData.registrationId=? AND eventRegistrationGroupData.studentId =? 
                        AND eventRegistrationData.registrationStatus = "2"`, [req.body.registrationId, req.body.studentId]);
                        
                        if (registration.length == 0) {
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Invalid Request!"
                            });
                        }
                        
                        else {
                            const [team] = await db_connection.query(`
                            SELECT 
                            eventRegistrationGroupData.studentId,
                            eventRegistrationGroupData.roleDescription,
                            eventRegistrationGroupData.isOwnRegistration,
                            eventRegistrationData.teamName,
                            studentData.studentFullName,
                            studentData.studentEmail,
                            studentData.studentPhone,
                            studentData.studentCollegeName,
                            studentData.studentCollegeCity
                            FROM eventRegistrationGroupData
                            LEFT JOIN studentData
                            ON eventRegistrationGroupData.studentId = studentData.studentId
                            LEFT JOIN eventRegistrationData
                            ON eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId
                            WHERE eventRegistrationGroupData.registrationId=?
                            AND eventRegistrationData.registrationStatus = "2"`
                            , [req.body.registrationId]);

                            await db_connection.query("UNLOCK TABLES");
                            
                            let transactionDetails;

                            if (registration[0].isMarketPlacePaymentMode == "1") {
                                
                                await transaction_db_connection.query("LOCK TABLES marketPlaceTransactionData READ");
                                
                                [transactionDetails] = await transaction_db_connection.query('SELECT * FROM marketPlaceTransactionData WHERE txnId=?', [registration[0].txnId]);
                                
                                await transaction_db_connection.query('UNLOCK TABLES');
                            }
                            
                            
                            else if (registration[0].isMarketPlacePaymentMode == "0") {
                                
                                await transaction_db_connection.query("LOCK TABLES transactionData READ");
                                
                                [transactionDetails] = await transaction_db_connection.query('SELECT * FROM transactionData WHERE txnId=?', [registration[0].txnId]);
                                
                                await transaction_db_connection.query('UNLOCK TABLES');
                            }
                            
                            
                            
                            return res.status(200).send({
                                "MESSAGE": "Successfully Fetched Registered Event Data.",
                                "txnId": transactionDetails[0].txnId,
                                "isMarketPlacePaymentMode": registration[0].isMarketPlacePaymentMode,
                                "transactionStatus": transactionDetails[0].transactionStatus,
                                "transactionAmount": transactionDetails[0].amount,
                                "transactionTime": transactionDetails[0].createdAt,
                                "teamName":team[0].teamName,
                                "team": team
                            });

                        }
                    }
                }
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - registeredEventData - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                }
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    
                    await transaction_db_connection.query("UNLOCK TABLES");
                    transaction_db_connection.release();
                }
            }
        // }
    ],

    //to add only the tags that have isActive = '1' 
    getAllEventsJSVersion: [
        validateEventRequest,
        async (req, res) => {
            
            if (req.body.isLoggedIn == "1"){ //&& !await dataValidator.isValidStudentRequest(req.body.studentId)) {
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            const db_connection = await anokha_db.promise().getConnection();

            try {


                //check if the student exists and is active
                await db_connection.query("LOCK TABLES studentData READ");
                
                const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                
                await db_connection.query("UNLOCK TABLES");
                
                if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                    
                    return res.status(400).send({
                        "MESSAGE": "Access Restricted!"
                    });
                }


                
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
                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Fetched All Events.",
                        "MODE": "0",
                        "EVENTS": result
                    });
                
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

                    return res.status(200).send({
                        "MESSAGE": "Successfully Fetched All Events.",
                        "MODE": "1",
                        "EVENTS": result
                    });

                }
            } catch (error) {
                console.log(error);
                
                const time = new Date();
                fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getAllEventsJSVersion - ${error}\n`);
                
                return res.status(500).send({
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
            
                const db_connection = await anokha_db.promise().getConnection();

                if (req.body.isLoggedIn == "1"){ // && !await dataValidator.isValidStudentRequest(req.body.studentId)) {
                    
                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }
                }

                
                try {
                    if (req.body.isLoggedIn == "0") {

                        try{


                            // Fetch all events from Redis
                            // const events = await redisClient.get('allEvents');
                            // if(events != null){
                                
                            //     return res.status(200).send({
                            //         "MESSAGE": "Successfully Fetched All Events.",
                            //         "MODE": "0",
                            //         "EVENTS": JSON.parse(events)
                            //     });
                            // }
                            
                            
                            
                            //else{
                                
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


                                // // Store the events in Redis
                                // await redisClient.set('allEvents', JSON.stringify(result));
                                
                                // // Set the expiry time for 10mins
                                // await redisClient.expire('allEvents', 600);

                                let activeEvents = [];
                                for (let i = 0; i < result.length; i++) {
                                    if (result[i].eventStatus != '0') {
                                        activeEvents.push(result[i]);
                                    }
                                }

                                
                                
                                // MODE 0 - Not Logged In
                                return res.status(200).send({
                                    "MESSAGE": "Successfully Fetched All Events.",
                                    "MODE": "0",
                                    "EVENTS": activeEvents
                                });
                            //}
                        }
                        catch(err){
                            
                            console.log(err);
                            
                            const time = new Date();
                            fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getAllEvents - ${err}\n`);
                            
                            return res.status(500).send({
                                "MESSAGE": "Internal Server Error. Contact Web Team"
                            });
                        }
                        finally{
                            
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
                                WHEN eventRegistrationData.studentId = ${req.body.studentId} 
                                AND eventRegistrationData.registrationStatus = "2" THEN "1"
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


                        const query2 = 
                        `
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
                                WHEN eventRegistrationGroupData.studentId = ${req.body.studentId} 
                                AND eventRegistrationData.registrationStatus = "2" THEN "1"
                                ELSE "0"
                            END AS isRegistered,
                            CASE
                                WHEN starredEvents.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isStarred
                        FROM
                            eventData 
                        LEFT JOIN eventRegistrationGroupData
                            ON eventRegistrationGroupData.eventId = eventData.eventId
                            AND eventRegistrationGroupData.studentId = ${req.body.studentId}
                        LEFT JOIN eventRegistrationData
                            ON eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId    
                        LEFT JOIN departmentData 
                            ON eventData.eventDepartmentId = departmentData.departmentId
                        LEFT JOIN eventTagData
                            ON eventTagData.eventId = eventData.eventId
                        LEFT JOIN tagData 
                            ON eventTagData.tagId = tagData.tagId
                        LEFT JOIN starredEvents 
                            ON eventData.eventId = starredEvents.eventId
                            AND starredEvents.studentId = ${req.body.studentId}
                        WHERE
                            ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )
                        AND
                            ( tagData.isActive != "0" OR tagData.isActive IS NULL )
                        ;`;
                        
                        
                        const query3 = 
                        `
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
                                WHEN eventRegistrationGroupData.studentId = ${req.body.studentId} 
                                AND eventRegistrationData.registrationStatus = "2" THEN "1"
                                ELSE "0"
                            END AS isRegistered,
                            CASE
                                WHEN starredEvents.studentId = ${req.body.studentId} THEN "1"
                                ELSE "0"
                            END AS isStarred
                        FROM
                            eventData 
                        RIGHT JOIN eventRegistrationGroupData
                            ON eventRegistrationGroupData.eventId = eventData.eventId
                            AND eventRegistrationGroupData.studentId = ${req.body.studentId}
                        LEFT JOIN eventRegistrationData
                            ON eventRegistrationData.registrationId = eventRegistrationGroupData.registrationId    
                        LEFT JOIN departmentData 
                            ON eventData.eventDepartmentId = departmentData.departmentId
                        LEFT JOIN eventTagData
                            ON eventTagData.eventId = eventData.eventId
                        LEFT JOIN tagData 
                            ON eventTagData.tagId = tagData.tagId
                        LEFT JOIN starredEvents 
                            ON eventData.eventId = starredEvents.eventId
                            AND starredEvents.studentId = ${req.body.studentId}
                        WHERE
                            ( eventData.isGroup = "1" AND eventData.needGroupData = "1" )
                        AND
                            ( tagData.isActive != "0" OR tagData.isActive IS NULL )
                        ;`;
                        
                        
                        

                        await db_connection.query('LOCK TABLES eventData READ, eventRegistrationData READ, starredEvents READ, eventRegistrationGroupData READ, departmentData READ, tagData READ, eventTagData READ');


                        const [rows] = await db_connection.query(query);
                        const [rows2] = await db_connection.query(query2);
                        const [rows3] = await db_connection.query(query3);

                        const concat_rows = [...new Set([...rows, ...rows3, ...rows2])];
                        //const concat_rows = [...new Set([...rows, ...rows3])];


                        await db_connection.query("UNLOCK TABLES");

                        
                        const aggregatedDataMap = new Map();

                        // Iterate through each event object
                        concat_rows.forEach((event) => {
                            
                            // Check if the eventId already exists in the map
                            if (aggregatedDataMap.has(event.eventId)) {
                                
                                // If yes, push the current event data to the existing array
                                const existingData = aggregatedDataMap.get(event.eventId);
                                
                                // existingData.tags.push({
                                //     tagName: event.tagName,
                                //     tagAbbreviation: event.tagAbbreviation,
                                // });
                                const isDuplicateTag = existingData.tags.some(tag => tag.tagName === event.tagName);

                                if (!isDuplicateTag) {
                                    existingData.tags.push({
                                        tagName: event.tagName,
                                        tagAbbreviation: event.tagAbbreviation,
                                    });
                                }
                                
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

                        let activeEvents = [];
                        for (let i = 0; i < result.length; i++) {
                            if (result[i].eventStatus != '0') {
                                activeEvents.push(result[i]);
                            }
                        }
                        
                        // MODE 1 - Logged In
                        return res.status(200).send({
                            "MESSAGE": "Successfully Fetched All Events.",
                            "MODE": "1",
                            "EVENTS": activeEvents
                        });
                    }
                    
                    else {
                        
                        return res.status(401).send({
                            "MESSAGE": "Unauthorized access. Warning."
                        });
                    }
                }
                
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getAllEvents - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                }
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
    ],

    
    getEventData: [
        validateEventRequest,
        async (req, res) => {

            req.params.eventId = parseInt(req.params.eventId);
            
            if (req.body.isLoggedIn == "0"){// || !dataValidator.isValidStudentRequest(req.body.studentId)) {
                
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
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }
                    
                    
                    else {
                        
                        event = event[0];
                        
                        const [tags] = await db_connection.query(`SELECT tagName, tagAbbreviation FROM eventTagData LEFT JOIN tagData ON eventTagData.tagId = tagData.tagId WHERE eventId=?`, [req.params.eventId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        
                        //MODE: 0 - Not Logged In, 1 - Logged In
                        return res.status(200).send({
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
                        
                    }
                }
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getEventData - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                }
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
            
            else if (req.body.isLoggedIn == "1"){// && dataValidator.isValidStudentRequest(req.body.studentId)) {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        await db_connection.query("LOCK TABLES eventData READ, departmentData READ, tagData READ, eventTagData READ, starredEvents READ, eventRegistrationData READ");

                        let [event] = await db_connection.query(`
                        SELECT * FROM eventData 
                        LEFT JOIN departmentData
                        ON eventData.eventDepartmentId = departmentData.departmentId
                        WHERE eventId=?`, [req.params.eventId]);
                        
                        if (event.length == 0 || event[0].eventStatus == "0") {
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Invalid Request!"
                            });
                        }
                        
                        
                        else {
                            event = event[0];
                            
                            const [tags] = await db_connection.query(`SELECT tagName, tagAbbreviation FROM eventTagData LEFT JOIN tagData ON eventTagData.tagId = tagData.tagId WHERE eventId=?`, [req.params.eventId]);
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            
                            //MODE: 0 - Not Logged In, 1 - Logged In
                            return res.status(200).send({
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
                        }

                    }


                    
                    await db_connection.query(`LOCK TABLES eventData READ,
                    departmentData READ, tagData READ,
                    eventTagData READ, starredEvents READ,
                    eventRegistrationData READ,
                    eventRegistrationGroupData READ`);

                    
                    
                    let [event] = await db_connection.query(`
                    SELECT * FROM eventData 
                    LEFT JOIN departmentData
                    ON eventData.eventDepartmentId = departmentData.departmentId
                    WHERE eventId=?`, [req.params.eventId]);
                    
                    
                    if (event.length == 0 || event[0].eventStatus == "0") {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }
                    
                    
                    else {
                        
                        event = event[0];
                        
                        const [tags] = await db_connection.query(`SELECT tagName, tagAbbreviation FROM eventTagData LEFT JOIN tagData ON eventTagData.tagId = tagData.tagId WHERE eventId=?`, [req.params.eventId]);
                        
                        const [starred] = await db_connection.query("SELECT * FROM starredEvents WHERE studentId=? AND eventId=?", [req.body.studentId, req.params.eventId]);
                        
                        let registration;
                        
                        if (event.isGroup == "0" || event.needGroupData == "0") {
                            
                            [registration] = await db_connection.query(`SELECT * FROM eventRegistrationData WHERE studentId=? AND eventId=? AND registrationStatus = "2"`, [req.body.studentId, req.params.eventId]);
                        }
                        
                        else if (event.isGroup == "1" && event.needGroupData == "1") {
                            
                            [registration] = await db_connection.query(
                            `SELECT * FROM
                            eventRegistrationGroupData
                            LEFT JOIN eventRegistrationData ON 
                            eventRegistrationGroupData.registrationId = eventRegistrationData.registrationId
                            WHERE eventRegistrationGroupData.studentId=? 
                            AND eventRegistrationGroupData.eventId=?
                            AND eventRegistrationData.registrationStatus = "2"`, 
                            [req.body.studentId, req.params.eventId]);
                        }
                        
                        
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        
                        
                        //MODE: 0 - Not Logged In, 1 - Logged In
                        return res.status(200).send({
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
                            "isRegistered": registration.length > 0 && registration[0].registrationStatus == "2" ? "1" : "0",
                            "registrationId": registration.length > 0 && registration[0].registrationStatus == "2" ? registration[0].registrationId : null,
                        });
                    }
                }
                
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getEventData - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team"
                    });
                }
                
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],


    
    buyPassport: [
        tokenValidator,
        async (req, res) => {
            const db_connection = await anokha_db.promise().getConnection();
            const transaction_db_connection = await anokha_transactions_db.promise().getConnection();

            try {

                // check if the student exists and is active
                await db_connection.query("LOCK TABLES studentData READ");

                const [studentData] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.body.studentId]);

                await db_connection.query("UNLOCK TABLES");

                if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {

                    return res.status(400).send({
                        "MESSAGE": "Access Restricted!"
                    });
                }

                if(studentData[0].isAmritaStudent === "1") {

                    return res.status(400).send({
                        "MESSAGE": "You are an Amrita Student. You don't need a passport!"
                    });
                }

                if(studentData[0].needPassport === "0") {
                    return res.status(400).send({
                        "MESSAGE": "You don't need a passport!"
                    });
                }

                if(studentData[0].studentEmail.split("@")[1] === "cb.students.amrita.edu") {
                    return res.status(400).send({
                        "MESSAGE": "You are an Amrita Student. You don't need a passport!"
                    });
                }

                await transaction_db_connection.query("LOCK TABLES transactionData READ");

                // check for any pending payments
                const [tT2] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE userId = ? AND transactionStatus = '0'", [req.body.studentId]);

                if (tT2.length > 0) {

                    return res.status(400).send({
                        "MESSAGE": "You have made a payment attempt that is still in pending state. Go to your profile -> Transactions and then click on verify now to proceed!"
                    });
                }

                await transaction_db_connection.query("UNLOCK TABLES");

                if (studentData[0].studentAccountStatus === "2") {
                    return res.status(400).send({
                        "MESSAGE": "You Already have a passport!"
                    });
                }

                if (studentData[0].studentAccountStatus !== "1") {
                    return res.status(400).send({
                        "MESSAGE": "Something's wrong on our end. Contact 7871602673 Dilip Parasu WMD Head !"
                    });
                }

                const txnId = `TXN-P-${req.body.studentId.toString()}-${new Date().getTime()}`;
                let amount = Math.ceil(300*1.18);
                let productinfo = `P-${req.body.studentId.toString()}`;
                let firstname = studentData[0].studentFullName;
                let email = studentData[0].studentEmail;
                let phone = studentData[0].studentPhone;
                
                await transaction_db_connection.query('LOCK TABLES transactionData WRITE');

                const [insertTransactionData] = await transaction_db_connection.query("INSERT INTO transactionData (txnId, userId, amount, productinfo, firstname, email, phone, transactionStatus)  VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txnId, studentData[0].studentId, amount, productinfo, firstname, email, phone, "0"]);
                
                await transaction_db_connection.query('UNLOCK TABLES');

                if (insertTransactionData.affectedRows !== 1) {
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }

                const hash = generateHash({
                    "txnid": txnId,
                    "amount": amount,
                    "productinfo": productinfo,
                    "firstname": firstname,
                    "email": email
                });

                
                // DONE. Move to Transaction from frontend.
                
                return res.status(200).send({
                    "MESSAGE": "Proceed to pay.",
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

            } catch (err) {
                console.log(err);

                const time = new Date();
                fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - buyPassport - ${err}\n`);

                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            } finally {
                await db_connection.query("UNLOCK TABLES");

                await transaction_db_connection.query("UNLOCK TABLES");

                db_connection.release();

                transaction_db_connection.release();
            }
        },
    ],


    /*{
        "transactionId":""
    }*/
    verifyTransactionPayU: async (req,res) => {
        const db_connection = await anokha_db.promise().getConnection();
        const transaction_db_connection = await anokha_transactions_db.promise().getConnection(); 
        let rollbackFlag = "0";
        try{
            
            if(!(typeof(req.body.transactionId)==='string' && req.body.transactionId.length>0 && req.body.transactionId.substring(0,3)==='TXN')){
                //console.log("check",req.body.transactionId.substring(0,2));
                return res.status(400).send({
                    "MESSAGE": "Invalid Transaction ID!"
                });
            }

            await transaction_db_connection.query("LOCK TABLES transactionData READ");

            const [transactionData] = await transaction_db_connection.query(`
            SELECT *,
            CASE
              WHEN expiryTime < CURRENT_TIMESTAMP THEN '1'
              ELSE '0'
            END 
            AS isExpired
            FROM transactionData
            WHERE txnId = ?;`, [req.body.transactionId]);

            await transaction_db_connection.query("UNLOCK TABLES");
            
            if(transactionData.length === 0){
                //console.log("test");
                return res.status(400).send({
                    "MESSAGE": "Invalid Transaction ID!"
                });
            }

            if(transactionData[0].transactionStatus === "1"){
                return res.status(200).send({
                    "MESSAGE": "Transaction already verified!"
                });
            }

            if(transactionData[0].transactionStatus === "2"){
                return res.status(202).send({
                    "MESSAGE": "Transaction Failed!"
                });
            }

            if(transactionData[0].transactionStatus != "0"){
                return res.status(400).send({
                    "MESSAGE": "Invalid Transaction Status!"
                });
            }



            if(transactionData[0].transactionStatus === "0" && transactionData[0].isExpired === "1"){
                // await transaction_db_connection.query("LOCK TABLES transactionData WRITE");
                // await transaction_db_connection.query('UPDATE transactionData SET transactionStatus = "2" WHERE txnId = ?', [transactionData[0].txnId]);
                // await transaction_db_connection.query("UNLOCK TABLES");
                return res.status(400).send({
                    "MESSAGE": "Transaction Expired! Wait for 10 minutes and try again!"
                });
            }

            req.body.studentId = transactionData[0].userId;

            // check if the student exists and is active
            await db_connection.query("LOCK TABLES studentData READ");

            const [studentData] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.body.studentId]);

            await db_connection.query("UNLOCK TABLES");

            if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {

                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            const txnId = req.body.transactionId;

            const productInfo = transactionData[0].productinfo;

            if (productInfo[0] === 'P') {


                const hash = generateVerifyHash({ command: "verify_payment", var1: transactionData[0].txnId });
                const response = await fetch(appConfig.payUVerifyURL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: `key=${appConfig.payUKey}&command=verify_payment&hash=${hash}&var1=${transactionData[0].txnId}`
                });

                const responseText = await response.json();



                const transactionDetails = responseText.transaction_details;

                console.log(transactionDetails[transactionData[0].txnId]);

                if (transactionDetails[transactionData[0].txnId].status === "success") {
                    
                    await db_connection.beginTransaction();
                    await transaction_db_connection.beginTransaction();

                    rollbackFlag = "1";

                    await transaction_db_connection.query("UPDATE transactionData SET transactionStatus = '1' WHERE txnId = ?", [txnId]);
                    await db_connection.query("UPDATE studentData SET studentAccountStatus = '2' WHERE studentId = ?", [req.body.studentId]);
                    
                    await transaction_db_connection.commit();
                    await db_connection.commit();

                    return res.status(200).send({   
                        "MESSAGE": "Transaction Verified!"
                    });

                }
                else if (transactionDetails[transactionData[0].txnId].status === "failure") {

                    await transaction_db_connection.query("LOCK TABLES transactionData WRITE");

                    await transaction_db_connection.query("UPDATE transactionData SET transactionStatus = '2' WHERE txnId = ?", [txnId]);

                    await transaction_db_connection.query("UNLOCK TABLES");

                    return res.status(202).send({
                        "MESSAGE": "Transaction Failed!"
                    });

                }

                else if (transactionDetails[transactionData[0].txnId].status === "pending"){
                    return res.status(201).send({
                        "MESSAGE": "Transaction Pending!"
                    });
                }
            } else if (productInfo[0] === 'E') {

                // Event Registration
                const hash = generateVerifyHash({ command: "verify_payment", var1: transactionData[0].txnId });
                
                const response = await fetch(appConfig.payUVerifyURL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: `key=${appConfig.payUKey}&command=verify_payment&hash=${hash}&var1=${transactionData[0].txnId}`
                });

                const responseText = await response.json();
                const transactionDetails = responseText.transaction_details;

                console.log(transactionDetails[transactionData[0].txnId]);

                if (transactionDetails[transactionData[0].txnId].status === "success") {
                    
                    await db_connection.beginTransaction();
                    await transaction_db_connection.beginTransaction();

                    rollbackFlag = "1";


                    await transaction_db_connection.query("UPDATE transactionData SET transactionStatus = '1' WHERE txnId = ?", [txnId]);
                    await db_connection.query("UPDATE eventRegistrationData SET registrationStatus = '2' WHERE txnId = ?", [txnId]);
                    
                    await transaction_db_connection.commit();
                    await db_connection.commit();

                    return res.status(200).send({   
                        "MESSAGE": "Transaction Verified!"
                    });

                }

                else if (transactionDetails[transactionData[0].txnId].status === "failure" || (transactionDetails[transactionData[0].txnId].mihpayid === "Not Found" && transactionDetails[transactionData[0].txnId].status === "Not Found")) {

                    // await transaction_db_connection.query("LOCK TABLES transactionData WRITE");

                    // await transaction_db_connection.query("UPDATE transactionData SET transactionStatus = '2' WHERE txnId = ?", [txnId]);

                    // await transaction_db_connection.query("UNLOCK TABLES");

                    await transaction_db_connection.beginTransaction();
                    await db_connection.beginTransaction();

                    rollbackFlag = "1";

                    await transaction_db_connection.query("UPDATE transactionData SET transactionStatus = '2', seatsReleased = '1'  WHERE txnId = ?", [txnId]); // bug fixed. AND replaced with comma

                    const [event] = await db_connection.query('SELECT * FROM eventRegistrationData WHERE txnId = ?',[txnId]);

                    await db_connection.query('DELETE from eventRegistrationGroupData WHERE txnId = ?',[txnId]);
                    await db_connection.query('DELETE from eventRegistrationData WHERE txnId = ?',[txnId]);

                    if(event.length > 0){
                        await db_connection.query('UPDATE eventData SET seatsFilled = seatsFilled - ? WHERE eventId = ?',[event[0].totalMembers,event[0].eventId]);
                    }
                    
                    await transaction_db_connection.commit();
                    await db_connection.commit();

                    return res.status(202).send({
                        "MESSAGE": "Transaction Failed!"
                    });

                }

                else if (transactionDetails[transactionData[0].txnId].status === "pending"){
                    
                    return res.status(201).send({
                        "MESSAGE": "Transaction Pending!"
                    });
                }

            } 
            
            else {
                
                return res.status(400).send({
                    "MESSAGE": "Unauthorized!"
                });
            }

        }
        catch(err){
            console.log(err);

            if(rollbackFlag === "1"){
                await transaction_db_connection.rollback();
                await db_connection.rollback();
            }    

            const time = new Date();
            fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - verifyTransactionPayU - ${err}\n`);
            return res.status(500).send({
                "MESSAGE": "Internal Server Error. Contact Web Team."
            });
        }
        finally{
            await db_connection.query("UNLOCK TABLES");
            await transaction_db_connection.query("UNLOCK TABLES");
            db_connection.release();
            transaction_db_connection.release();
        }
    },


    getAllTransactions: [
        tokenValidator,
        async (req, res) => {

            const db_connection = await anokha_transactions_db.promise().getConnection();

            try {
                await db_connection.query("LOCK TABLES transactionData READ, marketPlaceTransactionData READ");

                const [transactions] = await db_connection.query("SELECT txnId, amount, transactionStatus, createdAt AS timeOfTransaction FROM transactionData WHERE userId = ? ORDER BY createdAt DESC", [req.body.studentId]);
                const [marketPlaceTransactions] = await db_connection.query("SELECT txnId, amount, transactionStatus, createdAt AS timeOfTransaction FROM marketPlaceTransactionData WHERE userId = ? ORDER BY createdAt DESC", [req.body.studentId]);

                await db_connection.query("UNLOCK TABLES");

                return res.status(200).send({
                    "MESSAGE": "Successfully Fetched Transactions.",
                    "PAY_U_TRANSACTIONS": transactions,
                    "MARKET_PLACE_TRANSACTIONS": marketPlaceTransactions
                });
            }
            catch (err) {
                console.log(err);

                const time = new Date();
                fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getAllTransactions - ${err}\n`);

                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            }
            finally {
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
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
            
            // Validate parameter type and format
            if (!dataValidator.isValidEventRegistration(req)) {
                return res.status(400).send({
                    "MESSAGE": "Invalid Registration Details!"
                });
            }

            
            const db_connection = await anokha_db.promise().getConnection();
            const transaction_db_connection = await anokha_transactions_db.promise().getConnection();

            let rollbackFlag = "0";

            try {

                
                //check if the student exists and is active
                await db_connection.query("LOCK TABLES studentData READ");
                
                const [studentData] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.body.studentId]);
                
                await db_connection.query("UNLOCK TABLES");
                
                if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                    
                    return res.status(400).send({
                        "MESSAGE": "Access Restricted!"
                    });
                }

                
                
                await transaction_db_connection.query("LOCK TABLES transactionData READ");

                // check for any pending payments
                const [tT2] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE userId = ? AND transactionStatus = '0'", [req.body.studentId]);

                if (tT2.length > 0) {
                    
                    return res.status(400).send({
                        "MESSAGE": "You have made an attempt to register for an event that is still in pending state. Go to your profile -> Transactions and then click on verify now to proceed!"
                    });
                }

                
                
                await transaction_db_connection.query("UNLOCK TABLES");


                await db_connection.query("LOCK TABLES eventData READ, eventRegistrationData READ, eventRegistrationGroupData READ, studentData READ");

                
                
                // does the event exist
                const [eventData] = await db_connection.query("SELECT * from eventData WHERE eventId = ? AND eventDate >= CURDATE()", [req.body.eventId]);

                if (!(eventData.length > 0)) {
                    return res.status(400).send({
                        "MESSAGE": "Event is already over! Are you going back to past?"
                    });
                }
                
                // TODO: DATE EXECEEDED LOGIC PENDING

                if (!(eventData[0].eventStatus === "1")) {
                    return res.status(400).send({
                        "MESSAGE": "Registrations closed for this event!"
                    });
                }
                
                
                if (!(req.body.totalMembers >= eventData[0].minTeamSize && req.body.totalMembers <= eventData[0].maxTeamSize)) {
                    return res.status(400).send({
                        "MESSAGE": "Invalid Team Size!"
                    });
                }

                
                if (!(eventData[0].maxSeats - eventData[0].seatsFilled >= req.body.totalMembers)) {
                    return res.status(400).send({
                        "MESSAGE": "Registrations closed! Seats are full!"
                    });
                }

                
                
                // Event Registration Check
                const [regData] = await db_connection.query('SELECT * FROM eventRegistrationData WHERE studentId = ? AND eventId = ?', [req.body.studentId, req.body.eventId]);
                const [eventRegGroupData] = await db_connection.query('SELECT * FROM eventRegistrationGroupData WHERE studentId = ? AND eventId = ?', [req.body.studentId, req.body.eventId]);


                if (regData.length > 0) {
                    
                    return res.status(400).send({
                        "MESSAGE": "You have already registered for the event or the registration is pending! Complete it before moving forward for another attempt!"
                    });
                }

                
                if (eventRegGroupData.length > 0) {
                    
                    return res.status(400).send({
                        "MESSAGE": "You are already in a group for the same event or the registration is pending! Complete it before moving forward for another attempt!!"
                    });
                }

                if (studentData[0].studentAccountStatus !== "2") {
                    
                    return res.status(400).send({
                        "MESSAGE": "Failed to register. You need to buy a passport to register for events!"
                    });
                }

                
                await db_connection.query("UNLOCK TABLES");

                
                if (req.body.isMarketPlacePaymentMode === "0") {
                    
                    // payU

                    const txnId = `TXN-E-${req.body.studentId.toString()}-${req.body.eventId.toString()}-${new Date().getTime()}`;
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

                        //await transaction_db_connection.query("LOCK TABLES transactionData WRITE");

                        
                        await transaction_db_connection.query("LOCK TABLES transactionData READ");
                        
                        const [tDataTest] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE txnId = ?", [txnId]);
                       
                        await transaction_db_connection.query("UNLOCK TABLES");

                        if (tDataTest.length > 0) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Duplicate Transaction Attempt!"
                            });
                        }


                        await transaction_db_connection.beginTransaction();
                        await db_connection.beginTransaction();

                        rollbackFlag = "1";

                        const [insertTransactionData] = await transaction_db_connection.query("INSERT INTO transactionData (txnId, userId, amount, productinfo, firstname, email, phone, transactionStatus)  VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);

                        
                        if (insertTransactionData.affectedRows !== 1) {
                            
                            console.log("Failed to INSERT transactionData.");
                            
                            console.log([txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);

                            throw new Error("Failed to INSERT transactionData.");
                            
                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }



                        //await transaction_db_connection.query("UNLOCK TABLES");

                        // INSERTING INTO eventRegistrationData as PENDING: LOCKING THE SEATS

                        //await db_connection.query("LOCK TABLES eventRegistrationData WRITE, eventData WRITE");

                        
                        
                        const [insertEventRegistrationData] = await db_connection.query("INSERT INTO eventRegistrationData (eventId, studentId, isMarketPlacePaymentMode, txnId, totalMembers, totalAmountPaid, teamName, registrationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);

                        
                        
                        if (insertEventRegistrationData.affectedRows !== 1) {
                            
                            console.log("Failed to INSERT insertEventRegistrationData.");
                            
                            console.log([req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);
                            
                            throw new Error("Failed to INSERT insertEventRegistrationData.");

                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }

                        
                        const [eventDataUpdate] = await db_connection.query("UPDATE eventData SET seatsFilled = ? WHERE eventId = ?", [eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);

                        
                        if (eventDataUpdate.affectedRows !== 1) {
                            
                            console.log("Failed to UPDATE eventData.");
                            
                            console.log([eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);

                            throw new Error("Failed to UPDATE eventData.");
                            
                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }

                        await transaction_db_connection.commit();
                        await db_connection.commit();
                        //await db_connection.query("UNLOCK TABLES");

                        
                        const hash = generateHash({
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email
                        });

                        
                        // DONE. Move to Transaction from frontend.

                        
                        return res.status(200).send({
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



                    } 
                    
                    else if (eventData[0].isGroup === "1" && eventData[0].needGroupData === "0") {

                        if (eventData[0].isPerHeadPrice === "1") {
                            amount = (eventData[0].eventPrice * req.body.totalMembers) + Math.ceil((eventData[0].eventPrice * req.body.totalMembers) * 0.18);
                        } 
                        
                        else if (eventData[0].isPerHeadPrice === "0") {
                            amount = eventData[0].eventPrice + Math.ceil(eventData[0].eventPrice * 0.18);
                        }


                        productinfo = `EGPI-${req.body.studentId}-${req.body.eventId}-${req.body.totalMembers}-${amount}`;

                        
                        
                        // Inserting into transactionData as PENDING

                        await transaction_db_connection.query("LOCK TABLES transactionData READ");

                        const [tDataTest] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE txnId = ?", [txnId]);

                        await transaction_db_connection.query("UNLOCK TABLES");

                        if (tDataTest.length > 0) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Duplicate Transaction Attempt!"
                            });
                        }

                        

                        await transaction_db_connection.beginTransaction();
                        await db_connection.beginTransaction();

                        rollbackFlag = "1";
                        
                        const [insertTransactionData] = await transaction_db_connection.query("INSERT INTO transactionData (txnId, userId, amount, productinfo, firstname, email, phone, transactionStatus)  VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);

                        if (insertTransactionData.affectedRows !== 1) {
                            
                            console.log("Failed to INSERT transactionData.");
                            
                            console.log([txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);
                            
                            throw new Error("Failed to INSERT transactionData.");

                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }

                        
                        
                        //await transaction_db_connection.query("UNLOCK TABLES");

                        
                        // INSERTING INTO eventRegistrationData as PENDING: LOCKING THE SEATS

                        //await db_connection.query("LOCK TABLES eventRegistrationData WRITE, eventData WRITE");

                        const [insertEventRegistrationData] = await db_connection.query("INSERT INTO eventRegistrationData (eventId, studentId, isMarketPlacePaymentMode, txnId, totalMembers, totalAmountPaid, teamName, registrationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);

                        
                        if (insertEventRegistrationData.affectedRows !== 1) {
                            
                            console.log("Failed to INSERT insertEventRegistrationData.");
                            console.log([req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);
                            
                            throw new Error("Failed to INSERT insertEventRegistrationData.");
                            
                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }



                        const [eventDataUpdate] = await db_connection.query("UPDATE eventData SET seatsFilled = ? WHERE eventId = ?", [eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);

                        if (eventDataUpdate.affectedRows !== 1) {
                            
                            console.log("Failed to UPDATE eventData.");
                            console.log([eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);
                            
                            throw new Error("Failed to UPDATE eventData.");

                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }


                        // await db_connection.query("UNLOCK TABLES");

                        await transaction_db_connection.commit();
                        await db_connection.commit();

                        const hash = generateHash({
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email
                        });


                        
                        // DONE. Move to Transaction from frontend.

                        return res.status(200).send({
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


                    } 
                    
                    else if (eventData[0].isGroup === "1" && eventData[0].needGroupData === "1") {

                        // teamMembers, memberRoles, teamName

                        if (eventData[0].isPerHeadPrice === "1") {
                            amount = (eventData[0].eventPrice * req.body.totalMembers) + Math.ceil((eventData[0].eventPrice * req.body.totalMembers) * 0.18);
                        } 
                        
                        else if (eventData[0].isPerHeadPrice === "0") {
                            amount = eventData[0].eventPrice + Math.ceil(eventData[0].eventPrice * 0.18);
                        }

                        productinfo = `EGPT-${req.body.studentId}-${req.body.eventId}-${req.body.totalMembers}-${amount}`;

                        
                        if (!(typeof (req.body.teamName) === "string" && req.body.teamName.length > 0 && req.body.teamName.length < 255)) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Failed to Register. Invalid Team Name"
                            });
                        }

                        
                        if (!(typeof (req.body.teamMembers) === "object" && req.body.teamMembers.length === req.body.totalMembers - 1 && Array.isArray(req.body.teamMembers))) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Failed to Register. Team Data invalid."
                            });
                        }

                        if (!(typeof (req.body.memberRoles) === "object" && req.body.memberRoles.length === req.body.teamMembers.length && Array.isArray(req.body.memberRoles))) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Failed to Register. Role Data invalid."
                            });
                        }

                        
                        let seenStudents = {};
                        seenStudents[studentData[0].studentEmail] = true;

                        
                        
                        for (let i = 0; i < req.body.teamMembers.length; i++) {
                            
                            if (!(typeof (req.body.teamMembers[i]) === "string" && req.body.teamMembers[i].length > 0 && req.body.teamMembers[i].length < 255)) {
                                
                                return res.status(400).send({
                                    "MESSAGE": "Failed to Register. Team Data invalid email."
                                });
                            }

                            if (validator.isEmail(req.body.teamMembers[i]) === false) {
                                
                                return res.status(400).send({
                                    "MESSAGE": "Failed to Register. Team Data invalid email."
                                });
                            }

                            if (!(typeof (req.body.memberRoles[i]) === "string" && req.body.memberRoles[i].length > 0 && req.body.memberRoles[i].length < 255)) {
                                
                                return res.status(400).send({
                                    "MESSAGE": "Failed to Register. Team Data invalid role."
                                });
                            }

                            if (seenStudents[req.body.teamMembers[i]] === true) {
                                
                                return res.status(400).send({
                                    "MESSAGE": "Duplicate team members!"
                                });
                            }

                            seenStudents[req.body.teamMembers[i]] = true;
                        }



                        // check if team members are not already registered for the same event and does have a passport.

                        await db_connection.query("LOCK TABLES studentData READ, eventRegistrationData READ, eventRegistrationGroupData READ");

                        const [studentDataCheck] = await db_connection.query("SELECT * FROM studentData WHERE studentAccountStatus = '2' AND studentEmail IN (?)", [req.body.teamMembers]);

                        
                        if (studentDataCheck.length !== req.body.teamMembers.length) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Failed to Register. One of your teammates do not have a passport yet or you gave a wrong email!"
                            });
                        }

                        let studentIds = [];
                        
                        for (let i = 0; i < studentDataCheck.length; i++) {
                            studentIds.push(studentDataCheck[i].studentId);
                        }

                        
                        
                        const [eventRegistrationCheck] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE eventId = ? AND studentId IN (?)", [req.body.eventId, studentIds]);

                        if (eventRegistrationCheck.length > 0) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Failed to Register. One of your teammates have already registered for the same event."
                            });
                        }

                        
                        const [eventRegistrationGroupCheck] = await db_connection.query("SELECT * FROM eventRegistrationGroupData WHERE eventId = ? AND studentId IN (?)", [req.body.eventId, studentIds]);

                        
                        
                        if (eventRegistrationGroupCheck.length > 0) {
                            return res.status(400).send({
                                "MESSAGE": "Failed to Register. One of your teammates is already part of another team!"
                            });
                        }

                        
                        await db_connection.query("UNLOCK TABLES");

                        
                        
                        // Team Members Verified.

                        // Inserting into transactionData as PENDING

                        await transaction_db_connection.query("LOCK TABLES transactionData READ");

                        const [tDataTest] = await transaction_db_connection.query("SELECT * FROM transactionData WHERE txnId = ?", [txnId]);

                        await transaction_db_connection.query("UNLOCK TABLES");
                        
                        if (tDataTest.length > 0) {
                            return res.status(400).send({
                                "MESSAGE": "Duplicate Transaction Attempt!"
                            });
                        }

                                                
                        await transaction_db_connection.beginTransaction();
                        await db_connection.beginTransaction();

                        rollbackFlag = "1"; 

                        const [insertTransactionData] = await transaction_db_connection.query("INSERT INTO transactionData (txnId, userId, amount, productinfo, firstname, email, phone, transactionStatus)  VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);

                        if (insertTransactionData.affectedRows !== 1) {
                            
                            console.log("Failed to INSERT transactionData.");
                            
                            console.log([txnId, req.body.studentId, amount, productinfo, firstname, email, phone, "0"]);
                            
                            throw new Error("Failed to INSERT transactionData.");

                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }

                        //await transaction_db_connection.query("UNLOCK TABLES");


                        // INSERTING INTO eventRegistrationData as PENDING: LOCKING THE SEATS

                        //await db_connection.query("LOCK TABLES eventRegistrationData WRITE, eventData WRITE, eventRegistrationGroupData WRITE");

                        const [insertEventRegistrationData] = await db_connection.query("INSERT INTO eventRegistrationData (eventId, studentId, isMarketPlacePaymentMode, txnId, totalMembers, totalAmountPaid, teamName, registrationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, req.body.teamName, "1"]);

                        
                        if (insertEventRegistrationData.affectedRows !== 1) {
                            
                            console.log("Failed to INSERT insertEventRegistrationData.");
                            
                            console.log([req.body.eventId, req.body.studentId, "0", txnId, req.body.totalMembers, amount, "INDIVIDUAL REGISTRATION", "1"]);
                            
                            throw new Error("Failed to INSERT insertEventRegistrationData.");
                            
                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }



                        // INSERTING INTO eventRegistrationGroupData.
                        const [insertGroupData] = await db_connection.query("INSERT INTO eventRegistrationGroupData (registrationId, txnId, studentId, eventId, roleDescription, isOwnRegistration) VALUES (?, ?, ?, ?, ?, ?)", [insertEventRegistrationData.insertId, txnId, req.body.studentId, req.body.eventId, "TEAM LEAD", "1"]);

                        if (insertGroupData.affectedRows !== 1) {
                            
                            console.log("Failed to INSERT insertGroupData.");
                            
                            console.log([insertEventRegistrationData.insertId, txnId, req.body.studentId, req.body.eventId, "TEAM LEAD", "1"]);
                            
                            throw new Error("Failed to INSERT insertGroupData.");

                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }


                        for (let i = 0; i < req.body.teamMembers.length; i++) {
                            
                            const [insertTeamData] = await db_connection.query("INSERT INTO eventRegistrationGroupData (registrationId, txnId, studentId, eventId, roleDescription, isOwnRegistration) VALUES (?, ?, ?, ?, ?, ?)", [insertEventRegistrationData.insertId, txnId, studentIds[i], req.body.eventId, req.body.memberRoles[i], "0"]);

                            if (insertTeamData.affectedRows !== 1) {
                                
                                console.log("Failed to INSERT insertTeamData.");
                                
                                console.log([insertEventRegistrationData.insertId, txnId, studentIds[i], req.body.eventId, req.body.memberRoles[i], "0"]);
                                
                                throw new Error("Failed to INSERT insertTeamData.");
                                
                                // return res.status(500).send({
                                //     "MESSAGE": "Internal Server Error. Contact Web Team"
                                // });
                            }
                        }


                        // Update eventData seatsFilled. Lock for 5 mins.

                        const [eventDataUpdate] = await db_connection.query("UPDATE eventData SET seatsFilled = ? WHERE eventId = ?", [eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);

                        if (eventDataUpdate.affectedRows !== 1) {
                            
                            console.log("Failed to UPDATE eventData.");
                            
                            console.log([eventData[0].seatsFilled + req.body.totalMembers, req.body.eventId]);
                            
                            throw new Error("Failed to UPDATE eventData.");

                            // return res.status(500).send({
                            //     "MESSAGE": "Internal Server Error. Contact Web Team"
                            // });
                        }


                        //await db_connection.query("UNLOCK TABLES");

                        await transaction_db_connection.commit();
                        await db_connection.commit();

                        const hash = generateHash({
                            "txnid": txnId,
                            "amount": amount,
                            "productinfo": productinfo,
                            "firstname": firstname,
                            "email": email
                        });

                        
                        // DONE. Move to Transaction from frontend.

                        return res.status(200).send({
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
                    }

                } else {
                    
                    return res.status(400).send({
                        "MESSAGE": "MarketPlace Payment mode coming soon. Kindly use PayU till then!",
                    });
                }


                // GROUP REGISTRATION DONE. 
                // MARKETPLACE IMPLEMENTATION PENDING;


            } catch (err) {

                if (rollbackFlag === "1") {
                    await db_connection.rollback();
                    await transaction_db_connection.rollback();
                }

                console.log(err);
                
                const time = new Date();
                fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - isValidEventRegistration - ${err}\n`);
                
                //await db_connection.query("UNLOCK TABLES");
                //await transaction_db_connection.query("UNLOCK TABLES");
                
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team"
                });

            } finally {
                await db_connection.query("UNLOCK TABLES");
                
                await transaction_db_connection.query("UNLOCK TABLES");
                
                db_connection.release();
                
                transaction_db_connection.release();
            }


        }
    ],

    // CREATE TABLE IF NOT EXISTS crewDetails (
    //     crewId INTEGER PRIMARY KEY AUTO_INCREMENT,
    //     crewName VARCHAR(255) NOT NULL
    // );
    
    // CREATE TABLE IF NOT EXISTS crewMembers (
    //     memberId INTEGER PRIMARY KEY AUTO_INCREMENT,
    //     memberEmail VARCHAR(180) UNIQUE,
    //     managerName VARCHAR(255) NOT NULL,
    //     crewId INTEGER NOT NULL,
    //     memberImageURL VARCHAR(255) NOT NULL,
    //     departmentId INTEGER NOT NULL,
    //     roleDescription VARCHAR(255) NOT NULL,
    //     FOREIGN KEY (departmentId) REFERENCES departmentData(departmentId),
    //     FOREIGN KEY (crewId) REFERENCES crewDetails(crewId)
    // );

    getCrew: async (req,res) => {
        const db_connection = await anokha_db.promise().getConnection();
        
        try{
            const [crew] = await db_connection
            .query(`
            SELECT crewMembers.memberId,
            crewMembers.memberEmail,
            crewMembers.managerName,
            crewDetails.crewName,
            crewMembers.memberImageURL,
            departmentData.departmentName,
            crewMembers.roleDescription,
            crewMembers.crewId
            FROM crewMembers
            LEFT JOIN 
            crewDetails ON crewMembers.crewId = crewDetails.crewId
            LEFT JOIN 
            departmentData ON crewMembers.departmentId = departmentData.departmentId
            ORDER BY crewMembers.crewId
            `);

            const crewData = [];
            
            crew.forEach(member => {
                if(crewData.some(obj => obj.crewName === member.crewName)){
                    crewData.find(obj => obj.crewName === member.crewName).teamMembers.push(member);
                }
                else{
                    crewData.push({
                        "crewName": member.crewName,
                        "crewId": member.crewId,
                        "teamMembers": [member]
                    });
                }
            });

            return res.status(200).send({
                "MESSAGE": "Successfully Fetched Crew Data",
                "CREW_DATA": crewData
            });

        }
        catch(err){
            console.log(err);

            const time = new Date();
            fs.appendFileSync('./logs/userController/errorLogs.log', `${time.toISOString()} - getCrew - ${err}\n`);

            return res.status(500).send({
                "MESSAGE": "Internal Server Error. Contact Web Team"
            });
        }
        finally{
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },
}