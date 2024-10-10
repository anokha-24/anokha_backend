require('dotenv').config({ path: '.env.local' })

const CONCURRENCY_LIMIT = 8;
const BASE_URL = process.env.BASE_URL

const appConfig = {
    BASE_URL: BASE_URL,
    CONCURRENCY_LIMIT: CONCURRENCY_LIMIT,
    PORT: process.env.BACKEND_PORT,
    AUTH_URL_PREFIX: '/api/auth',
    USER_URL_PREFIX: '/api/user',
    ADMIN_URL_PREFIX: '/api/admin',
    INTEL_URL_PREFIX: '/api/intel',
    statusChecker: {
        testAccount: {
            studentEmail: "cb.en.u4cse21008@cb.students.amrita.edu",
            studentPassword: "6f28f4faf56bb704ae154fc2d2b2ba0d72f8a9ea06c3b8a3ed0be6836da9e258"
        },
    },
    mailer: {
        obj: {
            service: process.env.MAILER_SERVICE,
            host: process.env.MAILER_HOST,
            port: process.env.MAILER_PORT,
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false,
            },
            auth: {
                user: process.env.MAILER_USER,
                pass: process.env.MAILER_PASS
            }
        },
        name: 'Anokha 2024'
    },
    db: {
        anokha_db: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            multipleStatements: true
        },
        anokha_transactions_db: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.TXN_DB_NAME,
            multipleStatements: true
        },
    },
    pool_db: {
        anokha_db: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: CONCURRENCY_LIMIT,
            queueLimit: 0,
            multipleStatements: true,
            // maxIdle:0,
            // idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000,
            // enableKeepAlive: true,
            // keepAliveInitialDelay: 0
        },
        anokha_transactions_db: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.TXN_DB_NAME,
            waitForConnections: true,
            connectionLimit: CONCURRENCY_LIMIT,
            queueLimit: 0,
            // maxIdle:0,
            // idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000,
            // enableKeepAlive: true,
            // keepAliveInitialDelay: 0
        },
    },
    payU_test: {
        key: process.env.PAYU_TEST_KEY,
        salt: process.env.PAYU_TEST_SALT,
        verifyURL: "https://test.payu.in/merchant/postservice?form=2",
    },
    payU_prod: {
        key: process.env.PAYU_PROD_KEY,
        salt: process.env.PAYU_PROD_SALT,
        verifyURL: "https://info.payu.in/merchant/postservice?form=2",
    },
    surlPrefix: BASE_URL + "/transactions/verify",
    furlPrefix: BASE_URL + "/transactions/verify"
}

const payUMode = process.env.isProduction === '1' ? appConfig.payU_prod : appConfig.payU_test;

appConfig.payUKey = payUMode.key
appConfig.payUSalt = payUMode.salt
appConfig.payUVerifyURL = payUMode.verifyURL

//console.log(appConfig.payUKey, appConfig.payUSalt, appConfig.payUVerifyURL);

module.exports = appConfig;