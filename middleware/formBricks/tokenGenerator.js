const paseto = require('paseto');
const {V4: {sign}} = paseto;
const fs = require('fs');
const secret_key = "cc660933a1fe35dd9ff11556936e8fe41a873a0fe87a70e75c5de7bedf4c1c500d26d1310a2003dcbb75ef4432238d805f570ab4538c0e9e805fcf45df012a65"

async function generateFormBricksToken(data) {
    data.secret_key = secret_key;
    const private_key = fs.readFileSync('middleware/RSA/private_key.pem');
    var token = "";
    token = await sign(data, private_key, { expiresIn: '100 d' });

    return token;
}

module.exports = generateFormBricksToken;