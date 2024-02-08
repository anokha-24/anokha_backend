const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const mailer = require('../middleware/mailer/mailer');
const appConfig = require('../config/appConfig');
const [tokenValidator, validateEventRequest] = require('../middleware/auth/login/tokenValidator');

const validator = require("validator");
const redisClient = require('../connection/redis');

module.exports = {
    testConnection: async (req, res) => {
        res.status(200).json({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "Intel Controller"
        });
        return;
    },

    /*
    {
        "teamName": "Team Name",
        "devfolioId":"Devfolio Id",
        "unstopId":"Unstop Id",
        "devpostId":"Devpost Id",
        "teamMembers": ["abhinavramki@gmail.com","thanush@gmail.com","tharun@gmail.com"],
        "idcId":["idcId1","idcId2","idcId3","idcId4"]
    }
    */
   //either fill one of the devfolioId, unstopId, devpostId or don't fill any of them
    registerTeam: [
        tokenValidator,
        async (req, res) => {
            if(!await dataValidator.isValidStudentRequest(req.body.studentId)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!dataValidator.isValidRegisterTeamRequest(req.body)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    await db_connection.query('LOCK TABLES intelTeamData WRITE, intelTeamGroupData WRITE');
                    const [checkTeam] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE  studentId = ?', [req.body.studentId]);
                    if(checkTeam.length > 0){
                        res.status(400).json({
                            "MESSAGE": "You are already part of a team. You can't register a new team."
                        });
                        return;
                    }
                    const [checkTeamName] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamName = ?', [req.body.teamName]);
                    if(checkTeamName.length > 0){
                        res.status(400).json({
                            "MESSAGE": "Team Name already exists. Please choose a different name."
                        });
                        return;
                    }
                    await db_connection.query('UNLOCK TABLES');
                    let platformType = "1";
                    let platformId = null;
                    if (typeof(req.body.devfolioId)==='string' && req.body.devfolioId.length > 0 && req.body.devfolioId.length<=255){
                        platformType = "2";
                        platformId = req.body.devfolioId;
                    }
                    else if (typeof(req.body.unstopId)==='string' && req.body.unstopId.length > 0 && req.body.unstopId.length<=255){
                        platformType = "3";
                        platformId = req.body.unstopId;
                    }
                    else if (typeof(req.body.devpostId)==='string' && req.body.devpostId.length > 0 && req.body.devpostId.length<=255){
                        platformType = "4";
                        platformId = req.body.devpostId;
                    }
                    let member = [];
                    let memberIds = [];
                    await db_connection.query('LOCK TABLES studentData READ');
                    for(let i = 0; i < req.body.teamMembers.length; i++){
                        [member] = await db_connection.query('SELECT * FROM studentData WHERE studentEmail = ?', [req.body.teamMembers[i]]);
                        if(member.length === 0){
                            await db_connection.query('UNLOCK TABLES');
                            db_connection.release();
                            res.status(400).json({
                                "MESSAGE": `Team Member Not Registered: ${req.body.teamMembers[i]}`
                            });
                            return;
                        }
                        else{
                            memberIds.push(member[0].studentId);
                        }
                    }
                    await db_connection.query('UNLOCK TABLES');

                    await db_connection.query('LOCK TABLES intelTeamData WRITE, intelTeamGroupData WRITE');

                    let refiater;
                    if (platformType === '1'){
                        await db_connection.query('INSERT INTO intelTeamData (teamName, platformType, platformId, teamStatus, totalMembers, createdBy) VALUES (?,?,?,?,?,?)', [req.body.teamName, platformType, req.body.studentEmail, "1", req.body.teamMembers.length+1, req.body.studentId]);
                    }
                    else{
                        await db_connection.query('INSERT INTO intelTeamData (teamName, platformType, platformId, teamStatus, totalMembers, createdBy) VALUES (?,?,?,?,?,?)', [req.body.teamName, platformType, platformId, "1", req.body.teamMembers.length+1, req.body.studentId]);
                    }
                    const [team] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamName = ? AND createdBy = ?', [req.body.teamName, req.body.studentId]);
                    await db_connection.query('INSERT INTO intelTeamGroupData (teamId, studentId, isLeader, idcId) VALUES (?,?,?,?)', [team[0].teamId, req.body.studentId, "1", req.body.idcId[0]]);
                    for (let i = 0; i < memberIds.length; i++){
                        await db_connection.query('INSERT INTO intelTeamGroupData (teamId, studentId, idcId) VALUES (?,?,?)', [team[0].teamId, memberIds[i], req.body.idcId[i+1]]);
                    }

                    await db_connection.query('UNLOCK TABLES');
                    db_connection.release();

                    res.status(200).json({
                        "MESSAGE": "Team Registered Successfully"
                    });
                    
                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - registerTeam - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error"
                    });
                }
                finally{
                    await db_connection.query('UNLOCK TABLES');
                    db_connection.release();
                }
            }
        }
    ]
}
