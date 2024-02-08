const intelController = require('../controller/intelController');

const express = require('express');
const intelRouter = express.Router();

intelRouter.get('/test', intelController.testConnection);
intelRouter.post('/registerTeam', intelController.registerTeam);
intelRouter.post('/editTeam', intelController.editTeam);
intelRouter.post('/submitFirstRound', intelController.submitFirstRound);
intelRouter.post('/editFirstRoundSubmission', intelController.editFirstRoundSubmission);
intelRouter.post('/submitSecondRound', intelController.submitSecondRound);
intelRouter.post('/editSecondRoundSubmission', intelController.editSecondRoundSubmission);

module.exports = intelRouter;