require('dotenv').config({ path: '.env.local' })

const CONCURRENCY_LIMIT = 12;

const appConfig = {
    CONCURRENCY_LIMIT: CONCURRENCY_LIMIT,
    PORT: process.env.BACKEND_PORT,
    AUTH_URL_PREFIX: '/api/auth',
    USER_URL_PREFIX: '/api/user',
    ADMIN_URL_PREFIX: '/api/admin',
    INTEL_URL_PREFIX: '/api/intel',
    mailer:{
        obj: {
            service: 'Gmail',
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
            idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        },
        anokha_transactions_db: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.TXN_DB_NAME,
            waitForConnections: true,
            connectionLimit: CONCURRENCY_LIMIT,
            queueLimit: 0,
            idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        },
    },
    payU_test: {
        key: process.env.PAYU_TEST_KEY,
        salt: process.env.PAYU_TEST_SALT
    },
    payU_prod: {
        key: process.env.PAYU_PROD_KEY,
        salt: process.env.PAYU_PROD_SALT
    },
    surlPrefix: "http://localhost:3000/event/register/verify",
    furlPrefix: "http://localhost:3000/event/register/verify",
}

module.exports = appConfig;