const intelController = require('../controller/intelController');

const express = require('express');
const intelRouter = express.Router();

intelRouter.get('/test', intelController.testConnection);
intelRouter.post('/registerTeam', intelController.registerTeam);

module.exports = intelRouter;