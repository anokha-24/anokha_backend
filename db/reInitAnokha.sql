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
DROP TABLE IF EXISTS eventTagData;
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
    isActive CHAR(1) NOT NULL DEFAULT "1",
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (isActive IN ("0", "1"))
);



INSERT INTO managerRole (roleId, roleName) VALUES (1,"Super Admin");
INSERT INTO managerRole (roleId, roleName) VALUES (2,"Admin");
INSERT INTO managerRole (roleId, roleName) VALUES (3,"Event Head");
-- event crud
INSERT INTO managerRole (roleId, roleName) VALUES (4,"Finance");
-- can view total revenue, total registrations, total registrations per event, total registrations per department
INSERT INTO managerRole (roleId, roleName) VALUES (5,"Department Head");
-- 
INSERT INTO managerRole (roleId, roleName) VALUES (6,"Faculty Coordinator");
-- attendance for event
INSERT INTO managerRole (roleId, roleName) VALUES (7,"Student Coordinator");
-- atendance for event
INSERT INTO managerRole (roleId, roleName) VALUES (8,"Eventide Registration");
-- eventide registration
INSERT INTO managerRole (roleId, roleName) VALUES (9,"Security");
-- eventide attendance
INSERT INTO managerRole (roleId, roleName) VALUES (10,"Registration Head");
-- other college entry, exit



CREATE TABLE IF NOT EXISTS departmentData (
    departmentId INTEGER PRIMARY KEY AUTO_INCREMENT, 
    departmentName VARCHAR(255) NOT NULL UNIQUE, 
    departmentAbbreviation VARCHAR(255) NOT NULL UNIQUE,
    isActive CHAR(1) NOT NULL DEFAULT "1",
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (isActive IN ("0", "1"))
);

CREATE TABLE IF NOT EXISTS tagData (
    tagId INTEGER PRIMARY KEY AUTO_INCREMENT,
    tagName VARCHAR(255) NOT NULL UNIQUE,
    tagAbbreviation VARCHAR(255) NOT NULL UNIQUE,
    isActive CHAR(1) NOT NULL DEFAULT "1",
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (isActive IN ("0", "1"))
);

INSERT INTO tagData (tagName, tagAbbreviation) VALUES ("Computer Science", "CS");
INSERT INTO tagData (tagName, tagAbbreviation) VALUES ("Competitive Programming", "CP");
INSERT INTO tagData (tagName, tagAbbreviation) VALUES ("Internet Of Things", "IOT");


INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Electrical and Electronics Engineering","EEE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Mechanical Engineering","MEE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Cyber Security", "CYS");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Mathematics", "MATH");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Electronics and Communication Engineering", "ECE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Computer Science and Engineering", "CSE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Social Work", "MSW");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Civil Engineering", "CIE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Agriculture", "AGRI");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("English", "ENG");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Chemical Engineering", "CHE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Aerospace Engineering", "AEE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Computer Engineering and Networking", "CEN");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Team Media - Club", "TM");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Amrita Centre for Entrepreneurship", "ACE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Department of Science", "SCI");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Nivesha - Club", "NIV");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Department of Mass Communication", "ASCOM");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Elite - Club", "ELITE");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Corporate and Industry Relations", "CIR");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Eventide", "EVN");
INSERT INTO departmentData (departmentName,departmentAbbreviation) VALUES ("Toastmasters - Club", "ATC");


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

INSERT INTO managerData (
    managerFullName, 
    managerEmail, 
    managerPhone, 
    managerPassword, 
    managerRoleId, 
    managerDepartmentId
) VALUES (
    "Admin WMD Ark",
    "abhinavramki2@gmail.com", 
    "9595959599",
    "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    1,
    6 
);

INSERT INTO managerData (
    managerFullName, 
    managerEmail, 
    managerPhone, 
    managerPassword, 
    managerRoleId, 
    managerDepartmentId
) VALUES (
    "Admin WMD Ash",
    "ashrockzzz2003@gmail.com", 
    "9696969696",
    "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    1,
    6 
);

-- CREATE TABLE IF NOT EXISTS tagFaculty (
--     id INTEGER PRIMARY KEY AUTO_INCREMENT,
--     tagId INTEGER NOT NULL,
--     managerId INTEGER NOT NULL,
--     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (tagId) REFERENCES tagData(tagId),
--     FOREIGN KEY (managerId) REFERENCES managerData(managerId)
-- );

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


-- INSERT STUDENT DATA
-- password = ark123@890

INSERT INTO studentData (studentFullName, studentEmail, studentPhone, studentPassword, needPassport, studentCollegeName, studentCollegeCity, isInCampus, studentAccountStatus)
VALUES ("Abhinav R", "cb.en.u4cse21001@cb.students.amrita.edu", "9595959595", "4bc3446b672d30ca045eb57cd661347c27a7ca3edd80cc2fe320159800f8c856", "0", "Amrita Vishwa Vidyapeetham", "Coimbatore", "1", "2");
-- password = password

INSERT INTO studentData (studentFullName, studentEmail, studentPhone, studentPassword, needPassport, studentCollegeName, studentCollegeCity, isInCampus, studentAccountStatus)
VALUES ("Ashwin S", "cb.en.u4cse21008@cb.students.amrita.edu", "9695959595", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", "0", "Amrita Vishwa Vidyapeetham", "Coimbatore", "1", "2");

-- password = asdfghjkl
INSERT INTO studentData (studentFullName, studentEmail, studentPhone, studentPassword, needPassport, studentCollegeName, studentCollegeCity, isInCampus, studentAccountStatus)
VALUES ("Dharma Pravardhana V", "dharmapravardhana7@gmail.com", "8248847564", "5c80565db6f29da0b01aa12522c37b32f121cbe47a861ef7f006cb22922dffa1", "1", "Amrita Vishwa Vidyapeetham", "Coimbatore", "0", "1");

-- password = 123
INSERT INTO studentData (studentFullName, studentEmail, studentPhone, studentPassword, needPassport, studentCollegeName, studentCollegeCity, isInCampus, studentAccountStatus)
VALUES ("sajith", "saisajith03@gmail.com", "8993939323", "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3", "1", "Amrita Vishwa Vidyapeetham", "Coimbatore", "0", "1");

CREATE TABLE IF NOT EXISTS studentRegister (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentEmail VARCHAR(255) NOT NULL UNIQUE,
    otp VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forgotPasswordStudent (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    studentId INTEGER NOT NULL,
    otp VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES studentData(studentId)
);

CREATE TABLE IF NOT EXISTS forgotPasswordManager (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    managerId INTEGER NOT NULL,
    otp VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (managerId) REFERENCES managerData(managerId)
);

CREATE TABLE IF NOT EXISTS eventData (
    eventId INTEGER PRIMARY KEY AUTO_INCREMENT,
    eventName VARCHAR(255) NOT NULL,
    eventDescription VARCHAR(255) NOT NULL,
    eventMarkdownDescription VARCHAR(5000) NOT NULL,
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
    eventDepartmentId INTEGER,
    eventCreatedBy INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (eventDepartmentId) REFERENCES departmentData(departmentId),
    FOREIGN KEY (eventCreatedBy) REFERENCES managerData(managerId),
    CHECK (eventDepartmentId IS NOT NULL),
    CHECK (isWorkshop IN ("0", "1")),
    CHECK (isTechnical IN ("0", "1")),
    CHECK (isGroup IN ("0", "1")),
    CHECK (isPerHeadPrice IN ("0", "1")),
    CHECK (isRefundable IN ("0", "1")),
    CHECK (eventStatus IN ("0", "1", "2")),
    CHECK (needGroupData IN ("0", "1"))
);
-- eventStatus: 0 = CANCELLED FROM ANOKHA, 1 = ACTIVE, 2 = CLOSED FOR REGISTRATIONS

INSERT INTO eventData (
    eventName, 
    eventDescription, 
    eventMarkdownDescription, 
    eventDate, 
    eventTime, 
    eventVenue, 
    eventImageURL, 
    eventPrice, 
    maxSeats, 
    minTeamSize, 
    maxTeamSize,
    eventDepartmentId, 
    isWorkshop, 
    isTechnical, 
    isGroup, 
    isPerHeadPrice, 
    isRefundable, 
    eventStatus, 
    needGroupData, 
    eventCreatedBy
) VALUES (
    "Code Clash", 
    "Welcome to the Code Clash Championship, where the brightest minds in the world of programming come together to engage in an exhilarating battle of algorithms and logic!", 
    "# Code Clash Championship

Welcome to the Code Clash Championship, an electrifying event that brings together the sharpest minds in the programming world. Brace yourself for an intense showdown of algorithms and logic, where participants will be tested on their problem-solving skills, coding prowess, and strategic thinking.

## Event Highlights

- **Global Participation:** Engage with participants from around the world, fostering a diverse and competitive environment.
  
- **Multi-Round Challenges:** Navigate through multiple rounds featuring a range of algorithmic problems, from fundamental coding tasks to advanced puzzles.

- **Real-time Leaderboard:** Stay on the edge with a dynamic leaderboard, offering instant updates on participant rankings.

- **Time Constraints:** Experience the thrill of time-bound challenges, testing your ability to code efficiently under pressure.

- **Programming Languages:** Showcase your skills in your language of choice. The competition is language-agnostic, focusing on problem-solving abilities.

- **Innovative Problem Statements:** Tackle thought-provoking problems crafted by our expert panel, combining classic algorithms with novel scenarios.

- **Prizes and Recognition:** Compete for exciting prizes and gain recognition from the tech community and potential employers.

- **Networking Opportunities:** Connect with like-minded individuals, share insights, and build a global network within the coding community.

## Who Should Participate

- Enthusiastic programmers
- Computer science students
- Software developers
- Coding aficionados
- Anyone passionate about honing their coding skills

Gear up for an adrenaline-pumping coding experience where lines of code become your weapons, and logic serves as your armor. Join us at the Code Clash Championship and prove that you have what it takes to be crowned the coding champion!
", 
    "2021-03-01", 
    "10:00:00", 
    "Anugraha Hall", 
    "https://anokha.amrita.edu/2023/static/media/anokha_app.07f6b3b86aebf193cfc4.png", 
    200, 
    10, 
    2, 
    4, 
    6,
    "0", 
    "1", 
    "1", 
    "0", 
    "1", 
    "1", 
    "1", 
    1
);

INSERT INTO eventData (
    eventName, 
    eventDescription, 
    eventMarkdownDescription, 
    eventDate, 
    eventTime, 
    eventVenue, 
    eventImageURL, 
    eventPrice, 
    maxSeats, 
    minTeamSize, 
    maxTeamSize,
    eventDepartmentId, 
    isWorkshop, 
    isTechnical, 
    isGroup, 
    isPerHeadPrice, 
    isRefundable, 
    eventStatus, 
    needGroupData, 
    eventCreatedBy
) VALUES (
    "IOT Workshop",
    "Participants will explore the concepts, technologies, and practical applications of IoT that are transforming the way we interact with the world.", 
    "# IoT Workshop: Bridging the Physical and Digital Worlds

Welcome to our IoT Workshop, where we dive into the fascinating realm of the Internet of Things (IoT). In this hands-on session, participants will explore the concepts, technologies, and practical applications of IoT that are transforming the way we interact with the world.

## Workshop Highlights

- **Date and Time:** [Insert Date and Time]
- **Venue:** [Insert Venue]
- **Duration:** [Insert Duration]

## What to Expect

### Overview
IoT is revolutionizing industries, connecting devices, and creating smarter, more efficient systems. This workshop is designed for beginners and enthusiasts eager to understand the fundamentals and potential of IoT.

### Key Topics Covered
1. **Introduction to IoT**
   - Understanding the basics: sensors, actuators, and connectivity.
   
2. **IoT Architecture**
   - Exploring the layers: perception, network, and application layers.

3. **Protocols and Communication**
   - Overview of MQTT, CoAP, and HTTP protocols.
   - Hands-on communication between devices.", 
    "2021-03-03", 
    "11:00:00", 
    "Anugraha Hall", 
    "https://anokha.amrita.edu/2023/static/media/anokha_app.07f6b3b86aebf193cfc4.png", 
    100, 
    100, 
    1, 
    1, 
    6,
    "1", 
    "1", 
    "0", 
    "1", 
    "1", 
    "1", 
    "0", 
    1
);

CREATE TABLE IF NOT EXISTS eventTagData (
    eventId INTEGER NOT NULL,
    tagId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (eventId, tagId),
    FOREIGN KEY (eventId) REFERENCES eventData(eventId),
    FOREIGN KEY (tagId) REFERENCES tagData(tagId)
);

INSERT INTO eventTagData (eventId, tagId) VALUES (1, 1);
INSERT INTO eventTagData (eventId, tagId) VALUES (1, 2);
INSERT INTO eventTagData (eventId, tagId) VALUES (2, 1);
INSERT INTO eventTagData (eventId, tagId) VALUES (2, 3);

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


-- added eventId field to minimize joins during getAllEvents for logged in Student
-- added isOwnRegistration field to minimize joins during getAllEvents for logged in Student
CREATE TABLE IF NOT EXISTS eventRegistrationGroupData (
    registrationId INTEGER NOT NULL,
    txnId VARCHAR(255) DEFAULT NULL,
    studentId INTEGER NOT NULL,
    eventId INTEGER NOT NULL,
    roleDescription VARCHAR(255) DEFAULT NULL,
    isOwnRegistration CHAR(1) NOT NULL DEFAULT "0",
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (registrationId, studentId),
    FOREIGN KEY (registrationId) REFERENCES eventRegistrationData(registrationId),
    FOREIGN KEY (studentId) REFERENCES studentData(studentId),
    FOREIGN KEY (eventId) REFERENCES eventData(eventId)
);

INSERT INTO eventRegistrationData (eventId, studentId, isMarketPlacePaymentMode, txnId, totalMembers, totalAmountPaid, teamName, registrationStatus) VALUES (1, 1, "0", "simpletransactionid", 1, 200,"teamark", "2");
INSERT INTO eventRegistrationGroupData (registrationId, txnId, studentId, eventId, roleDescription, isOwnRegistration) VALUES (1,"simpletransactionid", 1, 1, "Member", "1");
INSERT INTO eventRegistrationGroupData (registrationId, txnId, studentId, eventId, roleDescription, isOwnRegistration) VALUES (1,"simpletransactionid", 2, 1, "Member", "0");

INSERT INTO eventRegistrationData (eventId, studentId, isMarketPlacePaymentMode, txnId, totalMembers, totalAmountPaid, teamName, registrationStatus) VALUES (2, 1, "1", "simpletransactionid2", 1, 200,"teamark", "2");

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

INSERT INTO starredEvents (studentId, eventId) VALUES (1, 1);

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


