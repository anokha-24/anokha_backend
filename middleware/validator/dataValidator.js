const validator = require('validator');

module.exports = {
    // Password should be greater than or equal to 8 characters. Cannot have hiphens or quotes.
    isValidPassword: (password) => {
        if (validator.isLength(password, { min: 8 }) && !validator.contains(password, '-' || "'")) {
            return true;
        }
        return false;
    },

    isValidOtp: (otp) => {
        if (validator.isNumeric(otp) && validator.isLength(otp, { min: 6, max: 6 })) {
            return true;
        }
        return false;
    },

    /*
    {
        "studentFullName":"",
        "studentEmail":"",
        "studentPhone":"",
        "studentPassword":"",
        "studentCollegeName":"",
        "studentCollegeCity":"",
    }
    */
    isValidStudentRegistration: (student) => {
        if (student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
            validator.isEmail(student.studentEmail) &&
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
    needPassport: (email) => {
        if (email.endsWith('@cb.students.amrita.edu') || email.endsWith('@cb.amrita.edu')) {
            return false;
        }
        return true;
    },
}