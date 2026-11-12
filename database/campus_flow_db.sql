-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: campus_flow_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cf_academic_sessions`
--

DROP TABLE IF EXISTS `cf_academic_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_academic_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `session_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_year` year NOT NULL,
  `end_year` year NOT NULL,
  `eligibility_mode` enum('any_subject','previously_studied','admin_selected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin_selected',
  `max_credit_hours` int NOT NULL DEFAULT '9',
  `is_active` tinyint(1) DEFAULT '1',
  `enrollment_fee` decimal(10,2) NOT NULL DEFAULT '5000.00',
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `session_name` (`session_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_academic_sessions`
--

LOCK TABLES `cf_academic_sessions` WRITE;
/*!40000 ALTER TABLE `cf_academic_sessions` DISABLE KEYS */;
INSERT INTO `cf_academic_sessions` VALUES (1,'2022-2026',2022,2026,'any_subject',10,1,5000.00),(2,'2023-2027',2023,2027,'previously_studied',9,1,5000.00),(3,'2024-2028',2024,2028,'previously_studied',12,1,5000.00),(4,'2025-2029',2025,2029,'previously_studied',6,1,5000.00),(5,'2021-2025',2021,2025,'any_subject',3,1,5000.00),(6,'2020-2024',2020,2024,'any_subject',5,0,5000.00),(7,'2019-2023',2019,2023,'any_subject',3,0,5000.00);
/*!40000 ALTER TABLE `cf_academic_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_admins`
--

DROP TABLE IF EXISTS `cf_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `cf_admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `cf_users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_admins`
--

LOCK TABLES `cf_admins` WRITE;
/*!40000 ALTER TABLE `cf_admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `cf_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_announcements`
--

DROP TABLE IF EXISTS `cf_announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_announcements` (
  `announcement_id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int DEFAULT NULL,
  `offering_id` int DEFAULT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `target_audience` enum('students','teachers','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'both',
  PRIMARY KEY (`announcement_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `offering_id` (`offering_id`),
  CONSTRAINT `cf_announcements_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `cf_teachers` (`teacher_id`),
  CONSTRAINT `cf_announcements_ibfk_2` FOREIGN KEY (`offering_id`) REFERENCES `cf_course_offerings` (`offering_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_announcements`
--

LOCK TABLES `cf_announcements` WRITE;
/*!40000 ALTER TABLE `cf_announcements` DISABLE KEYS */;
INSERT INTO `cf_announcements` VALUES (1,NULL,NULL,'Summer Semester Enrollment Open','Dear Students and Teachers,\n\nSummer Semester enrollment is now open. Students are requested to review the available courses and complete their enrollment process before the deadline.\n\nTeachers are requested to check their assigned courses and stay updated with the semester schedule.\n\nThank you,\nCAMPUS-FLOW Administration','2026-11-09 08:00:45','both'),(2,1,1,'assignment uploaded','Dear Students,\n\nPlease be informed that the upcoming assignment must be submitted before the due date. Make sure to review all instructions carefully and upload your completed work through the assignment portal on time.\n\nLate submissions may not be accepted. If you have any questions, please contact me during class hours.\n\nThank you.','2026-11-10 06:20:22','students'),(3,1,1,'assignment 02','assignment 2 is also uploaded','2026-11-10 13:38:51','students'),(4,NULL,NULL,'Registeration data Extended','register yourself for summer','2026-11-12 10:45:14','students');
/*!40000 ALTER TABLE `cf_announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_assessments`
--

DROP TABLE IF EXISTS `cf_assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_assessments` (
  `assessment_id` int NOT NULL AUTO_INCREMENT,
  `offering_id` int NOT NULL,
  `assessment_type` enum('quiz','assignment','midterm','final') COLLATE utf8mb4_unicode_ci NOT NULL,
  `assessment_title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_marks` decimal(7,2) NOT NULL,
  `assessment_date` date NOT NULL,
  `uploaded_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assessment_id`),
  KEY `offering_id` (`offering_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `cf_assessments_ibfk_1` FOREIGN KEY (`offering_id`) REFERENCES `cf_course_offerings` (`offering_id`),
  CONSTRAINT `cf_assessments_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `cf_teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_assessments`
--

LOCK TABLES `cf_assessments` WRITE;
/*!40000 ALTER TABLE `cf_assessments` DISABLE KEYS */;
INSERT INTO `cf_assessments` VALUES (1,4,'quiz','quiz 1',10.00,'2026-11-11',2,'2026-11-11 10:12:12'),(2,6,'assignment','assignment 01',20.00,'2026-11-12',3,'2026-11-12 14:55:35');
/*!40000 ALTER TABLE `cf_assessments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_assignment_submissions`
--

DROP TABLE IF EXISTS `cf_assignment_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_assignment_submissions` (
  `submission_id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `submission_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `submission_status` enum('pending','submitted','late','reviewed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `marks` decimal(5,2) DEFAULT NULL,
  `teacher_feedback` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`submission_id`),
  UNIQUE KEY `assignment_id` (`assignment_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `cf_assignment_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `cf_assignments` (`assignment_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `cf_students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_assignment_submissions`
--

LOCK TABLES `cf_assignment_submissions` WRITE;
/*!40000 ALTER TABLE `cf_assignment_submissions` DISABLE KEYS */;
INSERT INTO `cf_assignment_submissions` VALUES (1,3,1,'uploads/submissions/1794394301653-967719.docx','2026-11-11 10:51:41','pending',NULL,NULL);
/*!40000 ALTER TABLE `cf_assignment_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_assignments`
--

DROP TABLE IF EXISTS `cf_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `offering_id` int NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `attachment_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `due_date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `teacher_id` int DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  KEY `offering_id` (`offering_id`),
  KEY `fk_assignments_teacher` (`teacher_id`),
  CONSTRAINT `cf_assignments_ibfk_1` FOREIGN KEY (`offering_id`) REFERENCES `cf_course_offerings` (`offering_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignments_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `cf_teachers` (`teacher_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_assignments`
--

LOCK TABLES `cf_assignments` WRITE;
/*!40000 ALTER TABLE `cf_assignments` DISABLE KEYS */;
INSERT INTO `cf_assignments` VALUES (1,1,'AI-assignment','python programs for EDA','uploads/assignments/1794287823735-551450382.pdf','2026-11-11 10:16:00','2026-11-10 05:17:03',1),(2,4,'ICT-Assignment 01','PowerPoint presentation','uploads/assignments/1794392057631-440114808.docx','2026-11-10 15:14:00','2026-11-11 10:14:17',2),(3,4,'Assignment 02','MS Practice','uploads/assignments/1794394252421-914490390.pdf','2026-11-13 17:50:00','2026-11-11 10:50:52',2),(4,6,'web assignment 01','Basics of html,css,js','uploads/assignments/1794495415456-233232587.pdf','2026-11-12 19:56:00','2026-11-12 14:56:55',3);
/*!40000 ALTER TABLE `cf_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_attendance`
--

DROP TABLE IF EXISTS `cf_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `enrollment_course_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `attendance_status` enum('present','absent') COLLATE utf8mb4_unicode_ci NOT NULL,
  `marked_by` int DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `enrollment_course_id` (`enrollment_course_id`,`attendance_date`),
  KEY `marked_by` (`marked_by`),
  CONSTRAINT `cf_attendance_ibfk_1` FOREIGN KEY (`enrollment_course_id`) REFERENCES `cf_enrollment_courses` (`enrollment_course_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_attendance_ibfk_2` FOREIGN KEY (`marked_by`) REFERENCES `cf_teachers` (`teacher_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_attendance`
--

LOCK TABLES `cf_attendance` WRITE;
/*!40000 ALTER TABLE `cf_attendance` DISABLE KEYS */;
INSERT INTO `cf_attendance` VALUES (1,1,'2026-11-11','present',2),(2,7,'2026-11-12','present',3);
/*!40000 ALTER TABLE `cf_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_course_offerings`
--

DROP TABLE IF EXISTS `cf_course_offerings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_course_offerings` (
  `offering_id` int NOT NULL AUTO_INCREMENT,
  `subject_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `session_id` int NOT NULL,
  `capacity` int DEFAULT '40',
  `offering_status` enum('available','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  PRIMARY KEY (`offering_id`),
  UNIQUE KEY `subject_id` (`subject_id`,`session_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `cf_course_offerings_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `cf_subjects` (`subject_id`),
  CONSTRAINT `cf_course_offerings_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `cf_teachers` (`teacher_id`),
  CONSTRAINT `cf_course_offerings_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `cf_academic_sessions` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_course_offerings`
--

LOCK TABLES `cf_course_offerings` WRITE;
/*!40000 ALTER TABLE `cf_course_offerings` DISABLE KEYS */;
INSERT INTO `cf_course_offerings` VALUES (1,5,1,2,40,'available'),(2,9,2,4,15,'available'),(3,9,2,3,15,'available'),(4,9,1,2,15,'available'),(5,2,3,3,25,'available'),(6,2,3,2,25,'available'),(7,2,3,1,25,'available');
/*!40000 ALTER TABLE `cf_course_offerings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_departments`
--

DROP TABLE IF EXISTS `cf_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_departments` (
  `department_id` int NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `department_name` (`department_name`),
  UNIQUE KEY `department_code` (`department_code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_departments`
--

LOCK TABLES `cf_departments` WRITE;
/*!40000 ALTER TABLE `cf_departments` DISABLE KEYS */;
INSERT INTO `cf_departments` VALUES (1,'Software Engineering','SE'),(2,'biotechnology','bt'),(3,'Computer system engineering','CSE'),(4,'Information Tech','IT'),(8,'Education','ED');
/*!40000 ALTER TABLE `cf_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_enrollment_courses`
--

DROP TABLE IF EXISTS `cf_enrollment_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_enrollment_courses` (
  `enrollment_course_id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int NOT NULL,
  `offering_id` int NOT NULL,
  `credit_hours_snapshot` int NOT NULL,
  PRIMARY KEY (`enrollment_course_id`),
  UNIQUE KEY `enrollment_id` (`enrollment_id`,`offering_id`),
  KEY `offering_id` (`offering_id`),
  CONSTRAINT `cf_enrollment_courses_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `cf_enrollments` (`enrollment_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_enrollment_courses_ibfk_2` FOREIGN KEY (`offering_id`) REFERENCES `cf_course_offerings` (`offering_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_enrollment_courses`
--

LOCK TABLES `cf_enrollment_courses` WRITE;
/*!40000 ALTER TABLE `cf_enrollment_courses` DISABLE KEYS */;
INSERT INTO `cf_enrollment_courses` VALUES (1,1,4,1),(6,3,1,3),(7,3,6,3);
/*!40000 ALTER TABLE `cf_enrollment_courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_enrollments`
--

DROP TABLE IF EXISTS `cf_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_enrollments` (
  `enrollment_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `application_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `application_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `total_credit_hours` int DEFAULT '0',
  PRIMARY KEY (`enrollment_id`),
  UNIQUE KEY `student_id` (`student_id`),
  CONSTRAINT `cf_enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `cf_students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_enrollments`
--

LOCK TABLES `cf_enrollments` WRITE;
/*!40000 ALTER TABLE `cf_enrollments` DISABLE KEYS */;
INSERT INTO `cf_enrollments` VALUES (1,1,'2026-11-11 07:53:52','approved',1),(3,5,'2026-11-12 11:18:23','approved',6);
/*!40000 ALTER TABLE `cf_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_notifications`
--

DROP TABLE IF EXISTS `cf_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `cf_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `cf_users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_notifications`
--

LOCK TABLES `cf_notifications` WRITE;
/*!40000 ALTER TABLE `cf_notifications` DISABLE KEYS */;
INSERT INTO `cf_notifications` VALUES (1,19,'Fee Payment Rejected','Your fee payment proof has been rejected. Reason: incoorect receipt. Please upload a new payment proof for the same application.',0,'2026-11-12 11:45:04');
/*!40000 ALTER TABLE `cf_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_payments`
--

DROP TABLE IF EXISTS `cf_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('Bank Transfer','JazzCash','EasyPaisa','Other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` date NOT NULL,
  `receipt_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `verified_by` int DEFAULT NULL,
  `verification_date` datetime DEFAULT NULL,
  `admin_remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `cf_payments_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `cf_enrollments` (`enrollment_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_payments_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `cf_admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_payments`
--

LOCK TABLES `cf_payments` WRITE;
/*!40000 ALTER TABLE `cf_payments` DISABLE KEYS */;
INSERT INTO `cf_payments` VALUES (1,1,5000.00,'1234','Bank Transfer','2026-11-11','/uploads/payment-proofs/1794383632667-812196.jpeg','approved',NULL,'2026-11-11 12:55:42',NULL,'2026-11-11 07:53:52'),(3,3,10000.00,'76543','JazzCash','2026-11-12','/uploads/payment-proofs/1794489875189-190562.jpg','approved',NULL,'2026-11-12 18:25:14',NULL,'2026-11-12 11:18:23');
/*!40000 ALTER TABLE `cf_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_session_subject_eligibility`
--

DROP TABLE IF EXISTS `cf_session_subject_eligibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_session_subject_eligibility` (
  `eligibility_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`eligibility_id`),
  UNIQUE KEY `session_id` (`session_id`,`subject_id`),
  KEY `subject_id` (`subject_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `cf_session_subject_eligibility_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `cf_academic_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_session_subject_eligibility_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `cf_subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_session_subject_eligibility_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `cf_admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_session_subject_eligibility`
--

LOCK TABLES `cf_session_subject_eligibility` WRITE;
/*!40000 ALTER TABLE `cf_session_subject_eligibility` DISABLE KEYS */;
/*!40000 ALTER TABLE `cf_session_subject_eligibility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_student_marks`
--

DROP TABLE IF EXISTS `cf_student_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_student_marks` (
  `mark_id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `enrollment_course_id` int NOT NULL,
  `obtained_marks` decimal(7,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`mark_id`),
  UNIQUE KEY `unique_student_assessment` (`assessment_id`,`enrollment_course_id`),
  KEY `enrollment_course_id` (`enrollment_course_id`),
  CONSTRAINT `cf_student_marks_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `cf_assessments` (`assessment_id`),
  CONSTRAINT `cf_student_marks_ibfk_2` FOREIGN KEY (`enrollment_course_id`) REFERENCES `cf_enrollment_courses` (`enrollment_course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_student_marks`
--

LOCK TABLES `cf_student_marks` WRITE;
/*!40000 ALTER TABLE `cf_student_marks` DISABLE KEYS */;
INSERT INTO `cf_student_marks` VALUES (1,1,1,9.00,'2026-11-11 10:12:12'),(2,2,7,16.00,'2026-11-12 14:55:35');
/*!40000 ALTER TABLE `cf_student_marks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_student_subject_history`
--

DROP TABLE IF EXISTS `cf_student_subject_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_student_subject_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `semester` int DEFAULT NULL,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completion_status` enum('completed','incomplete','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'completed',
  PRIMARY KEY (`history_id`),
  UNIQUE KEY `student_id` (`student_id`,`subject_id`,`academic_year`,`semester`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `cf_student_subject_history_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `cf_students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_student_subject_history_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `cf_subjects` (`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_student_subject_history`
--

LOCK TABLES `cf_student_subject_history` WRITE;
/*!40000 ALTER TABLE `cf_student_subject_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `cf_student_subject_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_students`
--

DROP TABLE IF EXISTS `cf_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `registration_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `father_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` int NOT NULL,
  `session_id` int NOT NULL,
  `semester` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `registration_no` (`registration_no`),
  UNIQUE KEY `email` (`email`),
  KEY `department_id` (`department_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `cf_students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `cf_users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_students_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `cf_departments` (`department_id`),
  CONSTRAINT `cf_students_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `cf_academic_sessions` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_students`
--

LOCK TABLES `cf_students` WRITE;
/*!40000 ALTER TABLE `cf_students` DISABLE KEYS */;
INSERT INTO `cf_students` VALUES (1,13,'ST-012','AQSA','ISHFAQ','aqsa@gmail.com',NULL,NULL,1,2,NULL,'2026-11-09 04:32:34'),(2,15,'ST-038','Maryam','Fatima','maryam@gmail.com',NULL,NULL,3,2,NULL,'2026-11-09 06:09:22'),(3,16,'ST-044','Iqra','Khadim','iqra@123',NULL,NULL,2,2,NULL,'2026-11-10 15:56:25'),(4,17,'ST-01','amna','amnaa','amna@gmail.com',NULL,NULL,8,1,NULL,'2026-11-11 04:40:40'),(5,19,'ST-018','Aeman','Naeem','aeman@gmail.com',NULL,NULL,3,2,NULL,'2026-11-12 11:04:04');
/*!40000 ALTER TABLE `cf_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_subjects`
--

DROP TABLE IF EXISTS `cf_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_subjects` (
  `subject_id` int NOT NULL AUTO_INCREMENT,
  `subject_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit_hours` int NOT NULL DEFAULT '3',
  `department_id` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`subject_id`),
  UNIQUE KEY `subject_code` (`subject_code`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `cf_subjects_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `cf_departments` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_subjects`
--

LOCK TABLES `cf_subjects` WRITE;
/*!40000 ALTER TABLE `cf_subjects` DISABLE KEYS */;
INSERT INTO `cf_subjects` VALUES (1,'ST','Software Testing',3,1,'Software testing concepts and techniques',1,'2026-11-06 13:01:12'),(2,'WE','Web Engineering',3,1,'Web development and engineering',1,'2026-11-06 13:01:12'),(3,'AI','Artificial Intelligence',3,1,'Fundamentals of Artificial Intelligence',1,'2026-11-06 13:01:12'),(4,'SCD','Software Construction and Development',3,1,'Software construction and development',1,'2026-11-06 13:01:12'),(5,'PF','Programming Fundamentals',3,1,'Basic programming concepts',1,'2026-11-06 13:01:12'),(6,'OOP','Object-Oriented Programming',3,1,'Object-oriented programming concepts',1,'2026-11-06 13:01:12'),(7,'SE-PF','Programming Fundamentals',3,3,NULL,1,'2026-11-09 05:15:38'),(8,'EXP','Expository Writing',2,2,NULL,1,'2026-11-11 04:55:20'),(9,'ICT','Information and Communication Technology',1,4,NULL,1,'2026-11-11 04:56:05'),(10,'OOP-02','OOP',2,4,NULL,1,'2026-11-12 11:11:16');
/*!40000 ALTER TABLE `cf_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_system_settings`
--

DROP TABLE IF EXISTS `cf_system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_system_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_system_settings`
--

LOCK TABLES `cf_system_settings` WRITE;
/*!40000 ALTER TABLE `cf_system_settings` DISABLE KEYS */;
INSERT INTO `cf_system_settings` VALUES (1,'fee_per_subject','5000','2026-11-06 13:01:12'),(2,'maximum_credit_hours','9','2026-11-06 13:01:12');
/*!40000 ALTER TABLE `cf_system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_teacher_session_status`
--

DROP TABLE IF EXISTS `cf_teacher_session_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_teacher_session_status` (
  `teacher_id` int NOT NULL,
  `session_id` int NOT NULL,
  `account_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  PRIMARY KEY (`teacher_id`,`session_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `cf_teacher_session_status_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `cf_teachers` (`teacher_id`),
  CONSTRAINT `cf_teacher_session_status_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `cf_academic_sessions` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_teacher_session_status`
--

LOCK TABLES `cf_teacher_session_status` WRITE;
/*!40000 ALTER TABLE `cf_teacher_session_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `cf_teacher_session_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_teachers`
--

DROP TABLE IF EXISTS `cf_teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_teachers` (
  `teacher_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `teacher_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` int NOT NULL,
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `teacher_code` (`teacher_code`),
  UNIQUE KEY `email` (`email`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `cf_teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `cf_users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `cf_teachers_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `cf_departments` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_teachers`
--

LOCK TABLES `cf_teachers` WRITE;
/*!40000 ALTER TABLE `cf_teachers` DISABLE KEYS */;
INSERT INTO `cf_teachers` VALUES (1,14,'TC-013','Dr Anum','anum@gmail.com',NULL,1),(2,18,'TC-014','Engr Sehrish','sehrish@gmail.com',NULL,4),(3,20,'TC-020','Sami Ullah','samilah@gmail.com',NULL,3);
/*!40000 ALTER TABLE `cf_teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_timetable`
--

DROP TABLE IF EXISTS `cf_timetable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_timetable` (
  `timetable_id` int NOT NULL AUTO_INCREMENT,
  `offering_id` int NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`timetable_id`),
  KEY `offering_id` (`offering_id`),
  CONSTRAINT `cf_timetable_ibfk_1` FOREIGN KEY (`offering_id`) REFERENCES `cf_course_offerings` (`offering_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_timetable`
--

LOCK TABLES `cf_timetable` WRITE;
/*!40000 ALTER TABLE `cf_timetable` DISABLE KEYS */;
INSERT INTO `cf_timetable` VALUES (1,1,'Tuesday','13:40:00','15:40:00','LT-02'),(2,7,'Monday','14:15:00','17:15:00','LT-02');
/*!40000 ALTER TABLE `cf_timetable` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cf_users`
--

DROP TABLE IF EXISTS `cf_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cf_users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `login_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','teacher','student') COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `login_id` (`login_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cf_users`
--

LOCK TABLES `cf_users` WRITE;
/*!40000 ALTER TABLE `cf_users` DISABLE KEYS */;
INSERT INTO `cf_users` VALUES (1,'ADMIN001','$2b$10$et6R2tXVcOnBeVsb441jX./iSBaGayMlhh4Bx9YTyc3czmAfTUrlW','admin','active','2026-11-07 06:11:13'),(2,'TEA001','$2b$10$V2q2UbaudaSsqDJZi4ao8ec2KPt8B4FvH9Q7LddJ4epm1/1fDwp1S','teacher','active','2026-11-07 06:11:14'),(3,'TEA002','$2b$10$xX3coJeYQu4JfRX1LZ/aiODRlzgDTITGFfQK9KmHzgxNWJ0CwpsaO','teacher','active','2026-11-07 06:11:14'),(4,'TEA003','$2b$10$pXiXE8DHOz7UJvUoJkD7KeqoMsAqX9ZTbamzIPkwsEhRhj2Nv/0qe','teacher','active','2026-11-07 06:11:14'),(5,'TEA004','$2b$10$EKyflhdrPD1ZzpXHn3wGKOA8anCuMP0Vj06Gqh2yvXOTBVctRpOq.','teacher','active','2026-11-07 06:11:14'),(6,'STU001','$2b$10$tbXAJqDOSfNsM07Px45Z9Ol7Xd63fFxS8vraR7rX/4SHzvvSoAagm','student','active','2026-11-07 06:11:14'),(7,'STU002','$2b$10$awm7HWzgUlXQNpM4qLWkheA9GWFbQbsKAPweajkEQ3DrX8ahugF/G','student','active','2026-11-07 06:11:14'),(8,'STU003','$2b$10$0Ck8Jd00kl76ndPGdYDuUeZjI4v307Z72glrrYxjXuSalA.DU8ib.','student','active','2026-11-07 06:11:14'),(9,'STU004','$2b$10$9dpylo1G3GfnIaSEL1zelejUkAg7yy7FMAFPekbM2SNSiaB8Qgfg.','student','active','2026-11-07 06:11:14'),(10,'STU005','$2b$10$nXzFuJ3MbcZbXU9WoSRVEOwxZl5FInl7yi9ckQQ74hr6aVTclbqd6','student','active','2026-11-07 06:11:15'),(11,'STU006','$2b$10$OUc2k.9ME9hW29yv/wAyceiab8lz2Mki4TIyGamCrUQQNb9toRGjK','student','active','2026-11-07 06:11:15'),(12,'STU007','$2b$10$UnUjN25lk.GQb.QSS1I4neeouwPaQayFclgUKm6s7mBXtAcI2c3lK','student','active','2026-11-07 06:11:15'),(13,'ST-012','$2b$10$uGJ.mflmZv/uNMI/afhb8eswXB.iTckbbGl99QVJOq6Np5bRRzwhy','student','inactive','2026-11-09 04:32:34'),(14,'TC-013','$2b$10$GVyORuDKFoWQGst7RD91kevlknMegIQOuiH6EuiauXOUNLI0vVxWO','teacher','active','2026-11-09 04:46:18'),(15,'ST-038','$2b$10$wyDbEiXHEhQSAwUoZOBht.bG/kTpFeC.B1S6H/OvquZ.d.LUXzIFm','student','active','2026-11-09 06:09:22'),(16,'ST-044','$2b$10$Ubq22p0RonFLjIg5qr2zy.E5A97j9o.0HIlGFI8eNSVPRED36RaJm','student','active','2026-11-10 15:56:25'),(17,'ST-01','$2b$10$WiY1Y1w9uc5sL8dLfYwo.ezEPhc68DQKRfO06jHwlJjpjAQDVa.ci','student','inactive','2026-11-11 04:40:40'),(18,'TC-014','$2b$10$jY9BHKpNss5iS6iCVNlMaeofZ9HZxJPl57wmAya5XOWU6/NgVRsLu','teacher','active','2026-11-11 05:02:08'),(19,'ST-018','$2b$10$sgTUX4NhNpIqPf4lubNl2.gSsMKu6zB3AvOaTF4s8sGiVDRlJVMT2','student','active','2026-11-12 11:04:04'),(20,'TC-020','$2b$10$jruAbtOQvNeGOyC4jrQSQurv99Uym25OAcJ0taKfhod2hw4Ncty/2','teacher','active','2026-11-12 11:08:09');
/*!40000 ALTER TABLE `cf_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-12 20:39:00
