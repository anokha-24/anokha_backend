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
    ],

    /*
        {
            problemStatement: "Problem Statement",
            pptFileLink: "PPT File Link",
            githubLink: "Github Link",
            youtubeVideoLink: "Youtube Link",
            devmeshLink: "Devmesh Link",
        }
    */  

    submitFirstRound: [
        tokenValidator,
        async (req, res) => {
            if(!await dataValidator.isValidStudentRequest(req.body.studentId)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!dataValidator.isValidSubmitFirstRoundRequest(req.body)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request"
                });
                return;
            }
            else{

                const db_connection = await anokha_db.promise().getConnection();
                try{
                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelSubmissions READ');
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    if(team.length === 0){
                        res.status(400).json({
                            "MESSAGE": "Access Restricted!"
                        });
                        return;
                    }

                    const [submissions] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 1]);
                    if(submissions.length > 0){
                        res.status(400).json({
                            "MESSAGE": "You have already submitted for this round."
                        });
                        return;
                    }

                    await db_connection.query('UNLOCK TABLES');

                    let youtubeVideoLink = null;
                    let githubLink = null;
                    let devmeshLink = null;

                    if (( typeof (req.body.youtubeVideoLink) === "string" && req.body.youtubeVideoLink.length > 0 && req.body.youtubeVideoLink.length <= 500 && validator.isURL(req.body.youtubeVideoLink)))
                    {
                        youtubeVideoLink = req.body.youtubeVideoLink;
                    }
                    if (( typeof (req.body.githubLink) === "string" && req.body.githubLink.length > 0 && req.body.githubLink.length <= 500 && validator.isURL(req.body.githubLink)))
                    {
                        githubLink = req.body.githubLink;
                    }
                    if (( typeof (req.body.devmeshLink) === "string" && req.body.devmeshLink.length > 0 && req.body.devmeshLink.length <= 500 && validator.isURL(req.body.devmeshLink)))
                    {
                        devmeshLink = req.body.devmeshLink;
                    }

                    await db_connection.query('LOCK TABLES intelSubmissions WRITE');

                    await db_connection.query(`INSERT INTO intelSubmissions 
                    (
                    teamId,
                    problemStatement,
                    pptFileLink,
                    youtubeVideoLink,
                    githubLink,
                    devmeshLink,
                    submittedBy,
                    round
                    )
                    VALUES (?,?,?,?,?,?,?,?)`,
                    [team[0].teamId,
                    req.body.problemStatement,
                    req.body.pptFileLink,
                    youtubeVideoLink,
                    githubLink,
                    devmeshLink,
                    req.body.studentId, 1]);

                    await db_connection.query('UNLOCK TABLES');

                    db_connection.release();

                    res.status(200).json({
                        "MESSAGE": "Round 1 Submission Successful"
                    });

                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - submitFirstRound - ${err}\n`);
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
    ],

    /*
        {
            problemStatement: "Problem Statement",
            pptFileLink: "PPT File Link",
            githubLink: "Github Link",
            youtubeVideoLink: "Youtube Link",
            devmeshLink: "Devmesh Link",
        }
    */ 

    editFirstRoundSubmission: [
        tokenValidator,
        async (req, res) => {
            if(!await dataValidator.isValidStudentRequest(req.body.studentId)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!dataValidator.isValidSubmitFirstRoundRequest(req.body)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request"
                });
                return;
            }
            else{

                const db_connection = await anokha_db.promise().getConnection();
                try{
                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelSubmissions READ');
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    if(team.length === 0){
                        res.status(400).json({
                            "MESSAGE": "Access Restricted!"
                        });
                        return;
                    }

                    const [submissions] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 1]);
                    if(submissions.length === 0){
                        res.status(400).json({
                            "MESSAGE": "You have no submissions."
                        });
                        return;
                    }

                    await db_connection.query('UNLOCK TABLES');

                    let youtubeVideoLink = null;
                    let githubLink = null;
                    let devmeshLink = null;

                    if (( typeof (req.body.youtubeVideoLink) === "string" && req.body.youtubeVideoLink.length > 0 && req.body.youtubeVideoLink.length <= 500 && validator.isURL(req.body.youtubeVideoLink)))
                    {
                        youtubeVideoLink = req.body.youtubeVideoLink;
                    }
                    if (( typeof (req.body.githubLink) === "string" && req.body.githubLink.length > 0 && req.body.githubLink.length <= 500 && validator.isURL(req.body.githubLink)))
                    {
                        githubLink = req.body.githubLink;
                    }
                    if (( typeof (req.body.devmeshLink) === "string" && req.body.devmeshLink.length > 0 && req.body.devmeshLink.length <= 500 && validator.isURL(req.body.devmeshLink)))
                    {
                        devmeshLink = req.body.devmeshLink;
                    }

                    await db_connection.query('LOCK TABLES intelSubmissions WRITE');

                    await db_connection.query(`UPDATE intelSubmissions 
                    SET
                    problemStatement = ?,
                    pptFileLink = ?,
                    youtubeVideoLink = ?,
                    githubLink = ?,
                    devmeshLink = ?,
                    submittedBy =?,
                    seenStatus = ?
                    WHERE teamId = ? AND round = ?`,
                    [req.body.problemStatement,
                    req.body.pptFileLink,
                    youtubeVideoLink,
                    githubLink,
                    devmeshLink,
                    req.body.studentId,
                    "2",
                    team[0].teamId,1]);

                    await db_connection.query('UNLOCK TABLES');

                    db_connection.release();

                    res.status(200).json({
                        "MESSAGE": "Round 1 Submission Edited Successfully"
                    });

                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - editFirstRoundSubmission - ${err}\n`);
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
    ],

    /*
        {
            pptFileLink: "PPT File Link",
            githubLink: "Github Link",
            youtubeVideoLink: "Youtube Link",
            devmeshLink: "Devmesh Link",
        }
    */ 

    submitSecondRound: [
        tokenValidator,
        async (req, res) => {
            if(!await dataValidator.isValidStudentRequest(req.body.studentId)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!dataValidator.isValidSubmitSecondRoundRequest(req.body)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                //check if user is qualified for second round
                try{
                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelTeamData READ, intelSubmissions READ');
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    if(team.length === 0){
                        res.status(400).json({
                            "MESSAGE": "Access Restricted!"
                        });
                        return;
                    }
                    const [submissions1] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 1]);
                    if(submissions1.length === 0){
                        res.status(400).json({
                            "MESSAGE": "Unauthorised Access! You didn't submit for the first round."
                        });
                        return;
                    }
                    const [submissions2] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 2]);
                    if(submissions2.length > 0){
                        res.status(400).json({
                            "MESSAGE": "You have already submitted for this round."
                        });
                        return;
                    }
                    const [teamData] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamId = ? AND teamStatus = ?', [team[0].teamId, "2"]);
                    if(teamData.length === 0){
                        res.status(400).json({
                            "MESSAGE": "You are not qualified for this round."
                        });
                        return;
                    }

                    await db_connection.query('UNLOCK TABLES');

                    await db_connection.query('LOCK TABLES intelSubmissions WRITE');
                    await db_connection.query(`INSERT INTO intelSubmissions
                    (
                    teamId,
                    problemStatement,
                    pptFileLink,
                    youtubeVideoLink,
                    githubLink,
                    devmeshLink,
                    submittedBy,
                    round
                    )
                    VALUES (?,?,?,?,?,?,?,?)`,
                    [team[0].teamId,
                    team[0].problemStatement,
                    req.body.pptFileLink,
                    req.body.youtubeVideoLink,
                    req.body.githubLink,
                    req.body.devmeshLink,
                    req.body.studentId, 2]);

                    await db_connection.query('UNLOCK TABLES');
                    db_connection.release();

                    res.status(200).json({
                        "MESSAGE": "Round 2 Submission Successful"
                    });

                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - submitSecondRound - ${err}\n`);
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
    ],

    /*
        {
            pptFileLink: "PPT File Link",
            githubLink: "Github Link",
            youtubeVideoLink: "Youtube Link",
            devmeshLink: "Devmesh Link",
        }
    */ 

    editSecondRoundSubmission: [
        tokenValidator,
        async (req, res) => {
            if(!await dataValidator.isValidStudentRequest(req.body.studentId)){
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            if(!dataValidator.isValidSubmitSecondRoundRequest(req.body)){
                res.status(400).json({
                    "MESSAGE": "Invalid Request"
                });
                return;
            }
            else{
                const db_connection = await anokha_db.promise().getConnection();
                //check if user is qualified for second round
                try{
                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelTeamData READ, intelSubmissions READ');
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    if(team.length === 0){
                        res.status(400).json({
                            "MESSAGE": "Access Restricted!"
                        });
                        return;
                    }
                    // const [submissions1] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 1]);
                    // if(submissions1.length === 0){
                    //     res.status(400).json({
                    //         "MESSAGE": "Unauthorised Access! You didn't submit for the first round."
                    //     });
                    //     return;
                    // }
                    const [submissions2] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 2]);
                    if(submissions2.length === 0){
                        res.status(400).json({
                            "MESSAGE": "You have no submissions for this round."
                        });
                        return;
                    }
                    // const [teamData] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamId = ? AND teamStatus = ?', [team[0].teamId, "2"]);
                    // if(teamData.length === 0){
                    //     res.status(400).json({
                    //         "MESSAGE": "You are not qualified for this round."
                    //     });
                    //     return;
                    // }

                    await db_connection.query('UNLOCK TABLES');

                    await db_connection.query('LOCK TABLES intelSubmissions WRITE');
                    await db_connection.query(`UPDATE intelSubmissions 
                    SET
                    pptFileLink = ?,
                    youtubeVideoLink = ?,
                    githubLink = ?,
                    devmeshLink = ?,
                    submittedBy =?,
                    seenStatus = ?
                    WHERE teamId = ? AND round = ?`,
                    [
                    req.body.pptFileLink,
                    req.body.youtubeVideoLink,
                    req.body.githubLink,
                    req.body.devmeshLink,
                    req.body.studentId,
                    "2",
                    team[0].teamId,2]);

                    await db_connection.query('UNLOCK TABLES');
                    db_connection.release();

                    res.status(200).json({
                        "MESSAGE": "Round 2 Submission Edited Successfully"
                    });

                }
                catch(err){
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - editSecondRoundSubmission - ${err}\n`);
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

//get intelDashboard api to be done