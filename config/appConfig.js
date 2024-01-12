const CONCURRENCY_LIMIT = 12;

const appConfig = {
    CONCURRENCY_LIMIT: CONCURRENCY_LIMIT,
    PORT: 5000,
    AUTH_URL_PREFIX: '/api/auth',
    USER_URL_PREFIX: '/api/user',
    ADMIN_URL_PREFIX: '/api/admin',
    db: {
        anokha_db: {
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'anokha',
            multipleStatements: true
        },
        anokha_transactions_db: {
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'anokha_transactions',
            multipleStatements: true
        },
    },
    pool_db: {
        anokha_db: {
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'anokha',
            waitForConnections: true,
            connectionLimit: CONCURRENCY_LIMIT,
            queueLimit: 0
        },
        anokha_transactions_db: {
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'anokha_transactions',
            waitForConnections: true,
            connectionLimit: CONCURRENCY_LIMIT,
            queueLimit: 0
        },
    }
}

module.exports = appConfig;