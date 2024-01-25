const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [adminTokenValidator,tokenValidatorRegister, adminTokenValidatorSpecial] = require('../middleware/auth/login/adminTokenValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const { db } = require('../config/appConfig');

module.exports = {
    testConnection: async (req, res) => {
        res.status(200).json({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "Admin"
        });
        return;
    },

    getAdminProfile: [
        adminTokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidAdminRequest(req.body.managerId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    await db_connection.query("LOCK TABLES managerData READ, managerRole READ, departmentData READ");
                    const query = `SELECT * FROM managerData
                    LEFT JOIN managerRole ON managerData.managerRoleId = managerRole.roleId
                    LEFT JOIN departmentData ON managerData.managerDepartmentId = departmentData.departmentId
                    WHERE managerData.managerId=?`;
                    const [manager] = await db_connection.query(query, [req.body.managerId]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Fetched Admin Profile.",
                        "managerFullName": manager[0].managerFullName,
                        "managerEmail": manager[0].managerEmail,
                        "managerPhone": manager[0].managerPhone,
                        "managerRoleId": manager[0].managerRoleId,
                        "managerRole": manager[0].roleName,
                        "managerDepartmentId": manager[0].departmentId,
                        "managerDepartment": manager[0].departmentName,
                        "managerDepartmentAbbreviation":manager[0].departmentAbbreviation
                    });
                    return;
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAdminProfile - ${err}\n`);
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

    /*{
        "managerFullName": "",
        "managerPhone": "",
        "managerDepartmentId": 
    }*/
    editAdminProfile: [
        adminTokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidAdminRequest(req.body.managerId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!await dataValidator.isValidAdminEditProfile(req.body)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    await db_connection.query("LOCK TABLES managerData WRITE, departmentData READ");
                    const [department] = await db_connection.query("SELECT * from departmentData WHERE departmentId = ?",[req.body.managerDepartmentId]);
                    if(department.length==0){
                        res.status(400).json({
                            "MESSAGE": "Department Doesn't exist!"
                        });
                        return;
                    }
                    const [manager] = await db_connection.query("SELECT * from managerData WHERE managerPhone = ? AND managerId != ?",[req.body.managerPhone, req.body.managerId]);
                    if(manager.length!=0){
                        res.status(400).json({
                            "MESSAGE": "Phone Number Associated with Another Account!"
                        });
                        return;
                    }
                    const query = `UPDATE managerData SET managerFullName=?, managerPhone=?, managerDepartmentId=? WHERE managerId=?`;
                    await db_connection.query(query, [req.body.managerFullName, req.body.managerPhone, req.body.managerDepartmentId, req.body.managerId]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Edited Admin Profile."
                    });
                    return;
                }
                catch(err)
                {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - editAdminProfile - ${err}\n`);
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

    addTag: [
        adminTokenValidator,
        async (req, res) => {
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!await dataValidator.isValidTag(req.body)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    await db_connection.query("LOCK TABLES tagData WRITE");
                    const query = `INSERT INTO tagData (tagName, tagAbbreviation) VALUES (?, ?)`;
                    await db_connection.query(query, [req.body.tagName, req.body.tagAbbreviation]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Added Tag."
                    });
                    return;
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - addTag - ${err}\n`);
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
        tagId: int,
        isActive: <"0"/"1">
    }
    */
    toggleTagStatus:[
        adminTokenValidator,
        async (req,res) =>{
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!(dataValidator.isValidToggleTagStatus(req.body))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    await db_connection.query("LOCK TABLES tagData WRITE");
                    const query = `UPDATE tagData SET isActive=? WHERE tagId=?`;
                    await db_connection.query(query, [req.body.isActive, req.body.tagId]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Toggled Tag Status."
                    });
                    return;
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleTagStatus - ${err}\n`);
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
    getAllTags: async (req,res) =>{
        const db_connection = await anokha_db.promise().getConnection();
        try{
            await db_connection.query("LOCK TABLES tagData READ");
            const [tags] = await db_connection.query("SELECT tagId, tagName, tagAbbreviation, isActive FROM tagData");
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            res.status(200).json({
                "MESSAGE": "Successfully Fetched All Tags.",
                "tags": tags
            });
            return;
        }
        catch(err){
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAllTags - ${err}\n`);
            res.status(500).json({
                "MESSAGE": "Internal Server Error. Contact Web Team."
            });
            return;
        }
        finally{
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },
    getActiveTags: async (req,res) =>{
        const db_connection = await anokha_db.promise().getConnection();
        try{
            await db_connection.query("LOCK TABLES tagData READ");
            const [tags] = await db_connection.query("SELECT tagId, tagName, tagAbbreviation FROM tagData WHERE isActive=1");
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            res.status(200).json({
                "MESSAGE": "Successfully Fetched Active Tags.",
                "tags": tags
            });
            return;
        }
        catch(err){
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getActiveTags - ${err}\n`);
            res.status(500).json({
                "MESSAGE": "Internal Server Error. Contact Web Team."
            });
            return;
        }
        finally{
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },
    createEvent: [
        adminTokenValidator,
        async (req, res) => {
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                //console.log("token");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if (!(await dataValidator.isValidCreateEvent(req.body))){
                //console.log("body");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    await db_connection.query("LOCK TABLES eventData WRITE");
                    const query =
                    `
                    INSERT INTO eventData
                    (
                        eventName,
                        eventDescription,
                        eventMarkdownDescription,
                        eventDate,
                        eventTime,
                        eventVenue,
                        eventImageURL,
                        eventPrice,
                        maxSeats,
                        minTeamSize,
                        maxTeamSize,
                        isWorkshop,
                        isTechnical,
                        isGroup,
                        isPerHeadPrice,
                        isRefundable,
                        needGroupData,
                        eventDepartmentId,
                        eventCreatedBy
                    )
                    VALUES
                    (?,?,?,?,? ,?,?,?,?,? ,?,?,?,?,? ,?,?,?,?)
                    `
                    const [event] = await db_connection.query(query, [
                        req.body.eventName,
                        req.body.eventDescription,
                        req.body.eventMarkdownDescription,
                        req.body.eventDate,
                        req.body.eventTime,
                        req.body.eventVenue,
                        req.body.eventImageURL,
                        req.body.eventPrice,
                        req.body.maxSeats,
                        req.body.minTeamSize,
                        req.body.maxTeamSize,
                        req.body.isWorkshop,
                        req.body.isTechnical,
                        req.body.isGroup,
                        req.body.isPerHeadPrice,
                        req.body.isRefundable,
                        req.body.needGroupData,
                        req.body.eventDepartmentId,
                        req.body.managerId
                    ]);

                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Created Event."
                    });
                    return;
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - createEvent - ${err}\n`);
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
    editEventData: [
        adminTokenValidator,
        async (req, res) => {
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                //console.log("token");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if (!(await dataValidator.isValidEditEventData(req.body))){
                //console.log("body");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    await db_connection.query("LOCK TABLES eventData WRITE");
                    const query =
                    `
                    UPDATE eventData
                    SET
                        eventName = ?,
                        eventDescription = ?,
                        eventMarkdownDescription = ?,
                        eventDate = ?,
                        eventTime = ?,
                        eventVenue = ?,
                        eventImageURL = ?,
                        eventPrice = ?,
                        maxSeats = ?,
                        minTeamSize = ?,
                        maxTeamSize = ?,
                        isWorkshop = ?,
                        isTechnical = ?,
                        isGroup = ?,
                        isPerHeadPrice = ?,
                        isRefundable = ?,
                        needGroupData = ?,
                        eventDepartmentId = ?
                    WHERE eventId = ?
                    `
                    const [event] = await db_connection.query(query, [
                        req.body.eventName,
                        req.body.eventDescription,
                        req.body.eventMarkdownDescription,
                        req.body.eventDate,
                        req.body.eventTime,
                        req.body.eventVenue,
                        req.body.eventImageURL,
                        req.body.eventPrice,
                        req.body.maxSeats,
                        req.body.minTeamSize,
                        req.body.maxTeamSize,
                        req.body.isWorkshop,
                        req.body.isTechnical,
                        req.body.isGroup,
                        req.body.isPerHeadPrice,
                        req.body.isRefundable,
                        req.body.needGroupData,
                        req.body.eventDepartmentId,
                        req.body.eventId
                    ]);

                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Updated Event."
                    });
                    return;
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - editEventData - ${err}\n`);
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
    toggleEventStatus: [
        adminTokenValidator,
        async (req, res) => {
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                //console.log("token");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if (!(await dataValidator.isValidToggleEventStatus(req.body))){
                //console.log("body");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    await db_connection.query("LOCK TABLES eventData WRITE");
                    
                    const query =`UPDATE eventData SET eventStatus = ? WHERE eventId = ?`
                    
                    const [event] = await db_connection.query(query, [req.body.eventStatus, req.body.eventId]);

                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": req.body.eventStatus=="1" ? "Successfully Activated Event." : (req.body.eventStatus==2 ? "Successfully Closed Event Registrations." : "Successfully Removed Event from Anokha.")
                    });
                    return;
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleEventStatus - ${err}\n`);
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
        "eventId": int,
        "tagId": int
    }
    */
    addTagToEvent:[
        adminTokenValidator,
        async (req,res) => {
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidTagEvent(req.body))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                db_connection = await anokha_db.promise().getConnection();
                try{
                    db_connection.query("LOCK TABLES eventTagData WRITE");
                    const [check] = await db_connection.query("SELECT * FROM eventTagData WHERE eventId=? AND tagId=?", [req.body.eventId, req.body.tagId]);
                    if(check.length!=0){
                        res.status(400).json({
                            "MESSAGE": "Tag Already Exists for given event!"
                        });
                        return;
                    }
                    else{
                        await db_connection.query("INSERT INTO eventTagData (eventId, tagId) VALUES (?,?)", [req.body.eventId, req.body.tagId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Added Tag to Event."
                        });
                        return;
                    }
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - addTagToEvent - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
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
        "eventId": int,
        "tagId": int
    }
    */
    removeTagFromEvent:[
        adminTokenValidator,
        async (req,res) => {
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidTagEvent(req.body))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                db_connection = await anokha_db.promise().getConnection();
                try{
                    db_connection.query("LOCK TABLES eventTagData WRITE");
                    
                    await db_connection.query("DELETE FROM eventTagData WHERE eventId = ? AND tagId = ?", [req.body.eventId, req.body.tagId]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Removed Tag from Event."
                    });
                    return;
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - removeTagFromEvent - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                finally{
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],

    getAllOfficials: [
        adminTokenValidator,
        async (req, res) => {
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                if(req.body.authorizationTier == 1 || req.body.authorizationTier == 2){
                    const db_connection = await anokha_db.promise().getConnection();
                    try{
                        await db_connection.query("LOCK TABLES managerData READ, managerRole READ, departmentData READ");
                        const query = 
                        `SELECT
                        managerData.managerId,
                        managerData.managerFullName,
                        managerData.managerEmail,
                        managerData.managerPhone,
                        managerData.managerAccountStatus,
                        managerData.managerRoleId,
                        managerRole.roleName,
                        managerData.managerDepartmentId,
                        departmentData.departmentName,
                        departmentData.departmentAbbreviation                
                        FROM managerData
                        LEFT JOIN managerRole 
                        ON managerData.managerRoleId = managerRole.roleId
                        LEFT JOIN departmentData 
                        ON managerData.managerDepartmentId = departmentData.departmentId
                        WHERE managerData.managerId != ?
                        `;
                        const [officials] = await db_connection.query(query, [req.body.managerId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Fetched All Officials.",
                            "officials": officials
                        });
                        return;
                    }
                    catch(err){
                        console.log(err);
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAllOfficials - ${err}\n`);
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
                else if (req.body.authorizationTier == 4){
                    const db_connection = await anokha_db.promise().getConnection();
                    try{
                        await db_connection.query("LOCK TABLES managerData READ, managerRole READ, departmentData READ");
                        const query = 
                        `SELECT 
                        managerData.managerId,
                        managerData.managerFullName,
                        managerData.managerEmail,
                        managerData.managerPhone,
                        managerData.managerAccountStatus,
                        managerData.managerRoleId,
                        managerRole.roleName,
                        managerData.managerDepartmentId,
                        departmentData.departmentName,
                        departmentData.departmentAbbreviation
                        FROM managerData
                        LEFT JOIN managerRole 
                        ON managerData.managerRoleId = managerRole.roleId
                        LEFT JOIN departmentData 
                        ON managerData.managerDepartmentId = departmentData.departmentId
                        WHERE managerData.managerAddedBy = ?
                        `;
                        const [officials] = await db_connection.query(query, [req.body.managerId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Fetched All Officials.",
                            "officials": officials
                        });
                        return;
                    }
                    catch(err){
                        console.log(err);
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAllOfficials - ${err}\n`);
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
                else{
                    res.status(400).json({
                        "MESSAGE": "Access Restricted!"
                    });
                    return;
                }
            }
        }
    ],

    /*
    {
        "studentId": int,
        "isActive": <"0"/"1">
    }
    */
    toggleStudentStatus:[
        adminTokenValidator,
        async (req,res) => {
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidToggleStudentStatus(req.body))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    if (req.body.isActive == "0")
                    {
                        db_connection.query("LOCK TABLES studentData WRITE, blockedStudentStatus WRITE");
                        const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.body.studentId]);
                        if(check.length==0){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Student Doesn't Exist!"
                            });
                            return;
                        }
                        else if(check.length > 0 && check[0].studentAccountStatus =="0" )
                        {
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Student Already Blocked!"
                            });
                            return;
                        }
                        else{
                            await db_connection.query("INSERT INTO blockedStudentStatus (studentId, lastStatus, blockedBy) VALUES (?, ?, ?)", [req.body.studentId, check[0].studentAccountStatus, req.body.managerId]);
                            await db_connection.query("UPDATE studentData SET studentAccountStatus = ? WHERE studentId = ?", [req.body.isActive, req.body.studentId]);
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": "Successfully Blocked Student."
                            });
                        }
                    }

                    else if (req.body.isActive == "1")
                    {
                        db_connection.query("LOCK TABLES studentData WRITE, blockedStudentStatus WRITE");
                        const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.body.studentId]);
                        //console.log(check);
                        if(check.length==0){
                            //console.log("check");
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Student Doesn't Exist!"
                            });
                            return;
                        }
                        if((check.length > 0) && (check[0].studentAccountStatus !="0") )
                        {
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Student Already Active!"
                            });
                            return;
                        }
                        else{
                            const [lastStatus] = await db_connection.query("SELECT lastStatus FROM blockedStudentStatus WHERE studentId=?", [req.body.studentId]);
                            if(lastStatus.length==0){
                                //console.log("lastStatus");
                                await db_connection.query("UNLOCK TABLES");
                                db_connection.release();
                                res.status(400).json({
                                    "MESSAGE": "Student Doesn't Exist!"
                                });
                                return;
                            }
                            else{
                                await db_connection.query("UPDATE studentData SET studentAccountStatus = ? WHERE studentId = ?", [lastStatus[0].lastStatus, req.body.studentId]);
                                await db_connection.query("DELETE FROM blockedStudentStatus WHERE studentId=?", [req.body.studentId]);
                                await db_connection.query("UNLOCK TABLES");
                                db_connection.release();
                                res.status(200).json({
                                    "MESSAGE": "Successfully Unblocked Student."
                                });
                            }
                        }

                    }
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleStudentStatus - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                finally{
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],

    toggleOfficialStatus:[
        adminTokenValidatorSpecial,
        async (req,res) => {
            if(!(await dataValidator.isValidAdminRequest(req.body.tokenManagerId))){
                //console.log("token");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!(await dataValidator.isValidToggleOfficialStatus(req.body))){
                //console.log("body");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if((req.body.managerId == req.body.tokenManagerId)){
                //console.log("manager");
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                db_connection = await anokha_db.promise().getConnection();
                if (req.body.authorizationTier == 1)
                {
                    try{
                        await db_connection.query("LOCK TABLES managerData WRITE");
                        const [check] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        if(check.length==0){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Official Doesn't Exist!"
                            });
                            return;
                        }
                        //can't toggle status of SUPER_ADMIN
                        if(check.length > 0 && (check[0].managerRoleId == 1)){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Access Restricted!"
                            });
                            return;
                        }
                        else{
                            await db_connection.query("UPDATE managerData SET managerAccountStatus = ? WHERE managerId = ?", [req.body.isActive, req.body.managerId]);
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": (req.body.isActive == "1") ? "Successfully Activated Official." : "Successfully Blocked Official."
                            });
                        }
                    }
                    catch(err){
                        console.log(err);
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleOfficialStatus - ${err}\n`);
                        res.status(500).json({
                            "MESSAGE": "Internal Server Error. Contact Web Team."
                        });
                    }
                    finally{
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                    }
                }
                else if (req.body.authorizationTier == 2)
                {
                    try{
                        await db_connection.query("LOCK TABLES managerData WRITE");
                        const [check] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        if(check.length==0){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Official Doesn't Exist!"
                            });
                            return;
                        }
                        //can't toggle status of ADMIN and SUPER_ADMIN
                        if(check.length > 0 && (check[0].managerRoleId == 1 || check[0].managerRoleId == 2)){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Access Restricted!"
                            });
                            return;
                        }
                        else{
                            await db_connection.query("UPDATE managerData SET managerAccountStatus = ? WHERE managerId = ?", [req.body.isActive, req.body.managerId]);
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": (req.body.isActive == "1") ? "Successfully Activated Official." : "Successfully Blocked Official."
                            });
                        }
                    }
                    catch(err){
                        console.log(err);
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleOfficialStatus - ${err}\n`);
                        res.status(500).json({
                            "MESSAGE": "Internal Server Error. Contact Web Team."
                        });
                    }
                    finally{
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                    }
                }
                else if (req.body.authorizationTier == 4)
                {
                    try{
                        await db_connection.query("LOCK TABLES managerData WRITE");
                        const [check] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        if(check.length==0){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Official Doesn't Exist!"
                            });
                            return;
                        }
                        //can't toggle status if not registered by DEPARTMENT HEAD
                        if(check.length > 0 && check[0].managerAddedBy != req.body.tokenManagerId){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Access Restricted!"
                            });
                            return;
                        }
                        else{
                            await db_connection.query("UPDATE managerData SET managerAccountStatus = ? WHERE managerId = ?", [req.body.isActive, req.body.managerId]);
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": (req.body.isActive == "1") ? "Successfully Activated Official." : "Successfully Blocked Official."
                            });
                        }
                    }
                    catch(err){
                        console.log(err);
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleOfficialStatus - ${err}\n`);
                        res.status(500).json({
                            "MESSAGE": "Internal Server Error. Contact Web Team."
                        });
                    }
                    finally{
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                    }
                }
            }
        }
    ],
    
    assignEventToOfficial: [
        adminTokenValidatorSpecial,
        async (req,res) => {
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidAssignEventToOfficial(req.body))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                db_connection = await anokha_db.promise().getConnection();
                try{
                    if(req.body.authorizationTier==1 || req.body.authorizationTier==2){
                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE");
                        const [check] = await db_connection.query("SELECT * FROM eventOrganizersData WHERE eventId=? AND managerId=?", [req.body.eventId, req.body.managerId]);
                        if(check.length!=0){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Official Already Assigned to Event!"
                            });
                            return;
                        }
                        else{
                            await db_connection.query("INSERT INTO eventOrganizersData (eventId, managerId) VALUES (?,?)", [req.body.eventId, req.body.managerId]);
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": "Successfully Assigned Official to Event."
                            });
                            return;
                        }
                    }
                    else if(req.body.authorizationTier==4){
                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE, eventData READ, managerData READ");
                        const [manager] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ? AND eventDepartmentId = ?", [req.body.eventId, manager[0].managerDepartmentId]);
                        if(event.length == 0)
                        {
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Access Restricted!"
                            });
                            return;
                        
                        }
                        const [check] = await db_connection.query("SELECT * FROM eventOrganizersData WHERE eventId=? AND managerId=?", [req.body.eventId, req.body.managerId]);
                        if(check.length!=0){
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Official Already Assigned to Event!"
                            });
                            return;
                        }
                        else{
                            await db_connection.query("INSERT INTO eventOrganizersData (eventId, managerId) VALUES (?,?)", [req.body.eventId, req.body.managerId]);
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": "Successfully Assigned Official to Event."
                            });
                            return;
                        }
                    }
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - assignEventToOfficial - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                finally{
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ],

    removeOfficialFromEvent: [
        adminTokenValidatorSpecial,
        async (req,res) => {
            if(!(await dataValidator.isValidAdminRequest(req.body.managerId))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!(await dataValidator.isValidAssignEventToOfficial(req.body))){
                res.status(400).json({
                    "MESSAGE": "Invalid Request!"
                });
                return;
            }
            else{
                db_connection = await anokha_db.promise().getConnection();
                try{
                    if(req.body.authorizationTier==1 || req.body.authorizationTier==2){
                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE");
                        await db_connection.query("DELETE FROM eventOrganizersData WHERE eventId = ? AND managerId = ?", [req.body.eventId, req.body.managerId]);
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                        res.status(200).json({
                            "MESSAGE": "Successfully Removed Official from Event."
                        });
                        return;
                    }
                    else if(req.body.authorizationTier==4){
                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE, eventData READ, managerData READ");
                        const [manager] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ? AND eventDepartmentId = ?", [req.body.eventId, manager[0].managerDepartmentId]);
                        if(event.length == 0)
                        {
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": "Access Restricted!"
                            });
                            return;
                        
                        }
                        else{
                            await db_connection.query("DELETE FROM eventOrganizersData WHERE eventId = ? AND managerId = ?", [req.body.eventId, req.body.managerId]);
                            await db_connection.query("UNLOCK TABLES");
                            db_connection.release();
                            res.status(200).json({
                                "MESSAGE": "Successfully Removed Official from Event."
                            });
                            return;
                        }
                    }
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - removeOfficialFromEvent - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                finally{
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }
    ]
}