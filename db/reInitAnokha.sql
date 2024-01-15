DROP TABLE IF EXISTS managerLoginLogs;
DROP TABLE IF EXISTS studentLoginLogs;
DROP TABLE IF EXISTS crewMembers;
DROP TABLE IF EXISTS crewDetails;
DROP TABLE IF EXISTS starredEvents;
DROP TABLE IF EXISTS visitLogs;
DROP TABLE IF EXISTS eventAttendanceData;
DROP TABLE IF EXISTS eventRegistrationGroupData;
DROP TABLE IF EXISTS eventRegistrationData;
DROP TABLE IF EXISTS eventOrganizersData;
DROP TABLE IF EXISTS eventData;
DROP TABLE IF EXISTS forgotPasswordManager;
DROP TABLE IF EXISTS forgotPasswordStudent;
DROP TABLE IF EXISTS studentRegister;
DROP TABLE IF EXISTS studentData;
DROP TABLE IF EXISTS tagFaculty;
DROP TABLE IF EXISTS managerData;
DROP TABLE IF EXISTS tagData;
DROP TABLE IF EXISTS departmentData;
DROP TABLE IF EXISTS managerRole;

CREATE TABLE IF NOT EXISTS managerRole (
    roleId INTEGER PRIMARY KEY AUTO_INCREMENT,
    roleName VARCHAR(255) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departmentData (
    departmentId INTEGER PRIMARY KEY AUTO_INCREMENT, 
    departmentName VARCHAR(255) NOT NULL UNIQUE, 
    departmentAbbreviation VARCHAR(255) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tagData (
    tagId INTEGER PRIMARY KEY AUTO_INCREMENT,
    tagName VARCHAR(255) NOT NULL UNIQUE,
    tagAbbreviation VARCHAR(255) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS managerData (
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

CREATE TABLE IF NOT EXISTS tagFaculty (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    tagId INTEGER NOT NULL,
    managerId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tagId) REFERENCES tagData(tagId),
    FOREIGN KEY (managerId) REFERENCES managerData(managerId)
);

CREATE TABLE IF NOT EXISTS studentData (
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

CREATE TABLE IF NOT EXISTS studentRegister (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentEmail VARCHAR(255) NOT NULL UNIQUE,
    otp CHAR(6) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forgotPasswordStudent (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentId INTEGER NOT NULL,
    otp CHAR(6) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)
);

CREATE TABLE IF NOT EXISTS forgotPasswordManager (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    managerId INTEGER NOT NULL,
    otp CHAR(6) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (managerId) REFERENCES managerData(managerId)
);

CREATE TABLE IF NOT EXISTS eventData (
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

CREATE TABLE IF NOT EXISTS eventOrganizersData (
    eventId INTEGER NOT NULL,
    managerId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (eventId, managerId),
    FOREIGN KEY (eventId) REFERENCES eventData(eventId),
    FOREIGN KEY (managerId) REFERENCES managerData(managerId)
);

CREATE TABLE IF NOT EXISTS eventRegistrationData (
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

CREATE TABLE IF NOT EXISTS eventRegistrationGroupData (
    registrationId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    roleDescription VARCHAR(255) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (registrationId, studentId),
    FOREIGN KEY (registrationId) REFERENCES eventRegistrationData(registrationId),
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)
);

CREATE TABLE IF NOT EXISTS eventAttendanceData (
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

CREATE TABLE IF NOT EXISTS visitLogs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentId INTEGER NOT NULL,
    entryTime TIMESTAMP,
    exitTime TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)
);

CREATE TABLE IF NOT EXISTS starredEvents (
    studentId INTEGER NOT NULL,
    eventId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (studentId, eventId),
    FOREIGN KEY (studentId) REFERENCES studentData(studentId),
    FOREIGN KEY (eventId) REFERENCES eventData(eventId)
);

CREATE TABLE IF NOT EXISTS crewDetails (
    crewId INTEGER PRIMARY KEY AUTO_INCREMENT,
    crewName VARCHAR(255) NOT NULL
); 

CREATE TABLE IF NOT EXISTS crewMembers (
    memberEmail VARCHAR(255) PRIMARY KEY,
    managerName VARCHAR(255) NOT NULL,
    crewId INTEGER NOT NULL,
    memberImageURL VARCHAR(255) NOT NULL,
    departmentId INTEGER NOT NULL,
    roleDescription VARCHAR(255) NOT NULL,
    FOREIGN KEY (departmentId) REFERENCES departmentData(departmentId),
    FOREIGN KEY (crewId) REFERENCES crewDetails(crewId)
);

CREATE TABLE IF NOT EXISTS studentLoginLogs(
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentId INTEGER NOT NULL,
    loginTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)
);

CREATE TABLE IF NOT EXISTS managerLoginLogs(
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    managerId INTEGER NOT NULL,
    loginTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (managerId) REFERENCES managerData(managerId)
);


-- INSERT STUDENT DATA
-- password = ark123@890

INSERT INTO studentData (studentFullName, studentEmail, studentPhone, studentPassword, needPassport, studentCollegeName, studentCollegeCity, isInCampus, studentAccountStatus)
VALUES ("Abhinav R", "cb.en.u4cse21001@cb.students.amrita.edu", "9595959595", "4bc3446b672d30ca045eb57cd661347c27a7ca3edd80cc2fe320159800f8c856", "0", "Amrita Vishwa Vidyapeetham", "Coimbatore", "1", "2");

