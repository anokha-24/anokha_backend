const userController = require('../controller/userController');

const express = require('express');
const userRouter = express.Router();

userRouter.get('/test', userController.testConnection);
userRouter.get('/getAllEvents', userController.getAllEvents);
//userRouter.get('/getRegisteredEvents', userController.getRegisteredEvents);
userRouter.get('/getStarredEvents', userController.getStarredEvents);
userRouter.post('/toggleStarredEvent', userController.toggleStarredEvent);
userRouter.get('/getStudentProfile', userController.getStudentProfile);
userRouter.post('/editStudentProfile', userController.editStudentProfile);
//userRouter.post('/buyPassport',userController.buyPassport);
//userRouter.post('/registeredEventData', userController.registeredEventData);
userRouter.get('/getEventData/:eventId(\\d+)', userController.getEventData);
//userRouter.post('/registerForEventStepOne', userController.registerForEventStepOne);
//userRouter.post('/verifyTransaction', userController.verifyTransactionPayU);
//userRouter.get('/getAllTransactions', userController.getAllTransactions);

module.exports = userRouter;