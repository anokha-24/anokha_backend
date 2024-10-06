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
adminRouter.get('/getDepartments',adminController.getDepartments);
adminRouter.get('/getOfficialEvents',adminController.getOfficialEvents);
adminRouter.post('/addTagToEvent',adminController.addTagToEvent);
adminRouter.post('/removeTagFromEvent',adminController.removeTagFromEvent);
adminRouter.get('/getAllOfficials',adminController.getAllOfficials);
adminRouter.post('/toggleOfficialStatus',adminController.toggleOfficialStatus);
adminRouter.post('/toggleStudentStatus',adminController.toggleStudentStatus);
adminRouter.post('/assignEventToOfficial',adminController.assignEventToOfficial);
adminRouter.post('/removeOfficialFromEvent',adminController.removeOfficialFromEvent);
adminRouter.post('/markGateEntry/:studentId(\\d+)',adminController.markGateEntry);
adminRouter.post('/markGateExit/:studentId(\\d+)',adminController.markGateExit);
adminRouter.post('/markEventAttendanceEntry/:studentId(\\d+)-:eventId(\\d+)',adminController.markEventAttendanceEntry);
adminRouter.post('/markEventAttendanceExit/:studentId(\\d+)-:eventId(\\d+)',adminController.markEventAttendanceExit);
adminRouter.post('/getEventAttendance/:eventId(\\d+)',adminController.getEventAttendance);
adminRouter.post('/addCrewMember',adminController.addCrewMember);
adminRouter.post('/deleteCrewMember',adminController.deleteCrewMember);
adminRouter.post('/getAllTransactions', adminController.getAllTransactions);
adminRouter.get('/getEventRegistrationCount',adminController.getEventRegistrationCount);
adminRouter.get('/getEventRegistrationData/:eventId(\\d+)',adminController.getEventRegistrationData);

module.exports = adminRouter;