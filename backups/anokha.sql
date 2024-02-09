-- MySQL dump 10.13  Distrib 8.0.31, for Win64 (x86_64)
--
-- Host: localhost    Database: anokha
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `blockedstudentstatus`
--

DROP TABLE IF EXISTS `blockedstudentstatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blockedstudentstatus` (
  `studentId` int NOT NULL,
  `lastStatus` char(1) NOT NULL,
  `blockedBy` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`studentId`),
  KEY `blockedBy` (`blockedBy`),
  CONSTRAINT `blockedstudentstatus_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`),
  CONSTRAINT `blockedstudentstatus_ibfk_2` FOREIGN KEY (`blockedBy`) REFERENCES `managerdata` (`managerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blockedstudentstatus`
--

LOCK TABLES `blockedstudentstatus` WRITE;
/*!40000 ALTER TABLE `blockedstudentstatus` DISABLE KEYS */;
/*!40000 ALTER TABLE `blockedstudentstatus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crewdetails`
--

DROP TABLE IF EXISTS `crewdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crewdetails` (
  `crewId` int NOT NULL AUTO_INCREMENT,
  `crewName` varchar(255) NOT NULL,
  PRIMARY KEY (`crewId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crewdetails`
--

LOCK TABLES `crewdetails` WRITE;
/*!40000 ALTER TABLE `crewdetails` DISABLE KEYS */;
/*!40000 ALTER TABLE `crewdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crewmembers`
--

DROP TABLE IF EXISTS `crewmembers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crewmembers` (
  `memberEmail` varchar(255) NOT NULL,
  `managerName` varchar(255) NOT NULL,
  `crewId` int NOT NULL,
  `memberImageURL` varchar(255) NOT NULL,
  `departmentId` int NOT NULL,
  `roleDescription` varchar(255) NOT NULL,
  PRIMARY KEY (`memberEmail`),
  KEY `departmentId` (`departmentId`),
  KEY `crewId` (`crewId`),
  CONSTRAINT `crewmembers_ibfk_1` FOREIGN KEY (`departmentId`) REFERENCES `departmentdata` (`departmentId`),
  CONSTRAINT `crewmembers_ibfk_2` FOREIGN KEY (`crewId`) REFERENCES `crewdetails` (`crewId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crewmembers`
--

LOCK TABLES `crewmembers` WRITE;
/*!40000 ALTER TABLE `crewmembers` DISABLE KEYS */;
/*!40000 ALTER TABLE `crewmembers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departmentdata`
--

DROP TABLE IF EXISTS `departmentdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departmentdata` (
  `departmentId` int NOT NULL AUTO_INCREMENT,
  `departmentName` varchar(255) NOT NULL,
  `departmentAbbreviation` varchar(255) NOT NULL,
  `isActive` char(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`departmentId`),
  UNIQUE KEY `departmentName` (`departmentName`),
  UNIQUE KEY `departmentAbbreviation` (`departmentAbbreviation`),
  CONSTRAINT `departmentdata_chk_1` CHECK ((`isActive` in (_utf8mb4'0',_utf8mb4'1')))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departmentdata`
--

LOCK TABLES `departmentdata` WRITE;
/*!40000 ALTER TABLE `departmentdata` DISABLE KEYS */;
INSERT INTO `departmentdata` VALUES (1,'Electrical and Electronics Engineering','EEE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(2,'Mechanical Engineering','MEE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(3,'Cyber Security','CYS','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(4,'Mathematics','MATH','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(5,'Electronics and Communication Engineering','ECE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(6,'Computer Science and Engineering','CSE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(7,'Social Work','MSW','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(8,'Civil Engineering','CIE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(9,'Agriculture','AGRI','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(10,'English','ENG','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(11,'Chemical Engineering','CHE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(12,'Aerospace Engineering','AEE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(13,'Computer Engineering and Networking','CEN','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(14,'Team Media - Club','TM','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(15,'Amrita Centre for Entrepreneurship','ACE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(16,'Department of Science','SCI','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(17,'Nivesha - Club','NIV','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(18,'Department of Mass Communication','ASCOM','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(19,'Elite - Club','ELITE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(20,'Corporate and Industry Relations','CIR','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(21,'Eventide','EVN','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(22,'Toastmasters - Club','ATC','1','2024-02-09 12:24:32','2024-02-09 12:24:32');
/*!40000 ALTER TABLE `departmentdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventattendancedata`
--

DROP TABLE IF EXISTS `eventattendancedata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventattendancedata` (
  `attendanceId` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `studentId` int NOT NULL,
  `entryTime` timestamp NULL DEFAULT NULL,
  `exitTime` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendanceId`),
  KEY `eventId` (`eventId`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `eventattendancedata_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `eventdata` (`eventId`),
  CONSTRAINT `eventattendancedata_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventattendancedata`
--

LOCK TABLES `eventattendancedata` WRITE;
/*!40000 ALTER TABLE `eventattendancedata` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventattendancedata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventdata`
--

DROP TABLE IF EXISTS `eventdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventdata` (
  `eventId` int NOT NULL AUTO_INCREMENT,
  `eventName` varchar(255) NOT NULL,
  `eventDescription` varchar(255) NOT NULL,
  `eventMarkdownDescription` varchar(5000) NOT NULL,
  `eventDate` date NOT NULL,
  `eventTime` time NOT NULL,
  `eventVenue` varchar(255) NOT NULL,
  `eventImageURL` varchar(255) NOT NULL,
  `eventPrice` int NOT NULL,
  `maxSeats` int NOT NULL,
  `seatsFilled` int NOT NULL DEFAULT '0',
  `minTeamSize` int NOT NULL,
  `maxTeamSize` int NOT NULL,
  `isWorkshop` char(1) NOT NULL,
  `isTechnical` char(1) NOT NULL,
  `isGroup` char(1) NOT NULL,
  `isPerHeadPrice` char(1) NOT NULL,
  `isRefundable` char(1) NOT NULL,
  `eventStatus` char(1) NOT NULL DEFAULT '1',
  `needGroupData` char(1) NOT NULL DEFAULT '1',
  `eventDepartmentId` int DEFAULT NULL,
  `eventCreatedBy` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`eventId`),
  KEY `eventDepartmentId` (`eventDepartmentId`),
  KEY `eventCreatedBy` (`eventCreatedBy`),
  CONSTRAINT `eventdata_ibfk_1` FOREIGN KEY (`eventDepartmentId`) REFERENCES `departmentdata` (`departmentId`),
  CONSTRAINT `eventdata_ibfk_2` FOREIGN KEY (`eventCreatedBy`) REFERENCES `managerdata` (`managerId`),
  CONSTRAINT `eventdata_chk_1` CHECK ((`eventDepartmentId` is not null)),
  CONSTRAINT `eventdata_chk_2` CHECK ((`isWorkshop` in (_utf8mb4'0',_utf8mb4'1'))),
  CONSTRAINT `eventdata_chk_3` CHECK ((`isTechnical` in (_utf8mb4'0',_utf8mb4'1'))),
  CONSTRAINT `eventdata_chk_4` CHECK ((`isGroup` in (_utf8mb4'0',_utf8mb4'1'))),
  CONSTRAINT `eventdata_chk_5` CHECK ((`isPerHeadPrice` in (_utf8mb4'0',_utf8mb4'1'))),
  CONSTRAINT `eventdata_chk_6` CHECK ((`isRefundable` in (_utf8mb4'0',_utf8mb4'1'))),
  CONSTRAINT `eventdata_chk_7` CHECK ((`eventStatus` in (_utf8mb4'0',_utf8mb4'1',_utf8mb4'2'))),
  CONSTRAINT `eventdata_chk_8` CHECK ((`needGroupData` in (_utf8mb4'0',_utf8mb4'1')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventdata`
--

LOCK TABLES `eventdata` WRITE;
/*!40000 ALTER TABLE `eventdata` DISABLE KEYS */;
INSERT INTO `eventdata` VALUES (1,'Code Clash','Welcome to the Code Clash Championship, where the brightest minds in the world of programming come together to engage in an exhilarating battle of algorithms and logic!','# Code Clash Championship\r\n\r\nWelcome to the Code Clash Championship, an electrifying event that brings together the sharpest minds in the programming world. Brace yourself for an intense showdown of algorithms and logic, where participants will be tested on their problem-solving skills, coding prowess, and strategic thinking.\r\n\r\n## Event Highlights\r\n\r\n- **Global Participation:** Engage with participants from around the world, fostering a diverse and competitive environment.\r\n  \r\n- **Multi-Round Challenges:** Navigate through multiple rounds featuring a range of algorithmic problems, from fundamental coding tasks to advanced puzzles.\r\n\r\n- **Real-time Leaderboard:** Stay on the edge with a dynamic leaderboard, offering instant updates on participant rankings.\r\n\r\n- **Time Constraints:** Experience the thrill of time-bound challenges, testing your ability to code efficiently under pressure.\r\n\r\n- **Programming Languages:** Showcase your skills in your language of choice. The competition is language-agnostic, focusing on problem-solving abilities.\r\n\r\n- **Innovative Problem Statements:** Tackle thought-provoking problems crafted by our expert panel, combining classic algorithms with novel scenarios.\r\n\r\n- **Prizes and Recognition:** Compete for exciting prizes and gain recognition from the tech community and potential employers.\r\n\r\n- **Networking Opportunities:** Connect with like-minded individuals, share insights, and build a global network within the coding community.\r\n\r\n## Who Should Participate\r\n\r\n- Enthusiastic programmers\r\n- Computer science students\r\n- Software developers\r\n- Coding aficionados\r\n- Anyone passionate about honing their coding skills\r\n\r\nGear up for an adrenaline-pumping coding experience where lines of code become your weapons, and logic serves as your armor. Join us at the Code Clash Championship and prove that you have what it takes to be crowned the coding champion!\r\n','2021-03-01','10:00:00','Anugraha Hall','https://i.imgur.com/iQy8GLM.jpg',200,10,0,2,4,'0','1','1','0','1','1','1',6,1,'2024-02-09 12:24:32','2024-02-09 12:24:32'),(2,'IOT Workshop','Participants will explore the concepts, technologies, and practical applications of IoT that are transforming the way we interact with the world.','# IoT Workshop: Bridging the Physical and Digital Worlds\r\n\r\nWelcome to our IoT Workshop, where we dive into the fascinating realm of the Internet of Things (IoT). In this hands-on session, participants will explore the concepts, technologies, and practical applications of IoT that are transforming the way we interact with the world.\r\n\r\n## Workshop Highlights\r\n\r\n- **Date and Time:** [Insert Date and Time]\r\n- **Venue:** [Insert Venue]\r\n- **Duration:** [Insert Duration]\r\n\r\n## What to Expect\r\n\r\n### Overview\r\nIoT is revolutionizing industries, connecting devices, and creating smarter, more efficient systems. This workshop is designed for beginners and enthusiasts eager to understand the fundamentals and potential of IoT.\r\n\r\n### Key Topics Covered\r\n1. **Introduction to IoT**\r\n   - Understanding the basics: sensors, actuators, and connectivity.\r\n   \r\n2. **IoT Architecture**\r\n   - Exploring the layers: perception, network, and application layers.\r\n\r\n3. **Protocols and Communication**\r\n   - Overview of MQTT, CoAP, and HTTP protocols.\r\n   - Hands-on communication between devices.','2021-03-03','11:00:00','Anugraha Hall','https://i.imgur.com/iQy8GLM.jpg',100,100,0,1,1,'1','1','0','1','1','1','0',6,1,'2024-02-09 12:24:32','2024-02-09 12:24:32');
/*!40000 ALTER TABLE `eventdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventorganizersdata`
--

DROP TABLE IF EXISTS `eventorganizersdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventorganizersdata` (
  `eventId` int NOT NULL,
  `managerId` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`eventId`,`managerId`),
  KEY `managerId` (`managerId`),
  CONSTRAINT `eventorganizersdata_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `eventdata` (`eventId`),
  CONSTRAINT `eventorganizersdata_ibfk_2` FOREIGN KEY (`managerId`) REFERENCES `managerdata` (`managerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventorganizersdata`
--

LOCK TABLES `eventorganizersdata` WRITE;
/*!40000 ALTER TABLE `eventorganizersdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventorganizersdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventregistrationdata`
--

DROP TABLE IF EXISTS `eventregistrationdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventregistrationdata` (
  `registrationId` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `studentId` int NOT NULL,
  `isMarketPlacePaymentMode` char(1) NOT NULL DEFAULT '0',
  `txnId` varchar(255) DEFAULT NULL,
  `totalMembers` int NOT NULL DEFAULT '1',
  `totalAmountPaid` int NOT NULL DEFAULT '0',
  `teamName` varchar(255) DEFAULT NULL,
  `registrationStatus` char(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`registrationId`),
  KEY `eventId` (`eventId`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `eventregistrationdata_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `eventdata` (`eventId`),
  CONSTRAINT `eventregistrationdata_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`),
  CONSTRAINT `eventregistrationdata_chk_1` CHECK ((`isMarketPlacePaymentMode` in (_utf8mb4'0',_utf8mb4'1'))),
  CONSTRAINT `eventregistrationdata_chk_2` CHECK ((`registrationStatus` in (_utf8mb4'1',_utf8mb4'2',_utf8mb4'3',_utf8mb4'4',_utf8mb4'5',_utf8mb4'6',_utf8mb4'7')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventregistrationdata`
--

LOCK TABLES `eventregistrationdata` WRITE;
/*!40000 ALTER TABLE `eventregistrationdata` DISABLE KEYS */;
INSERT INTO `eventregistrationdata` VALUES (1,2,1,'1','simpletransactionid2',1,200,'teamark','2','2024-02-09 12:24:33','2024-02-09 12:24:33');
/*!40000 ALTER TABLE `eventregistrationdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventregistrationgroupdata`
--

DROP TABLE IF EXISTS `eventregistrationgroupdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventregistrationgroupdata` (
  `registrationId` int NOT NULL,
  `txnId` varchar(255) DEFAULT NULL,
  `studentId` int NOT NULL,
  `eventId` int NOT NULL,
  `roleDescription` varchar(255) DEFAULT NULL,
  `isOwnRegistration` char(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`registrationId`,`studentId`),
  KEY `studentId` (`studentId`),
  KEY `eventId` (`eventId`),
  CONSTRAINT `eventregistrationgroupdata_ibfk_1` FOREIGN KEY (`registrationId`) REFERENCES `eventregistrationdata` (`registrationId`),
  CONSTRAINT `eventregistrationgroupdata_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`),
  CONSTRAINT `eventregistrationgroupdata_ibfk_3` FOREIGN KEY (`eventId`) REFERENCES `eventdata` (`eventId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventregistrationgroupdata`
--

LOCK TABLES `eventregistrationgroupdata` WRITE;
/*!40000 ALTER TABLE `eventregistrationgroupdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventregistrationgroupdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventtagdata`
--

DROP TABLE IF EXISTS `eventtagdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventtagdata` (
  `eventId` int NOT NULL,
  `tagId` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`eventId`,`tagId`),
  KEY `tagId` (`tagId`),
  CONSTRAINT `eventtagdata_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `eventdata` (`eventId`),
  CONSTRAINT `eventtagdata_ibfk_2` FOREIGN KEY (`tagId`) REFERENCES `tagdata` (`tagId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventtagdata`
--

LOCK TABLES `eventtagdata` WRITE;
/*!40000 ALTER TABLE `eventtagdata` DISABLE KEYS */;
INSERT INTO `eventtagdata` VALUES (1,1,'2024-02-09 12:24:33','2024-02-09 12:24:33'),(1,2,'2024-02-09 12:24:33','2024-02-09 12:24:33'),(2,2,'2024-02-09 12:24:33','2024-02-09 12:24:33'),(2,3,'2024-02-09 12:24:33','2024-02-09 12:24:33');
/*!40000 ALTER TABLE `eventtagdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forgotpasswordmanager`
--

DROP TABLE IF EXISTS `forgotpasswordmanager`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forgotpasswordmanager` (
  `id` int NOT NULL AUTO_INCREMENT,
  `managerId` int NOT NULL,
  `otp` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `managerId` (`managerId`),
  CONSTRAINT `forgotpasswordmanager_ibfk_1` FOREIGN KEY (`managerId`) REFERENCES `managerdata` (`managerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forgotpasswordmanager`
--

LOCK TABLES `forgotpasswordmanager` WRITE;
/*!40000 ALTER TABLE `forgotpasswordmanager` DISABLE KEYS */;
/*!40000 ALTER TABLE `forgotpasswordmanager` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forgotpasswordstudent`
--

DROP TABLE IF EXISTS `forgotpasswordstudent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forgotpasswordstudent` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `otp` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `forgotpasswordstudent_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forgotpasswordstudent`
--

LOCK TABLES `forgotpasswordstudent` WRITE;
/*!40000 ALTER TABLE `forgotpasswordstudent` DISABLE KEYS */;
/*!40000 ALTER TABLE `forgotpasswordstudent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intelsubmissions`
--

DROP TABLE IF EXISTS `intelsubmissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intelsubmissions` (
  `teamId` int NOT NULL,
  `round` int NOT NULL,
  `problemStatement` varchar(1000) DEFAULT NULL,
  `theme` varchar(2) DEFAULT NULL,
  `githubLink` varchar(500) DEFAULT NULL,
  `youtubeVideoLink` varchar(500) DEFAULT NULL,
  `devmeshLink` varchar(500) DEFAULT NULL,
  `pptFileLink` varchar(500) DEFAULT NULL,
  `submittedBy` int NOT NULL,
  `seenStatus` char(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`teamId`,`round`),
  KEY `submittedBy` (`submittedBy`),
  CONSTRAINT `intelsubmissions_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `intelteamdata` (`teamId`),
  CONSTRAINT `intelsubmissions_ibfk_2` FOREIGN KEY (`submittedBy`) REFERENCES `studentdata` (`studentId`),
  CONSTRAINT `intelsubmissions_chk_1` CHECK (((`round` >= 1) and (`round` <= 3))),
  CONSTRAINT `intelsubmissions_chk_2` CHECK ((((`round` = 1) and (`pptFileLink` is not null) and (`problemStatement` is not null)) or (`round` <> 1))),
  CONSTRAINT `intelsubmissions_chk_3` CHECK ((((`round` = 2) and (`githubLink` is not null) and (`youtubeVideoLink` is not null) and (`devmeshLink` is not null)) or (`round` <> 2))),
  CONSTRAINT `intelsubmissions_chk_4` CHECK ((`seenStatus` in (_utf8mb4'0',_utf8mb4'1',_utf8mb4'2')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intelsubmissions`
--

LOCK TABLES `intelsubmissions` WRITE;
/*!40000 ALTER TABLE `intelsubmissions` DISABLE KEYS */;
INSERT INTO `intelsubmissions` VALUES (1,1,'Problem Statement','2',NULL,NULL,NULL,'https://www.google.com',2,'2','2024-02-09 12:24:53','2024-02-09 12:25:34'),(1,2,'Problem Statement','2','https://www.google.com','www.google.com','https://www.google.com','https://www.google.com',2,'2','2024-02-09 12:27:39','2024-02-09 12:27:49');
/*!40000 ALTER TABLE `intelsubmissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intelteamdata`
--

DROP TABLE IF EXISTS `intelteamdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intelteamdata` (
  `teamId` int NOT NULL AUTO_INCREMENT,
  `teamName` varchar(255) DEFAULT NULL,
  `platformType` char(1) NOT NULL,
  `platformId` varchar(255) NOT NULL,
  `teamStatus` char(1) NOT NULL,
  `totalMembers` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int NOT NULL,
  PRIMARY KEY (`teamId`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `intelteamdata_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `studentdata` (`studentId`),
  CONSTRAINT `intelteamdata_chk_1` CHECK (((`totalMembers` >= 3) and (`totalMembers` <= 4))),
  CONSTRAINT `intelteamdata_chk_2` CHECK ((`platformType` in (_utf8mb4'0',_utf8mb4'1',_utf8mb4'2',_utf8mb4'3')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intelteamdata`
--

LOCK TABLES `intelteamdata` WRITE;
/*!40000 ALTER TABLE `intelteamdata` DISABLE KEYS */;
INSERT INTO `intelteamdata` VALUES (1,'bottle','3','unstopId@gmail.com','2',3,'2024-02-09 12:24:47',2);
/*!40000 ALTER TABLE `intelteamdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intelteamgroupdata`
--

DROP TABLE IF EXISTS `intelteamgroupdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intelteamgroupdata` (
  `teamId` int NOT NULL,
  `studentId` int NOT NULL,
  `isLeader` char(1) NOT NULL DEFAULT '0',
  `idcId` varchar(255) NOT NULL,
  PRIMARY KEY (`teamId`,`studentId`),
  UNIQUE KEY `studentId` (`studentId`),
  CONSTRAINT `intelteamgroupdata_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `intelteamdata` (`teamId`),
  CONSTRAINT `intelteamgroupdata_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`),
  CONSTRAINT `intelteamgroupdata_chk_1` CHECK ((`isLeader` in (_utf8mb4'0',_utf8mb4'1')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intelteamgroupdata`
--

LOCK TABLES `intelteamgroupdata` WRITE;
/*!40000 ALTER TABLE `intelteamgroupdata` DISABLE KEYS */;
INSERT INTO `intelteamgroupdata` VALUES (1,1,'0','idcId2'),(1,2,'1','idcId1'),(1,3,'0','idcId3');
/*!40000 ALTER TABLE `intelteamgroupdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `managerdata`
--

DROP TABLE IF EXISTS `managerdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `managerdata` (
  `managerId` int NOT NULL AUTO_INCREMENT,
  `managerFullName` varchar(255) NOT NULL,
  `managerEmail` varchar(255) NOT NULL,
  `managerPhone` char(10) DEFAULT NULL,
  `managerPassword` varchar(255) NOT NULL,
  `managerRoleId` int NOT NULL,
  `managerAccountStatus` char(1) NOT NULL DEFAULT '1',
  `managerDepartmentId` int NOT NULL,
  `managerAddedBy` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`managerId`),
  UNIQUE KEY `managerEmail` (`managerEmail`),
  UNIQUE KEY `managerPhone` (`managerPhone`),
  KEY `managerRoleId` (`managerRoleId`),
  KEY `managerDepartmentId` (`managerDepartmentId`),
  KEY `managerAddedBy` (`managerAddedBy`),
  CONSTRAINT `managerdata_ibfk_1` FOREIGN KEY (`managerRoleId`) REFERENCES `managerrole` (`roleId`),
  CONSTRAINT `managerdata_ibfk_2` FOREIGN KEY (`managerDepartmentId`) REFERENCES `departmentdata` (`departmentId`),
  CONSTRAINT `managerdata_ibfk_3` FOREIGN KEY (`managerAddedBy`) REFERENCES `managerdata` (`managerId`),
  CONSTRAINT `managerdata_chk_1` CHECK ((`managerAccountStatus` in (_utf8mb4'0',_utf8mb4'1')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `managerdata`
--

LOCK TABLES `managerdata` WRITE;
/*!40000 ALTER TABLE `managerdata` DISABLE KEYS */;
INSERT INTO `managerdata` VALUES (1,'Admin WMD Ark','abhinavramki2@gmail.com','9595959599','5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',1,'1',6,NULL,'2024-02-09 12:24:32','2024-02-09 12:24:32'),(2,'Admin WMD Ash','ashrockzzz2003@gmail.com','9696969696','5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',1,'1',6,NULL,'2024-02-09 12:24:32','2024-02-09 12:24:32'),(3,'Hariharan','hariharan.14107@gmail.com','9545949494','5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',4,'1',6,NULL,'2024-02-09 12:24:32','2024-02-09 12:24:32');
/*!40000 ALTER TABLE `managerdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `managerloginlogs`
--

DROP TABLE IF EXISTS `managerloginlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `managerloginlogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `managerId` int NOT NULL,
  `loginTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `managerId` (`managerId`),
  CONSTRAINT `managerloginlogs_ibfk_1` FOREIGN KEY (`managerId`) REFERENCES `managerdata` (`managerId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `managerloginlogs`
--

LOCK TABLES `managerloginlogs` WRITE;
/*!40000 ALTER TABLE `managerloginlogs` DISABLE KEYS */;
INSERT INTO `managerloginlogs` VALUES (1,1,'2024-02-09 12:26:34');
/*!40000 ALTER TABLE `managerloginlogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `managerrole`
--

DROP TABLE IF EXISTS `managerrole`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `managerrole` (
  `roleId` int NOT NULL AUTO_INCREMENT,
  `roleName` varchar(255) NOT NULL,
  `isActive` char(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`roleId`),
  UNIQUE KEY `roleName` (`roleName`),
  CONSTRAINT `managerrole_chk_1` CHECK ((`isActive` in (_utf8mb4'0',_utf8mb4'1')))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `managerrole`
--

LOCK TABLES `managerrole` WRITE;
/*!40000 ALTER TABLE `managerrole` DISABLE KEYS */;
INSERT INTO `managerrole` VALUES (1,'SUPER_ADMIN','1','2024-02-09 12:24:31','2024-02-09 12:24:31'),(2,'ADMIN','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(3,'FINANCE','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(4,'DEPTARTMENT_HEAD','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(5,'EVENTIDE_ATTENDANCE_MARKER','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(6,'GLOBAL_ATTENDANCE_MARKER','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(7,'LOCAL_ATTENDANCE_MARKER','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(8,'GATE_ENTRY_EXIT_MARKER','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(9,'INTEL_ADMIN','1','2024-02-09 12:24:32','2024-02-09 12:24:32');
/*!40000 ALTER TABLE `managerrole` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `starredevents`
--

DROP TABLE IF EXISTS `starredevents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `starredevents` (
  `studentId` int NOT NULL,
  `eventId` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`studentId`,`eventId`),
  KEY `eventId` (`eventId`),
  CONSTRAINT `starredevents_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`),
  CONSTRAINT `starredevents_ibfk_2` FOREIGN KEY (`eventId`) REFERENCES `eventdata` (`eventId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `starredevents`
--

LOCK TABLES `starredevents` WRITE;
/*!40000 ALTER TABLE `starredevents` DISABLE KEYS */;
INSERT INTO `starredevents` VALUES (1,1,'2024-02-09 12:24:33');
/*!40000 ALTER TABLE `starredevents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studentdata`
--

DROP TABLE IF EXISTS `studentdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studentdata` (
  `studentId` int NOT NULL AUTO_INCREMENT,
  `studentFullName` varchar(255) NOT NULL,
  `studentEmail` varchar(255) NOT NULL,
  `studentPhone` char(10) NOT NULL,
  `studentPassword` varchar(255) NOT NULL,
  `needPassport` char(1) NOT NULL DEFAULT '1',
  `studentAccountStatus` char(1) NOT NULL DEFAULT '1',
  `studentCollegeName` varchar(255) NOT NULL,
  `studentCollegeCity` varchar(255) NOT NULL,
  `isInCampus` char(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`studentId`),
  UNIQUE KEY `studentEmail` (`studentEmail`),
  UNIQUE KEY `studentPhone` (`studentPhone`),
  CONSTRAINT `studentdata_chk_1` CHECK ((`needPassport` in (_utf8mb4'0',_utf8mb4'1'))),
  CONSTRAINT `studentdata_chk_2` CHECK ((`studentAccountStatus` in (_utf8mb4'0',_utf8mb4'1',_utf8mb4'2'))),
  CONSTRAINT `studentdata_chk_3` CHECK ((`isInCampus` in (_utf8mb4'0',_utf8mb4'1')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studentdata`
--

LOCK TABLES `studentdata` WRITE;
/*!40000 ALTER TABLE `studentdata` DISABLE KEYS */;
INSERT INTO `studentdata` VALUES (1,'Abhinav R','cb.en.u4cse21001@cb.students.amrita.edu','9595959595','4bc3446b672d30ca045eb57cd661347c27a7ca3edd80cc2fe320159800f8c856','0','2','Amrita Vishwa Vidyapeetham','Coimbatore','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(2,'Ashwin S','cb.en.u4cse21008@cb.students.amrita.edu','9695959595','5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8','0','2','Amrita Vishwa Vidyapeetham','Coimbatore','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(3,'Dharma Pravardhana V','dharmapravardhana7@gmail.com','8248847564','5c80565db6f29da0b01aa12522c37b32f121cbe47a861ef7f006cb22922dffa1','1','2','Amrita Vishwa Vidyapeetham','Coimbatore','0','2024-02-09 12:24:32','2024-02-09 12:24:32'),(4,'sajith','saisajith03@gmail.com','8993939323','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','1','1','Amrita Vishwa Vidyapeetham','Coimbatore','0','2024-02-09 12:24:32','2024-02-09 12:24:32'),(5,'Kalyan','kalyanguru18@gmail.com','8248100864','6b8c049022f412577c6f549c43d2042efe394911d6ac9142c925ef5d20a8ee5f','1','1','Amrita Vishwa Vidyapeetham','Coimbatore','0','2024-02-09 12:24:32','2024-02-09 12:24:32');
/*!40000 ALTER TABLE `studentdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studentloginlogs`
--

DROP TABLE IF EXISTS `studentloginlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studentloginlogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `loginTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `studentloginlogs_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studentloginlogs`
--

LOCK TABLES `studentloginlogs` WRITE;
/*!40000 ALTER TABLE `studentloginlogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `studentloginlogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studentregister`
--

DROP TABLE IF EXISTS `studentregister`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studentregister` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentEmail` varchar(255) NOT NULL,
  `otp` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `studentEmail` (`studentEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studentregister`
--

LOCK TABLES `studentregister` WRITE;
/*!40000 ALTER TABLE `studentregister` DISABLE KEYS */;
/*!40000 ALTER TABLE `studentregister` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tagdata`
--

DROP TABLE IF EXISTS `tagdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tagdata` (
  `tagId` int NOT NULL AUTO_INCREMENT,
  `tagName` varchar(255) NOT NULL,
  `tagAbbreviation` varchar(255) NOT NULL,
  `isActive` char(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tagId`),
  UNIQUE KEY `tagName` (`tagName`),
  UNIQUE KEY `tagAbbreviation` (`tagAbbreviation`),
  CONSTRAINT `tagdata_chk_1` CHECK ((`isActive` in (_utf8mb4'0',_utf8mb4'1')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tagdata`
--

LOCK TABLES `tagdata` WRITE;
/*!40000 ALTER TABLE `tagdata` DISABLE KEYS */;
INSERT INTO `tagdata` VALUES (1,'Featured','FT.','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(2,'Coding','COD','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(3,'Computer Science','CS','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(4,'Competitive Programming','CP','1','2024-02-09 12:24:32','2024-02-09 12:24:32'),(5,'Internet Of Things','IOT','1','2024-02-09 12:24:32','2024-02-09 12:24:32');
/*!40000 ALTER TABLE `tagdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitlogs`
--

DROP TABLE IF EXISTS `visitlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitlogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `entryTime` timestamp NULL DEFAULT NULL,
  `exitTime` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `visitlogs_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `studentdata` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitlogs`
--

LOCK TABLES `visitlogs` WRITE;
/*!40000 ALTER TABLE `visitlogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `visitlogs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-02-09 18:16:00
