CREATE TABLE managerRole (
    roleId INTEGER PRIMARY KEY AUTO_INCREMENT,
    roleName VARCHAR(255) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departmentData (
    departmentId INTEGER PRIMARY KEY AUTO_INCREMENT, 
    departmentName VARCHAR(255) NOT NULL UNIQUE, 
    departmentAbbreviation VARCHAR(255) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tagData (
    tagId INTEGER PRIMARY KEY AUTO_INCREMENT,
    tagName VARCHAR(255) NOT NULL UNIQUE,
    tagAbbreviation VARCHAR(255) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE managerData (
    managerId INTEGER PRIMARY KEY AUTO_INCREMENT,
    managerFullName VARCHAR(255) NOT NULL,
    managerEmail VARCHAR(255) NOT NULL UNIQUE,
    managerPhone CHAR(10) UNIQUE,
    managerPassword VARCHAR(255) NOT NULL,
    managerRoleId INTEGER NOT NULL,
    managerAccountStatus CHAR(1) NOT NULL DEFAULT "1",
    managerDepartmentId INTEGER NOT NULL,
    managerAddedBy INTEGER DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (managerRoleId) REFERENCES managerRole(roleId),
    FOREIGN KEY (managerDepartmentId) REFERENCES departmentData(departmentId),
    FOREIGN KEY (managerAddedBy) REFERENCES managerData(managerId),
    CHECK (managerAccountStatus IN ("0", "1"))
);

CREATE TABLE tagFaculty (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    tagId INTEGER NOT NULL,
    managerId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tagId) REFERENCES tagData(tagId),
    FOREIGN KEY (managerId) REFERENCES managerData(managerId)
);

CREATE TABLE studentData (
    studentId INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentFullName VARCHAR(255) NOT NULL,
    studentEmail VARCHAR(255) NOT NULL UNIQUE,
    studentPhone CHAR(10) NOT NULL UNIQUE,
    studentPassword VARCHAR(255) NOT NULL,
    needPassport CHAR(1) NOT NULL DEFAULT "1",
    studentAccountStatus CHAR(1) NOT NULL DEFAULT "1",
    studentCollegeName VARCHAR(255) NOT NULL,
    studentCollegeCity VARCHAR(255) NOT NULL,
    isInCampus CHAR(1) NOT NULL DEFAULT "0",
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (needPassport IN ("0", "1")),
    CHECK (studentAccountStatus IN ("0", "1", "2")),
    CHECK (isInCampus IN ("0", "1"))
);

-- studentAccountStatus: 0 = BLOCKED, 1 = REGISTERED, PENDING PASSPORT , 2 = PASSPORT DONE

CREATE TABLE studentRegister (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentEmail VARCHAR(255) NOT NULL UNIQUE,
    otp CHAR(6) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE forgotPasswordStudent (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentId INTEGER NOT NULL,
    otp CHAR(6) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)
);

CREATE TABLE forgotPasswordManager (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    managerId INTEGER NOT NULL,
    otp CHAR(6) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (managerId) REFERENCES managerData(managerId)
);

CREATE TABLE eventData (
    eventId INTEGER PRIMARY KEY AUTO_INCREMENT,
    eventName VARCHAR(255) NOT NULL,
    eventDescription VARCHAR(255) NOT NULL,
    eventDate DATE NOT NULL,
    eventTime TIME NOT NULL,
    eventVenue VARCHAR(255) NOT NULL,
    eventImageURL VARCHAR(255) NOT NULL,
    eventPrice INTEGER NOT NULL,
    maxSeats INTEGER NOT NULL,
    seatsFilled INTEGER NOT NULL DEFAULT 0,
    minTeamSize INTEGER NOT NULL,
    maxTeamSize INTEGER NOT NULL,
    isWorkshop CHAR(1) NOT NULL,
    isTechnical CHAR(1) NOT NULL,
    isGroup CHAR(1) NOT NULL,
    isPerHeadPrice CHAR(1) NOT NULL,
    isRefundable CHAR(1) NOT NULL,
    eventStatus CHAR(1) NOT NULL DEFAULT "1",
    needGroupData CHAR(1) NOT NULL DEFAULT "1",
    eventTagId INTEGER,
    eventDepartmentId INTEGER,
    eventCreatedBy INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (eventDepartmentId) REFERENCES departmentData(departmentId),
    FOREIGN KEY (eventTagId) REFERENCES tagData(tagId),
    FOREIGN KEY (eventCreatedBy) REFERENCES managerData(managerId),
    CHECK (eventTagId IS NOT NULL OR eventDepartmentId IS NOT NULL),
    CHECK (isWorkshop IN ("0", "1")),
    CHECK (isTechnical IN ("0", "1")),
    CHECK (isGroup IN ("0", "1")),
    CHECK (isPerHeadPrice IN ("0", "1")),
    CHECK (isRefundable IN ("0", "1")),
    CHECK (eventStatus IN ("0", "1", "2")),
    CHECK (needGroupData IN ("0", "1"))
);
-- eventStatus: 0 = CANCELLED FROM ANOKHA, 1 = ACTIVE, 2 = CLOSED FOR REGISTRATIONS

CREATE TABLE eventOrganizersData (
    eventId INTEGER NOT NULL,
    managerId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (eventId, managerId),
    FOREIGN KEY (eventId) REFERENCES eventData(eventId),
    FOREIGN KEY (managerId) REFERENCES managerData(managerId)
);

CREATE TABLE eventRegistrationData (
    registrationId INTEGER PRIMARY KEY AUTO_INCREMENT,
    eventId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    isMarketPlacePaymentMode CHAR(1) NOT NULL DEFAULT "0",
    txnId VARCHAR(255) DEFAULT NULL,
    totalMembers INTEGER NOT NULL DEFAULT 1,
    totalAmountPaid INTEGER NOT NULL DEFAULT 0,
    teamName VARCHAR(255) DEFAULT NULL,
    registrationStatus CHAR(1) NOT NULL DEFAULT "1",
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (eventId) REFERENCES eventData(eventId),
    FOREIGN KEY (studentId) REFERENCES studentData(studentId),
    CHECK (isMarketPlacePaymentMode IN ("0", "1")),
    CHECK  (registrationStatus IN ("1", "2", "3", "4", "5", "6", "7"))
);

-- isMarketPlacePaymentMode: 0 = 18% GST, 1 = AMRITA WALLET NO GST  
-- registrationStatus:
-- 1 -> REGISTRATION INITIATED. PAYMENT PENDING
-- 2 -> REGISTERED. PAYED.
-- 3 -> USER CANCELLED REGISTRATION.
-- 4 -> EVENT WAS CANCELLED. NO REFUND.
-- 5 -> EVENT WAS CANCELLED, waiting for refund.
-- 6 -> EVENT WAS CANCELLED, refund done.
-- 7 -> EVENT WAS CANCELLED, refund also rejected.

CREATE TABLE eventRegistrationGroupData (
    registrationId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    roleDescription VARCHAR(255) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (registrationId, studentId),
    FOREIGN KEY (registrationId) REFERENCES eventRegistrationData(registrationId),
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)
);

CREATE TABLE eventAttendanceData (
    attendanceId INTEGER PRIMARY KEY AUTO_INCREMENT,
    eventId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    entryTime TIMESTAMP,
    exitTime TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    FOREIGN KEY (eventId) REFERENCES eventData(eventId),
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)   
);

CREATE TABLE visitLogs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentId INTEGER NOT NULL,
    entryTime TIMESTAMP,
    exitTime TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)
);

CREATE TABLE starredEvents (
    studentId INTEGER NOT NULL,
    eventId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (studentId, eventId),
    FOREIGN KEY (studentId) REFERENCES studentData(studentId),
    FOREIGN KEY (eventId) REFERENCES eventData(eventId)
);

CREATE TABLE crewDetails (
    crewId INTEGER PRIMARY KEY AUTO_INCREMENT,
    crewName VARCHAR(255) NOT NULL
); 

CREATE TABLE crewMembers (
    memberEmail VARCHAR(255) PRIMARY KEY,
    managerName VARCHAR(255) NOT NULL,
    crewId INTEGER NOT NULL,
    departmentId INTEGER NOT NULL,
    roleDescription VARCHAR(255) NOT NULL,
    FOREIGN KEY (departmentId) REFERENCES departmentData(departmentId),
    FOREIGN KEY (crewId) REFERENCES crewDetails(crewId)
);


