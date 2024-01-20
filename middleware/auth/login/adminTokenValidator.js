const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');
const secret_key = "cc660933a1fe35dd9ff11556936e8fe41a873a0fe87a70e75c5de7bedf4c1c500d26d0805a9581dcbb75ef4432238d805f570ab4538c0e9e805fcf45df012a65"

async function tokenValidator(req, res, next) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];

    if (tokenHeader == null || token == null) {
        res.status(401).send({
            "MESSAGE": "No Token. Warning."
        });
        return;
    }

    const public_key = fs.readFileSync('middleware/RSA/public_key.pem');
    try {
        const payLoad = await verify(token, public_key);
        if (payLoad["secret_key"] == secret_key) {
            req.body.managerEmail = payLoad["managerEmail"];
            req.body.managerId = payLoad["managerId"];
            req.body.authorizationTier = payLoad["authorizationTier"];
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

async function tokenValidatorRegister(req, res, next) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];

    if (tokenHeader == null || token == null) {
        res.status(401).send({
            "MESSAGE": "No Token. Warning."
        });
        return;
    }

    const public_key = fs.readFileSync('middleware/RSA/public_key.pem');
    try {
        const payLoad = await verify(token, public_key);
        if (payLoad["secret_key"] == secret_key) {
            //req.body.managerEmail = payLoad["managerEmail"];
            req.body.managerId = payLoad["managerId"];
            req.body.authorizationTier = payLoad["authorizationTier"];
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


module.exports = [tokenValidator, tokenValidatorRegister];
