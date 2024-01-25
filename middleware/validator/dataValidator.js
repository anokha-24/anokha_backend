const validator = require('validator');
const [anokha_db, anokha_transactions_db] = require('../../connection/poolConnection');

module.exports = {
    // Password should be greater than or equal to 8 characters. Cannot have hiphens or quotes.
    isValidPassword: (password) => {
        // if (validator.isLength(password, { min: 8 }) && !validator.contains(password, '-' || "'")) {
        //     return true;
        // }
        // return false;
        if (typeof(password)=='string' && password!=null && password.length > 8 && password.length <= 255 ) {
            return true;
        }
        return false;
    },

    // Email should be valid.
    isValidEmail: (email) => {
        if (typeof(email)=='string' && email.length>0 && email.length <=255 && validator.isEmail(email)) {
            return true;
        }
        return false;
    },

    
    isValidOtp: (otp) => {
        if (typeof(otp)=='string' && otp != null && otp.length>0 && otp.length<=255) {
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
        if ( typeof(student.studentFullName)=='string' && student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
            typeof(student.studentEmail)=='string' &&
            validator.isEmail(student.studentEmail) && student.studentEmail.length > 0 && student.studentEmail.length <= 255 &&
            student.studentPhone.length == 10 && validator.isNumeric(student.studentPhone) &&
            student.studentPassword.length > 0 && student.studentPassword.length <= 255 && 
            validator.isLength(student.studentPassword, { min: 8 }) && !validator.contains(student.studentPassword, '-' || "'") &&
            student.studentCollegeName.length > 0 && student.studentCollegeName.length <= 255 &&
            student.studentCollegeCity.length > 0 && student.studentCollegeCity.length <= 255) 
        {
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
        if (typeof(student.studentEmail)=='string' &&
            validator.isEmail(student.studentEmail) &&
            typeof(student.studentPassword)=='string' &&
            student.studentPassword.length == 64 &&
            validator.isLength(student.studentPassword, { min: 8 }) && !validator.contains(student.studentPassword, '-' || "'")) 
        {
            return true;
        }
        return false;
    },

    isValidAdminRegistration: async (manager) => {
        if (typeof(manager.managerFullName)=='string' &&
            manager.managerFullName.length > 0 && manager.managerFullName.length <= 255 &&
            typeof(manager.managerEmail)=='string' &&
            validator.isEmail(manager.managerEmail) && manager.managerEmail.length > 0 && manager.managerEmail.length <= 255 &&
            typeof(manager.managerPhone)=='string' &&
            manager.managerPhone.length == 10 && validator.isNumeric(manager.managerPhone) &&
            manager.managerRoleId!=1 &&
            manager.managerRoleId!=null && manager.managerRoleId!=undefined && !isNaN(manager.managerRoleId) &&
            manager.managerDepartmentId!=null && manager.managerDepartmentId!=undefined && !isNaN(manager.managerDepartmentId) 
            )
        {
            //console.log(manager.managerRoleId,manager.managerDepartmentId);
            const db_connection = await anokha_db.promise().getConnection();
            await db_connection.query("LOCK TABLES managerRole READ, departmentData READ");
            const [role] = await db_connection.query("SELECT * from managerRole WHERE roleId = ?",[manager.managerRoleId]);
            const [department] = await db_connection.query("SELECT * from departmentData WHERE departmentId = ?",[manager.managerDepartmentId]);
            await db_connection.query("UNLOCK TABLES");
            db_connection.release();
            if(role.length!=0 && department.length!=0){
                return true;
            }
        }
        return false;
    },

    //sha256 consists only Hexadecimal characters.
    isValidAdminLogin: (manager) => {
        if (typeof(manager.managerEmail)=='string' &&
            validator.isEmail(manager.managerEmail) &&
            typeof(manager.managerPassword)=='string' &&
            manager.managerPassword.length == 64 &&
            validator.isLength(manager.managerPassword, { min: 8 }) && !validator.contains(manager.managerPassword, '-' || "'")) 
        {
            return true;
        }
        return false;
    },

    isValidStudentRequest: async (studentId) =>{
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES studentData READ");
        const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?",[studentId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(studentData.length==0 || (studentData.length>1 && studentData[0].studentAccountStatus=="0") ){
            return false;
        }
        return true;
    },

    isValidAdminRequest: async (managerId) =>{
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES managerData READ");
        const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?",[managerId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        //console.log(managerData);
        //console.log(managerData[0].managerAccountStatus);
        if(managerData.length==0 || (managerData.length>0 && managerData[0].managerAccountStatus=="0") ){
            //console.log("false");
            return false;
        }
        return true;
    },

    isValidEditStudentProfile: (student) => {
        if (typeof(student.studentFullName)=='string' &&
            student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
            typeof(student.studentPhone)=='string' &&
            student.studentPhone.length == 10 && validator.isNumeric(student.studentPhone) &&
            typeof(student.studentCollegeName)=='string' &&
            student.studentCollegeName.length > 0 && student.studentCollegeName.length <= 255 &&
            typeof(student.studentCollegeCity)=='string' &&
            student.studentCollegeCity.length > 0 && student.studentCollegeCity.length <= 255) 
        {
            return true;
        }
        return false;
    },

    isValidAdminEditProfile: (manager) => {
        if (typeof(manager.managerFullName)=='string' &&
            manager.managerFullName.length > 0 && manager.managerFullName.length <= 255 &&
            typeof(manager.managerPhone)=='string' &&
            manager.managerPhone.length == 10 && validator.isNumeric(manager.managerPhone) &&
            manager.managerDepartmentId!=null && manager.managerDepartmentId!=undefined && !isNaN(manager.managerDepartmentId)
        )
        {
            return true;
        }
        return false;
    },

    isValidToggleStarredEventRequest: async (req) =>{
        if(req.body.eventId==undefined || req.body.eventId == null || isNaN(req.body.eventId)){
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES eventData READ");
        const [event] = await db_connection.query("SELECT * FROM eventData WHERE eventId=?",[req.body.eventId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(event.length==0 || (req.body.isStarred != "0" && req.body.isStarred != "1")){
            return false;
        }
        return true;
    },

    vaildRegistrationDataRequest: async (req) =>{
        if(req.body.registrationId==undefined || req.body.registrationId == null || isNaN(req.body.registrationId)){
            return false;
        }
        return true;
    },

    isValidTag: async (tag) =>{
        if(typeof(tag.tagName)!='string' || tag.tagName==undefined || tag.tagName == null || tag.tagName.length>255 || tag.tagName.length==0 ||
        typeof(tag.tagAbbreviation)!='string' ||
        tag.tagAbbreviation==undefined || tag.tagAbbreviation == null || tag.tagAbbreviation.length>255 || tag.tagAbbreviation.length==0
        ){
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES tagData READ");
        const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagName = ? OR tagAbbreviation =?",[tag.tagName, tag.tagAbbreviation]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(tagData.length!=0){
            return false;
        }
        return true;
    },
    isValidToggleTagStatus: async (tag) =>{
        if(tag.tagId==undefined || tag.tagId == null || isNaN(tag.tagId)
        || typeof(tag.isActive)!='string'
        || tag.isActive==undefined || tag.isActive == null || (tag.isActive!="0" && tag.isActive!="1")
        ){
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES tagData READ");
        const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId = ?",[tag.tagId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(tagData.length==0){
            return false;
        }
        return true;
    },
    isValidCreateEvent: async (event) =>{
        if(typeof(event.eventName)!='string' ||
           event.eventName==undefined || event.eventName == null || event.eventName.length>255 || event.eventName.length==0 ||
           typeof(event.eventDescription)!='string' ||
           event.eventDescription==undefined || event.eventDescription == null || event.eventDescription.length>255 || event.eventDescription.length==0 ||
           typeof(event.eventMarkdownDescription)!='string' ||
           event.eventMarkdownDescription==undefined || event.eventMarkdownDescription == null || event.eventMarkdownDescription.length>5000 || event.eventMarkdownDescription.length==0 ||
           typeof(event.eventDate)!='string' ||
           event.eventDate ==undefined || event.eventDate == null || isNaN(Date.parse(event.eventDate))|| event.eventDate.length==0 ||
           typeof(event.eventTime)!='string' ||
           event.eventTime ==undefined || event.eventTime == null || validator.isTime(event.eventTime) || event.eventTime.length==0 ||
           typeof(event.eventVenue)!='string' ||
           event.eventVenue==undefined || event.eventVenue == null || event.eventVenue.length>255 || event.eventVenue.length==0 ||
           typeof(event.eventImageURL)!='string' ||
           event.eventImageURL == undefined || event.eventImageURL == null || event.eventImageURL.length>255 || event.eventImageURL.length==0 ||
           event.eventPrice == undefined || event.eventPrice == null || isNaN(event.eventPrice) ||
           event.maxSeats == undefined || event.maxSeats == null || isNaN(event.maxSeats) ||
           event.minTeamSize == undefined || event.minTeamSize == null || isNaN(event.minTeamSize) ||
           event.maxTeamSize == undefined || event.maxTeamSize == null || isNaN(event.maxTeamSize) ||
           event.isWorkshop == undefined || event.isWorkshop == null || (event.isWorkshop!="0" && event.isWorkshop!="1") ||
           event.isTechnical == undefined || event.isTechnical == null || (event.isTechnical!="0" && event.isTechnical!="1") ||
           event.isGroup == undefined || event.isGroup == null || (event.isGroup!="0" && event.isGroup!="1") ||
           event.isPerHeadPrice == undefined || event.isPerHeadPrice == null || (event.isPerHeadPrice!="0" && event.isPerHeadPrice!="1") ||
           event.isRefundable == undefined || event.isRefundable == null || (event.isRefundable!="0" && event.isRefundable!="1") ||
           event.needGroupData == undefined || event.needGroupData == null || (event.needGroupData!="0" && event.needGroupData!="1") ||
           event.eventDepartmentId == undefined || event.eventDepartmentId == null || isNaN(event.eventDepartmentId)
        )
        {
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES departmentData READ");
        const [departmentData] = await db_connection.query("SELECT * FROM departmentData WHERE departmentId = ?",[event.eventDepartmentId]);
        if(departmentData.length==0){
            return false;
        }
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        return true;
    },
    isValidEditEventData: async (event) =>{
        if( typeof(event.eventName)!='string' ||
            event.eventName==undefined || event.eventName == null || event.eventName.length>255 || event.eventName.length==0 ||
            typeof(event.eventDescription)!='string' ||
            event.eventDescription==undefined || event.eventDescription == null || event.eventDescription.length>255 || event.eventDescription.length==0 ||
            typeof(event.eventMarkdownDescription)!='string' ||
            event.eventMarkdownDescription==undefined || event.eventMarkdownDescription == null || event.eventMarkdownDescription.length>5000 || event.eventMarkdownDescription.length==0 ||
            typeof(event.eventDate)!='string' ||
            event.eventDate ==undefined || event.eventDate == null || isNaN(Date.parse(event.eventDate))|| event.eventDate.length==0 ||
            typeof(event.eventTime)!='string' ||
            event.eventTime ==undefined || event.eventTime == null || validator.isTime(event.eventTime) || event.eventTime.length==0 ||
            typeof(event.eventVenue)!='string' ||
            event.eventVenue==undefined || event.eventVenue == null || event.eventVenue.length>255 || event.eventVenue.length==0 ||
            typeof(event.eventImageURL)!='string' ||
            event.eventImageURL == undefined || event.eventImageURL == null || event.eventImageURL.length>255 || event.eventImageURL.length==0 ||
            event.eventPrice == undefined || event.eventPrice == null || isNaN(event.eventPrice) ||
            event.maxSeats == undefined || event.maxSeats == null || isNaN(event.maxSeats) ||
            event.minTeamSize == undefined || event.minTeamSize == null || isNaN(event.minTeamSize) ||
            event.maxTeamSize == undefined || event.maxTeamSize == null || isNaN(event.maxTeamSize) ||
            event.isWorkshop == undefined || event.isWorkshop == null || (event.isWorkshop!="0" && event.isWorkshop!="1") ||
            event.isTechnical == undefined || event.isTechnical == null || (event.isTechnical!="0" && event.isTechnical!="1") ||
            event.isGroup == undefined || event.isGroup == null || (event.isGroup!="0" && event.isGroup!="1") ||
            event.isPerHeadPrice == undefined || event.isPerHeadPrice == null || (event.isPerHeadPrice!="0" && event.isPerHeadPrice!="1") ||
            event.isRefundable == undefined || event.isRefundable == null || (event.isRefundable!="0" && event.isRefundable!="1") ||
            event.needGroupData == undefined || event.needGroupData == null || (event.needGroupData!="0" && event.needGroupData!="1") ||
            event.eventDepartmentId == undefined || event.eventDepartmentId == null || isNaN(event.eventDepartmentId)||
            event.eventId == undefined || event.eventId == null || isNaN(event.eventId)
         )
         {
             //console.log("body");
             return false;
         }
         const db_connection = await anokha_db.promise().getConnection();
         await db_connection.query("LOCK TABLES departmentData READ");
         const [departmentData] = await db_connection.query("SELECT * FROM departmentData WHERE departmentId = ?",[event.eventDepartmentId]);
         if(departmentData.length==0){
             //console.log("department");
             return false;
         }
         await db_connection.query("UNLOCK TABLES");
         await db_connection.query("LOCK TABLES eventData READ");
         const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?",[event.eventId]);
         if(eventData.length==0){
            //console.log("eventId");
            return false;
         }
         await db_connection.query("UNLOCK TABLES");
         db_connection.release();
         return true;
    },
    isValidToggleEventStatus: async (event) =>{
        if(event.eventId==undefined || event.eventId == null || isNaN(event.eventId)
        || event.eventStatus==undefined || event.eventStatus == null || (event.eventStatus!="0" && event.eventStatus!="1" && event.eventStatus!="2")
        ){
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES eventData READ");
        const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?",[event.eventId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(eventData.length==0){
            return false;
        }
        return true;
    },
    isValidTagEvent: async (req) => {
        if(req.eventId==undefined || req.eventId == null || isNaN(req.eventId)
        || req.tagId==undefined || req.tagId == null || isNaN(req.tagId)
        ){
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES eventData READ, tagData READ");
        const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?",[req.eventId]);
        const [tagData] = await db_connection.query("SELECT * FROM tagData WHERE tagId = ?",[req.tagId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(eventData.length==0 || tagData.length==0){
            return false;
        }
        return true;
    },

    isValidToggleStudentStatus: async (student) =>{
        if(student.studentId==undefined || student.studentId == null || isNaN(student.studentId)
        || student.isActive==undefined || student.isActive == null || (student.isActive!="0" && student.isActive!="1")
        ){
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES studentData READ");
        const [studentData] = await db_connection.query("SELECT * FROM studentData WHERE studentId = ?",[student.studentId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(studentData.length==0){
            return false;
        }
        return true;
    },

    isValidToggleOfficialStatus: async (manager) =>{
        if(manager.managerId==undefined || manager.managerId == null || isNaN(manager.managerId)
        || manager.isActive==undefined || manager.isActive == null || (manager.isActive!="0" && manager.isActive!="1")
        ){
            return false;
        }
        return true;
    },

    isValidAssignEventToOfficial: async (req) =>{
        if(req.eventId==undefined || req.eventId == null || isNaN(req.eventId)
        || req.managerId==undefined || req.managerId == null || isNaN(req.managerId)
        ){
            return false;
        }
        const db_connection = await anokha_db.promise().getConnection();
        await db_connection.query("LOCK TABLES eventData READ, managerData READ");
        const [eventData] = await db_connection.query("SELECT * FROM eventData WHERE eventId = ?",[req.eventId]);
        const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId = ?",[req.managerId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(eventData.length==0 || managerData.length==0){
            return false;
        }
        return true;
    },
}