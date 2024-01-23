const adminController = require('../controller/adminController');

const express = require('express');
const adminRouter = express.Router();

adminRouter.get('/test', adminController.testConnection);
adminRouter.get('/getAdminProfile',adminController.getAdminProfile);
adminRouter.post('/editAdminProfile',adminController.editAdminProfile);

module.exports = adminRouter;