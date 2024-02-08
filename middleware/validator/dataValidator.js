const validator = require('validator');
const [anokha_db, anokha_transactions_db] = require('../../connection/poolConnection');
const fs = require('fs');

module.exports = {
    // Password should be greater than or equal to 8 characters. Cannot have hiphens or quotes.
    isValidPassword: (password) => {
        // if (validator.isLength(password, { min: 8 }) && !validator.contains(password, '-' || "'")) {
        //     return true;
        // }
        // return false;
        if (typeof (password) === 'string' && password != null && password.length > 8 && password.length <= 255) {
            return true;
        }
        return false;
    },

    // Email should be valid.
    isValidEmail: (email) => {
        if (typeof (email) === 'string' && email.length > 0 && email.length <= 255 && validator.isEmail(email)) {
            return true;
        }
        return false;
    },


    isValidOtp: (otp) => {
        if (typeof (otp) === 'string' && otp != null && otp.length > 0 && otp.length <= 255) {
            return true;
        }
        return false;
    },

    /*
    {
        "studentFullName":"<Max 255 Chars>",
        "studentEmail":"<Valid Email ID. Max 255 chars.>",
        "studentPhone":"<10 digit. numeric only. Max 255 chars.>",
        "studentPassword":"<min 8 chars. Max 255 chars. Password cannot have `-` and `'`>",
        "studentCollegeName":"<Max 255 chars.>",
        "studentCollegeCity":"<Max 255 chars.>",
    }
    */
    isValidStudentRegistration: (student) => {
        if (typeof (student.studentFullName) === 'string' && student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
            typeof (student.studentEmail) === 'string' &&
            validator.isEmail(student.studentEmail) && student.studentEmail.length > 0 && student.studentEmail.length <= 255 &&
            student.studentPhone.length === 10 && validator.isNumeric(student.studentPhone) &&
            student.studentPassword.length > 0 && student.studentPassword.length <= 255 &&
            validator.isLength(student.studentPassword, { min: 8 }) && !validator.contains(student.studentPassword, '-' || "'") &&
            student.studentCollegeName.length > 0 && student.studentCollegeName.length <= 255 &&
            student.studentCollegeCity.length > 0 && student.studentCollegeCity.length <= 255) {
            return true;
        }
        return false;
    },

    /*
        If email ends with @cb.students.amrita.edu or @cb.amrita.edu, then the user does not need passport. userAccountStatus will be set to 2.
    */
    needPassport: (email) => {
        if (email.endsWith('@cb.students.amrita.edu') || email.endsWith('@cb.amrita.edu')) {
            return false;
        }
        return true;
    },

    //sha256 consists only Hexadecimal characters.
    isValidStudentLogin: (student) => {
        if (typeof (student.studentEmail) === 'string' &&
            validator.isEmail(student.studentEmail) &&
            typeof (student.studentPassword) === 'string' &&
            student.studentPassword.length === 64 &&
            validator.isLength(student.studentPassword, { min: 8 }) && !validator.contains(student.studentPassword, '-' || "'")) {
            return true;
        }
        return false;
    },

    isValidAdminRegistration: async (manager) => {
        if (typeof (manager.managerFullName) === 'string' &&
            manager.managerFullName.length > 0 && manager.managerFullName.length <= 255 &&
            typeof (manager.managerEmail) === 'string' &&
            validator.isEmail(manager.managerEmail) && manager.managerEmail.length > 0 && manager.managerEmail.length <= 255 &&
            typeof (manager.managerPhone) === 'string' &&
            manager.managerPhone.length === 10 && validator.isNumeric(manager.managerPhone) &&
            manager.managerRoleId != 1 &&
            manager.managerRoleId != null && manager.managerRoleId != undefined && !isNaN(manager.managerRoleId) &&
            manager.managerDepartmentId != null && manager.managerDepartmentId != undefined && !isNaN(manager.managerDepartmentId)
        ) {
            //console.log(manager.managerRoleId,manager.managerDepartmentId);
            const db_connection = await anokha_db.promise().getConnection();
            try {
                await db_connection.query("LOCK TABLES managerRole READ, departmentData READ");
                const [role] = await db_connection.query("SELECT * from managerRole WHERE roleId = ?", [manager.managerRoleId]);
                const [department] = await db_connection.query("SELECT * from departmentData WHERE departmentId = ?", [manager.managerDepartmentId]);
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                if (role.length != 0 && department.length != 0) {
                    return true;
                }
            }
            catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidAdminRegistration - ${err}\n`);
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                return false;
            }
            finally {
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
            }
        }
        return false;
    },

    //sha256 consists only Hexadecimal characters.
    isValidAdminLogin: (manager) => {
        if (typeof (manager.managerEmail) === 'string' &&
            validator.isEmail(manager.managerEmail) &&
            typeof (manager.managerPassword) === 'string' &&
            manager.managerPassword.length === 64 &&
            validator.isLength(manager.managerPassword, { min: 8 }) && !validator.contains(manager.managerPassword, '-' || "'")) {
            return true;
        }
        return false;
    },

    isValidStudentRequest: async (studentId) => {
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES studentData READ");
            const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [studentId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidStudentRequest - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    isValidAdminRequest: async (managerId) => {
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES managerData READ");
            const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [managerId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidAdminRequest - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    isValidEditStudentProfile: (student) => {
        if (typeof (student.studentFullName) === 'string' &&
            student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
            typeof (student.studentPhone) === 'string' &&
            student.studentPhone.length === 10 && validator.isNumeric(student.studentPhone) &&
            typeof (student.studentCollegeName) === 'string' &&
            student.studentCollegeName.length > 0 && student.studentCollegeName.length <= 255 &&
            typeof (student.studentCollegeCity) === 'string' &&
            student.studentCollegeCity.length > 0 && student.studentCollegeCity.length <= 255) {
            return true;
        }
        return false;
    },

    isValidAdminEditProfile: (manager) => {
        if (typeof (manager.managerFullName) === 'string' &&
            manager.managerFullName.length > 0 && manager.managerFullName.length <= 255 &&
            typeof (manager.managerPhone) === 'string' &&
            manager.managerPhone.length === 10 && validator.isNumeric(manager.managerPhone) &&
            manager.managerDepartmentId != null && manager.managerDepartmentId != undefined && !isNaN(manager.managerDepartmentId)
        ) {
            return true;
        }
        return false;
    },

    isValidToggleStarredEventRequest: async (req) => {
        if (req.body.eventId === undefined || req.body.eventId === null || isNaN(req.body.eventId)) {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES eventData READ");
            const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId=?", [req.body.eventId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (event.length === 0 || (req.body.isStarred != "0" && req.body.isStarred != "1")) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidToggleStarredEventRequest - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    vaildRegistrationDataRequest: async (req) => {
        if (req.body.registrationId === undefined || req.body.registrationId === null || isNaN(req.body.registrationId)) {
            return false;
        }
        return true;
    },

    isValidTag: async (tag) => {
        if (typeof (tag.tagName) != 'string' || tag.tagName === undefined || tag.tagName === null || tag.tagName.length > 255 || tag.tagName.length === 0 ||
            typeof (tag.tagAbbreviation) != 'string' ||
            tag.tagAbbreviation === undefined || tag.tagAbbreviation === null || tag.tagAbbreviation.length > 255 || tag.tagAbbreviation.length === 0
        ) {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES tagData READ");
            const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagName = ? OR tagAbbreviation =?", [tag.tagName, tag.tagAbbreviation]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (tagData.length != 0) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidTag - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    isValidToggleTagStatus: async (tag) => {
        if (tag.tagId === undefined || tag.tagId === null || isNaN(tag.tagId)
            || typeof (tag.isActive) != 'string'
            || tag.isActive === undefined || tag.isActive === null || (tag.isActive != "0" && tag.isActive != "1")
        ) {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES tagData READ");
            const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId = ?", [tag.tagId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (tagData.length === 0) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidToggleTagStatus - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    isValidCreateEvent: async (event) => {
        if (typeof (event.eventName) != 'string' ||
            event.eventName === undefined || event.eventName === null || event.eventName.length > 255 || event.eventName.length === 0 ||
            typeof (event.eventDescription) != 'string' ||
            event.eventDescription === undefined || event.eventDescription === null || event.eventDescription.length > 255 || event.eventDescription.length === 0 ||
            typeof (event.eventMarkdownDescription) != 'string' ||
            event.eventMarkdownDescription === undefined || event.eventMarkdownDescription === null || event.eventMarkdownDescription.length > 5000 || event.eventMarkdownDescription.length === 0 ||
            typeof (event.eventDate) != 'string' ||
            event.eventDate === undefined || event.eventDate === null || isNaN(Date.parse(event.eventDate)) || event.eventDate.length === 0 ||
            typeof (event.eventTime) != 'string' ||
            event.eventTime === undefined || event.eventTime === null || validator.isTime(event.eventTime) || event.eventTime.length === 0 ||
            typeof (event.eventVenue) != 'string' ||
            event.eventVenue === undefined || event.eventVenue === null || event.eventVenue.length > 255 || event.eventVenue.length === 0 ||
            typeof (event.eventImageURL) != 'string' ||
            event.eventImageURL === undefined || event.eventImageURL === null || event.eventImageURL.length > 255 || event.eventImageURL.length === 0 ||
            event.eventPrice === undefined || event.eventPrice === null || isNaN(event.eventPrice) ||
            event.maxSeats === undefined || event.maxSeats === null || isNaN(event.maxSeats) ||
            event.minTeamSize === undefined || event.minTeamSize === null || isNaN(event.minTeamSize) ||
            event.maxTeamSize === undefined || event.maxTeamSize === null || isNaN(event.maxTeamSize) ||
            event.isWorkshop === undefined || event.isWorkshop === null || (event.isWorkshop != "0" && event.isWorkshop != "1") ||
            event.isTechnical === undefined || event.isTechnical === null || (event.isTechnical != "0" && event.isTechnical != "1") ||
            event.isGroup === undefined || event.isGroup === null || (event.isGroup != "0" && event.isGroup != "1") ||
            event.isPerHeadPrice === undefined || event.isPerHeadPrice === null || (event.isPerHeadPrice != "0" && event.isPerHeadPrice != "1") ||
            event.isRefundable === undefined || event.isRefundable === null || (event.isRefundable != "0" && event.isRefundable != "1") ||
            event.needGroupData === undefined || event.needGroupData === null || (event.needGroupData != "0" && event.needGroupData != "1") ||
            event.eventDepartmentId === undefined || event.eventDepartmentId === null || isNaN(event.eventDepartmentId) ||
            event.tags === undefined || event.tags === null
        ) {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES departmentData READ, tagData READ");
            const [departmentData] = await db_connection.query("SELECT * FROM departmentData WHERE departmentId = ?", [event.eventDepartmentId]);
            if (departmentData.length === 0) {
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                return false;
            }
            if (event.tags.length != 0) {
                const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId IN (?)", [event.tags]);
                if (tagData.length != event.tags.length) {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    return false;
                }
            }
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidCreateEvent - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    isValidEditEventData: async (event) => {
        if (typeof (event.eventName) != 'string' ||
            event.eventName === undefined || event.eventName === null || event.eventName.length > 255 || event.eventName.length === 0 ||
            typeof (event.eventDescription) != 'string' ||
            event.eventDescription === undefined || event.eventDescription === null || event.eventDescription.length > 255 || event.eventDescription.length === 0 ||
            typeof (event.eventMarkdownDescription) != 'string' ||
            event.eventMarkdownDescription === undefined || event.eventMarkdownDescription === null || event.eventMarkdownDescription.length > 5000 || event.eventMarkdownDescription.length === 0 ||
            typeof (event.eventDate) != 'string' ||
            event.eventDate === undefined || event.eventDate === null || isNaN(Date.parse(event.eventDate)) || event.eventDate.length === 0 ||
            typeof (event.eventTime) != 'string' ||
            event.eventTime === undefined || event.eventTime === null || validator.isTime(event.eventTime) || event.eventTime.length === 0 ||
            typeof (event.eventVenue) != 'string' ||
            event.eventVenue === undefined || event.eventVenue === null || event.eventVenue.length > 255 || event.eventVenue.length === 0 ||
            typeof (event.eventImageURL) != 'string' ||
            event.eventImageURL === undefined || event.eventImageURL === null || event.eventImageURL.length > 255 || event.eventImageURL.length === 0 ||
            event.eventPrice === undefined || event.eventPrice === null || isNaN(event.eventPrice) ||
            event.maxSeats === undefined || event.maxSeats === null || isNaN(event.maxSeats) ||
            event.minTeamSize === undefined || event.minTeamSize === null || isNaN(event.minTeamSize) ||
            event.maxTeamSize === undefined || event.maxTeamSize === null || isNaN(event.maxTeamSize) ||
            event.isWorkshop === undefined || event.isWorkshop === null || (event.isWorkshop != "0" && event.isWorkshop != "1") ||
            event.isTechnical === undefined || event.isTechnical === null || (event.isTechnical != "0" && event.isTechnical != "1") ||
            event.isGroup === undefined || event.isGroup === null || (event.isGroup != "0" && event.isGroup != "1") ||
            event.isPerHeadPrice === undefined || event.isPerHeadPrice === null || (event.isPerHeadPrice != "0" && event.isPerHeadPrice != "1") ||
            event.isRefundable === undefined || event.isRefundable === null || (event.isRefundable != "0" && event.isRefundable != "1") ||
            event.needGroupData === undefined || event.needGroupData === null || (event.needGroupData != "0" && event.needGroupData != "1") ||
            event.eventDepartmentId === undefined || event.eventDepartmentId === null || isNaN(event.eventDepartmentId) ||
            event.eventId === undefined || event.eventId === null || isNaN(event.eventId) ||
            event.tags === undefined || event.tags === null
        ) {
            //console.log("body");
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES departmentData READ");
            const [departmentData] = await db_connection.query("SELECT * FROM departmentData WHERE departmentId = ?", [event.eventDepartmentId]);
            if (departmentData.length === 0) {
                //console.log("department");
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                return false;
            }
            await db_connection.query("UNLOCK TABLES");
            await db_connection.query("LOCK TABLES eventData READ");
            const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [event.eventId]);
            if (eventData.length === 0) {
                //console.log("eventId");
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                return false;
            }
            await db_connection.query("LOCK TABLES tagData READ");
            if (event.tags.length != 0) {
                const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId IN (?)", [event.tags]);
                if (tagData.length != event.tags.length) {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    return false;
                }
            }
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidEditEventData - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    isValidToggleEventStatus: async (event) => {
        if (event.eventId === undefined || event.eventId === null || isNaN(event.eventId)
            || event.eventStatus === undefined || event.eventStatus === null || (event.eventStatus != "0" && event.eventStatus != "1" && event.eventStatus != "2")
        ) {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES eventData READ");
            const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [event.eventId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (eventData.length === 0) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidToggleEventStatus - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },


    isValidTagEvent: async (req) => {
        if (req.eventId === undefined || req.eventId === null || isNaN(req.eventId)
            || req.tagId === undefined || req.tagId === null || isNaN(req.tagId)
        ) {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES eventData READ, tagData READ");
            const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.eventId]);
            const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId = ?", [req.tagId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (eventData.length === 0 || tagData.length === 0) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidTagEvent - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },


    isValidToggleStudentStatus: async (student) => {
        if (student.studentId === undefined || student.studentId === null || isNaN(student.studentId)
            || student.isActive === undefined || student.isActive === null || (student.isActive != "0" && student.isActive != "1")
        ) {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES studentData READ");
            const [studentData] = await db_connection.query("SELECT * FROM studentData WHERE studentId = ?", [student.studentId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (studentData.length === 0) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidToggleStudentStatus - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    isValidToggleOfficialStatus: async (manager) => {
        if (manager.managerId === undefined || manager.managerId === null || isNaN(manager.managerId)
            || manager.isActive === undefined || manager.isActive === null || (manager.isActive != "0" && manager.isActive != "1")
        ) {
            return false;
        }
        return true;
    },

    isValidAssignEventToOfficial: async (req) => {
        if (req.eventId === undefined || req.eventId === null || isNaN(req.eventId)
            || req.managerId === undefined || req.managerId === null || isNaN(req.managerId)
        ) {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES eventData READ, managerData READ");
            const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.eventId]);
            const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId = ?", [req.managerId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if (eventData.length === 0 || managerData.length === 0) {
                return false;
            }
            return true;
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidAssignEventToOfficial - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },

    isValidMarkEventAttendance: async (req) => {
        if (req.studentId === undefined || req.studentId === null || isNaN(req.studentId)
            || req.eventId === undefined || req.eventId === null || isNaN(req.eventId)
        ) {
            return false;
        }
        req.studentId = parseInt(req.studentId);
        req.eventId = parseInt(req.eventId);
        const db_connection = await anokha_db.promise().getConnection();
        try {
            await db_connection.query("LOCK TABLES eventData READ, studentData READ, eventRegistrationData READ, eventRegistrationGroupData READ");
            const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?", [req.eventId]);
            if (eventData.length === 0) {
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                return false;
            }
            else if (eventData[0].eventStatus != "1") {
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                return false;
            }
            else if (eventData[0].isGroup === "0" || (eventData[0].isGroup === "1" && eventData[0].needGroupData === "0")) {
                const [student] = await db_connection.query("SELECT * FROM eventRegistrationData WHERE eventId = ? AND studentId = ?", [req.eventId, req.studentId]);
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                if (student.length === 0) {
                    return false;
                }
                return true;
            }
            else if (eventData[0].isGroup === "1" && eventData[0].needGroupData === "1") {
                const [student] = await db_connection.query("SELECT * FROM eventRegistrationGroupData WHERE eventId = ? AND studentId = ?", [req.eventId, req.studentId]);
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
                if (student.length === 0) {
                    return false;
                }
                return true;
            }
        }
        catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('./logs/validator.log', `${time.toISOString()} - isValidMarkEventAttendance - ${err}\n`);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            return false;
        }
        finally {
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
        }
    },


    /*
    {
        "eventId": "integer",
        "totalMembers": "integer",
        "isMarketPlacePaymentMode": "<0/1>",
    }
    */
    isValidEventRegistration: (req) => {
        if (!(typeof (req.body.eventId) === "number" && req.body.eventId >= 1 &&
            typeof (req.body.totalMembers) === "number" && req.body.totalMembers >= 1 &&
            typeof (req.body.isMarketPlacePaymentMode) === "string" && (req.body.isMarketPlacePaymentMode === "1" || req.body.isMarketPlacePaymentMode === "0"))) {
            return false;
        }

        return true;
    },

    isValidRegisterTeamRequest: (req) => {
        if (!(typeof (req.teamName) === "string" && req.teamName.length > 0 && req.teamName.length <= 255 &&
            typeof (req.teamMembers) === "object" && req.teamMembers.length >= 2 && req.teamMembers.length <=3  &&
            typeof (req.idcId) === "object" && req.idcId.length === req.teamMembers.length + 1)) {
            return false;
        }
        for (let i = 0; i < req.teamMembers.length; i++) {
            if (!(typeof (req.teamMembers[i]) === 'string' && validator.isEmail(req.teamMembers[i]))) {
                return false;
            }
        }
        let devfolioId="0";
        if (typeof (req.devfolioId) === "string" && req.devfolioId.length > 0 && req.devfolioId.length <= 255 && validator.isEmail(req.devfolioId)) 
        {
            devfolioId="1";
            //console.log("devfolioId is not null");
        }
        let unstopId="0";
        if (typeof (req.unstopId) === "string" && req.unstopId.length > 0 && req.unstopId.length <= 255 && validator.isEmail(req.unstopId)) 
        {
            unstopId="1";
            //console.log("unstopId is not null");
        }
        let devpostId="0";
        if (typeof (req.devpostId) === "string" && req.devpostId.length > 0 && req.devpostId.length <= 255 && validator.isEmail(req.devpostId)) 
        {
            devpostId="1";
            //console.log("devpostId is not null");
        }
        if((devfolioId === "1" && unstopId != "1" && devpostId != "1")
        ||(devfolioId != "1" && unstopId === "1" && devpostId != "1")
        ||(devfolioId != "1" && unstopId != "1" && devpostId === "1")
        ||(devfolioId === "0" && unstopId === "0" && devpostId === "0"))
        {
            return true;
        }
        return false;
    },

    isValidSubmitFirstRoundRequest: (req) => {
        if(
            typeof (req.problemStatement) === "string" && req.problemStatement.length > 0 && req.problemStatement.length <= 1000 &&
            typeof (req.pptFileLink) === "string" && req.pptFileLink.length > 0 && req.pptFileLink.length <= 500 && validator.isURL(req.pptFileLink) 
        ){
            return true;
        }
        return false;
    },

    isValidSubmitSecondRoundRequest: (req) => {
        if(
            typeof (req.pptFileLink) === "string" && req.pptFileLink.length > 0 && req.pptFileLink.length <= 500 && validator.isURL(req.pptFileLink) &&
            typeof (req.githubLink) === "string" && req.githubLink.length > 0 && req.githubLink.length <= 500 && validator.isURL(req.githubLink) &&
            typeof (req.youtubeVideoLink) === "string" && req.youtubeVideoLink.length > 0 && req.youtubeVideoLink.length <= 500 && validator.isURL(req.youtubeVideoLink)&&
            typeof (req.devmeshLink) === "string" && req.devmeshLink.length > 0 && req.devmeshLink.length <= 500 && validator.isURL(req.devmeshLink)  
        )
        {
            return true;
        }
        return false;
    }
}