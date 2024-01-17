const userController = require('../controller/userController');

const express = require('express');
const userRouter = express.Router();

userRouter.get('/test', userController.testConnection);
userRouter.get('/getAllEvents',userController.getAllEvents);
userRouter.get('/getRegisteredEvents',userController.getRegisteredEvents);
userRouter.get('/getStarredEvents',userController.getStarredEvents);
userRouter.post('/toggleStarredEvent',userController.toggleStarredEvent);
userRouter.get('/getStudentProfile',userController.getStudentProfile);

module.exports = userRouter;