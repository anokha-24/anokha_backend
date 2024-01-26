const adminController = require('../controller/adminController');

const express = require('express');
const adminRouter = express.Router();

adminRouter.get('/test', adminController.testConnection);
adminRouter.get('/getOfficialProfile',adminController.getAdminProfile);
adminRouter.post('/editOfficialProfile',adminController.editAdminProfile);
adminRouter.post('/createEvent',adminController.createEvent);
adminRouter.post('/editEventData',adminController.editEventData);
adminRouter.post('/toggleEventStatus',adminController.toggleEventStatus);
adminRouter.post('/addTag',adminController.addTag);
adminRouter.post('/toggleTagStatus',adminController.toggleTagStatus);
adminRouter.get('/getAllTags',adminController.getAllTags);
adminRouter.get('/getActiveTags',adminController.getActiveTags);
adminRouter.post('/addTagToEvent',adminController.addTagToEvent);
adminRouter.post('/removeTagFromEvent',adminController.removeTagFromEvent);
adminRouter.get('/getAllOfficials',adminController.getAllOfficials);
adminRouter.post('/toggleOfficialStatus',adminController.toggleOfficialStatus);
adminRouter.post('/toggleStudentStatus',adminController.toggleStudentStatus);
adminRouter.post('/assignEventToOfficial',adminController.assignEventToOfficial);
adminRouter.post('/removeOfficialFromEvent',adminController.removeOfficialFromEvent);
adminRouter.get('/markGateEntry/:studentId(\\d+)',adminController.markGateEntry);
adminRouter.get('/markGateExit/:studentId(\\d+)',adminController.markGateExit);
adminRouter.get('/markEventAttendanceEntry/:studentId(\\d+)-:eventId(\\d+)',adminController.markEventAttendanceEntry);
adminRouter.get('/markEventAttendanceExit/:studentId(\\d+)-:eventId(\\d+)',adminController.markEventAttendanceExit);

module.exports = adminRouter;