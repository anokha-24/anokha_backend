DROP TABLE IF EXISTS transactionData;
DROP TABLE IF EXISTS marketPlaceTransactionData;

-- select * from transactionData where transactionStatus = "0" AND expiryTime < CURRENT_TIMESTAMP; 

CREATE TABLE IF NOT EXISTS transactionData (
    txnId VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    amount INT NOT NULL,
    productinfo VARCHAR(5000) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    transactionStatus VARCHAR(1) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiryTime TIMESTAMP NOT NULL DEFAULT ( createdAt + INTERVAL 5 MINUTE ),
    lastUpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (txnid),
    CHECK (transactionStatus IN ('0', '1', '2'))
    -- 0: Pending, 1: Success, 2: Failed
);

INSERT INTO transactionData 
(txnId, 
userId, 
amount, 
productinfo, 
firstname, 
email, 
phone, 
transactionStatus) 
VALUES
('simpletransactionid', 
1, 
200, 
'Test Product', 
'Abhinav R',
'cb.en.u4cse21001@cb.students.amrita.edu',
'9595959595',
'1'
);


CREATE TABLE IF NOT EXISTS marketPlaceTransactionData (
    txnId VARCHAR(255) NOT NULL,
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

INSERT INTO marketPlaceTransactionData 
(txnId, 
userId, 
amount, 
productinfo, 
firstname, 
email, 
phone, 
transactionStatus) 
VALUES
('simpletransactionid2', 
1, 
200, 
'Test Product', 
'Abhinav R',
'cb.en.u4cse21001@cb.students.amrita.edu',
'9595959595',
'1'
);