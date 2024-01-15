const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const otpTokenGenerator = require('../middleware/auth/otp/tokenGenerator');
const otpTokenValidator = require('../middleware/auth/otp/tokenValidator');
const tokenGenerator = require('../middleware/auth/login/tokenGenerator');
const tokenValidator = require('../middleware/auth/login/tokenValidator');
const generateOTP = require("../middleware/auth/otp/otpGenerator");
const mailer = require('../middleware/mailer/mailer');
const crypto = require('crypto');
const validator = require('validator');

module.exports = {
    testConnection: async (req, res) => {
        res.status(200).json({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "Auth"
        });
        return;
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
            res.status(400).json({
                "MESSAGE": "Invalid Data"
            });;
            return;
        }
        //if request is valid
        else {
            const db_connection = await anokha_db.promise().getConnection();
            try {
                //check if user already exists
                await db_connection.query("LOCK TABLES studentData READ, studentRegister WRITE");
                const [result] = await db_connection.query("SELECT * FROM studentData WHERE studentEmail = ?", [req.body.studentEmail]);
                if (result.length > 0) {
                    await db_connection.query("UNLOCK TABLES");
                    res.status(400).json({
                        "MESSAGE": "Student Already Exists!"
                    });
                    return;
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

                    //insert OTP into studentRegister
                    await db_connection.query("INSERT INTO studentRegister (studentEmail, otp) VALUES (?,?)", [req.body.studentEmail, otp]);


                    //await db_connection.query("INSERT INTO studentData (studentFullName, studentEmail, studentPhone, studentPassword, needPassport, studentAccountStatus studentCollegeName, studentCollegeCity, isInCampus) VALUES (?,?,?,?,?,?,?,?,?)", [req.body.studentFullName, req.body.studentEmail, req.body.studentPhone, req.body.studentPassword, needPassport, studentAccountStatus, req.body.studentCollegeName, req.body.studentCollegeCity, isInCampus]);
                    await db_connection.query("UNLOCK TABLES");

                    mailer.studentRegistered(req.body.studentFullName, req.body.studentEmail, otp)

                    res.status(200).json({
                        "SECRET_TOKEN": secret_token,
                        "MESSAGE": "User Registered Successfully, Check Email for OTP!"
                    });
                    return;
                }
            }
            catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - registerUser - ${err}\n`);
                res.status(500).json({
                    "MESSAGE": "Internal Server Error"
                });
                return;
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
            if (!(dataValidator.isValidOtp(req.body.otp) && validator.isEmail(req.body.studentEmail))) {
                res.status(400).json({
                    "MESSAGE": "Invalid Data"
                });
                return;
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
                        res.status(400).json({
                            "MESSAGE": "User Already Exists!"
                        });
                        return;
                    }
                    //if user does not exist
                    else {
                        await db_connection.query("UNLOCK TABLES");
                        await db_connection.query("LOCK TABLES studentRegister WRITE, studentData WRITE");
                        //verify OTP
                        const [check] = await db_connection.query(`Delete from studentRegister where studentEmail = ? and otp = ?`, [req.body.studentEmail, req.body.otp]);
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
                            // sha256 hash the password.
                            req.body.studentPassword = crypto.createHash('sha256').update(req.body.studentPassword).digest('hex');

                            await db_connection.query("INSERT INTO studentData (studentFullName, studentEmail, studentPhone, studentPassword, needPassport, studentAccountStatus, studentCollegeName, studentCollegeCity, isInCampus) VALUES (?,?,?,?,?,?,?,?,?)", [req.body.studentFullName, req.body.studentEmail, req.body.studentPhone, req.body.studentPassword, req.body.needPassport, req.body.studentAccountStatus, req.body.studentCollegeName, req.body.studentCollegeCity, req.body.isInCampus]);
                            await db_connection.query("UNLOCK TABLES");
                            res.status(200).json({
                                "MESSAGE": "User Registration Verified Successfully!"
                            });
                            return;
                        }
                    }
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - verifyStudent - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error"
                    });
                    return;
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
                res.status(400).json({
                    "MESSAGE": "Invalid Data"
                });
                return;
            }
            //if request is valid
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    //check if user already exists
                    await db_connection.query("LOCK TABLES studentData READ");
                    const [result] = await db_connection.query("SELECT * FROM studentData WHERE studentEmail = ?", [req.body.studentEmail]);
                    if (result.length === 0) {
                        await db_connection.query("UNLOCK TABLES");
                        res.status(400).json({
                            "MESSAGE": "User Does Not Exists!"
                        });
                        return;
                    }
                    //if user exist
                    else {
                        await db_connection.query("LOCK TABLES studentData READ");

                        // sha256 hash the password, right now before its being done in frontend itself later.
                        req.body.studentPassword = crypto.createHash('sha256').update(req.body.studentPassword).digest('hex');
                        
                        const [student] = await db_connection.query(`SELECT * from studentData where studentEmail = ? and studentPassword = ?`, [req.body.studentEmail, req.body.studentPassword]);
                        if (student.length === 0) {
                            await db_connection.query(`UNLOCK TABLES`);
                            return res.status(400).send({ "MESSAGE": "Invalid Credentials!" });
                        }
                        else {
                            await db_connection.query("UNLOCK TABLES");
                            const token = await tokenGenerator({
                                "studentEmail": req.body.studentEmail
                            });
                            res.status(200).json({
                                "MESSAGE": "User Login Successful!",
                                "SECRET_TOKEN": token,
                                "studentFullName":student[0].studentFullName,
                                "studentEmail":student[0].studentEmail,
                                "studentPhone":student[0].studentPhone,
                                "needPassport":student[0].needPassport,
                                "studentAccountStatus":student[0].studentAccountStatus,
                                "studentCollegeName":student[0].studentCollegeName,
                                "studentCollegeCity":student[0].studentCollegeCity,
                                "isInCampus":student[0].isInCampus
                            });
                            return;
                        }
                    }
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/authController/errorLogs.log', `${time.toISOString()} - loginStudent - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error"
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            }
        },
}