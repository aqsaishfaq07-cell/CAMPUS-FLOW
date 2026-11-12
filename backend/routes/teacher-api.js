
const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// =====================================
// ASSIGNMENT FILE UPLOAD CONFIGURATION
// =====================================

const uploadDirectory = path.join(
    __dirname,
    "../../uploads/assignments"
);

// Create folder automatically if it does not exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9) + extension;

        cb(null, uniqueName);
    }

});

const upload = multer({

    storage: storage,

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedExtensions = [".pdf", ".doc", ".docx"];

        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            return cb(new Error("Only PDF, DOC and DOCX files are allowed."));
        }

        cb(null, true);
    }

});

// TEACHER OVERVIEW
router.get("/overview", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            t.teacher_id,
            t.teacher_code,
            t.full_name,
            d.department_name,

            (
                SELECT COUNT(*)
                FROM cf_course_offerings co
                WHERE co.teacher_id = t.teacher_id
            ) AS totalCourses,

            (
                SELECT COUNT(DISTINCT e.student_id)
                FROM cf_enrollments e
                JOIN cf_enrollment_courses ec
                    ON e.enrollment_id = ec.enrollment_id
                JOIN cf_course_offerings co
                    ON ec.offering_id = co.offering_id
                WHERE co.teacher_id = t.teacher_id
                AND e.application_status = 'approved'
            ) AS totalStudents,

            (
                SELECT COUNT(*)
                FROM cf_assignments a
                JOIN cf_course_offerings co
                    ON a.offering_id = co.offering_id
                WHERE co.teacher_id = t.teacher_id
            ) AS totalAssignments,

            (
                SELECT COUNT(*)
                FROM cf_attendance att
                JOIN cf_enrollment_courses ec
                    ON att.enrollment_course_id = ec.enrollment_course_id
                JOIN cf_course_offerings co
                    ON ec.offering_id = co.offering_id
                WHERE co.teacher_id = t.teacher_id
            ) AS totalAttendance

        FROM cf_teachers t
        LEFT JOIN cf_departments d
            ON t.department_id = d.department_id
        WHERE t.user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Teacher Overview Error:", err);

            return res.status(500).json({
                message: "Failed to load teacher overview"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Teacher record not found"
            });
        }

        res.json({
            success: true,
            teacher: results[0],
            stats: {
                totalCourses: results[0].totalCourses,
                totalStudents: results[0].totalStudents,
                totalAssignments: results[0].totalAssignments,
                totalAttendance: results[0].totalAttendance
            }
        });

    });

});


// =====================================
// GET TEACHER ASSIGNED COURSES
// =====================================

router.get("/courses", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            co.offering_id,
            co.offering_status,
            co.capacity,
            s.subject_code,
            s.subject_name,
            s.credit_hours,
            ac.session_name,
            ac.start_year,
            ac.end_year

        FROM cf_teachers t

        JOIN cf_course_offerings co
            ON t.teacher_id = co.teacher_id

        JOIN cf_subjects s
            ON co.subject_id = s.subject_id

        JOIN cf_academic_sessions ac
            ON co.session_id = ac.session_id

        WHERE t.user_id = ?

        ORDER BY ac.start_year DESC, s.subject_name ASC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Teacher Courses Error:", err);

            return res.status(500).json({
                message: "Failed to load assigned courses"
            });
        }

        res.json({
            success: true,
            courses: results
        });

    });

});


// =====================================
// GET TEACHER'S ENROLLED STUDENTS
// =====================================

router.get("/students", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({ message: "Unauthorized access" });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            s.student_id,
            s.registration_no,
            s.full_name,
            sub.subject_code,
            sub.subject_name,
            ac.session_name

        FROM cf_teachers t

        JOIN cf_course_offerings co
            ON co.teacher_id = t.teacher_id

        JOIN cf_subjects sub
            ON co.subject_id = sub.subject_id

        JOIN cf_academic_sessions ac
            ON co.session_id = ac.session_id

        JOIN cf_enrollment_courses ec
            ON co.offering_id = ec.offering_id

        JOIN cf_enrollments e
            ON ec.enrollment_id = e.enrollment_id

        JOIN cf_students s
            ON e.student_id = s.student_id

        WHERE
            t.user_id = ?
            AND e.application_status = 'approved'

        ORDER BY sub.subject_name, s.full_name
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Teacher Students Error:", err);
            return res.status(500).json({
                message: "Failed to load students"
            });
        }

        res.json({
            success: true,
            students: results
        });

    });
});


// =====================================
// GET STUDENTS BY SELECTED COURSE
// =====================================

router.get("/students/:offeringId", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;
    const offeringId = Number(req.params.offeringId);

    if (!Number.isInteger(offeringId) || offeringId <= 0) {
        return res.status(400).json({
            message: "Invalid course selection"
        });
    }

    const sql = `
        SELECT
            ec.enrollment_course_id,
            s.registration_no,
            s.full_name

        FROM cf_teachers t

        JOIN cf_course_offerings co
            ON co.teacher_id = t.teacher_id

        JOIN cf_enrollment_courses ec
            ON ec.offering_id = co.offering_id

        JOIN cf_enrollments e
            ON e.enrollment_id = ec.enrollment_id

        JOIN cf_students s
            ON s.student_id = e.student_id

        WHERE
            t.user_id = ?
            AND co.offering_id = ?
            AND e.application_status = 'approved'

        ORDER BY s.full_name
    `;

    db.query(sql, [userId, offeringId], (err, results) => {

        if (err) {
            console.error("Course Students Error:", err);

            return res.status(500).json({
                message: "Failed to load course students"
            });
        }

        res.json({
            success: true,
            students: results
        });

    });

});


// =====================================
// SAVE STUDENT ATTENDANCE
// =====================================

router.post("/attendance", async (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;
    const { offering_id, attendance_date, attendance } = req.body;

    if (
        !offering_id ||
        !attendance_date ||
        !Array.isArray(attendance) ||
        attendance.length === 0
    ) {
        return res.status(400).json({
            message: "Please select a course, date and attendance."
        });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(attendance_date)) {
        return res.status(400).json({
            message: "Invalid attendance date."
        });
    }

    // Validate attendance entries
    const ids = attendance.map(item => Number(item.enrollment_course_id));

    if (
        ids.some(id => !Number.isInteger(id) || id <= 0) ||
        new Set(ids).size !== ids.length ||
        attendance.some(item =>
            !["present", "absent"].includes(item.status)
        )
    ) {
        return res.status(400).json({
            message: "Invalid attendance details."
        });
    }

    let connection;
let transactionStarted = false;
    try {

        connection = await db.promise().getConnection();

await connection.beginTransaction();
transactionStarted = true;

        // Get teacher ID from logged-in user
        const [teachers] = await connection.execute(
            `SELECT teacher_id
             FROM cf_teachers
             WHERE user_id = ?`,
            [userId]
        );

        if (teachers.length === 0) {
    await connection.rollback();
    transactionStarted = false;

    return res.status(404).json({
        message: "Teacher record not found."
    });
}

        const teacherId = teachers[0].teacher_id;

        // Check that all students belong to this teacher's
        // selected course and have approved enrollment
        const placeholders = ids.map(() => "?").join(",");

        const [validStudents] = await connection.execute(
            `SELECT ec.enrollment_course_id
             FROM cf_teachers t
             JOIN cf_course_offerings co
                ON co.teacher_id = t.teacher_id
             JOIN cf_enrollment_courses ec
                ON ec.offering_id = co.offering_id
             JOIN cf_enrollments e
                ON e.enrollment_id = ec.enrollment_id
             WHERE t.user_id = ?
               AND co.offering_id = ?
               AND e.application_status = 'approved'
               AND ec.enrollment_course_id IN (${placeholders})`,
            [userId, offering_id, ...ids]
        );

        if (validStudents.length !== ids.length) {
    await connection.rollback();
    transactionStarted = false;

    return res.status(403).json({
        message: "Invalid course or student selection."
    });
}

        // Save attendance records
        for (const item of attendance) {

            await connection.execute(
                `INSERT INTO cf_attendance
                 (enrollment_course_id, attendance_date,
                  attendance_status, marked_by)
                 VALUES (?, ?, ?, ?)`,
                [
                    Number(item.enrollment_course_id),
                    attendance_date,
                    item.status,
                    teacherId
                ]
            );

        }

        await connection.commit();
        transactionStarted = false;

        res.json({
            success: true,
            message: "Attendance saved successfully."
        });

    } catch (error) {

    if (connection && transactionStarted) {
        await connection.rollback();
        transactionStarted = false;
        
    }

    console.error("Save Attendance Error:", error);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            message: "Attendance has already been marked for this course and date."
        });
    }

    res.status(500).json({
        message: "Failed to save attendance."
    });

} finally {

    if (connection) {
        connection.release();
    }

}

});


// =====================================
// GET TEACHER'S MARKS RECORDS
// =====================================

router.get("/marks", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            a.assessment_id,
            a.assessment_type,
            a.assessment_title,
            a.total_marks,
            a.assessment_date,
            s.subject_code,
            s.subject_name,
            ac.session_name

        FROM cf_assessments a

        JOIN cf_course_offerings co
            ON a.offering_id = co.offering_id

        JOIN cf_teachers t
            ON co.teacher_id = t.teacher_id

        JOIN cf_subjects s
            ON co.subject_id = s.subject_id

        JOIN cf_academic_sessions ac
            ON co.session_id = ac.session_id

        WHERE t.user_id = ?

        ORDER BY a.assessment_date DESC, a.assessment_id DESC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Teacher Marks Records Error:", err);

            return res.status(500).json({
                message: "Failed to load marks records."
            });
        }

        res.json({
            success: true,
            records: results
        });

    });

});


// =====================================
// SAVE STUDENT MARKS
// =====================================

router.post("/marks", async (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const {
        offering_id,
        assessment_type,
        assessment_title,
        total_marks,
        assessment_date,
        marks
    } = req.body;

    const offeringId = Number(offering_id);
    const totalMarks = Number(total_marks);

    const allowedTypes = [
        "quiz",
        "assignment",
        "midterm",
        "final"
    ];

    if (
        !Number.isInteger(offeringId) ||
        offeringId <= 0 ||
        !allowedTypes.includes(assessment_type) ||
        !assessment_title ||
        !assessment_title.trim() ||
        !Number.isFinite(totalMarks) ||
        totalMarks <= 0 ||
        !assessment_date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(assessment_date) ||
        !Array.isArray(marks) ||
        marks.length === 0
    ) {
        return res.status(400).json({
            message: "Please provide valid assessment details and student marks."
        });
    }

    const enrollmentCourseIds = marks.map(item =>
        Number(item.enrollment_course_id)
    );

    if (
        enrollmentCourseIds.some(id =>
            !Number.isInteger(id) || id <= 0
        ) ||
        new Set(enrollmentCourseIds).size !== enrollmentCourseIds.length ||
        marks.some(item => {
            const obtained = Number(item.obtained_marks);

            return (
                item.obtained_marks === "" ||
                !Number.isFinite(obtained) ||
                obtained < 0 ||
                obtained > totalMarks
            );
        })
    ) {
        return res.status(400).json({
            message: "Please enter valid marks for every student. Obtained marks cannot exceed total marks."
        });
    }

    let connection;
let transactionStarted = false;

try {
    connection = await db.promise().getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

        // GET LOGGED-IN TEACHER
        const [teachers] = await connection.execute(
            `SELECT teacher_id
             FROM cf_teachers
             WHERE user_id = ?`,
            [userId]
        );

       if (teachers.length === 0) {
    await connection.rollback();
    transactionStarted = false;

    return res.status(404).json({
        message: "Teacher record not found."
    });
}
        const teacherId = teachers[0].teacher_id;

        // VERIFY ASSIGNED COURSE
        const [courses] = await connection.execute(
            `SELECT offering_id
             FROM cf_course_offerings
             WHERE offering_id = ?
               AND teacher_id = ?`,
            [offeringId, teacherId]
        );

       if (courses.length === 0) {
    await connection.rollback();
    transactionStarted = false;

    return res.status(403).json({
        message: "You are not assigned to this course."
    });
}

        // VERIFY APPROVED STUDENTS OF THIS COURSE
        const placeholders = enrollmentCourseIds
            .map(() => "?")
            .join(",");

        const [validStudents] = await connection.execute(
            `SELECT ec.enrollment_course_id
             FROM cf_enrollment_courses ec

             JOIN cf_enrollments e
                ON ec.enrollment_id = e.enrollment_id

             WHERE ec.offering_id = ?
               AND e.application_status = 'approved'
               AND ec.enrollment_course_id IN (${placeholders})`,
            [offeringId, ...enrollmentCourseIds]
        );

        if (validStudents.length !== enrollmentCourseIds.length) {
    await connection.rollback();
    transactionStarted = false;

    return res.status(403).json({
        message: "Some students are not approved or do not belong to this course."
    });
}

        // SAVE ASSESSMENT
        const [assessmentResult] = await connection.execute(
            `INSERT INTO cf_assessments
             (
                offering_id,
                assessment_type,
                assessment_title,
                total_marks,
                assessment_date,
                uploaded_by
             )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                offeringId,
                assessment_type,
                assessment_title.trim(),
                totalMarks,
                assessment_date,
                teacherId
            ]
        );

        const assessmentId = assessmentResult.insertId;

        // SAVE EACH STUDENT'S MARKS
        for (const item of marks) {

            await connection.execute(
                `INSERT INTO cf_student_marks
                 (
                    assessment_id,
                    enrollment_course_id,
                    obtained_marks
                 )
                 VALUES (?, ?, ?)`,
                [
                    assessmentId,
                    Number(item.enrollment_course_id),
                    Number(item.obtained_marks)
                ]
            );

        }

        await connection.commit();
        transactionStarted = false;

        res.json({
            success: true,
            message: "Student marks uploaded successfully."
        });

    } catch (error) {

    if (connection && transactionStarted) {
        await connection.rollback();
        transactionStarted = false;
    }

    console.error("Save Marks Error:", error);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            message: "Duplicate marks record found."
        });
    }

    res.status(500).json({
        message: "Failed to save student marks."
    });

} finally {

    if (connection) {
        connection.release();
    }

}
});

// =====================================
// GET TEACHER ANNOUNCEMENTS
// =====================================

router.get("/announcements", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            a.announcement_id,
            a.offering_id,
            a.title,
            a.message,
            a.created_at,
            s.subject_code,
            s.subject_name,
            ac.session_name

        FROM cf_announcements a

        JOIN cf_teachers t
            ON a.teacher_id = t.teacher_id

        JOIN cf_course_offerings co
            ON a.offering_id = co.offering_id

        JOIN cf_subjects s
            ON co.subject_id = s.subject_id

        JOIN cf_academic_sessions ac
            ON co.session_id = ac.session_id

        WHERE
            t.user_id = ?
            AND a.teacher_id IS NOT NULL
            AND a.offering_id IS NOT NULL

        ORDER BY a.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Teacher Announcements Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load announcements."
            });
        }

        res.json({
            success: true,
            announcements: results
        });

    });

});


// =====================================
// CREATE TEACHER ANNOUNCEMENT
// =====================================

router.post("/announcements", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const { offering_id, title, message } = req.body;

    const offeringId = Number(offering_id);

    if (
        !Number.isInteger(offeringId) ||
        offeringId <= 0 ||
        !title ||
        !title.trim() ||
        title.trim().length > 150 ||
        !message ||
        !message.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid announcement details."
        });
    }

    const sql = `
        SELECT teacher_id
        FROM cf_teachers
        WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, teachers) => {

        if (err) {
            console.error("Teacher Verification Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to verify teacher."
            });
        }

        if (teachers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher record not found."
            });
        }

        const teacherId = teachers[0].teacher_id;

        const courseSql = `
            SELECT offering_id
            FROM cf_course_offerings
            WHERE offering_id = ?
              AND teacher_id = ?
        `;

        db.query(
            courseSql,
            [offeringId, teacherId],
            (courseError, courses) => {

                if (courseError) {
                    console.error("Announcement Course Check Error:", courseError);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to verify assigned course."
                    });
                }

                if (courses.length === 0) {
                    return res.status(403).json({
                        success: false,
                        message: "You are not assigned to this course."
                    });
                }

                const insertSql = `
                    INSERT INTO cf_announcements
                    (
                        teacher_id,
                        offering_id,
                        title,
                        message,
                        target_audience
                    )
                    VALUES (?, ?, ?, ?, 'students')
                `;

                db.query(
                    insertSql,
                    [
                        teacherId,
                        offeringId,
                        title.trim(),
                        message.trim()
                    ],
                    (insertError, result) => {

                        if (insertError) {
                            console.error("Create Teacher Announcement Error:", insertError);

                            return res.status(500).json({
                                success: false,
                                message: "Failed to publish announcement."
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: "Announcement published successfully!",
                            announcement_id: result.insertId
                        });

                    }
                );

            }
        );

    });

});

// =====================================
// GET TEACHER ASSIGNMENTS
// =====================================

router.get("/assignments", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            a.assignment_id,
            a.title,
            a.description,
            a.attachment_path,
            a.due_date,
            a.created_at,
            s.subject_code,
            s.subject_name,
            ac.session_name

        FROM cf_assignments a

        JOIN cf_course_offerings co
            ON a.offering_id = co.offering_id
JOIN cf_teachers t
    ON a.teacher_id = t.teacher_id

        JOIN cf_subjects s
            ON co.subject_id = s.subject_id

        JOIN cf_academic_sessions ac
            ON co.session_id = ac.session_id

        WHERE t.user_id = ?

        ORDER BY a.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Load Teacher Assignments Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load assignments."
            });
        }

        res.json({
            success: true,
            assignments: results
        });

    });

});

// =====================================
// GET TEACHER SUBMITTED ASSIGNMENTS
// =====================================

router.get("/submitted-assignments", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            sub.submission_id,
            sub.submission_path,
            sub.submitted_at,
            sub.submission_status,

            a.assignment_id,
            a.title AS assignment_title,
            a.due_date,

            s.student_id,
            s.full_name,
            s.registration_no,

            co.offering_id,

            subj.subject_code,
            subj.subject_name,

            ac.session_name

        FROM cf_assignment_submissions sub

        JOIN cf_assignments a
            ON sub.assignment_id = a.assignment_id

        JOIN cf_students s
            ON sub.student_id = s.student_id

        JOIN cf_course_offerings co
            ON a.offering_id = co.offering_id

        JOIN cf_teachers t
    ON a.teacher_id = t.teacher_id

        JOIN cf_subjects subj
            ON co.subject_id = subj.subject_id

        JOIN cf_academic_sessions ac
            ON co.session_id = ac.session_id

        WHERE t.user_id = ?

        ORDER BY sub.submitted_at DESC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Submitted Assignments Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load submitted assignments."
            });
        }

        res.json({
            success: true,
            submissions: results
        });

    });

});
// =====================================
// CREATE TEACHER ASSIGNMENT
// =====================================

router.post(
    "/assignments",

    (req, res, next) => {

        if (!req.session.user || req.session.user.role !== "teacher") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        upload.single("assignment_file")(req, res, (error) => {

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            next();

        });

    },

    (req, res) => {

        const userId = req.session.user.user_id;

        const {
            offering_id,
            title,
            description,
            due_date
        } = req.body;

        const offeringId = Number(offering_id);

        // Validate form fields
        if (
            !Number.isInteger(offeringId) ||
            offeringId <= 0 ||
            !title ||
            !title.trim() ||
            title.trim().length > 150 ||
            !due_date ||
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(due_date)
        ) {

            if (req.file) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
                success: false,
                message: "Please provide valid assignment details."
            });

        }

        // Convert datetime-local into MySQL DATETIME format
        const formattedDueDate = due_date.replace("T", " ") + ":00";

        // Save uploaded file path
        const attachmentPath = req.file
            ? "uploads/assignments/" + req.file.filename
            : null;

        // Verify that the selected course belongs to this teacher
       const courseSql = `
    SELECT co.offering_id, t.teacher_id

    FROM cf_course_offerings co

    JOIN cf_teachers t
        ON co.teacher_id = t.teacher_id

    JOIN cf_users u
        ON t.user_id = u.user_id

    WHERE co.offering_id = ?
    AND t.user_id = ?
    AND u.account_status = 'active'
`;

        db.query(
            courseSql,
            [offeringId, userId],
            (err, courses) => {

                if (err) {

                    console.error("Assignment Course Check Error:", err);

                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }

                    return res.status(500).json({
                        success: false,
                        message: "Failed to verify assigned course."
                    });

                }

                if (courses.length === 0) {

                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }

                    return res.status(403).json({
                        success: false,
                        message: "You are not assigned to this course."
                    });

                }

                // Insert assignment into database
              const insertSql = `
    INSERT INTO cf_assignments
    (
        offering_id,
        teacher_id,
        title,
        description,
        attachment_path,
        due_date
    )
    VALUES (?, ?, ?, ?, ?, ?)
`;

                db.query(
                    insertSql,
                   [
    offeringId,
    courses[0].teacher_id,
    title.trim(),
    description ? description.trim() : null,
    attachmentPath,
    formattedDueDate
],
                    (insertError, result) => {

                        if (insertError) {

                            console.error(
                                "Create Assignment Error:",
                                insertError
                            );

                            if (req.file) {
                                fs.unlinkSync(req.file.path);
                            }

                            return res.status(500).json({
                                success: false,
                                message: "Failed to create assignment."
                            });

                        }

                        return res.status(201).json({
                            success: true,
                            message: "Assignment created successfully.",
                            assignment_id: result.insertId
                        });

                    }
                );

            }
        );

    }
);
// =====================================
// GET TEACHER TIMETABLE
// =====================================

router.get("/timetable", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            tt.timetable_id,
            tt.day_of_week,
            tt.start_time,
            tt.end_time,
            tt.room_no,

            subj.subject_code,
            subj.subject_name,

            ac.session_name

        FROM cf_timetable tt

        JOIN cf_course_offerings co
            ON tt.offering_id = co.offering_id

        JOIN cf_teachers t
            ON co.teacher_id = t.teacher_id

        JOIN cf_subjects subj
            ON co.subject_id = subj.subject_id

        JOIN cf_academic_sessions ac
            ON co.session_id = ac.session_id

        WHERE t.user_id = ?

        ORDER BY
            FIELD(
                tt.day_of_week,
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ),
            tt.start_time
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Teacher Timetable Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load timetable."
            });
        }

        res.json({
            success: true,
            timetable: results
        });

    });

});
// =====================================
// GET TEACHER NOTIFICATIONS
// =====================================

router.get("/notifications", (req, res) => {

    if (!req.session.user || req.session.user.role !== "teacher") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            notification_id,
            title,
            message,
            is_read,
            created_at

        FROM cf_notifications

        WHERE user_id = ?

        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Teacher Notifications Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load notifications."
            });
        }

        res.json({
            success: true,
            notifications: results
        });

    });

});
module.exports = router;
