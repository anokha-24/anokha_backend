const authController = require('../controller/authController');

const express = require('express');
const authRouter = express.Router();

authRouter.get('/test', authController.testConnection);
authRouter.post('/registerStudent', authController.registerStudent);
authRouter.post('/verifyStudent', authController.verifyStudent);
authRouter.post('/loginStudent', authController.loginStudent);
authRouter.post('/forgotPasswordStudent', authController.forgotPasswordStudent);
authRouter.post('/resetPasswordStudent', authController.resetPasswordStudent);

module.exports = authRouter;