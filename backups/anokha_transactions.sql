-- MySQL dump 10.13  Distrib 8.0.31, for Win64 (x86_64)
--
-- Host: localhost    Database: anokha_transactions
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
-- Table structure for table `marketplacetransactiondata`
--

DROP TABLE IF EXISTS `marketplacetransactiondata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marketplacetransactiondata` (
  `txnId` varchar(255) NOT NULL,
  `userId` int NOT NULL,
  `amount` int NOT NULL,
  `productinfo` varchar(5000) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(10) NOT NULL,
  `transactionStatus` varchar(1) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`txnId`),
  CONSTRAINT `marketplacetransactiondata_chk_1` CHECK ((`transactionStatus` in (_utf8mb4'0',_utf8mb4'1',_utf8mb4'2')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marketplacetransactiondata`
--

LOCK TABLES `marketplacetransactiondata` WRITE;
/*!40000 ALTER TABLE `marketplacetransactiondata` DISABLE KEYS */;
INSERT INTO `marketplacetransactiondata` VALUES ('simpletransactionid2',1,200,'Test Product','Abhinav R','cb.en.u4cse21001@cb.students.amrita.edu','9595959595','1','2024-02-09 12:24:31','2024-02-09 12:24:31');
/*!40000 ALTER TABLE `marketplacetransactiondata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactiondata`
--

DROP TABLE IF EXISTS `transactiondata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactiondata` (
  `txnId` varchar(255) NOT NULL,
  `userId` int NOT NULL,
  `amount` int NOT NULL,
  `productinfo` varchar(5000) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(10) NOT NULL,
  `transactionStatus` varchar(1) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`txnId`),
  CONSTRAINT `transactiondata_chk_1` CHECK ((`transactionStatus` in (_utf8mb4'0',_utf8mb4'1',_utf8mb4'2')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactiondata`
--

LOCK TABLES `transactiondata` WRITE;
/*!40000 ALTER TABLE `transactiondata` DISABLE KEYS */;
INSERT INTO `transactiondata` VALUES ('simpletransactionid',1,200,'Test Product','Abhinav R','cb.en.u4cse21001@cb.students.amrita.edu','9595959595','1','2024-02-09 12:24:31','2024-02-09 12:24:31');
/*!40000 ALTER TABLE `transactiondata` ENABLE KEYS */;
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
