DROP TABLE IF EXISTS transactionData;
DROP TABLE IF EXISTS marketPlaceTransactionData;

CREATE TABLE IF NOT EXISTS transactionData (
    txnid VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    amount INT NOT NULL,
    productinfo VARCHAR(5000) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    transactionStatus VARCHAR(1) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (txnid),
    CHECK (transactionStatus IN ('0', '1', '2'))
    -- 0: Pending, 1: Success, 2: Failed
);

CREATE TABLE IF NOT EXISTS marketPlaceTransactionData (
    txnid VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    amount INT NOT NULL,
    productinfo VARCHAR(5000) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    transactionStatus VARCHAR(1) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (txnid),
    CHECK (transactionStatus IN ('0', '1', '2'))
    -- 0: Pending, 1: Success, 2: Failed
);