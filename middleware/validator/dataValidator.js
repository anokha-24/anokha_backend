const validator = require('validator');
const [anokha_db, anokha_transactions_db] = require('../../connection/poolConnection');

module.exports = {
    // Password should be greater than or equal to 8 characters. Cannot have hiphens or quotes.
    isValidPassword: (password) => {
        // if (validator.isLength(password, { min: 8 }) && !validator.contains(password, '-' || "'")) {
        //     return true;
        // }
        // return false;
        if (password!=null && password.length > 8 && password.length <= 255 ) {
            return true;
        }
        return false;
    },

    // Email should be valid.
    isValidEmail: (email) => {
        if (email.length>0 && email.length <=255 && validator.isEmail(email)) {
            return true;
        }
        return false;
    },

    
    isValidOtp: (otp) => {
        if (otp != null && otp.length>0 && otp.length<=255) {
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
        if (student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
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
        if (validator.isEmail(student.studentEmail) &&
            student.studentPassword.length == 64 &&
            validator.isLength(student.studentPassword, { min: 8 }) && !validator.contains(student.studentPassword, '-' || "'")) 
        {
            return true;
        }
        return false;
    },

    isValidAdminRegistration: async (manager) => {
        if (manager.managerFullName.length > 0 && manager.managerFullName.length <= 255 &&
            validator.isEmail(manager.managerEmail) && manager.managerEmail.length > 0 && manager.managerEmail.length <= 255 &&
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
        if (validator.isEmail(manager.managerEmail) &&
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
        const [managerData] = await db_connection.query("SELECT managerAccountStatus FROM managerData WHERE managerId=?",[managerId]);
        await db_connection.query("UNLOCK TABLES");
        db_connection.release();
        if(managerData.length==0 || (managerData.length>1 && managerData[0].managerAccountStatus=="0") ){
            return false;
        }
        return true;
    },

    isValidEditStudentProfile: (student) => {
        if (student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
            student.studentPhone.length == 10 && validator.isNumeric(student.studentPhone) &&
            student.studentCollegeName.length > 0 && student.studentCollegeName.length <= 255 &&
            student.studentCollegeCity.length > 0 && student.studentCollegeCity.length <= 255) 
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

}