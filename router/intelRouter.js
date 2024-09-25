const intelController = require('../controller/intelController');

const express = require('express');
const intelRouter = express.Router();

intelRouter.get('/test', intelController.testConnection);
//intelRouter.post('/registerTeam', intelController.registerTeam);
// intelRouter.post('/editTeam', intelController.editTeam);
//intelRouter.post('/submitFirstRound', intelController.submitFirstRound);
//intelRouter.post('/editFirstRoundSubmission', intelController.editFirstRoundSubmission);
// intelRouter.post('/submitSecondRound', intelController.submitSecondRound);
// intelRouter.post('/editSecondRoundSubmission', intelController.editSecondRoundSubmission);
// intelRouter.post('/admin/intelSelectToSecondRound', intelController.intelSelectToSecondRound);
// intelRouter.post('/admin/intelSelectToThirdRound', intelController.intelSelectToThirdRound);
// intelRouter.get('/getDashBoard', intelController.getDashBoard);
intelRouter.get('/admin/getAllSubmissions/:round([1-3])', intelController.getAllSubmissions);
// intelRouter.post('/admin/markSeen/:teamId(\\d+)-:round([1-3])', intelController.markSeen);
// intelRouter.post('/admin/markUnseen/:teamId(\\d+)-:round([1-3])', intelController.markUnseen);
intelRouter.get('/admin/getTeamContact/:teamId(\\d+)', intelController.getTeamContact);

module.exports = intelRouter;
