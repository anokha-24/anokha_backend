const fs = require('fs');
const crypto = require('crypto');

const generateRSAKey = () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    try {
        fs.writeFileSync('./middleware/RSA/public_key.pem', publicKey);
        fs.writeFileSync('./middleware/RSA/private_key.pem', privateKey);
    } catch (err) {
        console.log(`[ERROR]: ${err}`);
        fs.appendFileSync('./logs/index.log', `[${new Date().toLocaleString()}]: ${err}\n`);
    }
}

module.exports = { generateRSAKey };