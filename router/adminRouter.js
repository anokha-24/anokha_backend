const adminController = require('../controller/adminController');

const express = require('express');
const adminRouter = express.Router();

adminRouter.get('/test', adminController.testConnection);
adminRouter.get('/getAdminProfile',adminController.getAdminProfile);
adminRouter.post('/editAdminProfile',adminController.editAdminProfile);
//adminRouter.post('/createEvent',adminController.createEvent);
adminRouter.post('/addTag',adminController.addTag);
adminRouter.post('/toggleTagStatus',adminController.toggleTagStatus);

module.exports = adminRouter;