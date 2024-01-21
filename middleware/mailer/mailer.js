const mailer = require('nodemailer');
const fs = require('fs');
const appConfig = require('../../config/appConfig');

const TEMPLATE_STUDENT_REGISTERED = require('./template_student_registered');
const TEMPLATE_FORGOT_PASSWORD = require('./template_forgot_password');
const TEMPLATE_MANAGER_REGISTERED = require('./template_manager_registered');


const transporter = mailer.createTransport(appConfig.mailer.obj);

module.exports = {
    studentRegistered: (fullName, userEmail, otp) => {
        var mailOptions = {
            from: {
                name: appConfig.mailer.name,
                address: appConfig.mailer.obj.auth.user
            },
            to: userEmail,
            subject: '[OTP Verification] - Anokha 2024',
            html: TEMPLATE_STUDENT_REGISTERED(fullName, otp)
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Student Verification OTP sent: ' + userEmail);
            }
        });
    },

    managerRegistered: (managerName, managerEmail, managerPassword) => {
        var mailOptions = {
            from: {
                name: appConfig.mailer.name,
                address: appConfig.mailer.obj.auth.user
            },
            to: managerEmail,
            subject: '[Admin Login Credentials] - Anokha 2024',
            html: TEMPLATE_MANAGER_REGISTERED(managerName, managerPassword)
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Manager Account Credentials sent: ' + managerEmail);
            }
        });
    },

    forgotPassword: (studentFullName, studentEmail, otp) => {
        var mailOptions = {
            from: {
                name: appConfig.mailer.name,
                address: appConfig.mailer.obj.auth.user
            },
            to: studentEmail,
            subject: '[OTP Password Reset] - Anokha 2024',
            html: TEMPLATE_FORGOT_PASSWORD(studentFullName, otp)
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Forgot Password OTP sent: ' + studentEmail);
            }
        });

    },
        
}