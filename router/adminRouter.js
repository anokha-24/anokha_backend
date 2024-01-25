const adminController = require('../controller/adminController');

const express = require('express');
const adminRouter = express.Router();

adminRouter.get('/test', adminController.testConnection);
adminRouter.get('/getAdminProfile',adminController.getAdminProfile);
adminRouter.post('/editAdminProfile',adminController.editAdminProfile);
adminRouter.post('/createEvent',adminController.createEvent);
adminRouter.post('/editEventData',adminController.editEventData);
adminRouter.post('/toggleEventStatus',adminController.toggleEventStatus);
adminRouter.post('/addTag',adminController.addTag);
adminRouter.post('/toggleTagStatus',adminController.toggleTagStatus);
adminRouter.get('/getAllTags',adminController.getAllTags);
adminRouter.get('/getActiveTags',adminController.getActiveTags);

module.exports = adminRouter;