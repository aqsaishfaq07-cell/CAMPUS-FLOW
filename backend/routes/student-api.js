
const express = require("express");
const router = express.Router();
console.log("STUDENT API ROUTE FILE LOADED");
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// =====================================
// STUDENT ASSIGNMENT SUBMISSION UPLOAD
// =====================================

const submissionFolder = path.join(
    __dirname,
    "../../uploads/submissions"
);

if (!fs.existsSync(submissionFolder)) {
    fs.mkdirSync(submissionFolder, { recursive: true });
}

const submissionStorage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, submissionFolder);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" +
            Math.round(Math.random() * 1000000) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

const submissionUpload = multer({

    storage: submissionStorage,

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "image/jpeg",
            "image/png"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF, Word, PowerPoint and image files are allowed."));
        }

    }

});

// =====================================
// STUDENT ASSIGNMENT SUBMISSION
// =====================================

router.post(
    "/assignments/:id/submit",
    submissionUpload.single("submission"),
    async (req, res) => {

        let newFilePath = null;

        try {

            if (!req.session.user || req.session.user.role !== "student") {
                if (req.file) fs.unlinkSync(req.file.path);

                return res.status(401).json({
                    success: false,
                    message: "Unauthorized access"
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please select an assignment file."
                });
            }

            newFilePath = "uploads/submissions/" + req.file.filename;

            const userId = req.session.user.user_id;
            const assignmentId = req.params.id;

            // CHECK STUDENT ENROLLMENT AND DEADLINE
            const [records] = await db.promise().execute(
                `SELECT
                    st.student_id,
                    a.due_date,
                    (NOW() <= a.due_date) AS submission_open,
                    aps.submission_id,
                    aps.submission_path

                FROM cf_students st

                JOIN cf_enrollments e
                    ON st.student_id = e.student_id

                JOIN cf_enrollment_courses ec
                    ON e.enrollment_id = ec.enrollment_id

                JOIN cf_assignments a
                    ON ec.offering_id = a.offering_id

                LEFT JOIN cf_assignment_submissions aps
                    ON aps.assignment_id = a.assignment_id
                    AND aps.student_id = st.student_id

                WHERE st.user_id = ?
                AND e.application_status = 'approved'
                AND a.assignment_id = ?

                ORDER BY aps.submission_id DESC
                LIMIT 1`,
                [userId, assignmentId]
            );

            if (records.length === 0) {

                fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    success: false,
                    message: "Assignment not found for your enrolled courses."
                });
            }

            const record = records[0];

            // DEADLINE CHECK
            if (!record.submission_open) {

                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    success: false,
                    message: "Submission deadline has passed. Portal is closed."
                });
            }

            // REPLACE EXISTING SUBMISSION
            if (record.submission_id) {

                await db.promise().execute(
                    `UPDATE cf_assignment_submissions
                    SET submission_path = ?,
                        submitted_at = NOW(),
                        submission_status = 'pending',
                        marks = NULL
                    WHERE submission_id = ?`,
                    [newFilePath, record.submission_id]
                );

                // DELETE OLD FILE
                if (record.submission_path) {

                    const oldFilePath = path.join(
                        __dirname,
                        "../../",
                        record.submission_path
                    );

                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }

            } else {

                // FIRST SUBMISSION
                await db.promise().execute(
                    `INSERT INTO cf_assignment_submissions
                    (assignment_id, student_id, submission_path, submitted_at, submission_status)
                    VALUES (?, ?, ?, NOW(), 'pending')`,
                    [
                        assignmentId,
                        record.student_id,
                        newFilePath
                    ]
                );

            }

            res.json({
                success: true,
                message: "Assignment submitted successfully."
            });

        } catch (error) {

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            console.error("Assignment Submission Error:", error);

            res.status(500).json({
                success: false,
                message: "Failed to submit assignment."
            });

        }

    }
);


// STUDENT OVERVIEW

router.get("/overview", async (req, res) => {

    try {

        // CHECK LOGIN SESSION
        if (!req.session.user || req.session.user.role !== "student") {
            return res.status(401).json({
                message: "Unauthorized access"
            });
        }

        const userId = req.session.user.user_id;

        // GET STUDENT INFORMATION
        const [rows] = await db.promise().execute(
            `SELECT
                s.student_id,
                s.registration_no,
                s.full_name,
                s.semester,
                d.department_name,
                a.session_name,
               a.max_credit_hours,
e.enrollment_id,
e.application_status,
p.payment_id,
p.payment_status,
p.admin_remarks
            FROM cf_students s
            JOIN cf_departments d
                ON s.department_id = d.department_id
            JOIN cf_academic_sessions a
                ON s.session_id = a.session_id
            LEFT JOIN cf_enrollments e
                ON s.student_id = e.student_id
            LEFT JOIN cf_payments p
                ON e.enrollment_id = p.enrollment_id
            WHERE s.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Student record not found"
            });
        }

        const student = rows[0];

        // GET ENROLLMENT STATISTICS
        const [stats] = await db.promise().execute(
            `SELECT
                COUNT(ec.enrollment_course_id) AS enrolled_subjects,
                COALESCE(SUM(ec.credit_hours_snapshot), 0) AS credit_hours
            FROM cf_enrollments e
            LEFT JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id
            WHERE e.student_id = ?
            AND e.application_status = 'approved'`,
            [student.student_id]
        );

        // GET STUDENT ASSIGNMENTS COUNT
        const [assignmentStats] = await db.promise().execute(
            `SELECT
                COUNT(DISTINCT a.assignment_id) AS assignment_count
            FROM cf_students st
            JOIN cf_enrollments e
                ON st.student_id = e.student_id
            JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id
            JOIN cf_assignments a
                ON ec.offering_id = a.offering_id
            WHERE st.user_id = ?
            AND e.application_status = 'approved'`,
            [userId]
        );

        // GET UNREAD NOTIFICATIONS COUNT
        const [notificationStats] = await db.promise().execute(
            `SELECT
                COUNT(*) AS unread_notifications
            FROM cf_notifications
            WHERE user_id = ?
            AND is_read = 0`,
            [userId]
        );

        // ADD COUNTS TO STATISTICS
        stats[0].assignment_count =
            assignmentStats[0].assignment_count;

        stats[0].unread_notifications =
            notificationStats[0].unread_notifications;

        // SEND RESPONSE
        res.json({
            success: true,
            student: student,
            stats: stats[0]
        });

    } catch (error) {

        console.error("Student Overview Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// GET SESSION-WISE AVAILABLE COURSES
router.get("/courses", async (req, res) => {
    try {
        // Check student login
        if (!req.session.user || req.session.user.role !== "student") {
            return res.status(401).json({
                message: "Unauthorized access"
            });
        }

        const userId = req.session.user.user_id;

        // Get student's academic session
        const [studentRows] = await db.promise().execute(
            `SELECT
                s.student_id,
                s.session_id,
                a.session_name,
                a.eligibility_mode,
                a.max_credit_hours
            FROM cf_students s
            JOIN cf_academic_sessions a
                ON s.session_id = a.session_id
            WHERE s.user_id = ?`,
            [userId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                message: "Student record not found"
            });
        }

        const student = studentRows[0];
// GET EXISTING ENROLLMENT
const [existingRows] = await db.promise().execute(
    `SELECT
        e.enrollment_id,
        e.application_status,
        p.payment_status,
        p.admin_remarks
     FROM cf_enrollments e
     LEFT JOIN cf_payments p
        ON e.enrollment_id = p.enrollment_id
     WHERE e.student_id = ?
     LIMIT 1`,
    [student.student_id]
);

const existingEnrollment = existingRows[0] || null;

let selectedOfferingIds = [];

if (existingEnrollment) {
    const [savedCourses] = await db.promise().execute(
        `SELECT offering_id
         FROM cf_enrollment_courses
         WHERE enrollment_id = ?`,
        [existingEnrollment.enrollment_id]
    );

    selectedOfferingIds = savedCourses.map(course =>
        Number(course.offering_id)
    );
}
        // Get courses offered for this student's session only
        const [courses] = await db.promise().execute(
            `SELECT
                co.offering_id,
                s.subject_id,
                s.subject_code,
                s.subject_name,
                s.credit_hours,
                s.description,
                t.teacher_id,
                t.full_name AS teacher_name
            FROM cf_course_offerings co
            JOIN cf_subjects s
                ON co.subject_id = s.subject_id
            LEFT JOIN cf_teachers t
                ON co.teacher_id = t.teacher_id
            WHERE co.session_id = ?
            AND co.offering_status = 'available'
            AND s.is_active = 1
            ORDER BY s.subject_name`,
            [student.session_id]
        );

      res.json({
    success: true,
    session: student.session_name,
    eligibility_mode: student.eligibility_mode,
    max_credit_hours: student.max_credit_hours,
    courses: courses,
    enrollment: existingEnrollment,
    selected_offering_ids: selectedOfferingIds,enrollment: existingEnrollment,
selected_offering_ids: selectedOfferingIds
});

    } catch (error) {
        console.error("Student Courses Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// GET STUDENT ENROLLED COURSES
router.get("/my-courses", async (req, res) => {

    try {

        // Check student login
        if (!req.session.user || req.session.user.role !== "student") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const userId = req.session.user.user_id;

        // Get approved student's enrolled courses
        const [courses] = await db.promise().execute(
            `SELECT
                ec.enrollment_course_id,
                co.offering_id,
                s.subject_code,
                s.subject_name,
                ec.credit_hours_snapshot AS credit_hours,
                t.full_name AS teacher_name
            FROM cf_students st
            JOIN cf_enrollments e
                ON st.student_id = e.student_id
            JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id
            JOIN cf_course_offerings co
                ON ec.offering_id = co.offering_id
            JOIN cf_subjects s
                ON co.subject_id = s.subject_id
            LEFT JOIN cf_teachers t
                ON co.teacher_id = t.teacher_id
            WHERE st.user_id = ?
            AND e.application_status = 'approved'
            ORDER BY s.subject_name`,
            [userId]
        );

        res.json({
            success: true,
            courses: courses
        });

    } catch (error) {

        console.error("My Courses Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load enrolled courses."
        });
    }
});

 // GET STUDENT ATTENDANCE
router.get("/attendance", async (req, res) => {

    try {

        // Check student login
        if (!req.session.user || req.session.user.role !== "student") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const userId = req.session.user.user_id;

        // Get attendance for each approved enrolled course
        const [attendance] = await db.promise().execute(
            `SELECT
                ec.enrollment_course_id,
                s.subject_code,
                s.subject_name,
                COUNT(a.attendance_id) AS total_classes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.attendance_status = 'present' THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS present_classes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.attendance_status = 'absent' THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS absent_classes,

                CASE
                    WHEN COUNT(a.attendance_id) = 0 THEN 0
                    ELSE ROUND(
                        SUM(
                            CASE
                                WHEN a.attendance_status = 'present' THEN 1
                                ELSE 0
                            END
                        ) * 100.0 / COUNT(a.attendance_id),
                        2
                    )
                END AS attendance_percentage

            FROM cf_students st

            JOIN cf_enrollments e
                ON st.student_id = e.student_id

            JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id

            JOIN cf_course_offerings co
                ON ec.offering_id = co.offering_id

            JOIN cf_subjects s
                ON co.subject_id = s.subject_id

            LEFT JOIN cf_attendance a
                ON ec.enrollment_course_id = a.enrollment_course_id

            WHERE st.user_id = ?
            AND e.application_status = 'approved'

            GROUP BY
                ec.enrollment_course_id,
                s.subject_code,
                s.subject_name

            ORDER BY s.subject_name`,
            [userId]
        );

        res.json({
            success: true,
            attendance: attendance
        });

    } catch (error) {

        console.error("Student Attendance Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load attendance."
        });
    }
});


// =====================================
// GET STUDENT ASSIGNMENTS
// =====================================

router.get("/assignments", async (req, res) => {

    if (!req.session.user || req.session.user.role !== "student") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    try {

        const userId = req.session.user.user_id;

        const [assignments] = await db.promise().execute(
            `SELECT
                a.assignment_id,
                a.title,
                a.description,
                a.attachment_path,
                a.due_date,
                a.created_at,

                sub.subject_code,
                sub.subject_name,
                t.full_name AS teacher_name,

                aps.submission_id,
                aps.submission_path,
                aps.submitted_at,
                aps.submission_status,
                aps.marks

            FROM cf_students st

            JOIN cf_enrollments e
                ON st.student_id = e.student_id

            JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id

            JOIN cf_course_offerings co
                ON ec.offering_id = co.offering_id

            JOIN cf_assignments a
                ON co.offering_id = a.offering_id

            JOIN cf_subjects sub
                ON co.subject_id = sub.subject_id

            JOIN cf_teachers t
                ON co.teacher_id = t.teacher_id

            LEFT JOIN cf_assignment_submissions aps
                ON aps.assignment_id = a.assignment_id
                AND aps.student_id = st.student_id

            WHERE st.user_id = ?
            AND e.application_status = 'approved'

            ORDER BY a.due_date ASC`,
            [userId]
        );

        res.json({
            success: true,
            assignments: assignments
        });

    } catch (error) {

        console.error("Student Assignments Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load assignments."
        });

    }

});

// 

// =====================================
// GET STUDENT MARKS
// =====================================

router.get("/marks", async (req, res) => {

    if (!req.session.user || req.session.user.role !== "student") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    try {

        const userId = req.session.user.user_id;

        // GET ALL APPROVED ENROLLED SUBJECTS
        const [subjects] = await db.promise().execute(
            `SELECT DISTINCT
                sub.subject_code,
                sub.subject_name

            FROM cf_students st

            JOIN cf_enrollments e
                ON st.student_id = e.student_id

            JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id

            JOIN cf_course_offerings co
                ON ec.offering_id = co.offering_id

            JOIN cf_subjects sub
                ON co.subject_id = sub.subject_id

            WHERE st.user_id = ?
            AND e.application_status = 'approved'

            ORDER BY sub.subject_name`,
            [userId]
        );

        // GET ASSESSMENT MARKS
        const [marks] = await db.promise().execute(
            `SELECT
                a.assessment_id,
                a.assessment_type,
                a.assessment_title,
                a.total_marks,
                a.assessment_date,

                sub.subject_code,
                sub.subject_name,

                sm.obtained_marks

            FROM cf_students st

            JOIN cf_enrollments e
                ON st.student_id = e.student_id

            JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id

            JOIN cf_course_offerings co
                ON ec.offering_id = co.offering_id

            JOIN cf_subjects sub
                ON co.subject_id = sub.subject_id

            JOIN cf_assessments a
                ON a.offering_id = co.offering_id

            LEFT JOIN cf_student_marks sm
                ON sm.assessment_id = a.assessment_id
                AND sm.enrollment_course_id = ec.enrollment_course_id

            WHERE st.user_id = ?
            AND e.application_status = 'approved'

            ORDER BY a.assessment_date DESC, a.assessment_id DESC`,

            [userId]
        );

        res.json({
            success: true,
            subjects: subjects,
            marks: marks
        });

    } catch (error) {

        console.error("Student Marks Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load student marks."
        });

    }

});


// =====================================
// GET STUDENT ANNOUNCEMENTS
// =====================================

router.get("/announcements", async (req, res) => {

    if (!req.session.user || req.session.user.role !== "student") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    try {

        const userId = req.session.user.user_id;

        const [announcements] = await db.promise().execute(
            `SELECT DISTINCT
                an.announcement_id,
                an.title,
                an.message,
                an.created_at,
                an.target_audience,
                an.teacher_id,
                sub.subject_code,
                sub.subject_name

            FROM cf_students st

            LEFT JOIN cf_enrollments e
                ON st.student_id = e.student_id
                AND e.application_status = 'approved'

            LEFT JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id

            LEFT JOIN cf_course_offerings co
                ON ec.offering_id = co.offering_id

            LEFT JOIN cf_subjects sub
                ON co.subject_id = sub.subject_id

            JOIN cf_announcements an
                ON (
                    (
                        an.teacher_id IS NULL
                        AND an.target_audience IN ('students', 'both')
                    )
                    OR
                    (
                        an.teacher_id IS NOT NULL
                        AND an.offering_id = co.offering_id
                    )
                )

            WHERE st.user_id = ?

            ORDER BY an.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            announcements
        });

    } catch (error) {

        console.error("Student Announcements Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load announcements."
        });

    }

});

// PAYMENT PROOF UPLOAD
const uploadFolder = path.join(__dirname, "../../uploads/payment-proofs");

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },

    filename: (req, file, cb) => {
        const fileName = Date.now() + "-" +
            Math.round(Math.random() * 1000000) +
            path.extname(file.originalname);

        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "application/pdf"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG and PDF files are allowed."));
        }
    }
});

// SUBMIT ENROLLMENT AND PAYMENT PROOF
router.post("/submit-enrollment", upload.single("proof"), async (req, res) => {

    if (!req.session.user || req.session.user.role !== "student") {
        if (req.file) fs.unlinkSync(req.file.path);

        return res.status(401).json({
            success: false,
            message: "Please login as a student."
        });
    }

    const pool = db.promise();
let connection;

    try {
        const userId = req.session.user.user_id;

        const {
            transactionId,
            paymentDate,
            paymentMethod,
            offering_ids
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload payment proof."
            });
        }

        if (!transactionId || !paymentDate || !paymentMethod || !offering_ids) {
            throw new Error("Please fill all payment details.");
        }

        const offeringIds = JSON.parse(offering_ids);

        if (!Array.isArray(offeringIds) || offeringIds.length === 0) {
            throw new Error("Please select at least one course.");
        }

        const uniqueIds = [...new Set(offeringIds.map(Number))];

        if (
            uniqueIds.length !== offeringIds.length ||
            uniqueIds.some(id => !Number.isInteger(id) || id <= 0)
        ) {
            throw new Error("Invalid course selection.");
        }

        const validMethods = [
            "Bank Transfer",
            "JazzCash",
            "EasyPaisa",
            "Other"
        ];

        if (!validMethods.includes(paymentMethod)) {
            throw new Error("Invalid payment method.");
        }
connection = await pool.getConnection();
await connection.beginTransaction();

        // GET STUDENT AND SESSION DETAILS
        const [students] = await connection.query(
           `SELECT s.student_id, s.session_id,
        a.max_credit_hours, a.is_active
 FROM cf_students s
 JOIN cf_academic_sessions a
 ON s.session_id = a.session_id
 WHERE s.user_id = ?`,
            [userId]
        );

        if (students.length === 0) {
            throw new Error("Student record not found.");
        }

        const student = students[0];
        // CHECK ACADEMIC SESSION STATUS
if (Number(student.is_active) !== 1) {
    throw new Error(
        "Your academic session is inactive. New enrollment is not allowed."
    );
}

        // VALIDATE SELECTED COURSES
        const placeholders = uniqueIds.map(() => "?").join(",");

        const [courses] = await connection.query(
            `SELECT o.offering_id, s.credit_hours
             FROM cf_course_offerings o
             JOIN cf_subjects s ON o.subject_id = s.subject_id
             WHERE o.offering_id IN (${placeholders})
             AND o.session_id = ?
             AND o.offering_status = 'available'
             AND s.is_active = 1`,
            [...uniqueIds, student.session_id]
        );

        if (courses.length !== uniqueIds.length) {
            throw new Error("Some selected courses are no longer available.");
        }

        const totalCredits = courses.reduce(
            (total, course) => total + Number(course.credit_hours),
            0
        );

        if (totalCredits > student.max_credit_hours) {
            throw new Error(
                `Your credit limit is ${student.max_credit_hours} hours.`
            );
        }

        const totalAmount = uniqueIds.length * 5000;
        const receiptPath = "/uploads/payment-proofs/" + req.file.filename;

        // CHECK EXISTING ENROLLMENT
        const [enrollments] = await connection.query(
            `SELECT enrollment_id, application_status
             FROM cf_enrollments
             WHERE student_id = ?
             FOR UPDATE`,
            [student.student_id]
        );

        let enrollmentId;
        let existingPayment = null;

        if (enrollments.length > 0) {

            enrollmentId = enrollments[0].enrollment_id;

            const [payments] = await connection.query(
                `SELECT payment_id, payment_status
                 FROM cf_payments
                 WHERE enrollment_id = ?
                 ORDER BY payment_id DESC
                 LIMIT 1`,
                [enrollmentId]
            );

            existingPayment = payments[0];

            if (
                existingPayment &&
                existingPayment.payment_status !== "rejected"
            ) {
                throw new Error(
                    "Your enrollment is already submitted or approved."
                );
            }

            if (!existingPayment) {
                throw new Error("An enrollment already exists for this student.");
            }

            // REPLACE PREVIOUS SELECTED COURSES
            await connection.query(
                "DELETE FROM cf_enrollment_courses WHERE enrollment_id = ?",
                [enrollmentId]
            );

            await connection.query(
                `UPDATE cf_enrollments
                 SET total_credit_hours = ?, application_status = 'pending'
                 WHERE enrollment_id = ?`,
                [totalCredits, enrollmentId]
            );

        } else {

            const [result] = await connection.query(
                `INSERT INTO cf_enrollments
                 (student_id, total_credit_hours, application_status)
                 VALUES (?, ?, 'pending')`,
                [student.student_id, totalCredits]
            );

            enrollmentId = result.insertId;
        }

        // SAVE SELECTED COURSES
        for (const course of courses) {
            await connection.query(
                `INSERT INTO cf_enrollment_courses
                 (enrollment_id, offering_id, credit_hours_snapshot)
                 VALUES (?, ?, ?)`,
                [
                    enrollmentId,
                    course.offering_id,
                    course.credit_hours
                ]
            );
        }

        // SAVE OR REPLACE PAYMENT
        if (existingPayment) {

            await connection.query(
                `UPDATE cf_payments
                 SET amount = ?,
                     transaction_id = ?,
                     payment_method = ?,
                     payment_date = ?,
                     receipt_path = ?,
                     payment_status = 'pending',
                     verified_by = NULL,
                     verification_date = NULL,
                     admin_remarks = NULL
                 WHERE payment_id = ?`,
                [
                    totalAmount,
                    transactionId,
                    paymentMethod,
                    paymentDate,
                    receiptPath,
                    existingPayment.payment_id
                ]
            );

        } else {

            await connection.query(
                `INSERT INTO cf_payments
                 (enrollment_id, amount, transaction_id,
                  payment_method, payment_date, receipt_path,
                  payment_status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    enrollmentId,
                    totalAmount,
                    transactionId,
                    paymentMethod,
                    paymentDate,
                    receiptPath
                ]
            );
        }

        await connection.commit();
connection.release();

        res.json({
            success: true,
            message: "Enrollment and payment proof submitted successfully. Waiting for admin verification.",
            enrollment_id: enrollmentId
        });

    } catch (error) {

    if (connection) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error("Rollback Error:", rollbackError);
        }

        connection.release();
    }

    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    console.error("Enrollment Submission Error:", error);

    res.status(400).json({
        success: false,
        message: error.message || "Enrollment submission failed."
    });
}
});


// =====================================
// DELETE STUDENT ASSIGNMENT SUBMISSION
// =====================================

router.delete("/assignments/:id/submission", async (req, res) => {

    if (!req.session.user || req.session.user.role !== "student") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    try {

        const userId = req.session.user.user_id;
        const assignmentId = req.params.id;

        const [records] = await db.promise().execute(
            `SELECT
                aps.submission_id,
                aps.submission_path,
                a.due_date,
                (NOW() <= a.due_date) AS submission_open

            FROM cf_students st

            JOIN cf_enrollments e
                ON st.student_id = e.student_id

            JOIN cf_enrollment_courses ec
                ON e.enrollment_id = ec.enrollment_id

            JOIN cf_assignments a
                ON ec.offering_id = a.offering_id

            JOIN cf_assignment_submissions aps
                ON aps.assignment_id = a.assignment_id
                AND aps.student_id = st.student_id

            WHERE st.user_id = ?
            AND e.application_status = 'approved'
            AND a.assignment_id = ?

            LIMIT 1`,
            [userId, assignmentId]
        );

        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Submission not found."
            });
        }

        const record = records[0];

        if (!record.submission_open) {
            return res.status(400).json({
                success: false,
                message: "Deadline has passed. You cannot delete your submission."
            });
        }

        await db.promise().execute(
            `DELETE FROM cf_assignment_submissions
             WHERE submission_id = ?`,
            [record.submission_id]
        );

        if (record.submission_path) {

            const oldFilePath = path.join(
                __dirname,
                "../../",
                record.submission_path
            );

            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        res.json({
            success: true,
            message: "Your submission has been deleted successfully."
        });

    } catch (error) {

        console.error("Delete Submission Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete submission."
        });

    }

});


module.exports = router;
