const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const otpTokenGenerator = require('../middleware/auth/otp/tokenGenerator');
const [otpTokenValidator, studentResetPasswordValidator, adminResetPasswordValidator] = require('../middleware/auth/otp/tokenValidator');
const tokenGenerator = require('../middleware/auth/login/tokenGenerator');
const adminTokenGenerator = require('../middleware/auth/login/adminTokenGenerator');
const [adminTokenValidator,adminTokenValidatorRegister, adminTokenValidatorSpecial] = require('../middleware/auth/login/adminTokenValidator');
const tokenValidator = require('../middleware/auth/login/tokenValidator');
const generateOTP = require("../middleware/auth/otp/otpGenerator");
const mailer = require('../middleware/mailer/mailer');
const crypto = require('crypto');
const validator = require('validator');
const { db } = require('../config/appConfig');
const passwordGenerator = require('secure-random-password');

module.exports = {
    
    testConnection: async (req, res) => {
        
        return res.status(200).send({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "Auth"
        });
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
    registerStudent: async (req, res) => {
        
        //validate Request
        if (!dataValidator.isValidStudentRegistration(req.body)) {
            
            return res.status(400).send({
                "MESSAGE": "Invalid Data"
            });;
        }
        
        //if request is valid
        else {
            
            const db_connection = await anokha_db.promise().getConnection();
            
            try {
                
                //check if user already exists
                await db_connection.query("LOCK TABLES studentData READ, studentRegister WRITE");
                
                const [result] = await db_connection.query("SELECT * FROM studentData WHERE studentEmail = ? OR studentPhone = ?", [req.body.studentEmail, req.body.studentPhone]);
                
                if (result.length > 0) {
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Student Already Exists!"
                    });
                }
                
                // if user does not exist
                else {
                    
                    var needPassport = "1";
                    
                    var isInCampus = "0";
                    
                    const studentAccountStatus = "1";
                    
                    // check if user is needs passport
                    if (!dataValidator.needPassport(req.body.studentEmail)) {
                        
                        //if user needs passport
                        needPassport = "0";
                        isInCampus = "1";
                        
                        req.body.studentCollegeName = "Amrita Vishwa Vidyapeetham";
                        req.body.studentCollegeCity = "Coimbatore";
                    }
                    
                    //generate OTP
                    const otp = generateOTP();

                    // sha256 hash the password.
                    //req.body.studentPassword = crypto.createHash('sha256').update(req.body.studentPassword).digest('hex');

                    //generate OTP token Payload
                    const secret_token = await otpTokenGenerator({
                        "studentFullName": req.body.studentFullName,
                        "studentEmail": req.body.studentEmail,
                        "studentPhone": req.body.studentPhone,
                        "studentPassword": req.body.studentPassword,
                        "needPassport": needPassport,
                        "studentAccountStatus": studentAccountStatus,
                        "studentCollegeName": req.body.studentCollegeName,
                        "studentCollegeCity": req.body.studentCollegeCity,
                        "isInCampus": isInCampus
                    });

                    mailer.studentRegistered(req.body.studentFullName, req.body.studentEmail, otp);

                    await db_connection.query("DELETE FROM studentRegister WHERE studentEmail = ?", [req.body.studentEmail]);
                    
                    //sha256 hash the otp
                    const otp_hashed = crypto.createHash('sha256').update(otp).digest('hex');
                    
                    //insert OTP into studentRegister
                    await db_connection.query("INSERT INTO studentRegister (studentEmail, otp) VALUES (?,?)", [req.body.studentEmail, otp_hashed]);

                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(200).send({
                        "SECRET_TOKEN": secret_token,
                        "MESSAGE": "User Registered Successfully, Check Email for OTP!"
                    });
                }
            }
            
            catch (err) {
                
                console.log(err);
                
                const time = new Date();
                fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - registerUser - ${err}\n`);
                
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            }
            finally {
                
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
            }
        }
    },

    
    /*{
        "otp": ""
    }*/

    verifyStudent: [
        otpTokenValidator,
        async (req, res) => {
            
            //validate Request
            if (!(dataValidator.isValidOtp(req.body.otp) && dataValidator.isValidEmail(req.body.studentEmail))) {
                return res.status(400).send({
                    "MESSAGE": "Invalid Data"
                });
            }
            
            //if request is valid
            else {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {
                    
                    //check if user already exists
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [result] = await db_connection.query("SELECT * FROM studentData WHERE studentEmail = ?", [req.body.studentEmail]);
                    
                    if (result.length > 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "User Already Exists!"
                        });
                    }
                    
                    //if user does not exist
                    else {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        await db_connection.query("LOCK TABLES studentRegister WRITE, studentData WRITE");
                        
                        //verify OTP
                        const [check] = await db_connection.query(`DELETE FROM studentRegister WHERE studentEmail = ? AND otp = ?`, [req.body.studentEmail, req.body.otp]);
                        
                        if (check.affectedRows === 0) {
                            
                            await db_connection.query(`UNLOCK TABLES`);
                            
                            return res.status(400).send({ "MESSAGE": "Invalid OTP!" });
                            
                        }
                        
                        
                        //if OTP is valid
                        else {
                            
                            //if user doesn't need passport
                            if (!dataValidator.needPassport(req.body.studentEmail)) {
                                req.body.studentAccountStatus = "2";
                            }
                            
                            //if user needs passport
                            else {
                                req.body.studentAccountStatus = "1";
                            }

                            
                            //insert user into studentData
                            await db_connection.query("INSERT INTO studentData (studentFullName, studentEmail, studentPhone, studentPassword, needPassport, studentAccountStatus, studentCollegeName, studentCollegeCity, isInCampus) VALUES (?,?,?,?,?,?,?,?,?)", [req.body.studentFullName, req.body.studentEmail, req.body.studentPhone, req.body.studentPassword, req.body.needPassport, req.body.studentAccountStatus, req.body.studentCollegeName, req.body.studentCollegeCity, req.body.isInCampus]);
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            
                            return res.status(200).send({
                                "MESSAGE": "User Registration Verified Successfully!"
                            });
                        }
                    }
                }
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - verifyStudent - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }],

    /*{
        "studentEmail": "",
        "studentPassword": ""
    }*/
    loginStudent: async (req, res) => {
        
        //validate Request
        if (!dataValidator.isValidStudentLogin(req.body)) {
            
            return res.status(400).send({
                "MESSAGE": "Invalid Data"
            });
        }
        
        //if request is valid
        else {
            
            const db_connection = await anokha_db.promise().getConnection();
            
            try {
                
                await db_connection.query("LOCK TABLES studentData READ");

                
                //check if credentials are correct
                const [student] = await db_connection.query(`SELECT * from studentData where studentEmail = ? and studentPassword = ?`, [req.body.studentEmail, req.body.studentPassword]);
                await db_connection.query("UNLOCK TABLES");

                //if credentials are incorrect
                if (student.length === 0) {
                    return res.status(400).send({ "MESSAGE": "Invalid Credentials!" });
                    
                }
                
                //if credentials are correct
                else {

                    //if account is blocked
                    if (student[0].studentAccountStatus === "0") {
                        
                        return res.status(400).send({ "MESSAGE": "Account is BLOCKED by Admin!" });
                        
                    }
                    
                    else {
                        
                        await db_connection.query("LOCK TABLES studentLoginLogs WRITE");
                        
                        await db_connection.query("INSERT INTO studentLoginLogs (studentId, loginTime) VALUES (?, NOW())", [student[0].studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        
                        //generate token and send student details as response
                        const token = await tokenGenerator({
                            "studentEmail": req.body.studentEmail,
                            "studentId": student[0].studentId
                        });
                        
                        return res.status(200).send({
                            "MESSAGE": "User Login Successful!",
                            "SECRET_TOKEN": token,
                            "studentId": student[0].studentId,
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
                }
            }
            catch (err) {
                
                console.log(err);
                
                const time = new Date();
                fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - loginStudent - ${err}\n`);
                
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            }
            finally {
                
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
            }
        }
    },


    /*{
        "managerEmail": "",
        "managerPassword": ""
    }*/    
    loginAdmin: async (req, res) => {
        
        //validate Request
        if (!dataValidator.isValidAdminLogin(req.body)) {
            
            return res.status(400).send({
                "MESSAGE": "Invalid Data"
            });
        }
        
        //if request is valid
        else {
            
            const db_connection = await anokha_db.promise().getConnection();
            
            try {
                
                await db_connection.query("LOCK TABLES managerData READ, managerRole READ");

                
                //check if credentials are correct
                const [manager] = await db_connection.query(`SELECT * from managerData where managerEmail = ? and managerPassword = ?`, [req.body.managerEmail, req.body.managerPassword]);

                //if credentials are incorrect
                if (manager.length === 0) {
                    
                    await db_connection.query("UNLOCK TABLES");

                    return res.status(400).send({ "MESSAGE": "Invalid Credentials!" });
                    
                }
                
                //if credentials are correct
                else {

                    //if account is blocked
                    if (manager[0].managerAccountStatus === "0") {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({ "MESSAGE": "Account is BLOCKED by Admin!" });
                        
                    }
                    
                    else {
                        
                        const [role]= await db_connection.query(`SELECT * from managerRole where roleId = ?`, [manager[0].managerRoleId]);
                        
                        await db_connection.query("UNLOCK TABLES");

                        await db_connection.query("LOCK TABLES managerLoginLogs WRITE");
                        
                        await db_connection.query("INSERT INTO managerLoginLogs (managerId, loginTime) VALUES (?, NOW())", [manager[0].managerId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        
                        //generate token and send student details as response
                        const token = await adminTokenGenerator({
                            "managerEmail": req.body.managerEmail,
                            "managerId": manager[0].managerId,
                            "authorizationTier": manager[0].managerRoleId
                        });
                        
                        return res.status(200).send({
                            "MESSAGE": "Manager Login Successful!",
                            "SECRET_TOKEN": token,
                            "managerFullName": manager[0].managerFullName,
                            "managerEmail": manager[0].managerEmail,
                            "managerPhone": manager[0].managerPhone,
                            "managerRoleId": manager[0].managerRoleId,
                            "managerRoleName": role[0].roleName,
                        });
                    }
                }
            }
            catch (err) {
                
                console.log(err);
                
                const time = new Date();
                fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - loginAdmin - ${err}\n`);
                
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            }
            
            finally {
                
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
            }
        }
    },

    registerAdmin:[
        adminTokenValidatorRegister,
        async (req, res) => {
            
            //Admins and SuperAdmins can register anybody. Except SuperAdmins.
            if((req.body.authorizationTier == 1 || req.body.authorizationTier == 2)){
                
                //Validate Request
                if (!dataValidator.isValidAdminRegistration(req.body)) {
                    
                    return res.status(400).send({
                        "MESSAGE": "Invalid Data"
                    });
                }
                else{
                    
                    const db_connection = await anokha_db.promise().getConnection();
                    
                    try{
                    
                        //check if user already exists
                        await db_connection.query("LOCK TABLES managerData READ");
                        
                        const [result] = await db_connection.query("SELECT * FROM managerData WHERE managerEmail = ? OR managerPhone = ?", [req.body.managerEmail, req.body.managerPhone]);
                        
                        if (result.length > 0) {
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Manager Already Exists!"
                            });
                        }

                        await db_connection.query("UNLOCK TABLES");
                        
                        await db_connection.query("LOCK TABLES managerRole READ, departmentData READ");
                        
                        const [role] = await db_connection.query("SELECT * from managerRole WHERE roleId = ?", [req.body.managerRoleId]);
                        
                        const [department] = await db_connection.query("SELECT * from departmentData WHERE departmentId = ?", [req.body.managerDepartmentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        if (role.length == 0 || department.length == 0) {
                            
                            await db_connection.query("UNLOCK TABLES");
                            
                            return res.status(400).send({
                                "MESSAGE": "Invalid Data"
                            });
                        }
                        
                        // generate a random password for the manager.
                        const managerPassword = passwordGenerator.randomPassword({
                            length: 8,
                            characters: [passwordGenerator.lower, passwordGenerator.upper, passwordGenerator.digits]
                        });

                        // sha256 hash the password.
                        const passwordHashed = crypto.createHash('sha256').update(managerPassword).digest('hex');

                        await db_connection.query("LOCK TABLES managerData WRITE");
                        
                        await db_connection.query(
                        `INSERT INTO managerData
                        (managerFullName,
                        managerEmail,
                        managerPhone,
                        managerPassword, 
                        managerRoleId, 
                        managerDepartmentId, 
                        managerAddedBy) 
                        VALUES (?,?,?,?,?,?,?)`,
                        [req.body.managerFullName,
                        req.body.managerEmail,
                        req.body.managerPhone,
                        passwordHashed,
                        req.body.managerRoleId,
                        req.body.managerDepartmentId,
                        req.body.managerId]);

                        await db_connection.query("UNLOCK TABLES");
                        
                        // Email the password to the manager.
                        mailer.managerRegistered(req.body.managerFullName, req.body.managerEmail, managerPassword);
                        
                        return res.status(200).send({
                            "MESSAGE": "Manager Registered Successfully!"
                        });
                    }
                    catch(err)
                    {
                        
                        console.log(err);
                        
                        const time = new Date();
                        fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - registerAdmin - ${err}\n`);
                        
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

            // if user is a Department Head, he can register only local attendance markers.
            else if (req.body.authorizationTier == 4){
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    //check if manager is from the same department
                    const [managerData] =  await db_connection.query("SELECT * FROM managerData WHERE managerId = ?",[req.body.managerId]);
                    
                    if(managerData[0].managerDepartmentId != req.body.managerDepartmentId){
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Unauthorised Access! You can only add managers within your department."
                        });
                    }
                    
                    //check if registree is a local attendance marker.
                    if(!(req.body.managerRoleId == 7)){
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Unauthorised Access. Warning."
                        });
                    }

                    //check if user already exists
                    const [result] = await db_connection.query("SELECT * FROM managerData WHERE managerEmail = ? OR managerPhone = ?", [req.body.managerEmail, req.body.managerPhone]);
                    
                    if (result.length > 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Manager Already Exists!"
                        });
                    }

                    
                    // generate a random password for the manager.
                    const managerPassword = passwordGenerator.randomPassword({
                        length: 8,
                        characters: [passwordGenerator.lower, passwordGenerator.upper, passwordGenerator.digits]
                    });

                    // sha256 hash the password.
                    const passwordHashed = crypto.createHash('sha256').update(managerPassword).digest('hex');

                    
                    await db_connection.query("LOCK TABLES managerData WRITE");
                    
                    await db_connection.query(
                        `INSERT INTO managerData
                        (managerFullName,
                        managerEmail,
                        managerPhone,
                        managerPassword, 
                        managerRoleId, 
                        managerDepartmentId, 
                        managerAddedBy) 
                        VALUES (?,?,?,?,?,?,?)`,
                        [req.body.managerFullName,
                        req.body.managerEmail,
                        req.body.managerPhone,
                        passwordHashed,
                        req.body.managerRoleId,
                        req.body.managerDepartmentId,
                        req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");

                    // Email the password to the manager.
                    mailer.managerRegistered(req.body.managerFullName, req.body.managerEmail, managerPassword);
                    
                    return res.status(200).send({
                        "MESSAGE": "Manager Registered Successfully!"
                    });
                }

                catch(err)
                {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - registerAdmin - ${err}\n`);
                    
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
                
                return res.status(401).send({
                    "MESSAGE": "Unauthorized access. Warning."
                });
            }
        }
    ],

    
    /*{
        "studentEmail": ""
    }*/
    forgotPasswordStudent: async (req, res) => {
        
        if (!dataValidator.isValidEmail(req.body.studentEmail)) {
            
            return res.status(400).send({
                "MESSAGE": "Invalid Data"
            });
        }
        
        else {
            
            const db_connection = await anokha_db.promise().getConnection();
            
            try {
                
                await db_connection.query("LOCK TABLES studentData READ,forgotPasswordStudent WRITE");
                
                const [student] = await db_connection.query(`SELECT * from studentData where studentEmail = ?`, [req.body.studentEmail]);
                
                if (student.length === 0) {
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Account Does Not Exist!"
                    });
                }
                
                else if (student[0].studentAccountStatus === "0") {
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Account is BLOCKED by Admin!"
                    });
                }
                
                else {
                    
                    await db_connection.query(`DELETE from forgotPasswordStudent where studentId = ?`, [student[0].studentId]);
                    
                    const otp = generateOTP();
                    
                    const otp_token = await otpTokenGenerator({
                        "studentEmail": student[0].studentEmail,
                        "studentId": student[0].studentId
                    });
                    
                    
                    //hash otp and insert into forgotPasswordStudent
                    const otp_hashed = crypto.createHash('sha256').update(otp).digest('hex');
                    
                    await db_connection.query("INSERT INTO forgotPasswordStudent (studentId, otp) VALUES (?,?)", [student[0].studentId, otp_hashed]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    mailer.forgotPassword(student[0].studentFullName, student[0].studentEmail, otp);
                    
                    return res.status(200).send({
                        "MESSAGE": "Check Email for Password Reset OTP!",
                        "SECRET_TOKEN": otp_token
                    });
                }
            }
            catch (err) {
                
                console.log(err);
                
                const time = new Date();
                fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - forgotPasswordStudent - ${err}\n`);
                
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            }
            finally {
                
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
            }
        }
    },

    /*{
        "managerEmail": ""
    }*/
    forgotPasswordAdmin: async (req, res) => {
        
        if (!dataValidator.isValidEmail(req.body.managerEmail)) {
            
            return res.status(400).send({
                "MESSAGE": "Invalid Data"
            });
        }
        
        else {
            
            const db_connection = await anokha_db.promise().getConnection();
            
            try {
                
                await db_connection.query("LOCK TABLES managerData READ,forgotPasswordManager WRITE");
                
                const [manager] = await db_connection.query(`SELECT * from managerData where managerEmail = ?`, [req.body.managerEmail]);
                
                if (manager.length === 0) {
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Account Does Not Exist!"
                    });
                }
                
                else if (manager[0].managerAccountStatus === "0") {
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    return res.status(400).send({
                        "MESSAGE": "Account is BLOCKED by Admin!"
                    });
                }
                
                else {
                    
                    await db_connection.query(`DELETE from forgotPasswordManager where managerId = ?`, [manager[0].managerId]);
                    
                    const otp = generateOTP();
                    
                    const otp_token = await otpTokenGenerator({
                        "managerEmail": manager[0].managerEmail,
                        "managerId": manager[0].managerId
                    });
                    
                    
                    //hash otp and insert into forgotPasswordManager
                    const otp_hashed = crypto.createHash('sha256').update(otp).digest('hex');
                    
                    
                    await db_connection.query("INSERT INTO forgotPasswordManager (managerId, otp) VALUES (?,?)", [manager[0].managerId, otp_hashed]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    mailer.forgotPassword(manager[0].managerFullName, manager[0].managerEmail, otp);
                    
                    return res.status(200).send({
                        "MESSAGE": "Check Email for Password Reset OTP!",
                        "SECRET_TOKEN": otp_token
                    });
                }
            }
            catch (err) {
                
                console.log(err);
                
                const time = new Date();
                fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - forgotPasswordAdmin - ${err}\n`);
                
                return res.status(500).send({
                    "MESSAGE": "Internal Server Error. Contact Web Team."
                });
            }
            finally {
                
                await db_connection.query("UNLOCK TABLES");
                db_connection.release();
            }
        }
    },

    
    /*{
        "otp": "",
        "studentPassword": ""
    }*/
    resetPasswordStudent: [
        studentResetPasswordValidator,
        async (req, res) => {
            
            if (!(dataValidator.isValidOtp(req.body.otp) && dataValidator.isValidEmail(req.body.studentEmail) && dataValidator.isValidPassword(req.body.studentPassword))) {
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Data"
                });
            }
            else {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {
                    
                    await db_connection.query("LOCK TABLES forgotPasswordStudent WRITE, studentData WRITE");

                    const [verify] = await db_connection.query(`SELECT * from studentData where studentEmail = ?`, [req.body.studentEmail]);

                    //if user does not exist
                    if (verify.length === 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Account Does Not Exist!"
                        });
                    }

                    //if account is blocked
                    else if (verify[0].studentAccountStatus === "0") {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Account is BLOCKED by Admin!"
                        });
                    }

                    

                    //check if OTP is correct
                    const [student] = await db_connection.query(`DELETE from forgotPasswordStudent where studentId = ? and otp = ?`, [verify[0].studentId, req.body.otp]);
                    
                    if (student.affectedRows === 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid OTP!"
                        });
                    }

                    else {
                        
                        await db_connection.query("UPDATE studentData SET studentPassword = ? WHERE studentId = ?", [req.body.studentPassword, verify[0].studentId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Password Reset Successful!"
                        });
                    }
                }
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - resetPasswordStudent - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                
                }
            }
        }],

    
    /*{
        "otp": "",
        "managerPassword": ""
    }*/
    resetPasswordAdmin: [
        adminResetPasswordValidator,
        async (req, res) => {
            
            if (!(dataValidator.isValidOtp(req.body.otp) && dataValidator.isValidEmail(req.body.managerEmail) && dataValidator.isValidPassword(req.body.managerPassword))) {
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Data"
                });
            }
            
            else {
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try {
                    
                    await db_connection.query("LOCK TABLES forgotPasswordManager WRITE, managerData WRITE");

                    const [verify] = await db_connection.query(`SELECT * from managerData where managerEmail = ?`, [req.body.managerEmail]);

                    //if user does not exist
                    if (verify.length === 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Account Does Not Exist!"
                        });
                    }

                    
                    //if account is blocked
                    else if (verify[0].managerAccountStatus === "0") {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Account is BLOCKED by Admin!"
                        });
                    }

                    
                    //check if OTP is correct
                    const [manager] = await db_connection.query(`DELETE from forgotPasswordManager where managerId = ? and otp = ?`, [verify[0].managerId, req.body.otp]);
                    
                    if (manager.affectedRows === 0) {
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid OTP!"
                        });
                    }

                    else {
                        
                        await db_connection.query("UPDATE managerData SET managerPassword = ? WHERE managerId = ?", [req.body.managerPassword, verify[0].managerId]);
                        
                        await db_connection.query("UNLOCK TABLES");
                        
                        return res.status(200).send({
                            "MESSAGE": "Password Reset Successful!"
                        });
                    }
                }
                
                catch (err) {
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - resetPasswordAdmin - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                }
                finally {
                    
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        }],
}