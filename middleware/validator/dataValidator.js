const validator = require('validator');
const [anokha_db, anokha_transactions_db] = require('../../connection/poolConnection');

module.exports = {
    // Password should be greater than or equal to 8 characters. Cannot have hiphens or quotes.
    isValidPassword: (password) => {
        if (validator.isLength(password, { min: 8 }) && !validator.contains(password, '-' || "'")) {
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

    // OTP Should be exactly 6 digits and numeric only.
    isValidOtp: (otp) => {
        if (validator.isNumeric(otp) && validator.isLength(otp, { min: 6, max: 6 })) {
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

    isValidStudentLogin: (student) => {
        if (validator.isEmail(student.studentEmail) &&
            student.studentPassword.length > 0 && student.studentPassword.length <= 255 &&
            validator.isLength(student.studentPassword, { min: 8 }) && !validator.contains(student.studentPassword, '-' || "'")) 
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
}