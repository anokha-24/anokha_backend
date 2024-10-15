const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');
const secret_key = "cc660933a1fe35dd9ff11556936e8fe41a873a0fe87a70e75c5de7bedf4c1c500d26d1310a2003dcbb75ef4432238d805f570ab4538c0e9e805fcf45df012a65"

async function decryptToken(formBricksToken) {
    if (formBricksToken == null) {
        return null;
    }

    if (typeof (formBricksToken) != 'string') {
        return null;
    }

    const public_key = fs.readFileSync('middleware/RSA/public_key.pem');
    try {
        const payLoad = await verify(formBricksToken, public_key);
        if (payLoad["secret_key"] == secret_key) {
            return payLoad;
        } else {
            return null;
        }
    } catch (err) {
        console.log(err);
        return null;
    }

}

module.exports = [decryptToken];
