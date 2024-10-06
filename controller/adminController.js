const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [adminTokenValidator,tokenValidatorRegister, adminTokenValidatorSpecial] = require('../middleware/auth/login/adminTokenValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const { db } = require('../config/appConfig');
const {unlockTables, getEventRegistrationCount, getEventRegistrationData} = require('../db/sql/adminController/queries');

module.exports = {
    testConnection: async (req, res) => {
        return res.status(200).send({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "Admin"
        });
    },

    getAdminProfile: [
        adminTokenValidator,
        async (req, res) => {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {

                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }

                    await db_connection.query("LOCK TABLES managerData READ, managerRole READ, departmentData READ");
                    
                    const query = `SELECT * FROM managerData
                    LEFT JOIN managerRole 
                    ON managerData.managerRoleId = managerRole.roleId
                    LEFT JOIN departmentData 
                    ON managerData.managerDepartmentId = departmentData.departmentId
                    WHERE managerData.managerId=?`;

                    const [manager] = await db_connection.query(query, [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
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
                
                }
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAdminProfile - ${err}\n`);
                    
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

    
    /*{
        "managerFullName": "",
        "managerPhone": "",
        "managerDepartmentId": 
    }*/
    editAdminProfile: [
        adminTokenValidator,
        async (req, res) => {
            
            if(!dataValidator.isValidAdminEditProfile(req.body)){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            
            }

            else {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {

                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }


                    await db_connection.query("LOCK TABLES managerData WRITE, departmentData READ");
                    
                    const [department] = await db_connection.query("SELECT * from departmentData WHERE departmentId = ?",[req.body.managerDepartmentId]);
                    
                    if(department.length==0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Department Doesn't exist!"
                        });
                    
                    }
                    

                    const [manager] = await db_connection.query("SELECT * from managerData WHERE managerPhone = ? AND managerId != ?",[req.body.managerPhone, req.body.managerId]);
                    
                    if(manager.length!=0){
                    
                        return res.status(400).send({
                            "MESSAGE": "Phone Number Associated with Another Account!"
                        });
                    
                    }
                    
                    
                    const query = `UPDATE managerData SET managerFullName=?, managerPhone=?, managerDepartmentId=? WHERE managerId=?`;
                    
                    await db_connection.query(query, [req.body.managerFullName, req.body.managerPhone, req.body.managerDepartmentId, req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Edited Admin Profile."
                    });
                
                }
                catch(err)
                {
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - editAdminProfile - ${err}\n`);
                    
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

    addTag: [
        adminTokenValidator,
        async (req, res) => {
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });

            }
            
            if(!dataValidator.isValidTag(req.body)){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });

            }

            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    
                    await db_connection.query("LOCK TABLES tagData READ");
                    
                    const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagName = ? OR tagAbbreviation =?", [req.body.tagName, req.body.tagAbbreviation]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (tagData.length != 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Tag Already Exists!"
                        });
                    
                    }

                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                    
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }

                    
                    await db_connection.query("LOCK TABLES tagData WRITE");
                    
                    const query = `INSERT INTO tagData (tagName, tagAbbreviation) VALUES (?, ?)`;
                    
                    await db_connection.query(query, [req.body.tagName, req.body.tagAbbreviation]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Added Tag."
                    });
                
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - addTag - ${err}\n`);
                    
                    return res.status(500).send({
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
        tagId: int,
        isActive: <"0"/"1">
    }
    */
    toggleTagStatus:[
        adminTokenValidator,
        async (req,res) =>{
            
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            if(!(dataValidator.isValidToggleTagStatus(req.body))){
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    
                    await db_connection.query("LOCK TABLES tagData READ");
                    
                    const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId = ?", [req.body.tagId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (tagData.length === 0) {

                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    
                    }

                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }

                    
                    await db_connection.query("LOCK TABLES tagData WRITE");
                    
                    const query = `UPDATE tagData SET isActive=? WHERE tagId=?`;
                    
                    await db_connection.query(query, [req.body.isActive, req.body.tagId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Toggled Tag Status."
                    });
                
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleTagStatus - ${err}\n`);
                    
                    return res.status(500).send({
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


    getAllTags: async (req,res) =>{
        
        const db_connection = await anokha_db.promise().getConnection();
        
        try{
            
            await db_connection.query("LOCK TABLES tagData READ");
            
            const [tags] = await db_connection.query("SELECT tagId, tagName, tagAbbreviation, isActive FROM tagData");
            
            await db_connection.query("UNLOCK TABLES");
            
            return res.status(200).send({
                "MESSAGE": "Successfully Fetched All Tags.",
                "tags": tags
            });
        
        }
        
        catch(err){
            
            console.log(err);
            
            const time = new Date();
            fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAllTags - ${err}\n`);
            
            return res.status(500).send({
                "MESSAGE": "Internal Server Error. Contact Web Team."
            });
        
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
            
            return res.status(200).send({
                "MESSAGE": "Successfully Fetched Active Tags.",
                "tags": tags
            });
        
        }
        
        catch(err){
            
            console.log(err);
            
            const time = new Date();
            fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getActiveTags - ${err}\n`);
            
            return res.status(500).send({
                "MESSAGE": "Internal Server Error. Contact Web Team."
            });
        
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
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            
            }

            if (!(dataValidator.isValidCreateEvent(req.body))){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                let rollbackFlag = "0";

                try{
                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }


                    //check if department exists and tags are valid
                    await db_connection.query("LOCK TABLES departmentData READ, tagData READ");
                    
                    const [departmentData] = await db_connection.query("SELECT * FROM departmentData WHERE departmentId = ?", [req.body.eventDepartmentId]);
                    
                    if (departmentData.length === 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Department!"
                        });
                    
                    }
                    
                    if (req.body.tags.length != 0) {
                        
                        const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId IN (?)", [req.body.tags]);
                        
                        if (tagData.length != req.body.tags.length) {
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Invalid Tags!"
                            });
                        
                        }
                    
                    }
                    
                    
                    await db_connection.query("UNLOCK TABLES");



                    await db_connection.beginTransaction();

                    rollbackFlag = "1";
                    
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

                    for (let i = 0; i < req.body.tags.length; i++) {
                        await db_connection.query("INSERT INTO eventTagData (eventId, tagId) VALUES (?, ?)", [event.insertId, req.body.tags[i]]);
                    }

                    await db_connection.commit();
                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Created Event."
                    });
                
                }
                catch(err){

                    if (rollbackFlag=== "1") {
                        await db_connection.rollback();
                    }

                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - createEvent - ${err}\n`);
                    
                    return res.status(500).send({
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


    editEventData: [
        adminTokenValidator,
        async (req, res) => {
            
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            
            }

            if (!(dataValidator.isValidEditEventData(req.body))){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();

                let rollbackFlag = "0";
                
                try{
                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }


                    //check if department exists, event exists and tags are valid
                    await db_connection.query("LOCK TABLES departmentData READ");
                    
                    const [departmentData] = await db_connection.query("SELECT * FROM departmentData WHERE departmentId = ?", [req.body.eventDepartmentId]);
                    
                    if (departmentData.length === 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Department!"
                        });

                    }
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    await db_connection.query("LOCK TABLES eventData READ");
                    
                    const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.body.eventId]);
                    
                    if (eventData.length === 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Event!"
                        });
                    
                    }

                    
                    await db_connection.query("LOCK TABLES tagData READ");
                    
                    if (req.body.tags.length != 0) {
                        
                        const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId IN (?)", [req.body.tags]);
                        
                        if (tagData.length != req.body.tags.length) {
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Invalid Tags!"
                            });
                        
                        }
                    
                    }
                    
                    await db_connection.query("UNLOCK TABLES");



                    await db_connection.beginTransaction();
                    
                    rollbackFlag = "1";

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

                    await db_connection.query("DELETE FROM eventTagData WHERE eventId = ?", [req.body.eventId]);

                    for (let i = 0; i < req.body.tags.length; i++) {
                        await db_connection.query("INSERT INTO eventTagData (eventId, tagId) VALUES (?, ?)", [req.body.eventId, req.body.tags[i]]);
                    }

                    await db_connection.commit();

                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Updated Event."
                    });
                
                }
                catch(err){

                    if (rollbackFlag === "1") {
                        await db_connection.rollback();
                    }

                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - editEventData - ${err}\n`);
                    
                    return res.status(500).send({
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

    
    toggleEventStatus: [
        adminTokenValidator,
        async (req, res) => {
            
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)) {
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            
            }
            
            if (!(dataValidator.isValidToggleEventStatus(req.body))){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    await db_connection.query("UNLOCK TABLES");
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }


                    //check if event exists
                    await db_connection.query("LOCK TABLES eventData READ");
                    
                    const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.body.eventId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (eventData.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Event!"
                        });
                    
                    }


                    await db_connection.query("LOCK TABLES eventData WRITE");
                    
                    const query =`UPDATE eventData SET eventStatus = ? WHERE eventId = ?`
                    
                    const [event] = await db_connection.query(query, [req.body.eventStatus, req.body.eventId]);

                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
                        "MESSAGE": req.body.eventStatus=="1" ? "Successfully Activated Event." : (req.body.eventStatus==2 ? "Successfully Closed Event Registrations." : "Successfully Removed Event from Anokha.")
                    });

                
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleEventStatus - ${err}\n`);
                    
                    return res.status(500).send({
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
    addTagToEvent:[
        adminTokenValidator,
        async (req,res) => {
            
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            
            }
            
            if(!(dataValidator.isValidTagEvent(req.body))){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{

                    await db_connection.query("LOCK TABLES eventData READ, tagData READ");
                    
                    const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.body.eventId]);
                    
                    const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId = ?", [req.body.tagId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (eventData.length === 0 || tagData.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    
                    }

                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }


                    await db_connection.query("LOCK TABLES eventTagData WRITE");
                    
                    const [check] = await db_connection.query("SELECT * FROM eventTagData WHERE eventId=? AND tagId=?", [req.body.eventId, req.body.tagId]);
                    
                    if(check.length!=0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Tag Already Exists for given event!"
                        });
                    
                    }
                    
                    else{
                        
                        await db_connection.query("INSERT INTO eventTagData (eventId, tagId) VALUES (?,?)", [req.body.eventId, req.body.tagId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                    
    
                        return res.status(200).send({
                            "MESSAGE": "Successfully Added Tag to Event."
                        });
                    
                    }
                
                }
                
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - addTagToEvent - ${err}\n`);
                    
                    return res.status(500).send({
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
            
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            
            }
            
            if(!(dataValidator.isValidTagEvent(req.body))){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    
                    await db_connection.query("LOCK TABLES eventData READ, tagData READ");
                    
                    const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.body.eventId]);
                    
                    const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId = ?", [req.body.tagId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (eventData.length === 0 || tagData.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    
                    }

                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }

                    
                    await db_connection.query("LOCK TABLES eventTagData WRITE");
                    
                    await db_connection.query("DELETE FROM eventTagData WHERE eventId = ? AND tagId = ?", [req.body.eventId, req.body.tagId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
                        "MESSAGE": "Successfully Removed Tag from Event."
                    });
                
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - removeTagFromEvent - ${err}\n`);
                    
                    return res.status(500).send({
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
            
                if(req.body.authorizationTier == 1 || req.body.authorizationTier == 2){
                    
                    const db_connection = await anokha_db.promise().getConnection();
                    
                    try{

                        await db_connection.query("LOCK TABLES managerData READ");
                        
                        const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Access Restricted!"
                            });
                        
                        }

                        
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
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Fetched All Officials.",
                            "officials": officials
                        });
                    
                    }
                    
                    catch(err){
                        
                        console.log(err);
                        
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAllOfficials - ${err}\n`);
                        
                        return res.status(500).send({
                            "MESSAGE": "Internal Server Error. Contact Web Team."
                        });
                    
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
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Fetched All Officials.",
                            "officials": officials
                        });
                    
                    }
                    
                    catch(err){
                        
                        console.log(err);
                        
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAllOfficials - ${err}\n`);
                        
                        return res.status(500).send({
                            "MESSAGE": "Internal Server Error. Contact Web Team."
                        });
                    
                    }
                    finally{
                        
                        await db_connection.query("UNLOCK TABLES");
                        db_connection.release();
                    
                    }
                }
                
                else{
                    
                    return res.status(400).send({
                        "MESSAGE": "Access Restricted!"
                    });
                
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
            
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2)){
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }
            
            if(!(dataValidator.isValidToggleStudentStatus(req.body))){
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();

                let rollbackFlag = "0";
                
                try{
                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    
                    }


                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT * FROM studentData WHERE studentId = ?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    
                    }

                    
                    
                    if (req.body.isActive == "0")
                    {
                        await db_connection.query("LOCK TABLES studentData READ");
                        
                        const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.body.studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");

                        if(check.length==0){
                                                        
                            return res.status(400).send({
                                "MESSAGE": "Student Doesn't Exist!"
                            });
                        }
                        
                        else if(check.length > 0 && check[0].studentAccountStatus =="0" )
                        {
                            
                            return res.status(400).send({
                                "MESSAGE": "Student Already Blocked!"
                            });
                        }

                        
                        else{

                            await db_connection.beginTransaction();

                            rollbackFlag = "1"; 
                            
                            await db_connection.query("INSERT INTO blockedStudentStatus (studentId, lastStatus, blockedBy) VALUES (?, ?, ?)", [req.body.studentId, check[0].studentAccountStatus, req.body.managerId]);
                            
                            await db_connection.query("UPDATE studentData SET studentAccountStatus = ? WHERE studentId = ?", [req.body.isActive, req.body.studentId]);
                            
                            await db_connection.commit();
                            
                            return res.status(200).send({
                                "MESSAGE": "Successfully Blocked Student."
                            });
                        }
                    }

                    else if (req.body.isActive == "1")
                    {
                        await db_connection.query("LOCK TABLES studentData READ");
                        
                        const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.body.studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        if(check.length==0){
                            
                            return res.status(400).send({
                                "MESSAGE": "Student Doesn't Exist!"
                            });
                        }
                        
                        if((check.length > 0) && (check[0].studentAccountStatus !="0") )
                        {

                            return res.status(400).send({
                                "MESSAGE": "Student Already Active!"
                            });
                        }
                        
                        else{

                            await db_connection.query("LOCK TABLES blockedStudentStatus READ");
                            
                            const [lastStatus] = await db_connection.query("SELECT lastStatus FROM blockedStudentStatus WHERE studentId=?", [req.body.studentId]);
                            
                            await db_connection.query("UNLOCK TABLES");

                            if(lastStatus.length==0){
                                
                                return res.status(400).send({
                                    "MESSAGE": "Student Doesn't Exist!"
                                });
                            }
                            
                            else{

                                await db_connection.beginTransaction();

                                rollbackFlag = "1";
                                
                                await db_connection.query("UPDATE studentData SET studentAccountStatus = ? WHERE studentId = ?", [lastStatus[0].lastStatus, req.body.studentId]);
                                
                                await db_connection.query("DELETE FROM blockedStudentStatus WHERE studentId=?", [req.body.studentId]);
                                
                                await db_connection.commit();
                                
                                return res.status(200).send({
                                    "MESSAGE": "Successfully Unblocked Student."
                                });
                            }
                        }

                    }
                }
                
                catch(err){

                    if (rollbackFlag === "1") {
                        await db_connection.rollback();
                    }

                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleStudentStatus - ${err}\n`);
                    
                    return res.status(500).send({
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
            
            if(!(dataValidator.isValidToggleOfficialStatus(req.body))){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            
            }
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4)){
                //console.log("auth");
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }
            if((req.body.managerId == req.body.tokenManagerId)){
                //console.log("manager");
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            }
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                if (req.body.authorizationTier == 1)
                {
                    
                    try{

                        await db_connection.query("LOCK TABLES managerData READ");
                        
                        const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.tokenManagerId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                            
                            return res.status(400).send({
                                "MESSAGE": "Access Restricted!"
                            });
                        }

                        
                        
                        await db_connection.query("LOCK TABLES managerData WRITE");
                        
                        const [check] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        
                        if(check.length==0){
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Official Doesn't Exist!"
                            });
                        }
                        
                        
                        //can't toggle status of SUPER_ADMIN
                        if(check.length > 0 && (check[0].managerRoleId == 1)){
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Access Restricted!"
                            });
                        }
                        
                        else{
                            
                            await db_connection.query("UPDATE managerData SET managerAccountStatus = ? WHERE managerId = ?", [req.body.isActive, req.body.managerId]);
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(200).send({
                                "MESSAGE": (req.body.isActive == "1") ? "Successfully Activated Official." : "Successfully Blocked Official."
                            });
                        }
                    
                    }
                    
                    catch(err){
                        
                        console.log(err);
                        
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleOfficialStatus - ${err}\n`);
                        
                        return res.status(500).send({
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
                            
                            return res.status(400).send({
                                "MESSAGE": "Official Doesn't Exist!"
                            });
                        }
                        
                        
                        //can't toggle status of ADMIN and SUPER_ADMIN
                        if(check.length > 0 && (check[0].managerRoleId == 1 || check[0].managerRoleId == 2)){
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Access Restricted!"
                            });
                        }
                        
                        
                        else{
                            await db_connection.query("UPDATE managerData SET managerAccountStatus = ? WHERE managerId = ?", [req.body.isActive, req.body.managerId]);
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(200).send({
                                "MESSAGE": (req.body.isActive == "1") ? "Successfully Activated Official." : "Successfully Blocked Official."
                            });
                        }
                    }
                    
                    catch(err){
                        
                        console.log(err);
                        
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleOfficialStatus - ${err}\n`);
                        
                        return res.status(500).send({
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
                            
                            return res.status(400).send({
                                "MESSAGE": "Official Doesn't Exist!"
                            });
                        
                        }
                        
                        
                        
                        //can't toggle status if not registered by DEPARTMENT HEAD
                        if(check.length > 0 && check[0].managerAddedBy != req.body.tokenManagerId){
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Access Restricted!"
                            });
                        }
                        

                        else{
                            
                            await db_connection.query("UPDATE managerData SET managerAccountStatus = ? WHERE managerId = ?", [req.body.isActive, req.body.managerId]);
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(200).send({
                                "MESSAGE": (req.body.isActive == "1") ? "Successfully Activated Official." : "Successfully Blocked Official."
                            });
                        }
                    }
                    
                    catch(err){
                        
                        console.log(err);
                        
                        const time = new Date();
                        fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - toggleOfficialStatus - ${err}\n`);
                        
                        return res.status(500).send({
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
            
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }
            
            if(!(dataValidator.isValidAssignEventToOfficial(req.body))){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{

                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }


                    //check if event exists
                    await db_connection.query("LOCK TABLES eventData READ, managerData READ");
                    
                    const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.body.eventId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (eventData.length === 0 || managerData.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }


                    if(req.body.authorizationTier==1 || req.body.authorizationTier==2){
                        
                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE");
                        
                        const [check] = await db_connection.query("SELECT * FROM eventOrganizersData WHERE eventId=? AND managerId=?", [req.body.eventId, req.body.managerId]);
                        
                        if(check.length!=0){
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Official Already Assigned to Event!"
                            });
                        }
                        
                        else{
                            
                            await db_connection.query("INSERT INTO eventOrganizersData (eventId, managerId) VALUES (?,?)", [req.body.eventId, req.body.managerId]);
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(200).send({
                                "MESSAGE": "Successfully Assigned Official to Event."
                            });
                        }
                    }
                    
                    else if(req.body.authorizationTier==4){
                        
                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE, eventData READ, managerData READ");
                        
                        const [manager] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        
                        const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ? AND eventDepartmentId = ?", [req.body.eventId, manager[0].managerDepartmentId]);
                        
                        if(event.length == 0)
                        {
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Access Restricted!"
                            });
                        
                        }
                        
                        
                        const [check] = await db_connection.query("SELECT * FROM eventOrganizersData WHERE eventId=? AND managerId=?", [req.body.eventId, req.body.managerId]);
                        
                        if(check.length!=0){
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Official Already Assigned to Event!"
                            });
                        }
                        else{
                            
                            await db_connection.query("INSERT INTO eventOrganizersData (eventId, managerId) VALUES (?,?)", [req.body.eventId, req.body.managerId]);
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(200).send({
                                "MESSAGE": "Successfully Assigned Official to Event."
                            });
                        }
                    
                    }
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - assignEventToOfficial - ${err}\n`);
                    
                    return res.status(500).send({
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

    getOfficialEvents: [
        adminTokenValidator,
        async (req,res) => {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{

                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }
                    
                    if(req.body.authorizationTier==1 || req.body.authorizationTier==2 || req.body.authorizationTier==6){

                        await db_connection.query("LOCK TABLES eventData READ");
                        const [events] = await db_connection.query("SELECT eventId, eventName, eventImageURL FROM eventData WHERE eventStatus != '0'", [req.body.managerId]);
                        await db_connection.query("UNLOCK TABLES");

                        return res.status(200).send({
                            "MESSAGE": "Successfully Fetched Official Events.",
                            "events": events
                        });

                    }
                    
                    else if(req.body.authorizationTier==4){

                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE, eventData READ, managerData READ");
                        
                        const [events] = await db_connection.query("SELECT eventData.eventId, eventData.eventName, eventData.eventImageURL FROM eventData RIGHT JOIN managerData ON managerData.managerId = managerData.managerId WHERE managerData.managerDepartmentId = ? AND managerData.managerId = ? AND eventData.eventStatus != '0'", [managerData[0].managerDepartmentId,req.body.managerId]);

                        await db_connection.query("UNLOCK TABLES");

                        return res.status(200).send({
                            "MESSAGE": "Successfully Fetched Official Events.",
                            "events": events
                        });
                    
                    }
                    else if(req.body.authorizationTier==7){
                            
                            await db_connection.query("LOCK TABLES eventOrganizersData WRITE, eventData READ");
                            
                            const [events] = await db_connection.query("SELECT eventData.eventId, eventData.eventName, eventData.eventImageURL FROM eventData RIGHT JOIN eventOrganizersData ON eventData.eventId = eventOrganizersData.eventId WHERE eventOrganizersData.managerId = ? AND eventData.eventStatus != '0'", [req.body.managerId]);
    
                            await db_connection.query("UNLOCK TABLES");
    
                            return res.status(200).send({
                                "MESSAGE": "Successfully Fetched Official Events.",
                                "events": events
                            });
                    }
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - assignEventToOfficial - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                finally{
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                
                }
            }
    ],

    removeOfficialFromEvent: [
        adminTokenValidatorSpecial,
        async (req,res) => {
            
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }
            
            if(!(dataValidator.isValidAssignEventToOfficial(req.body))){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{

                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }


                    
                    //check if event exists
                    await db_connection.query("LOCK TABLES eventData READ, managerData READ");
                    
                    const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.body.eventId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (eventData.length === 0 || managerData.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }


                    
                    if(req.body.authorizationTier==1 || req.body.authorizationTier==2){
                        
                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE");
                        
                        await db_connection.query("DELETE FROM eventOrganizersData WHERE eventId = ? AND managerId = ?", [req.body.eventId, req.body.managerId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Removed Official from Event."
                        });
                    }
                    
                    
                    else if(req.body.authorizationTier==4){
                        
                        await db_connection.query("LOCK TABLES eventOrganizersData WRITE, eventData READ, managerData READ");
                        
                        const [manager] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                        
                        const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ? AND eventDepartmentId = ?", [req.body.eventId, manager[0].managerDepartmentId]);
                        
                        if(event.length == 0)
                        {
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Access Restricted!"
                            });
                        
                        }
                        else{
                            
                            await db_connection.query("DELETE FROM eventOrganizersData WHERE eventId = ? AND managerId = ?", [req.body.eventId, req.body.managerId]);
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(200).send({
                                "MESSAGE": "Successfully Removed Official from Event."
                            });
                        }
                    }
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - removeOfficialFromEvent - ${err}\n`);
                    
                    return res.status(500).send({
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
    params studentId
    */
    // permission for Admin [2] and Super_Admin [1], Gate_entry_exit_marker [8]
    markGateEntry: [
      adminTokenValidator,
      async (req, res) => {
        
        if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 8)) {
            
            return res.status(400).send({
            "MESSAGE": "Access Restricted!"
          });
        }
        
        else {
          
          req.params.studentId = parseInt(req.params.studentId);
          
          const db_connection = await anokha_db.promise().getConnection();

          let rollbackFlag = "0";
          
          try {

            await db_connection.query("LOCK TABLES managerData READ");
            
            const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
            
            await db_connection.query("UNLOCK TABLES");
            
            if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }


            
            await db_connection.query("LOCK TABLES studentData READ");
            
            const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.params.studentId]);
            
            await db_connection.query("UNLOCK TABLES");
            
            if (check.length == 0) {
              
              return res.status(400).send({
                "MESSAGE": "Student Doesn't Exist!"
              });
            }
            
            await db_connection.query("LOCK TABLES visitLogs READ")
            const [check2] = await db_connection.query("SELECT * FROM visitLogs WHERE studentId=? AND exitTime IS NULL", [req.params.studentId]);
            await db_connection.query("UNLOCK TABLES");
            
            if (check2.length != 0) {
                            
              return res.status(400).send({
                "MESSAGE": "Malpractice: Student Didn't Mark Exit!"
              });
            }
            
            else {

              await db_connection.beginTransaction();

              rollbackFlag = "1";

              await db_connection.query("INSERT INTO visitLogs (studentId, entryTime) VALUES (?, NOW())", [req.params.studentId]);
              
              await db_connection.query("UPDATE studentData SET isInCampus = 1 WHERE studentId = ?", [req.params.studentId]);
              
              await db_connection.commit();
              
              return res.status(200).send({
                "MESSAGE": "Successfully Marked Gate Entry."
              });
            }
            
          }
          
          catch (err) {

            if(rollbackFlag == "1"){
                await db_connection.rollback();
            }

            console.log(err);
            
            const time = new Date();
            fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - markGateEntry - ${err}\n`);
            
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

    getDepartments: async (req, res) => {
            //console.log("getDepartments");
            const db_connection = await anokha_db.promise().getConnection();
            try {
                await db_connection.query("LOCK TABLES departmentData READ");
                const [departments] = await db_connection.query("SELECT departmentId, departmentName, departmentAbbreviation FROM departmentData");
                await db_connection.query("UNLOCK TABLES");
                return res.status(200).send({
                    "MESSAGE": "Successfully Fetched Departments.",
                    "departments": departments
                });
            }    
            catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getDepartments - ${err}\n`);
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            }
            finally {
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
            }
        },

    
    /*
    params studentId
    */
    // permission for Admin [2] and Super_Admin [1], Gate_entry_exit_marker [8]
    markGateExit: [
        adminTokenValidator,
        
        async (req, res) => {
          
          if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 8)) {
            return res.status(400).send({
              "MESSAGE": "Access Restricted!"
            });
          }
        
          else {
            
            req.params.studentId = parseInt(req.params.studentId);
            
            const db_connection = await anokha_db.promise().getConnection();

            let rollbackFlag = "0";
            
            try {

                await db_connection.query("LOCK TABLES managerData READ");
                
                const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                
                await db_connection.query("UNLOCK TABLES");
                
                if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                    
                    return res.status(400).send({
                        "MESSAGE": "Access Restricted!"
                    });
                }

              
                await db_connection.query("LOCK TABLES studentData READ");
              
                const [check] = await db_connection.query("SELECT * FROM studentData WHERE studentId=?", [req.params.studentId]);
                
                await db_connection.query("UNLOCK TABLES");
                
                if (check.length == 0) {
                                
                    return res.status(400).send({
                        "MESSAGE": "Student Doesn't Exist!"
                    });
                }
                
                await db_connection.query("LOCK TABLES visitLogs READ");
                const [check2] = await db_connection.query("SELECT * FROM visitLogs WHERE studentId=? AND entryTime IS NULL", [req.params.studentId]);
                await db_connection.query("UNLOCK TABLES");
                
                if (check2.length != 0) {
                
                    return res.status(400).send({
                        "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                    });
                }
                
                
                await db_connection.query("LOCK TABLES visitLogs READ");
                const [check3] = await db_connection.query("SELECT * FROM visitLogs WHERE studentId=?", [req.params.studentId]);
                await db_connection.query("UNLOCK TABLES");
                
                if (check3.length == 0) {
                    
                    return res.status(400).send({
                        "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                    });
                }
                
                
                await db_connection.query("LOCK TABLES visitLogs READ");
                const [check4] = await db_connection.query("SELECT * FROM visitLogs WHERE studentId=? AND exitTime IS NULL", [req.params.studentId]);
                await db_connection.query("UNLOCK TABLES");
                
                if (check4.length == 0) {
                
                    return res.status(400).send({
                        "MESSAGE": "Malpractice: Student Didn't Mark Exit!"
                    });
                }
                
                else {

                    await db_connection.beginTransaction();

                    rollbackFlag = "1";

                    await db_connection.query("UPDATE visitLogs SET studentId = ?, exitTime = NOW() WHERE exitTime is NULL", [req.params.studentId]);
                    
                    await db_connection.query("UPDATE studentData SET isInCampus = 0 WHERE studentId = ?", [req.params.studentId]);
                    
                    await db_connection.commit();
                
                    return res.status(200).send({
                        "MESSAGE": "Successfully Marked Gate Exit."
                    });
                }
              
            }
            
            catch (err) {

              if(rollbackFlag == "1"){
                await db_connection.rollback();
              }
              
              console.log(err);
              
              const time = new Date();
              fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - markGateExit - ${err}\n`);
              
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

            
    markEventAttendanceEntry: [
        adminTokenValidator,
        async (req, res) => {
        
          if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4 || req.body.authorizationTier == 6 || req.body.authorizationTier == 7)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
          }
          
          if (!(dataValidator.isValidMarkEventAttendance(req.params))) {

            return res.status(400).send({
              "MESSAGE": "Invalid Request!"
            });
          }
          
          else{
            
            //console.log(req.params);
            req.params.studentId = parseInt(req.params.studentId);
            req.params.eventId = parseInt(req.params.eventId);
            
            const db_connection = await anokha_db.promise().getConnection();
            
            try {

                await db_connection.query("LOCK TABLES managerData READ");
                
                const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                
                await db_connection.query("UNLOCK TABLES");
                
                if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                    
                    return res.status(400).send({
                        "MESSAGE": "Access Restricted!"
                    });
                
                }



                await db_connection.query("LOCK TABLES eventData READ, studentData READ, eventRegistrationData READ, eventRegistrationGroupData READ");
                
                const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.params.eventId]);
                
                //check if event exists
                if (eventData.length === 0) {
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Event doesn't exist!"
                    });
                }

                //check if event is active
                else if (eventData[0].eventStatus != "1") {
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Event Not Active!"
                    });
                }

                
                //check if student is registered for individual event
                else if (eventData[0].isGroup === "0" || (eventData[0].isGroup === "1" && eventData[0].needGroupData === "0")) {
                    
                    const [student] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE eventId = ? AND studentId = ?", [req.params.eventId, req.params.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (student.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Student Not Registered for Event!"
                        });
                    }
                }

                //check if student is registered for group event
                else if (eventData[0].isGroup === "1" && eventData[0].needGroupData === "1") {
                    
                    const [student] = await db_connection.query("SELECT * FROM eventRegistrationGroupData WHERE eventId = ? AND studentId = ?", [req.params.eventId, req.params.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (student.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Student Not Registered for Event!"
                        });
                    }
                }


                
                // super admins, admins and global attendace markers
                if(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 6){
                    
                    await db_connection.query("LOCK TABLES eventAttendanceData WRITE");
                    
                    const [check] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId = ? AND studentId=? AND exitTime IS NULL", [req.params.eventId,req.params.studentId]);
                    
                    if (check.length != 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Exit!"
                        });
                    }
                    else {
                        
                        await db_connection.query("INSERT INTO eventAttendanceData (eventId, studentId, entryTime) VALUES (?, ?, NOW())", [req.params.eventId,req.params.studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Marked Attendance Entry."
                        });
                    }
                }
                
                else if(req.body.authorizationTier == 4)
                {
                    
                    await db_connection.query("LOCK TABLES eventData READ, managerData READ");
                    
                    const [manager] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ? AND eventDepartmentId = ?", [req.params.eventId, manager[0].managerDepartmentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if(event.length == 0)
                    {
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }
                    
                    await db_connection.query("LOCK TABLES eventAttendanceData WRITE");
                    
                    const [check] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId = ? AND studentId=? AND exitTime IS NULL", [req.params.eventId,req.params.studentId]);
                    
                    if (check.length != 0) {
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Exit!"
                        });
                    }
                    
                    else {
                        
                        await db_connection.query("INSERT INTO eventAttendanceData (eventId, studentId, entryTime) VALUES (?, ?, NOW())", [req.params.eventId,req.params.studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Marked Attendance Entry."
                        });
                    }
                }

                else if(req.body.authorizationTier == 7)
                {
                    
                    await db_connection.query("LOCK TABLES eventOrganizersData READ");
                    
                    const [confirm] = await db_connection.query("SELECT * FROM eventOrganizersData WHERE managerId=? AND eventId=?", [req.body.managerId, req.params.eventId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if(confirm.length == 0)
                    {
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }
                    
                    await db_connection.query("LOCK TABLES eventAttendanceData WRITE");
                    
                    const [check] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId = ? AND studentId=? AND exitTime IS NULL", [req.params.eventId,req.params.studentId]);
                    
                    if (check.length != 0) {
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Exit!"
                        });
                    }
                    
                    else {
                        
                        await db_connection.query("INSERT INTO eventAttendanceData (eventId, studentId, entryTime) VALUES (?, ?, NOW())", [req.params.eventId,req.params.studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Marked Attendance Entry."
                        });
                    }
                }  
          }
          
          catch(err){
            
            console.log(err);
            
            const time = new Date();
            fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - markEventAttendanceEntry - ${err}\n`);
            
            return res.status(500).send({
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

    markEventAttendanceExit: [
        adminTokenValidator,
        async (req, res) => {
        
          if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4 || req.body.authorizationTier == 6 || req.body.authorizationTier == 7)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
          }
          
          if (!(dataValidator.isValidMarkEventAttendance(req.params))) {
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
          }
          
          else{
            
            req.params.studentId = parseInt(req.params.studentId);
            req.params.eventId = parseInt(req.params.eventId);
            
            const db_connection = await anokha_db.promise().getConnection();
            
            try {

                await db_connection.query("LOCK TABLES managerData READ");
                
                const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                
                await db_connection.query("UNLOCK TABLES");
                
                if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                    
                    return res.status(400).send({
                        "MESSAGE": "Access Restricted!"
                    });
                }


                await db_connection.query(`LOCK TABLES
                eventData READ,
                studentData READ,
                eventRegistrationData READ,
                eventRegistrationGroupData READ`);

                const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.params.eventId]);
                
                
                //check if event exists
                if (eventData.length === 0) {
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Event doesn't exist!"
                    });
                }

                
                //check if event is active
                else if (eventData[0].eventStatus != "1") {
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Event Not Active!"
                    });
                }

                
                //check if student is registered for individual event
                else if (eventData[0].isGroup === "0" || (eventData[0].isGroup === "1" && eventData[0].needGroupData === "0")) {
                    
                    const [student] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE eventId = ? AND studentId = ?", [req.params.eventId, req.params.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (student.length === 0) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Student Not Registered for Event!"
                        });
                    }
                }

                
                //check if student is registered for group event
                else if (eventData[0].isGroup === "1" && eventData[0].needGroupData === "1") {
                    
                    const [student] = await db_connection.query("SELECT * FROM eventRegistrationGroupData WHERE eventId = ? AND studentId = ?", [req.params.eventId, req.params.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (student.length === 0) {
                        return res.status(400).send({
                            "MESSAGE": "Student Not Registered for Event!"
                        });
                    }
                }

                

                // super admins, admins and global attendace markers
                if(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 6){
                    
                    await db_connection.query("LOCK TABLES eventAttendanceData WRITE");
                    
                    const [check] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId =? AND studentId=? AND entryTime IS NULL", [req.params.eventId, req.params.studentId]);
                    
                    if (check.length != 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    const [check2] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId=? AND studentId=?", [req.params.eventId, req.params.studentId]);
                    if (check2.length == 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    
                    const [check3] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId=? AND studentId=? AND exitTime IS NULL", [req.params.eventId, req.params.studentId]);
                    if (check3.length == 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    else {
                        
                        await db_connection.query("UPDATE eventAttendanceData SET eventId = ?, studentId = ?, exitTime = NOW() WHERE exitTime IS NULL", [req.params.eventId,req.params.studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Marked Attendance Exit."
                        });
                    }
                }
                
                else if(req.body.authorizationTier == 4)
                {
                    
                    await db_connection.query("LOCK TABLES eventData READ, managerData READ");
                    
                    const [manager] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ? AND eventDepartmentId = ?", [req.params.eventId, manager[0].managerDepartmentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if(event.length == 0)
                    {
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }
                    
                    await db_connection.query("LOCK TABLES eventAttendanceData WRITE");
                    
                    const [check] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId =? AND studentId=? AND entryTime IS NULL", [req.params.eventId, req.params.studentId]);
                    
                    if (check.length != 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    
                    const [check2] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId=? AND studentId=?", [req.params.eventId, req.params.studentId]);
                    if (check2.length == 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    const [check3] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId=? AND studentId=? AND exitTime IS NULL", [req.params.eventId, req.params.studentId]);
                    if (check3.length == 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    else {
                        
                        await db_connection.query("UPDATE eventAttendanceData SET eventId = ?, studentId = ?, exitTime = NOW() WHERE exitTime IS NULL", [req.params.eventId,req.params.studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Marked Attendance Exit."
                        });
                    }
                }

                
                else if(req.body.authorizationTier == 7)
                {
                    await db_connection.query("LOCK TABLES eventOrganizersData READ");
                    
                    const [confirm] = await db_connection.query("SELECT * FROM eventOrganizersData WHERE managerId=? AND eventId=?", [req.body.managerId, req.params.eventId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if(confirm.length == 0)
                    {
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }
                    
                    await db_connection.query("LOCK TABLES eventAttendanceData WRITE");
                    
                    const [check] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId =? AND studentId=? AND entryTime IS NULL", [req.params.eventId, req.params.studentId]);
                    
                    if (check.length != 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    const [check2] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId=? AND studentId=?", [req.params.eventId, req.params.studentId]);
                    
                    if (check2.length == 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    const [check3] = await db_connection.query("SELECT * FROM eventAttendanceData WHERE eventId=? AND studentId=? AND exitTime IS NULL", [req.params.eventId, req.params.studentId]);
                    
                    if (check3.length == 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Malpractice: Student Didn't Mark Entry!"
                        });
                    }
                    
                    else {
                        
                        await db_connection.query("UPDATE eventAttendanceData SET eventId = ?, studentId = ?, exitTime = NOW() WHERE exitTime IS NULL", [req.params.eventId,req.params.studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Marked Attendance Exit."
                        });
                    }
                }  
          }
          
          catch(err){
            
            console.log(err);
            
            const time = new Date();
            fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - markEventAttendanceExit - ${err}\n`);
            
            return res.status(500).send({
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

    getEventAttendance: [
        adminTokenValidator,
        async (req, res) => {
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 4 || req.body.authorizationTier == 6 || req.body.authorizationTier == 7)){
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    req.params.eventId = parseInt(req.params.eventId);

                    await db_connection.query("LOCK TABLES managerData READ");
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    await db_connection.query("UNLOCK TABLES");

                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }

                    if(req.params.eventId === undefined || isNaN(req.params.eventId) || req.params.eventIf === null || req.params.eventId < 1){
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }

                    if(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 || req.body.authorizationTier == 6){

                        await db_connection.query("LOCK TABLES eventData READ");
                        const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.params.eventId]);
                        await db_connection.query("UNLOCK TABLES");

                        if (eventData.length === 0) {
                            return res.status(400).send({
                                "MESSAGE": "Invalid Request!"
                            });
                        }


                        await db_connection.query("LOCK TABLES eventAttendanceData READ");

                        const [attendance] = await db_connection.query("SELECT attendanceId, eventId, studentId, entryTime, exitTime  FROM eventAttendanceData WHERE eventId = ?", [req.params.eventId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Fetched Event Attendance.",
                            "attendance": attendance
                        });
                    }

                    else if(req.body.authorizationTier == 4){
                        await db_connection.query("LOCK TABLES eventData READ");
                        const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ? AND eventDepartmentId = ?", [req.params.eventId, managerData[0].managerDepartmentId]);
                        await db_connection.query("UNLOCK TABLES");

                        if (eventData.length === 0) {
                            return res.status(400).send({
                                "MESSAGE": "Invalid Request!"
                            });
                        }


                        await db_connection.query("LOCK TABLES eventAttendanceData READ");

                        const [attendance] = await db_connection.query("SELECT attendanceId, eventId, studentId, entryTime, exitTime  FROM eventAttendanceData WHERE eventId = ?", [req.params.eventId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Fetched Event Attendance.",
                            "attendance": attendance
                        });
                    }

                    else if (req.body.authorizationTier == 7){
                        await db_connection.query("LOCK TABLES eventData READ, eventOrganizersData READ");
                        const [eventData] = await db_connection.query("SELECT * FROM eventData RIGHT JOIN eventOrganizersData ON eventData.eventId = eventOrganizersData.eventId WHERE eventData.eventId = ? ", [req.params.eventId]);
                        await db_connection.query("UNLOCK TABLES");

                        if (eventData.length === 0) {
                            return res.status(400).send({
                                "MESSAGE": "Invalid Request!"
                            });
                        }


                        await db_connection.query("LOCK TABLES eventAttendanceData READ");

                        const [attendance] = await db_connection.query("SELECT attendanceId, eventId, studentId, entryTime, exitTime  FROM eventAttendanceData WHERE eventId = ?", [req.params.eventId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Successfully Fetched Event Attendance.",
                            "attendance": attendance
                        });
                    }

                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getEventAttendance - ${err}\n`);
                    return res.status(500).send({
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

    
    addCrewMember: [
        adminTokenValidator,
        async (req,res) =>{
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2))
            {
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }
            if(!(dataValidator.isValidCrewMember(req.body)))
            {
                return res.status(400).send({
                    "MESSAGE": "Invalid Request!"
                });
            
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    
                    await db_connection.query("LOCK TABLES crewMembers READ");
                    
                    const [check] = await db_connection.query("SELECT * from crewMembers where memberEmail = ?", [req.body.memberEmail]);
                    
                    await db_connection.query("UNLOCK TABLES");

                    if(check.length > 0){
                        return res.status(400).send({
                            "MESSAGE": "Member Already Exists!"
                        });
                    }

                    await db_connection.query("LOCK TABLES departmentData READ");

                    const [department] = await db_connection.query("SELECT * FROM departmentData WHERE departmentId = ?", [req.body.departmentId]);

                    await db_connection.query("UNLOCK TABLES");

                    if(department.length === 0){
                        return res.status(400).send({
                            "MESSAGE": "Department doesn't exist!"
                        });
                    }
                  
                    
                    await db_connection.query("LOCK TABLES crewDetails READ");

                    const [crew] = await db_connection.query("SELECT * FROM crewDetails WHERE crewId = ?", [req.body.crewId]);

                    await db_connection.query("UNLOCK TABLES");

                    if(crew.length === 0){
                        return res.status(400).send({
                            "MESSAGE": "Crew doesn't exist!"
                        });
                    }



                    await db_connection.query("LOCK TABLES crewMembers WRITE");

                    await db_connection
                    .query(`
                    INSERT INTO crewMembers 
                    (managerName,
                    memberEmail,
                    crewId, 
                    memberImageURL,
                    departmentId,
                    roleDescription)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [req.body.managerName, req.body.memberEmail, req.body.crewId, req.body.memberImageURL, req.body.departmentId, req.body.roleDescription]
                    );

                    await db_connection.query("UNLOCK TABLES");

                    return res.status(200).send({
                        "MESSAGE": "Successfully Added Crew Member."
                    }); 

                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - addCrewMember - ${err}\n`);
                    return res.status(500).send({
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

    deleteCrewMember: [
        adminTokenValidator,
        async (req,res) =>{
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2))
            {
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    if (!( typeof(req.body.memberId) == "number" || req.body.memberId >= 1 )) {
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request!"
                        });
                    }
                    await db_connection.query("LOCK TABLES crewMembers WRITE");

                    const [Delete] = await db_connection.query("DELETE FROM crewMembers WHERE memberId = ?", [req.body.memberId]);

                    await db_connection.query("UNLOCK TABLES");

                    if(Delete.affectedRows === 0){
                        return res.status(400).send({
                            "MESSAGE": "Member not present!"
                        });
                    }

                    return res.status(200).send({
                        "MESSAGE": "Successfully Deleted Crew Member."
                    });
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - deleteCrewMember - ${err}\n`);
                    return res.status(500).send({
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
    
    getAllTransactions: [
        adminTokenValidator,
        async (req, res) => {
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2))
            {
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            if (!dataValidator.isValidTransactionStatus(req.body)) {
                return res.status(400).send({
                    "MESSAGE": "Invalid Transaction Status!"
                });
            }

            const transaction_db_conn = await anokha_transactions_db.promise().getConnection();

            try {

                await transaction_db_conn.query("LOCK TABLES transactionData READ");

                const [transactions] = await transaction_db_conn.query("SELECT * FROM transactionData WHERE transactionStatus = ?", [req.body.transactionStatus]);

                await transaction_db_conn.query("UNLOCK TABLES");

                return res.status(200).send({
                    "MESSAGE": `Successfully Fetched Transactions with status ${req.body.transactionStatus}.`,
                    "transactions": transactions
                });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAllPendingTransactions - ${err}\n`);
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            } finally {
                await transaction_db_conn.query("UNLOCK TABLES");
                transaction_db_conn.release();
            }
        }
    ],

    getEventRegistrationCount: [
        adminTokenValidator,
        async (req,res) => {
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2))
            {
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            const db_conn = await anokha_db.promise().getConnection();

            try{
                await db_conn.query(getEventRegistrationCount.locks.lockEventData_departmentData);

                const [data] = await db_conn.query(getEventRegistrationCount.queries.getEventRegistrationCountData);

                await db_conn.query(unlockTables.queries.unlock);

                return res.status(200).send({
                    "MESSAGE": "Successfully Fetched Registration Count For All Events.",
                    "data": data
                });
                
            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getEventRegistrationCount - ${err}\n`);
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            } finally {
                await db_conn.query(unlockTables.queries.unlock);
                db_conn.release();
            }
        }
    ],

    getEventRegistrationData: //[
        //adminTokenValidator,
        async (req, res) => {

            // response
            /*
            {
                MESSAGE: "Fetched <"All"/"Department"/"Event"> registration data successfully",
                DATA:
                {
                    eventId: <INTEGER>,
                    eventName: <STRING>
                    eventDate: <DATE>
                    eventTime: <TIME>,
                    eventVenue: <STRING>,
                    eventPrice: <INTEGER>,
                    maxSeats: <INTEGER>,
                    seatsFilled: <INTEGER>,
                    minTeamSize: <INTEGER>
                    maxTeamSize: <INTEGER>,
                    isWorkshop: <"0/1">,
                    isTechnical: <"0/1">,
                    isGroup: <"0/1">,
                    isPerHeadPrice: <"0"/"1">,
                    eventStatus: <"0"/"1">,
                    eventDepartmentId: <INTEGER>,
                    eventDepartmentName: <STRING>
                    registrations:
                    [
                        {
                            registrationId: <INTEGER>,
                            registrationDate: <DATE>,
                            txnID: <STRING>,
                            amount: <INTEGER>
                            teamName: <NULL>/<STRING>,
                            teamData: 
                            [
                                {
                                    studentId: <INTEGER>,
                                    roleDescription: <NULL>/<STRING>,
                                    isOwnRegistration: <"0"/"1">
                                    studentFullName: <STRING>,
                                    studentCollegeName: <STRING>,
                                    studentCollegeCity: <STRING>,
                                    studentEmail: <STRING>,
                                    studentPhone: <STRING>
                                }
                            ]
                        }
                    ]   
                }
            } 

            */
            // 1 - Super Admin - All Events
            // 2 - Admin - All Events
            // 3 - Finance - No Access
            // 4 - Department Head - Department Registrations Only
            // 5 - Eventide Attendance Marker - No Access
            // 6 - Global Attendance Marker - All Events
            // 7 - Local Attendance Marker - Specific Event Only
            // 8 - Gate Entry Exit Marker - No Access
            // 9 - Intel Admin - No Access

            // if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 2 
            //     || req.body.authorizationTier == 4 || req.body.authorizationTier == 6
            //     || req.body.authorizationTier == 7
            // ))
            // {
            //         return res.status(400).send({
            //             "MESSAGE": "Access Restricted!"
            //         });
            // }

            req.params.eventId = parseInt(req.params.eventId);
            const db_conn = await anokha_db.promise().getConnection();

            try {

                let query = "";

                await db_conn.query(getEventRegistrationData.locks.lockEventData_eventRegistrationData_eventRegistrationGroupData_studentData);

                const [[eventData]] = await db_conn.query(getEventRegistrationData.queries.getEventData, req.params.eventId);
                
                console.log(eventData);

                // All Event Registration Data
                // if(req.authorizationTier == 1 || req.authorizationTier == 2 || req.authorizationTier == 6 ) {
                    query = getEventRegistrationData.queries.getAllEventRegistrationData;
                // }
                // // Department Event Registration Data
                // else if(req.authorizationTier == 4) {
                //     await db_conn.query();
                //     query = getEventRegistrationData.queries.getDepartmentEventRegistrationData;
                // }
                // // Specific Event Registration Data
                // else if(req.authorizationTier == 7) {
                //     await db_conn.query();
                //     query = getEventRegistrationData.queries.getSpecificEventRegistrationData;
                // }

                // const [registrationData] = await db_conn.query(query);

                db_conn.query(unlockTables.queries.unlock);

                res.status(200).send({
                    "MESSAGE":`Fetched <"All"/"Department"/"Event"> registration data successfully`,
                    "DATA": eventData
                });

            } catch(err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getEventRegistrationData - ${err}\n`);
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            } finally {
                await db_conn.query(unlockTables.queries.unlock);
                db_conn.release();
            }
        }
    //]
}