const express = require('express');
const helmet = require('helmet');
const cluster = require('cluster');
const fs = require('fs');
const { pid } = require('process');
const cors = require('cors');

const establishConnection = require('./connection/initializeDbConnection');
const reinitDb = require('./db/reinitDb');

const authRouter = require('./router/authRouter');
const userRouter = require('./router/userRouter');
const adminRouter = require('./router/adminRouter');
const intelRouter = require('./router/intelRouter');
//const testRouter = require('./router/testRouter');

const { generateRSAKey } = require('./middleware/generateRSAKey');

const appConfig = require('./config/appConfig');

const server = express();
server.use(helmet());
server.use(cors());
server.use(express.json());
server.disable('x-powered-by');

server.use(appConfig.AUTH_URL_PREFIX, authRouter);
server.use(appConfig.USER_URL_PREFIX, userRouter);
server.use(appConfig.ADMIN_URL_PREFIX, adminRouter);
server.use(appConfig.INTEL_URL_PREFIX, intelRouter);
//server.use('/api/testRoute',testRouter);

if (cluster.isPrimary) {
    console.log(`[MESSAGE]: Master ${pid} running.`);
    const [anokha_db, anokha_transactions_db] = establishConnection();

    reinitDb(anokha_db, "anokha");
    reinitDb(anokha_transactions_db, "anokha_transactions");

    if (fs.existsSync('./middleware/RSA/private_key.pem') && fs.existsSync('./middleware/RSA/public_key.pem')) {
        // Delete Key
        fs.unlinkSync('./middleware/RSA/private_key.pem');
        fs.unlinkSync('./middleware/RSA/public_key.pem');

        // Generate Key
        generateRSAKey();
    } else {
        // Generate Key
        generateRSAKey();
    }

    for (let i = 0; i < appConfig.CONCURRENCY_LIMIT; i++) {
        cluster.fork();
    }

} else {
    switch (cluster.worker.id) {
        case 1:
            // CRON job
            break;
        default:
            server.listen(appConfig.PORT, (err) => {
                if (err) {
                    console.log(`[ERROR]: ${err}`);
                    fs.appendFileSync('./logs/index.log', `${new Date().toLocaleString} | [ERROR]: ${err}\n`)
                } else {
                    console.log(`[MESSAGE]: ${pid} running.`);
                }
            });
            break;
    }
}

