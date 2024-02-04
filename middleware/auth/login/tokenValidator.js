const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');
const secret_key = "e7465f20b133d294382d1f52dde0cf94994c762a63d796704d55ee9f7a1846be88c8531cc0e1f60f5cea162003744bbf2cca5b13d38dadf71db2544c64d78fe49e44abfec8094f337117ba5b0160fb65dd914e8b14b8ab10bf44e1418d79dc9b78597a0b2a7ce4206090613d8f76e311b2abdd649bfb483b3b53128aa5e27002a66aa888afd3b2bb4a1625790ddd456acb1a77c2b8a73f5816cb11968363a30032ce0b3d90ba466b51a85ce306e6eb030c095db2c6286c0a62939f1056e7ed477cb9f15450452539ea3756a9f40a16b54f501680528842f2f436a684337bd856179cf0a8d9e71fc6c91331f1fd6006d62ad242978a2522455a31f863ec81cdc8aefd3eadb42b0036c1aea176a7ea"

async function tokenValidator(req, res, next) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];
    const validate = typeof(tokenHeader)=='string' && tokenHeader.split(' ').length==2;

    //console.log(tokenHeader, validate, typeof(tokenHeader), tokenHeader.split(' ').length);

    if (tokenHeader == null || token == null) {
        res.status(401).send({
            "MESSAGE": "No Token. Warning."
        });
        return;
    }
    
    if (!validate) {
        res.status(401).send({
            "MESSAGE": "Invalid Token. Warning."
        });
        return;
    } 

    const public_key = fs.readFileSync('middleware/RSA/public_key.pem');
    try {
        const payLoad = await verify(token, public_key);
        if (payLoad["secret_key"] == secret_key) {
            req.body.studentEmail = payLoad["studentEmail"];
            req.body.studentId = payLoad["studentId"];
            next();
            return;
        } else {
            res.status(401).send({
                "MESSAGE": "Unauthorized access. Warning."
            });
            return;
        }
    } catch (err) {
        res.status(401).send({
            "MESSAGE": "Unauthorized access. Warning."
        });
        return;
    }

}

async function validateEventRequest(req, res, next){
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];
    const validate = typeof(tokenHeader)=='string' && tokenHeader.split(' ').length==2;

    //console.log(tokenHeader, validate, typeof(tokenHeader), tokenHeader.split(' ').length);

    if (tokenHeader == null || token == null) {
        req.body.isLoggedIn = "0";
        next();
        return;
    }
    
    if (!validate) {
        req.body.isLoggedIn = "0";
        next();
        return;
    } 

    const public_key = fs.readFileSync('middleware/RSA/public_key.pem');
    try {
        const payLoad = await verify(token, public_key);
        if (payLoad["secret_key"] == secret_key) {
            req.body.studentEmail = payLoad["studentEmail"];
            req.body.studentId = payLoad["studentId"];
            req.body.isLoggedIn = "1";
            next();
            return;
        } else {
            //console.log("else st");
            req.body.isLoggedIn = "0";
            next();
            return;
        }
    } catch (err) {
        //console.log(err);
        //console.log("catch st");
        req.body.isLoggedIn = "0";
        next();
        return;
    }
}

module.exports = [tokenValidator,validateEventRequest];
