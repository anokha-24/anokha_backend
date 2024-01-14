const mailer = require('nodemailer');
const fs = require('fs');
const appConfig = require('../../config/appConfig');

const TEMPLATE_STUDENT_REGISTERED = require('./template_student_registered');


const transporter = mailer.createTransport(appConfig.mailer.obj);

module.exports = {
    studentRegistered: (fullName, userEmail, otp) => {
        var mailOptions = {
            from: {
                name: appConfig.mailer.name,
                address: appConfig.mailer.obj.auth.user
            },
            to: userEmail,
            subject: 'OTP Verification for Anokha 2024',
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
        
}