const mailer = require('nodemailer');
const fs = require('fs');
const appConfig = require('../../config/appConfig');

const TEMPLATE_STUDENT_REGISTERED = require('./template_student_registered');
const TEMPLATE_FORGOT_PASSWORD = require('./template_forgot_password');
const TEMPLATE_MANAGER_REGISTERED = require('./template_manager_registered');
const TEMPLATE_WELCOME_MAIL = require('./welcome_mail');
const TEMPLATE_ANOKHA_DOWN = require('./template_anokha_down');

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
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - studentRegistered - [ERROR]: ${error}\n`);
            } else {
                console.log('Student Verification OTP sent: ' + userEmail);
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - studentRegistered - [MESSAGE]: Student Verification OTP sent: ${userEmail}\n`);
            }
        });
    },

    welcomeMail: (fullName, userEmail) => {
        var mailOptions = {
            from: {
                name: appConfig.mailer.name,
                address: appConfig.mailer.obj.auth.user
            },
            to: userEmail,
            subject: '[Welcome to Anokha 2024]',
            html: TEMPLATE_WELCOME_MAIL(fullName)
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - welcomeMail - [ERROR]: ${error}\n`);
            } else {
                console.log('Welcome Mail sent: ' + userEmail);
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - welcomeMail - [MESSAGE]: Welcome Mail sent: ${userEmail}\n`);
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
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - managerRegistered - [ERROR]: ${error}\n`);
            } else {
                console.log('Manager Account Credentials sent: ' + managerEmail);
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - managerRegistered - [MESSAGE]: Manager Account Credentials sent: ${managerEmail}\n`);
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
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - forgotPassword - [ERROR]: ${error}\n`);
            } else {
                console.log('Forgot Password OTP sent: ' + studentEmail);
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - forgotPassword - [MESSAGE]: Forgot Password OTP sent: ${studentEmail}\n`);
            }
        });

    },

    anokhaDown: (devEmail, ccEmail, data) => {
        var mailOptions = {
            from: {
                name: appConfig.mailer.name,
                address: appConfig.mailer.obj.auth.user
            },
            to: devEmail,
            cc: ccEmail,
            subject: '[Anokha 2024] - Server Down',
            html: TEMPLATE_ANOKHA_DOWN(data)
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - anokhaDown - [ERROR]: ${error}\n`);
            } else {
                console.log('Anokha Down Mail sent: ' + devEmail + " and " + ccEmail);
                fs.appendFileSync('./logs/mailer.log', `${new Date().toLocaleString()} - anokhaDown - [MESSAGE]: Anokha Down Mail sent: ${devEmail} and ${ccEmail}\n`);
            }
        });
    }

}