const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');
const mailer = require('../middleware/mailer/mailer');
const appConfig = require('../config/appConfig');
const [tokenValidator, validateEventRequest] = require('../middleware/auth/login/tokenValidator');
const [adminTokenValidator,tokenValidatorRegister, adminTokenValidatorSpecial] = require('../middleware/auth/login/adminTokenValidator');

const validator = require("validator");
const redisClient = require('../connection/redis');

module.exports = {
    
    testConnection: async (req, res) => {
        
        return res.status(200).send({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "Intel Controller"
        });
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
            
            
            if(!dataValidator.isValidRegisterTeamRequest(req.body)){
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();

                let rollbackFlag = "0";
                
                try {

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }

                    
                    
                    for(let i = 0; i < req.body.teamMembers.length; i++){
                        
                        if(req.body.teamMembers[i] === req.body.studentEmail){
                            
                            return res.status(400).send({
                                "MESSAGE": "You're added by default in the team. Kindly remove your email from the list of team members."
                            });
                        }
                    }


                    let checkMembers = {};
                    
                    for(let i = 0; i < req.body.teamMembers.length; i++){
                        
                        if(checkMembers[req.body.teamMembers[i]]==1)
                        {
                            return res.status(400).send({
                                "MESSAGE": "Duplicate Team Members"
                            });
                        }
                        else{
                            checkMembers[req.body.teamMembers[i]] = 1;
                        }
                    }

                    
                    let checkIdc = {};
                    
                    for(let i = 0; i < req.body.idcId.length; i++){
                        
                        if(checkIdc[req.body.idcId[i]]==1)
                        {
                            return res.status(400).send({
                                "MESSAGE": "Duplicate IDCs"
                            });
                        }
                        else{
                            checkIdc[req.body.idcId[i]] = 1;
                        }
                    }

                    
                    await db_connection.query('LOCK TABLES intelTeamData READ, intelTeamGroupData READ');
                    
                    const [checkTeam] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE  studentId = ?', [req.body.studentId]);
                    
                    if(checkTeam.length > 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "You are already part of a team. You can't register a new team."
                        });
                    }
                    
                    
                    const [checkTeamName] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamName = ?', [req.body.teamName]);
                    
                    
                    if(checkTeamName.length > 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Team Name already exists. Please choose a different name."
                        });
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
                    
                    await db_connection.query('LOCK TABLES studentData READ, intelTeamGroupData READ');
                    
                    for(let i = 0; i < req.body.teamMembers.length; i++){
                        
                        [member] = await db_connection.query('SELECT * FROM studentData WHERE studentEmail = ?', [req.body.teamMembers[i]]);
                        
                        if(member.length === 0){
                            
                            await db_connection.query('UNLOCK TABLES');
                            
                            return res.status(400).send({
                                "MESSAGE": `Team Member Not Registered: ${req.body.teamMembers[i]}`
                            });
                        }
                        else{
                            let [checkTeamMember] = await db_connection.query('SELECT * from intelTeamGroupData where studentId = ?',[member[0].studentId]);
                            if (checkTeamMember.length > 0)
                            {
                                await db_connection.query('UNLOCK TABLES');

                                return res.status(400).send({
                                    "MESSAGE": `Team Member already part of a team: ${req.body.teamMembers[i]}`
                                });
                            }
                            memberIds.push(member[0].studentId);
                        }
                    }
                    await db_connection.query('UNLOCK TABLES');
                 
                    //let refiater;
                    
                    await db_connection.beginTransaction();

                    rollbackFlag = "1";

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

                    
                    await db_connection.commit();
                    
                    
                    return res.status(200).send({
                        "MESSAGE": "Team Registered Successfully"
                    });
                    
                }
                
                catch(err){
                    
                    if(rollbackFlag === "1"){                    
                        await db_connection.rollback();
                    }

                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - registerTeam - ${err}\n`);
                    
                    return res.status(500).send({
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

    
    editTeam: [
        
        tokenValidator,
        async (req, res) => {
            
            if(!dataValidator.isValidEditTeamRequest(req.body)){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
            }
            
            else{

                const db_connection = await anokha_db.promise().getConnection();

                let rollbackFlag = "0";
                
                try{

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }


                    
                    for(let i = 0; i < req.body.teamMembers.length; i++){
                        
                        if(req.body.teamMembers[i] === req.body.studentEmail){
                            
                            return res.status(400).send({
                                "MESSAGE": "You're added by default in the team. Kindly remove your email from the list of team members."
                            });
                        }
                    }

                    
                    let checkMembers = {};
                    for(let i = 0; i < req.body.teamMembers.length; i++){
                        
                        if(checkMembers[req.body.teamMembers[i]]==1)
                        {
                            
                            return res.status(400).send({
                                "MESSAGE": "Duplicate Team Members"
                            });
                        }
                        else{
                            
                            checkMembers[req.body.teamMembers[i]] = 1;
                        }
                    }

                    
                    
                    let checkIdc = {};
                    for(let i = 0; i < req.body.idcId.length; i++){
                        
                        if(checkIdc[req.body.idcId[i]]==1)
                        {
                            
                            return res.status(400).send({
                                "MESSAGE": "Duplicate IDCs"
                            });
                        }
                        else{
                            checkIdc[req.body.idcId[i]] = 1;
                        }
                    }


                    
                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelTeamData READ');
                    
                    const [checkTeam] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE  studentId = ? AND isLeader = ?', [req.body.studentId, "1"]);
                    
                    
                    
                    if(checkTeam.length === 0){

                        await db_connection.query('UNLOCK TABLES');
                        
                        return res.status(400).send({
                            "MESSAGE": "You are not a team leader. You can't edit the team details."
                        });
                    }
                    
                    
                    
                    const [checkTeamName] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamName = ? AND teamId != ?', [req.body.teamName, checkTeam[0].teamId]);
                    
                    if(checkTeamName.length > 0){

                        await db_connection.query('UNLOCK TABLES');
                        
                        return res.status(400).send({
                            "MESSAGE": "Team Name already exists. Please choose a different name."
                        });
                    }
                    
                    
                    await db_connection.query('UNLOCK TABLES');
                    
                    
                    let member = [];
                    let memberIds = [];
                    
                    await db_connection.query('LOCK TABLES studentData READ, intelTeamGroupData READ');
                    
                    for(let i = 0; i < req.body.teamMembers.length; i++){
                        
                        [member] = await db_connection.query('SELECT * FROM studentData WHERE studentEmail = ?', [req.body.teamMembers[i]]);
                        
                        if(member.length === 0){
                            
                            await db_connection.query('UNLOCK TABLES');
                            
                            return res.status(400).send({
                                "MESSAGE": `Team Member Not Registered: ${req.body.teamMembers[i]}`
                            });
                        }

                        else{
                            let [checkTeamMember] = await db_connection.query('SELECT * from intelTeamGroupData where studentId = ?',[member[0].studentId]);
                            if (checkTeamMember.length > 0)
                            {
                                await db_connection.query('UNLOCK TABLES');

                                return res.status(400).send({
                                    "MESSAGE": `Team Member already part of a team: ${req.body.teamMembers[i]}`
                                });
                            }
                            memberIds.push(member[0].studentId);
                        }
                    }



                    await db_connection.query('UNLOCK TABLES');

                    


                    await db_connection.beginTransaction();

                    rollbackFlag = "1";

                    await db_connection.query('UPDATE intelTeamData SET teamName = ?, totalMembers = ? WHERE teamId = ?', [req.body.teamName, req.body.teamMembers.length+1, checkTeam[0].teamId]);
                    
                    await db_connection.query('DELETE FROM intelTeamGroupData WHERE teamId = ? AND studentId != ?', [checkTeam[0].teamId, req.body.studentId]);
                    
                    for (let i = 0; i < memberIds.length; i++){
                        await db_connection.query('INSERT INTO intelTeamGroupData (teamId, studentId, idcId) VALUES (?,?,?)', [checkTeam[0].teamId, memberIds[i], req.body.idcId[i+1]]);
                    }

                    await db_connection.commit();
                    
                    
                    return res.status(200).send({
                        "MESSAGE": "Team Details Edited Successfully"
                    });

                }
                catch(err){

                    if(rollbackFlag === "1"){
                        await db_connection.rollback();
                    }
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - editTeam - ${err}\n`);
                    
                    return res.status(500).send({
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
            
            if(!dataValidator.isValidSubmitFirstRoundRequest(req.body)){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
            }
            
            
            else{

                const db_connection = await anokha_db.promise().getConnection();
                try{

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }



                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelSubmissions READ');
                    
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    
                    if(team.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }



                    const [submissions] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 1]);
                    
                    if(submissions.length > 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "You have already submitted for this round."
                        });
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
                    theme,
                    problemStatement,
                    pptFileLink,
                    youtubeVideoLink,
                    githubLink,
                    devmeshLink,
                    submittedBy,
                    round
                    )
                    VALUES (?,?,?,?,?,?,?,?,?)`,
                    [team[0].teamId,
                    req.body.theme,
                    req.body.problemStatement,
                    req.body.pptFileLink,
                    youtubeVideoLink,
                    githubLink,
                    devmeshLink,
                    req.body.studentId, 1]);

                    
                    await db_connection.query('UNLOCK TABLES');

                
                    return res.status(200).send({
                        "MESSAGE": "Round 1 Submission Successful"
                    });

                }
                
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - submitFirstRound - ${err}\n`);
                    
                    return res.status(500).send({
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
            
            if(!dataValidator.isValidSubmitFirstRoundRequest(req.body)){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
            }
            
            else{

                const db_connection = await anokha_db.promise().getConnection();
                
                try{

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }


                    
                    
                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelSubmissions READ');
                    
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    
                    if(team.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }

                    
                    const [submissions] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 1]);
                    
                    if(submissions.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "You have no submissions."
                        });
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
                    theme = ?,
                    problemStatement = ?,
                    pptFileLink = ?,
                    youtubeVideoLink = ?,
                    githubLink = ?,
                    devmeshLink = ?,
                    submittedBy =?,
                    seenStatus = ?
                    WHERE teamId = ? AND round = ?`,
                    [req.body.theme,
                    req.body.problemStatement,
                    req.body.pptFileLink,
                    youtubeVideoLink,
                    githubLink,
                    devmeshLink,
                    req.body.studentId,
                    "2",
                    team[0].teamId,1]);

                    await db_connection.query('UNLOCK TABLES');


                    return res.status(200).send({
                        "MESSAGE": "Round 1 Submission Edited Successfully"
                    });

                }

                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - editFirstRoundSubmission - ${err}\n`);
                    
                    return res.status(500).send({
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
            
            if(!dataValidator.isValidSubmitSecondRoundRequest(req.body)){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
            }
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                
                try{

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }


                    
                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelTeamData READ, intelSubmissions READ');
                    
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    
                    if(team.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }



                    const [submissions1] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 1]);
                    
                    if(submissions1.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Unauthorised Access! You didn't submit for the first round."
                        });
                    }



                    const [submissions2] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 2]);
                    
                    if(submissions2.length > 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "You have already submitted for this round."
                        });
                    }

                    
                    
                    //check if user is qualified for second round
                    const [teamData] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamId = ? AND teamStatus = ?', [team[0].teamId, "2"]);
                    
                    if(teamData.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "You are not qualified for this round."
                        });
                    }

                    await db_connection.query('UNLOCK TABLES');

                    
                    
                    await db_connection.query('LOCK TABLES intelSubmissions WRITE');
                    
                    await db_connection.query(`INSERT INTO intelSubmissions
                    (
                    teamId,
                    theme,
                    problemStatement,
                    pptFileLink,
                    youtubeVideoLink,
                    githubLink,
                    devmeshLink,
                    submittedBy,
                    round
                    )
                    VALUES (?,?,?,?,?,?,?,?,?)`,
                    [team[0].teamId,
                    submissions1[0].theme,
                    submissions1[0].problemStatement,
                    req.body.pptFileLink,
                    req.body.youtubeVideoLink,
                    req.body.githubLink,
                    req.body.devmeshLink,
                    req.body.studentId, 2]);

                    
                    await db_connection.query('UNLOCK TABLES');
                    
                    
                    return res.status(200).send({
                        "MESSAGE": "Round 2 Submission Successful"
                    });

                }


                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - submitSecondRound - ${err}\n`);
                    
                    return res.status(500).send({
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
            
            if(!dataValidator.isValidSubmitSecondRoundRequest(req.body)){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
            }
            
            else{

                const db_connection = await anokha_db.promise().getConnection();
                
                try{

                    //check if the student exists and is active
                    
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }




                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, intelTeamData READ, intelSubmissions READ');
                    
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    
                    if(team.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }

                    
                    
                    const [submissions2] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [team[0].teamId, 2]);
                    
                    if(submissions2.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "You have no submissions for this round."
                        });
                    }
                    
                    
                    
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
                    
                    
                    return res.status(200).send({
                        "MESSAGE": "Round 2 Submission Edited Successfully"
                    });

                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - editSecondRoundSubmission - ${err}\n`);
                    
                    return res.status(500).send({
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

    getDashBoard:[
        tokenValidator,
        async (req, res) => {
        
                const db_connection = await anokha_db.promise().getConnection();
                try{

                    //check if the student exists and is active
                    await db_connection.query("LOCK TABLES studentData READ");
                    
                    const [studentData] = await db_connection.query("SELECT studentAccountStatus FROM studentData WHERE studentId=?", [req.body.studentId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (studentData.length === 0 || (studentData.length > 1 && studentData[0].studentAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }



                    await db_connection.query('LOCK TABLES intelTeamData READ, intelTeamGroupData READ, intelSubmissions READ, studentData READ');
                    
                    const [team] = await db_connection.query('SELECT * FROM intelTeamGroupData WHERE studentId = ?', [req.body.studentId]);
                    
                    if(team.length === 0){
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }



                    const [teamData] = await db_connection.query('SELECT teamId, teamName, platformType, platformId, totalMembers, teamStatus FROM intelTeamData WHERE teamId = ?', [team[0].teamId]);
                    
                    const [teamMembers] = await db_connection.query(`SELECT 
                    studentData.studentEmail,
                    studentData.studentFullName,
                    intelTeamGroupData.idcId,
                    intelTeamGroupData.isLeader
                    FROM studentData INNER JOIN intelTeamGroupData 
                    ON studentData.studentId = intelTeamGroupData.studentId
                    WHERE intelTeamGroupData.teamId = ?`, [team[0].teamId]);
                    
                    const [submissions1] = await db_connection.query(`SELECT 
                    theme,
                    problemStatement,
                    githubLink,
                    youtubeVideoLink,
                    devmeshLink,
                    pptFileLink
                    FROM intelSubmissions 
                    WHERE teamId = ? AND round = ?`, [team[0].teamId, 1]);
                    
                    const [submissions2] = await db_connection.query(`SELECT 
                    theme,
                    problemStatement,
                    githubLink,
                    youtubeVideoLink,
                    devmeshLink,
                    pptFileLink
                    FROM intelSubmissions 
                    WHERE teamId = ? AND round = ?`, [team[0].teamId, 2]);

                    await db_connection.query('UNLOCK TABLES');
                    
                    
                    
                    return res.status(200).send({
                        "MESSAGE": "Data Fetched Successfully",
                        "teamId": teamData[0].teamId,
                        "teamName": teamData[0].teamName,
                        "platformType": teamData[0].platformType,
                        "platformId": teamData[0].platformId,
                        "totalMembers": teamData[0].totalMembers,
                        "teamStatus": teamData[0].teamStatus,
                        "teamMembers": teamMembers,
                        "firstRoundSubmission": submissions1,
                        "secondRoundSubmission": submissions2
                    });
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - getDashBoard - ${err}\n`);
                    
                    return res.status(500).send({
                        "MESSAGE": "Internal Server Error"
                    });
                }
                finally{
                    
                    await db_connection.query('UNLOCK TABLES');
                    db_connection.release();
                }
            }
        
    ],

    intelSelectToSecondRound: [
        adminTokenValidator,
        async (req, res) => {
            
            //only SUPER_ADMIN and INTEL_ADMIN can access this
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 9)) {
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }
            
            else{

                if(!(typeof(req.body.teams)==='object' && req.body.teams.length > 0)){
                    
                    return res.status(400).send({
                        "MESSAGE": "Invalid Request"
                    });
                }


                for(i = 0; i < req.body.teams.length; i++){
                    
                    if(!(typeof(req.body.teams[i])==='number' && req.body.teams[i] > 0)){
                        
                        //console.log('number');
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request"
                        });
                    }
                }

                
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }




                    await db_connection.query('LOCK TABLES intelTeamData WRITE');
                    
                    for(i = 0; i < req.body.teams.length; i++){
                        
                        const [team] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamId = ?', [req.body.teams[i]]);
                        
                        if(team.length === 0){
                            
                            await db_connection.query('UNLOCK TABLES');
                            
                            return res.status(400).send({
                                "MESSAGE": `Invalid Team Id: ${req.body.teams[i]}`
                            });
                        }


                        else if (team[0].teamStatus == "0"){
                            
                            await db_connection.query('UNLOCK TABLES');
                            
                            return res.status(400).send({
                                "MESSAGE": `Team ${team[0].teamName}, teamId: ${req.body.teams[i]} is Disqualified. Can't Select for Second Round.`
                            });
                        }
                    }




                    for(i = 0; i < req.body.teams.length; i++){
                        
                        await db_connection.query('UPDATE intelTeamData SET teamStatus = ? WHERE teamId = ?', ["2", req.body.teams[i]]);
                    }


                    await db_connection.query('UNLOCK TABLES');
                    
                    return res.status(200).send({
                        "MESSAGE": "Teams Selected for Second Round"
                    });
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - intelSelectToSecondRound - ${err}\n`);
                    
                    return res.status(500).send({
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

    intelSelectToThirdRound: [
        adminTokenValidator,
        async (req, res) => {
            
            //only SUPER_ADMIN and INTEL_ADMIN can access this
            if (!(req.body.authorizationTier == 1 || req.body.authorizationTier == 9)) {
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            
            else{

                if(!(typeof(req.body.teams)==='object' && req.body.teams.length > 0)){
                    
                    return res.status(400).send({
                        "MESSAGE": "Invalid Request"
                    });
                }

                
                for(i = 0; i < req.body.teams.length; i++){
                    
                    if(!(typeof(req.body.teams[i])==='number' && req.body.teams[i] > 0)){
                        //console.log('number');
                        return res.status(400).send({
                            "MESSAGE": "Invalid Request"
                        });
                    }
                }

                
                const db_connection = await anokha_db.promise().getConnection();
                try{

                    await db_connection.query("LOCK TABLES managerData READ");
                    
                    const [managerData] = await db_connection.query("SELECT * FROM managerData WHERE managerId=?", [req.body.managerId]);
                    
                    await db_connection.query("UNLOCK TABLES");
                    
                    if (managerData.length === 0 || (managerData.length > 0 && managerData[0].managerAccountStatus === "0")) {
                        
                        return res.status(400).send({
                            "MESSAGE": "Access Restricted!"
                        });
                    }



                    await db_connection.query('LOCK TABLES intelTeamData WRITE');
                    
                    for(i = 0; i < req.body.teams.length; i++){
                        
                        const [team] = await db_connection.query('SELECT * FROM intelTeamData WHERE teamId = ?', [req.body.teams[i]]);
                        
                        if(team.length === 0){
                           
                            await db_connection.query('UNLOCK TABLES');
                            
                            return res.status(400).send({
                                "MESSAGE": `Invalid Team Id: ${req.body.teams[i]}`
                            });
                        }



                        else if (team[0].teamStatus == "0"){
                            
                            await db_connection.query('UNLOCK TABLES');
                            
                            return res.status(400).send({
                                "MESSAGE": `Team ${team[0].teamName}, teamId: ${req.body.teams[i]} is Disqualified. Can't Select for Third Round.`
                            });
                        }



                        else if (!(team[0].teamStatus == "2" || team[0].teamStatus == "3")){
                            
                            await db_connection.query('UNLOCK TABLES');
                            
                            return res.status(400).send({
                                "MESSAGE": `Team ${team[0].teamName}, teamId: ${req.body.teams[i]} has not Qualified For Second Round, Can't Select for Third Round.`
                            });
                        }

                    }
                    
                    for(i = 0; i < req.body.teams.length; i++){
                        
                        await db_connection.query('UPDATE intelTeamData SET teamStatus = ? WHERE teamId = ?', ["3", req.body.teams[i]]);
                    }
                    
                    await db_connection.query('UNLOCK TABLES');
                    
                    return res.status(200).send({
                        "MESSAGE": "Teams Selected for Third Round"
                    });
                }

                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - intelSelectToThirdRound - ${err}\n`);
                    
                    return res.status(500).send({
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

    getAllSubmissions: [
        adminTokenValidator,
        async (req, res) => {
            
            //only SUPER_ADMIN and INTEL_ADMIN can access this
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 9)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
                
            }
            
            
            if(req.params.round != 1 && req.params.round != 2 && req.params.round != 3){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
                
            }
            
            
            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    
                    await db_connection.query('LOCK TABLES intelTeamData READ, intelSubmissions READ');
                    
                    const [submissions] = await db_connection.query(`SELECT
                    intelSubmissions.teamId,
                    intelTeamData.teamName,
                    intelTeamData.teamStatus,
                    intelTeamData.totalMembers,
                    intelSubmissions.seenStatus,
                    intelSubmissions.theme,
                    intelSubmissions.problemStatement,
                    intelSubmissions.pptFileLink,
                    intelSubmissions.githubLink,
                    intelSubmissions.youtubeVideoLink,
                    intelSubmissions.devmeshLink
                    FROM intelSubmissions LEFT JOIN intelTeamData
                    ON intelTeamData.teamId = intelSubmissions.teamId
                    WHERE round = ?`, [req.params.round]);
                    
                    await db_connection.query('UNLOCK TABLES');
                    
                    return res.status(200).send({
                        "MESSAGE": "Data Fetched Successfully",
                        "submissions": submissions
                    });

                }

                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - getAllSubmissions - ${err}\n`);
                    
                    return res.status(500).send({
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

    markSeen:[
        adminTokenValidator,
        async (req, res) => {
            
            //only SUPER_ADMIN and INTEL_ADMIN can access this
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 9)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            if(req.params.round != 1 && req.params.round != 2 && req.params.round != 3){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
            }

            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    await db_connection.query('LOCK TABLES intelSubmissions WRITE');
                    
                    const [check] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [req.params.teamId,req.params.round]);
                    
                    if(check.length === 0){
                        
                        await db_connection.query('UNLOCK TABLES');
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Submission"
                        });
                    }



                    await db_connection.query('UPDATE intelSubmissions SET seenStatus = ? WHERE teamId = ? AND round = ?', ["1", req.params.teamId,req.params.round]);
                    
                    await db_connection.query('UNLOCK TABLES');
                    
                    return res.status(200).send({
                        "MESSAGE": "Marked Seen Successfully"
                    });

                }
                
                
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - markSeen - ${err}\n`);
                    
                    return res.status(500).send({
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


    markUnseen:[
        adminTokenValidator,
        async (req, res) => {
            
            //only SUPER_ADMIN and INTEL_ADMIN can access this
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 9)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            if(req.params.round != 1 && req.params.round != 2 && req.params.round != 3){
                
                return res.status(400).send({
                    "MESSAGE": "Invalid Request"
                });
            }

            else{
                
                const db_connection = await anokha_db.promise().getConnection();
                try{
                    
                    
                    await db_connection.query('LOCK TABLES intelSubmissions WRITE');
                    
                    const [check] = await db_connection.query('SELECT * FROM intelSubmissions WHERE teamId = ? AND round = ?', [req.params.teamId,req.params.round]);
                    
                    if(check.length === 0){
                        
                        await db_connection.query('UNLOCK TABLES');
                        
                        return res.status(400).send({
                            "MESSAGE": "Invalid Submission"
                        });
                    }



                    await db_connection.query('UPDATE intelSubmissions SET seenStatus = ? WHERE teamId = ? AND round = ?', ["0", req.params.teamId,req.params.round]);
                    await db_connection.query('UNLOCK TABLES');
                    
                    return res.status(200).send({
                        "MESSAGE": "Marked Unseen Successfully"
                    });

                }
                
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - markUnseen - ${err}\n`);
                    
                    return res.status(500).send({
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



    getTeamContact:[
        
        adminTokenValidator,
        
        async (req, res) => {
            
            if(!(req.body.authorizationTier == 1 || req.body.authorizationTier == 9)){
                
                return res.status(400).send({
                    "MESSAGE": "Access Restricted!"
                });
            }

            else{
                
                if (!(typeof(req.params.teamId)=='string' && validator.isNumeric(req.params.teamId))){
                    
                    return res.status(400).send({
                        "MESSAGE": "Invalid Request"
                    });
                }
                
                
                
                req.params.teamId = parseInt(req.params.teamId);
                
                if (req.params.teamId <= 0){
                    
                    return res.status(400).send({
                        "MESSAGE": "Invalid Request"
                    });
                }
                


                const db_connection = await anokha_db.promise().getConnection();
                
                try{
                    
                    await db_connection.query('LOCK TABLES intelTeamGroupData READ, studentData READ');
                    
                    const [teamMembers] = await db_connection.query(`SELECT 
                    studentData.studentFullName,
                    intelTeamGroupData.isLeader,
                    studentData.studentEmail,
                    studentData.studentPhone
                    FROM studentData INNER JOIN intelTeamGroupData 
                    ON studentData.studentId = intelTeamGroupData.studentId
                    WHERE intelTeamGroupData.teamId = ?`, [req.params.teamId]);
                    
                    await db_connection.query('UNLOCK TABLES');
                    
                    
                    return res.status(200).send({
                        "MESSAGE": "Data Fetched Successfully",
                        "teamMembers": teamMembers
                    });
                }
                catch(err){
                    
                    console.log(err);
                    
                    const time = new Date();
                    fs.appendFileSync('./logs/intelController/errorLogs.log', `${time.toISOString()} - getTeamContact - ${err}\n`);
                    
                    return res.status(500).send({
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
