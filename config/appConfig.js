const CONCURRENCY_LIMIT = 12;

const db_pass = 'password';

const appConfig = {
    CONCURRENCY_LIMIT: CONCURRENCY_LIMIT,
    PORT: 5000,
    AUTH_URL_PREFIX: '/api/auth',
    USER_URL_PREFIX: '/api/user',
    ADMIN_URL_PREFIX: '/api/admin',
    INTEL_URL_PREFIX: '/api/intel',
    mailer:{
        obj: {
            service: 'Gmail',
            auth: {
                user: 'auth.amrita.placements@gmail.com',
                pass: 'huhrfndypcwuaxtn'
            }
        },
        name: 'Anokha 2024'
    },
    db: {
        anokha_db: {
            host: 'localhost',
            user: 'root',
            password: db_pass,
            database: 'anokha',
            multipleStatements: true
        },
        anokha_transactions_db: {
            host: 'localhost',
            user: 'root',
            password: db_pass,
            database: 'anokha_transactions',
            multipleStatements: true
        },
    },
    pool_db: {
        anokha_db: {
            host: 'localhost',
            user: 'root',
            password: db_pass,
            database: 'anokha',
            waitForConnections: true,
            connectionLimit: CONCURRENCY_LIMIT,
            queueLimit: 0,
            idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        },
        anokha_transactions_db: {
            host: 'localhost',
            user: 'root',
            password: db_pass,
            database: 'anokha_transactions',
            waitForConnections: true,
            connectionLimit: CONCURRENCY_LIMIT,
            queueLimit: 0,
            idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        },
    },
    payU_test: {
        key: "Pz9v2c",
        salt: "TbxC2ph02lBUbVYwx0fIB50CvqL27pHo"
    },
    payU_prod: {
        key: "ypfBaj",
        salt: "aG3tGzBZ"
    },
    surlPrefix: "http://localhost:3000/event/register/verify",
    furlPrefix: "http://localhost:3000/event/register/verify",
}

module.exports = appConfig;