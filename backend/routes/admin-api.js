console.log("ADMIN API FILE LOADED:", __filename);
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../db");


// =====================================
// ADMIN OVERVIEW
// =====================================
router.get("/overview", (req, res) => {

    const query = `
        SELECT
            (SELECT COUNT(*) FROM cf_students) AS totalStudents,
            (SELECT COUNT(*) FROM cf_teachers) AS totalTeachers,
            (SELECT COUNT(*) FROM cf_subjects WHERE is_active = 1) AS totalSubjects,
            (SELECT COUNT(*) FROM cf_payments WHERE payment_status = 'pending') AS pendingPayments,
            (SELECT COUNT(*) FROM cf_enrollments) AS totalEnrollments,
            (SELECT COUNT(*) FROM cf_enrollments WHERE application_status = 'approved') AS approvedEnrollments
    `;

    db.query(query, (error, results) => {

        if (error) {

            console.error("Overview API Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load dashboard statistics."
            });

        }

        res.json({
            success: true,
            data: results[0]
        });

    });

});

// =====================================
// GET DEPARTMENTS
// =====================================

router.get("/departments", (req, res) => {

    const query = `
        SELECT department_id, department_name, department_code
        FROM cf_departments
        ORDER BY department_name
    `;

    db.query(query, (error, results) => {

        if (error) {
            console.error("Load Departments Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load departments."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// =====================================
// ADD DEPARTMENT
// =====================================

router.post("/departments", (req, res) => {

    const { department_code, department_name } = req.body;

    if (!department_code?.trim() || !department_name?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Department code and name are required."
        });
    }

    const sql = `
        INSERT INTO cf_departments (department_code, department_name)
        VALUES (?, ?)
    `;

    db.query(
        sql,
        [department_code.trim(), department_name.trim()],
        (err, result) => {

            if (err) {
                console.error("Add Department Error:", err);

                return res.status(err.code === "ER_DUP_ENTRY" ? 409 : 500).json({
                    success: false,
                    message: err.code === "ER_DUP_ENTRY"
                        ? "Department code or name already exists."
                        : "Unable to save department."
                });
            }

            res.status(201).json({
                success: true,
                message: "Department added successfully.",
                data: {
                    department_id: result.insertId,
                    department_code: department_code.trim(),
                    department_name: department_name.trim()
                }
            });

        }
    );

});


// =====================================
// DELETE DEPARTMENT
// =====================================

router.delete("/departments/:id", (req, res) => {

    const departmentId = Number(req.params.id);

    if (!Number.isInteger(departmentId) || departmentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid department ID."
        });
    }

    const checkSql = `
        SELECT
            (SELECT COUNT(*) FROM cf_students
             WHERE department_id = ?) AS totalStudents,

            (SELECT COUNT(*) FROM cf_teachers
             WHERE department_id = ?) AS totalTeachers,

            (SELECT COUNT(*) FROM cf_subjects
             WHERE department_id = ?) AS totalSubjects
    `;

    db.query(
        checkSql,
        [departmentId, departmentId, departmentId],
        (error, results) => {

            if (error) {
                console.error("Department Check Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to check department records."
                });
            }

            const records = results[0];

            if (
                records.totalStudents > 0 ||
                records.totalTeachers > 0 ||
                records.totalSubjects > 0
            ) {
                return res.status(409).json({
                    success: false,
                    message: "This department cannot be deleted because it has linked students, teachers, or subjects. Please transfer or unassign these records first.",
                    data: records
                });
            }

            db.query(
                "DELETE FROM cf_departments WHERE department_id = ?",
                [departmentId],
                (deleteError, deleteResult) => {

                    if (deleteError) {
                        console.error("Delete Department Error:", deleteError);

                        return res.status(500).json({
                            success: false,
                            message: "Unable to delete department."
                        });
                    }

                    if (deleteResult.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: "Department not found."
                        });
                    }

                    res.json({
                        success: true,
                        message: "Department deleted successfully."
                    });

                }
            );

        }
    );

});

// =====================================
// GET ACTIVE ACADEMIC SESSIONS
// =====================================
// =====================================
// GET ALL ACADEMIC SESSIONS
// =====================================

router.get("/sessions", (req, res) => {

    const query = `
    SELECT
        session_id,
        session_name,
        start_year,
        end_year,
        eligibility_mode,
        max_credit_hours,
        enrollment_fee,
        is_active
    FROM cf_academic_sessions
    ORDER BY start_year DESC
`;

    db.query(query, (error, results) => {

        if (error) {
            console.error("Load Sessions Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load academic sessions."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});
// =====================================
// ADD SESSION
// =====================================

router.post("/sessions", (req, res) => {

    const {
        session_name,
        eligibility_rule,
        max_credits,
        status
    } = req.body;

    if (!session_name || !eligibility_rule || !max_credits || !status) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required session fields."
        });
    }

    const match = session_name.trim().match(/^(\d{4})-(\d{4})$/);

    if (!match || Number(match[2]) <= Number(match[1])) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid session, for example 2023-2027."
        });
    }

    const eligibilityMap = {
        "Any subject": "any_subject",
        "Previously studied subjects": "previously_studied"
    };

    const eligibilityMode = eligibilityMap[eligibility_rule];

    if (!eligibilityMode) {
        return res.status(400).json({
            success: false,
            message: "Invalid eligibility rule."
        });
    }

    const isActive = status === "Active" ? 1 : 0;

    const sql = `
        INSERT INTO cf_academic_sessions
        (
            session_name,
            start_year,
            end_year,
            eligibility_mode,
            max_credit_hours,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            session_name.trim(),
            Number(match[1]),
            Number(match[2]),
            eligibilityMode,
            Number(max_credits),
            isActive
        ],
        (err, result) => {

            if (err) {
                console.error("Add Session Error:", err);

                return res.status(err.code === "ER_DUP_ENTRY" ? 409 : 500).json({
                    success: false,
                    message: err.code === "ER_DUP_ENTRY"
                        ? "This session already exists."
                        : "Unable to save session."
                });
            }

            res.status(201).json({
                success: true,
                message: "Session added successfully.",
                data: {
                    session_id: result.insertId,
                    session_name: session_name.trim()
                }
            });

        }
    );

});
// =====================================
// UPDATE SESSION STATUS
// =====================================

router.patch("/sessions/:id/status", (req, res) => {

    const sessionId = Number(req.params.id);
    const { is_active } = req.body;

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID."
        });
    }

    if (![0, 1].includes(Number(is_active))) {
        return res.status(400).json({
            success: false,
            message: "Invalid session status."
        });
    }

    const sql = `
        UPDATE cf_academic_sessions
        SET is_active = ?
        WHERE session_id = ?
    `;

    db.query(sql, [Number(is_active), sessionId], (error, result) => {

        if (error) {
            console.error("Update Session Status Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update session status."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Academic session not found."
            });
        }

        res.json({
            success: true,
            message: Number(is_active) === 1
                ? "Academic session activated successfully."
                : "Academic session deactivated successfully."
        });

    });

});

// =====================================
// UPDATE SESSION RULES
// =====================================
router.patch("/sessions/:id/rules", (req, res) => {
    const sessionId = Number(req.params.id);
    const { max_credit_hours, enrollment_fee } = req.body;

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID."
        });
    }

    const credits = Number(max_credit_hours);
    const fee = Number(enrollment_fee);

    if (
        !Number.isInteger(credits) ||
        credits <= 0 ||
        !Number.isFinite(fee) ||
        fee <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Please enter valid credit hours and enrollment fee."
        });
    }

    const sql = `
        UPDATE cf_academic_sessions
        SET max_credit_hours = ?, enrollment_fee = ?
        WHERE session_id = ?
    `;

    db.query(sql, [credits, fee, sessionId], (error, result) => {
        if (error) {
            console.error("Update Session Rules Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to update session rules."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Academic session not found."
            });
        }

        res.json({
            success: true,
            message: "Session rules updated successfully."
        });
    });
});

// =====================================
// ADD STUDENT
// =====================================

router.post("/students", async (req, res) => {

    const {
        registration_no,
        full_name,
        father_name,
        email,
        department_id,
        session_id,
        password
    } = req.body;

    if (
        !registration_no?.trim() ||
        !full_name?.trim() ||
        !email?.trim() ||
        !department_id ||
        !session_id ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 8 characters."
        });
    }

    const departmentId = Number(department_id);
    const sessionId = Number(session_id);

    if (!Number.isInteger(departmentId) || !Number.isInteger(sessionId)) {
        return res.status(400).json({
            success: false,
            message: "Please select a valid department and session."
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            `INSERT INTO cf_users
             (login_id, password_hash, role, account_status)
             VALUES (?, ?, 'student', 'active')`,
            [registration_no.trim(), hashedPassword],
            (error, userResult) => {

                if (error) {
                    console.error("User Save Error:", error);

                    return res.status(
                        error.code === "ER_DUP_ENTRY" ? 409 : 500
                    ).json({
                        success: false,
                        message: error.code === "ER_DUP_ENTRY"
                            ? "Student ID already exists."
                            : "Unable to create student account."
                    });
                }

                const userId = userResult.insertId;

                db.query(
                    `INSERT INTO cf_students
                     (
                        user_id,
                        registration_no,
                        full_name,
                        father_name,
                        email,
                        department_id,
                        session_id
                     )
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        registration_no.trim(),
                        full_name.trim(),
                        father_name?.trim() || null,
                        email.trim(),
                        departmentId,
                        sessionId
                    ],
                    (error, studentResult) => {

                        if (error) {
                            console.error("Student Save Error:", error);

                            db.query(
                                "DELETE FROM cf_users WHERE user_id = ?",
                                [userId]
                            );

                            return res.status(
                                error.code === "ER_DUP_ENTRY" ? 409 : 500
                            ).json({
                                success: false,
                                message: error.code === "ER_DUP_ENTRY"
                                    ? "Student ID or email already exists."
                                    : "Unable to save student details."
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: "Student added successfully!",
                            data: {
                                user_id: userId,
                                student_id: studentResult.insertId,
                                registration_no: registration_no.trim()
                            }
                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error("Student Save Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to process student registration."
        });

    }

});


// =====================================
// GET STUDENTS
// =====================================

router.get("/students", (req, res) => {

    const query = `
        SELECT
            s.student_id,
            s.registration_no,
            s.full_name,
            s.father_name,
            s.email,
            s.department_id,
            s.session_id,
            u.account_status
        FROM cf_students s
        INNER JOIN cf_users u
            ON s.user_id = u.user_id
        ORDER BY s.student_id DESC
    `;

    db.query(query, (error, results) => {

        if (error) {
            console.error("Students Display Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load students."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// =====================================
// UPDATE STUDENT ACCOUNT STATUS
// =====================================

router.patch("/students/:id/status", async (req, res) => {
    try {
        const studentId = req.params.id;
        const { account_status } = req.body;

        if (!["active", "inactive"].includes(account_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account status."
            });
        }

        const [result] = await db.promise().query(
            `UPDATE cf_users u
             INNER JOIN cf_students s ON u.user_id = s.user_id
             SET u.account_status = ?
             WHERE s.student_id = ? AND u.role = 'student'`,
            [account_status, studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        res.json({
            success: true,
            message: `Student account ${account_status} successfully.`
        });

    } catch (error) {
        console.error("Update Student Status Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update student status."
        });
    }
});

// =====================================
// GET ALL TEACHERS
// =====================================

router.get("/teachers", (req, res) => {

    const query = `
        SELECT
            t.teacher_id,
            t.teacher_code,
            t.full_name,
            t.email,
            t.department_id,
            d.department_name,
            u.account_status,
            0 AS assigned_subjects
        FROM cf_teachers t
        INNER JOIN cf_users u
            ON t.user_id = u.user_id
        INNER JOIN cf_departments d
            ON t.department_id = d.department_id
        ORDER BY t.teacher_id DESC
    `;

    db.query(query, (error, results) => {

        if (error) {
            console.error("Teachers Display Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load teachers."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// =====================================
// ADD TEACHER
// =====================================

router.post("/teachers", async (req, res) => {

    const {
        teacher_code,
        full_name,
        email,
        department_id,
        password
    } = req.body;

    if (
        !teacher_code?.trim() ||
        !full_name?.trim() ||
        !email?.trim() ||
        !department_id ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 8 characters."
        });
    }

    const departmentId = Number(department_id);

    if (!Number.isInteger(departmentId)) {
        return res.status(400).json({
            success: false,
            message: "Please select a valid department."
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            `INSERT INTO cf_users
             (login_id, password_hash, role, account_status)
             VALUES (?, ?, 'teacher', 'active')`,
            [teacher_code.trim(), hashedPassword],
            (error, userResult) => {

                if (error) {
                    console.error("Teacher User Save Error:", error);

                    return res.status(
                        error.code === "ER_DUP_ENTRY" ? 409 : 500
                    ).json({
                        success: false,
                        message: error.code === "ER_DUP_ENTRY"
                            ? "Teacher ID already exists."
                            : "Unable to create teacher account."
                    });
                }

                const userId = userResult.insertId;

                db.query(
                    `INSERT INTO cf_teachers
                     (user_id, teacher_code, full_name, email, department_id)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        userId,
                        teacher_code.trim(),
                        full_name.trim(),
                        email.trim(),
                        departmentId
                    ],
                    (error, teacherResult) => {

                        if (error) {
                            console.error("Teacher Save Error:", error);

                            db.query(
                                "DELETE FROM cf_users WHERE user_id = ?",
                                [userId]
                            );

                            return res.status(
                                error.code === "ER_DUP_ENTRY" ? 409 : 500
                            ).json({
                                success: false,
                                message: error.code === "ER_DUP_ENTRY"
                                    ? "Teacher ID or email already exists."
                                    : "Unable to save teacher details."
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: "Teacher added successfully!",
                            data: {
                                user_id: userId,
                                teacher_id: teacherResult.insertId,
                                teacher_code: teacher_code.trim()
                            }
                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error("Teacher Save Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to process teacher registration."
        });

    }

});

// GET SESSIONS ASSIGNED TO A TEACHER
router.get("/teachers/:id/sessions", (req, res) => {

    const teacherId = Number(req.params.id);

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid teacher ID."
        });
    }

    const query = `
        SELECT DISTINCT
            ac.session_id,
            ac.session_name
        FROM cf_course_offerings co
        INNER JOIN cf_academic_sessions ac
            ON co.session_id = ac.session_id
        WHERE co.teacher_id = ?
        ORDER BY ac.session_id
    `;

    db.query(query, [teacherId], (error, results) => {

        if (error) {
            console.error("Teacher Sessions Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load teacher sessions."
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});

// CHECK TEACHER COURSES AND APPROVED STUDENTS IN SELECTED SESSION
router.get("/teachers/:id/sessions/:sessionId/courses", (req, res) => {

    const teacherId = Number(req.params.id);
    const sessionId = Number(req.params.sessionId);

    if (
        !Number.isInteger(teacherId) || teacherId <= 0 ||
        !Number.isInteger(sessionId) || sessionId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid teacher or session ID."
        });
    }

    const query = `
        SELECT
            co.offering_id,
            s.subject_code,
            s.subject_name,
            COUNT(DISTINCT e.enrollment_id) AS enrolled_students
        FROM cf_course_offerings co
        INNER JOIN cf_subjects s
            ON co.subject_id = s.subject_id
        LEFT JOIN cf_enrollment_courses ec
            ON co.offering_id = ec.offering_id
        LEFT JOIN cf_enrollments e
            ON ec.enrollment_id = e.enrollment_id
            AND e.application_status = 'approved'
        WHERE co.teacher_id = ?
          AND co.session_id = ?
        GROUP BY
            co.offering_id,
            s.subject_code,
            s.subject_name
        ORDER BY s.subject_code
    `;

    db.query(query, [teacherId, sessionId], (error, results) => {

        if (error) {
            console.error("Teacher Course Check Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to check enrolled students."
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});
// =====================================
// UPDATE TEACHER ACCOUNT STATUS
// =====================================

router.patch("/teachers/:id/status", async (req, res) => {

    const teacherId = Number(req.params.id);
    const { status, session_id, replacements = [] } = req.body;

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid teacher ID."
        });
    }

    if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid teacher status."
        });
    }

    if (!Array.isArray(replacements)) {
        return res.status(400).json({
            success: false,
            message: "Invalid replacement teacher data."
        });
    }

    let connection;

    try {

        connection = await db.promise().getConnection();

        await connection.beginTransaction();

        // CHECK TEACHER
        const [teacherRows] = await connection.query(
            `SELECT t.teacher_id, t.user_id, u.account_status
             FROM cf_teachers t
             INNER JOIN cf_users u
                ON t.user_id = u.user_id
             WHERE t.teacher_id = ?
               AND u.role = 'teacher'
             FOR UPDATE`,
            [teacherId]
        );

        if (teacherRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Teacher not found."
            });
        }

        // REACTIVATE TEACHER
        if (status === "active") {

            await connection.query(
                `UPDATE cf_users
                 SET account_status = 'active'
                 WHERE user_id = ? AND role = 'teacher'`,
                [teacherRows[0].user_id]
            );

            await connection.commit();

            return res.json({
                success: true,
                message: "Teacher account activated successfully."
            });
        }

        // CHECK SELECTED SESSION
        const selectedSessionId = Number(session_id);

        if (!Number.isInteger(selectedSessionId) || selectedSessionId <= 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Please select a valid academic session."
            });
        }

        const [sessionRows] = await connection.query(
            `SELECT offering_id
             FROM cf_course_offerings
             WHERE teacher_id = ? AND session_id = ?`,
            [teacherId, selectedSessionId]
        );

        if (sessionRows.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Selected session is not assigned to this teacher."
            });
        }

        // FIND ALL COURSES WITH APPROVED STUDENTS
        const [requiredOfferings] = await connection.query(
            `SELECT co.offering_id
             FROM cf_course_offerings co
             WHERE co.teacher_id = ?
               AND EXISTS (
                    SELECT 1
                    FROM cf_enrollment_courses ec
                    INNER JOIN cf_enrollments e
                        ON ec.enrollment_id = e.enrollment_id
                    WHERE ec.offering_id = co.offering_id
                      AND e.application_status = 'approved'
               )
             FOR UPDATE`,
            [teacherId]
        );

        const requiredIds = requiredOfferings.map(
            offering => Number(offering.offering_id)
        );

        const replacementIds = replacements.map(
            item => Number(item.offering_id)
        );

        // CHECK EVERY REQUIRED COURSE HAS A REPLACEMENT
        if (
            new Set(replacementIds).size !== replacementIds.length ||
            requiredIds.length !== replacementIds.length ||
            !requiredIds.every(id => replacementIds.includes(id))
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Please assign a replacement teacher to every course with approved students."
            });
        }

        // VALIDATE AND UPDATE REPLACEMENT TEACHERS
        for (const item of replacements) {

            const offeringId = Number(item.offering_id);
            const replacementTeacherId = Number(item.teacher_id);

            if (
                !Number.isInteger(replacementTeacherId) ||
                replacementTeacherId <= 0 ||
                replacementTeacherId === teacherId
            ) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Invalid replacement teacher selected."
                });
            }

            // CHECK REPLACEMENT TEACHER IS ACTIVE
            const [replacementRows] = await connection.query(
                `SELECT t.teacher_id
                 FROM cf_teachers t
                 INNER JOIN cf_users u
                    ON t.user_id = u.user_id
                 WHERE t.teacher_id = ?
                   AND u.role = 'teacher'
                   AND u.account_status = 'active'
                 FOR UPDATE`,
                [replacementTeacherId]
            );

            if (replacementRows.length === 0) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Selected replacement teacher is not active."
                });
            }

            // ASSIGN REPLACEMENT TEACHER
            const [updateResult] = await connection.query(
                `UPDATE cf_course_offerings
                 SET teacher_id = ?
                 WHERE offering_id = ?
                   AND teacher_id = ?`,
                [replacementTeacherId, offeringId, teacherId]
            );

            if (updateResult.affectedRows !== 1) {
                throw new Error("Unable to update course teacher assignment.");
            }
        }

        // DEACTIVATE ORIGINAL TEACHER
        await connection.query(
            `UPDATE cf_users
             SET account_status = 'inactive'
             WHERE user_id = ? AND role = 'teacher'`,
            [teacherRows[0].user_id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Teacher deactivated and replacement teachers assigned successfully."
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error("Teacher Status Update Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update teacher status."
        });

    } finally {

        if (connection) {
            connection.release();
        }

    }

});


// =====================================
// GET ALL SUBJECTS
// =====================================

router.get("/subjects", (req, res) => {

    const sql = `
        SELECT
            s.subject_id,
            s.subject_code,
            s.subject_name,
            s.credit_hours,
            s.department_id,
            s.is_active,
            d.department_name
        FROM cf_subjects s
        JOIN cf_departments d
            ON s.department_id = d.department_id
        ORDER BY s.subject_id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("Get Subjects Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load subjects."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// =====================================
// ADD SUBJECT
// =====================================

router.post("/subjects", (req, res) => {

    const {
        subject_code,
        subject_name,
        credit_hours,
        department_id,
        status
    } = req.body;

    if (
        !subject_code?.trim() ||
        !subject_name?.trim() ||
        !credit_hours ||
        !department_id ||
        !status
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });
    }

    const is_active = status === "Active" ? 1 : 0;

    const sql = `
        INSERT INTO cf_subjects
        (
            subject_code,
            subject_name,
            credit_hours,
            department_id,
            is_active
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            subject_code.trim(),
            subject_name.trim(),
            Number(credit_hours),
            Number(department_id),
            is_active
        ],
        (err, result) => {

            if (err) {
                console.error("Add Subject Error:", err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "This subject code already exists."
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Unable to save subject."
                });
            }

            res.status(201).json({
                success: true,
                message: "Subject added successfully.",
                subject_id: result.insertId
            });

        }
    );

});


// =====================================
// GET ALL COURSE OFFERINGS
// =====================================

router.get("/offerings", (req, res) => {

    const sql = `
        SELECT
            o.offering_id,
            o.subject_id,
            s.subject_code,
            s.subject_name,
            s.department_id,
            d.department_name,
            o.teacher_id,
            t.full_name AS teacher_name,
            u.account_status AS teacher_status,
            o.session_id,
            ac.session_name,
            o.capacity,
            o.offering_status
        FROM cf_course_offerings o
        INNER JOIN cf_subjects s
            ON o.subject_id = s.subject_id
        INNER JOIN cf_departments d
            ON s.department_id = d.department_id
        INNER JOIN cf_teachers t
            ON o.teacher_id = t.teacher_id
            INNER JOIN cf_users u
    ON t.user_id = u.user_id
        INNER JOIN cf_academic_sessions ac
            ON o.session_id = ac.session_id
        ORDER BY o.offering_id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("Get Offerings Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load course offerings."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// =====================================
// ADD COURSE OFFERING
// =====================================

// =====================================
// ADD COURSE OFFERING
// =====================================

router.post("/offerings", (req, res) => {

    const {
        subject_id,
        teacher_id,
        session_id,
        capacity,
        status
    } = req.body;

    if (
        !subject_id ||
        !teacher_id ||
        !session_id ||
        !capacity ||
        !status
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });
    }

    const subjectId = Number(subject_id);
    const teacherId = Number(teacher_id);
    const offeringCapacity = Number(capacity);

    // Support multiple sessions, and older single-session requests
    const sessionIds = [
        ...new Set(
            (Array.isArray(session_id) ? session_id : [session_id])
                .map(id => Number(id))
        )
    ];

    if (
        !Number.isInteger(subjectId) || subjectId <= 0 ||
        !Number.isInteger(teacherId) || teacherId <= 0 ||
        sessionIds.length === 0 ||
        sessionIds.some(id => !Number.isInteger(id) || id <= 0) ||
        !Number.isInteger(offeringCapacity) || offeringCapacity <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Please enter valid offering details."
        });
    }

    const statusMap = {
        "Available": "available",
        "Unavailable": "closed"
    };

    const offeringStatus = statusMap[status];

    if (!offeringStatus) {
        return res.status(400).json({
            success: false,
            message: "Invalid offering status."
        });
    }

    const placeholders = sessionIds
        .map(() => "(?, ?, ?, ?, ?)")
        .join(", ");

    const values = [];

    sessionIds.forEach(sessionId => {
        values.push(
            subjectId,
            teacherId,
            sessionId,
            offeringCapacity,
            offeringStatus
        );
    });

    const sql = `
        INSERT INTO cf_course_offerings
        (
            subject_id,
            teacher_id,
            session_id,
            capacity,
            offering_status
        )
        VALUES ${placeholders}
    `;

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error("Add Offering Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to save course offering."
            });
        }

        res.status(201).json({
            success: true,
            message: "Course offering added successfully!",
            data: {
                offering_id: result.insertId,
                inserted_count: sessionIds.length
            }
        });

    });

});

// =====================================
// GET ALL TIMETABLE SCHEDULES
// =====================================

router.get("/timetable", (req, res) => {

    const sql = `
        SELECT
            tt.timetable_id,
            tt.offering_id,
            s.subject_code,
            s.subject_name,
            t.full_name AS teacher_name,
            ac.session_name,
            tt.day_of_week,
            tt.start_time,
            tt.end_time,
            tt.room_no
        FROM cf_timetable tt
        INNER JOIN cf_course_offerings o
            ON tt.offering_id = o.offering_id
        INNER JOIN cf_subjects s
            ON o.subject_id = s.subject_id
        INNER JOIN cf_teachers t
            ON o.teacher_id = t.teacher_id
        INNER JOIN cf_academic_sessions ac
            ON o.session_id = ac.session_id
        ORDER BY
            FIELD(
                tt.day_of_week,
                'Monday', 'Tuesday', 'Wednesday',
                'Thursday', 'Friday'
            ),
            tt.start_time
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("Get Timetable Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load timetable."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// =====================================
// ADD TIMETABLE SCHEDULE
// =====================================

router.post("/timetable", (req, res) => {

    const {
        offering_id,
        day_of_week,
        start_time,
        end_time,
        room_no
    } = req.body;

    if (
        !offering_id ||
        !day_of_week ||
        !start_time ||
        !end_time
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });
    }

    const offeringId = Number(offering_id);

    const allowedDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
    ];

    if (
        !Number.isInteger(offeringId) ||
        offeringId <= 0 ||
        !allowedDays.includes(day_of_week)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid course offering or day."
        });
    }

    if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(end_time) ||
        start_time >= end_time
    ) {
        return res.status(400).json({
            success: false,
            message: "Please enter valid start and end times."
        });
    }

    const sql = `
        INSERT INTO cf_timetable
        (
            offering_id,
            day_of_week,
            start_time,
            end_time,
            room_no
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            offeringId,
            day_of_week,
            start_time,
            end_time,
            room_no?.trim() || null
        ],
        (err, result) => {

            if (err) {
                console.error("Add Timetable Error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to save timetable schedule."
                });
            }

            res.status(201).json({
                success: true,
                message: "Timetable schedule added successfully!",
                data: {
                    timetable_id: result.insertId
                }
            });

        }
    );

});


// =====================================
// GET ALL ANNOUNCEMENTS
// =====================================

router.get("/announcements", (req, res) => {

    const sql = `
        SELECT
            announcement_id,
            title,
            message,
            target_audience,
            created_at
        FROM cf_announcements
        WHERE teacher_id IS NULL
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("Get Announcements Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load announcements."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// =====================================
// PUBLISH ANNOUNCEMENT
// =====================================

router.post("/announcements", (req, res) => {

    const { title, message, target_audience } = req.body;

    if (
        !title?.trim() ||
        !message?.trim() ||
        !target_audience
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill all announcement fields."
        });
    }

    const allowedAudiences = ["students", "teachers", "both"];

    if (!allowedAudiences.includes(target_audience)) {
        return res.status(400).json({
            success: false,
            message: "Invalid announcement audience."
        });
    }

    const sql = `
        INSERT INTO cf_announcements
        (teacher_id, offering_id, title, message, target_audience)
        VALUES (NULL, NULL, ?, ?, ?)
    `;

    db.query(
        sql,
        [title.trim(), message.trim(), target_audience],
        (err, result) => {

            if (err) {
                console.error("Publish Announcement Error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to publish announcement."
                });
            }

            res.status(201).json({
                success: true,
                message: "Announcement published successfully!",
                announcement_id: result.insertId
            });

        }
    );

});

// =====================================
// GET ENROLLMENT APPLICATIONS
// =====================================

router.get("/enrollments", (req, res) => {

    const sql = `
        SELECT
            e.enrollment_id,
            CONCAT('EN-', LPAD(e.enrollment_id, 3, '0')) AS application_id,
            s.student_id,
            s.registration_no,
            s.full_name,
            ac.session_name,
            e.total_credit_hours,
            e.application_date,
            e.application_status,

            (SELECT COUNT(*)
             FROM cf_enrollment_courses ec
             WHERE ec.enrollment_id = e.enrollment_id) * 5000
             AS total_fee,

            p.payment_id,
            p.transaction_id,
            p.payment_method,
            p.amount,
            p.receipt_path,
            p.payment_status,
            p.admin_remarks

        FROM cf_enrollments e

        INNER JOIN cf_students s
            ON e.student_id = s.student_id

        INNER JOIN cf_academic_sessions ac
            ON s.session_id = ac.session_id

        LEFT JOIN cf_payments p
            ON p.payment_id = (
                SELECT MAX(p2.payment_id)
                FROM cf_payments p2
                WHERE p2.enrollment_id = e.enrollment_id
            )

        ORDER BY e.enrollment_id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("Load Enrollments Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load enrollment applications."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// =====================================
// GET ENROLLMENT DETAILS
// =====================================

router.get("/enrollments/:id", (req, res) => {

    const enrollmentId = Number(req.params.id);

    if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid enrollment ID."
        });
    }

    const enrollmentSql = `
        SELECT
            e.enrollment_id,
            CONCAT('EN-', LPAD(e.enrollment_id, 3, '0')) AS application_id,
            s.student_id,
            s.registration_no,
            s.full_name,
            s.father_name,
            s.email,
            ac.session_name,
            e.total_credit_hours,
            e.application_date,
            e.application_status,

            (SELECT COUNT(*)
             FROM cf_enrollment_courses ec
             WHERE ec.enrollment_id = e.enrollment_id) * 5000
             AS total_fee

        FROM cf_enrollments e

        INNER JOIN cf_students s
            ON e.student_id = s.student_id

        INNER JOIN cf_academic_sessions ac
            ON s.session_id = ac.session_id

        WHERE e.enrollment_id = ?
    `;

    db.query(enrollmentSql, [enrollmentId], (err, enrollmentResults) => {

        if (err) {
            console.error("Enrollment Details Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load enrollment details."
            });
        }

        if (enrollmentResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enrollment application not found."
            });
        }

        const coursesSql = `
            SELECT
                s.subject_code,
                s.subject_name,
                ec.credit_hours_snapshot AS credit_hours,
                t.full_name AS teacher_name
            FROM cf_enrollment_courses ec

            INNER JOIN cf_course_offerings o
                ON ec.offering_id = o.offering_id

            INNER JOIN cf_subjects s
                ON o.subject_id = s.subject_id

            LEFT JOIN cf_teachers t
                ON o.teacher_id = t.teacher_id

            WHERE ec.enrollment_id = ?
            ORDER BY s.subject_code
        `;

        db.query(coursesSql, [enrollmentId], (courseError, courses) => {

            if (courseError) {
                console.error("Enrollment Courses Error:", courseError);

                return res.status(500).json({
                    success: false,
                    message: "Unable to load selected subjects."
                });
            }

            res.json({
                success: true,
                data: {
                    ...enrollmentResults[0],
                    subjects: courses
                }
            });

        });

    });

});


// =====================================
// GET FEE DETAILS
// =====================================

router.get("/enrollments/:id/payment", (req, res) => {

    const enrollmentId = Number(req.params.id);

    if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid enrollment ID."
        });
    }

    const sql = `
        SELECT
            payment_id,
            enrollment_id,
            amount,
            transaction_id,
            payment_method,
            payment_date,
            receipt_path,
            payment_status,
            admin_remarks,
            verification_date
        FROM cf_payments
        WHERE enrollment_id = ?
        ORDER BY payment_id DESC
        LIMIT 1
    `;

    db.query(sql, [enrollmentId], (err, results) => {

        if (err) {
            console.error("Fee Details Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load payment details."
            });
        }

        res.json({
            success: true,
            data: results.length ? results[0] : null
        });

    });

});


// =====================================
// APPROVE PAYMENT
// =====================================

router.post("/payments/:id/approve", (req, res) => {

    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment ID."
        });
    }

    const sql = `
        UPDATE cf_payments p

        INNER JOIN cf_enrollments e
            ON p.enrollment_id = e.enrollment_id

        SET
            p.payment_status = 'approved',
            p.verification_date = NOW(),
            e.application_status = 'approved'

        WHERE
            p.payment_id = ?
            AND p.payment_status = 'pending'
    `;

    db.query(sql, [paymentId], (err, result) => {

        if (err) {
            console.error("Approve Payment Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to approve payment."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Pending payment not found."
            });
        }

        res.json({
            success: true,
            message: "Payment and enrollment approved successfully."
        });

    });

});


// =====================================
// REJECT PAYMENT
// =====================================

router.post("/payments/:id/reject", (req, res) => {

    const paymentId = Number(req.params.id);
    const reason = req.body.reason?.trim();

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment ID."
        });
    }

    if (!reason) {
        return res.status(400).json({
            success: false,
            message: "Please enter a rejection reason."
        });
    }

    const detailsSql = `
        SELECT
            p.payment_id,
            p.payment_status,
            e.enrollment_id,
            s.user_id
        FROM cf_payments p

        INNER JOIN cf_enrollments e
            ON p.enrollment_id = e.enrollment_id

        INNER JOIN cf_students s
            ON e.student_id = s.student_id

        WHERE p.payment_id = ?
    `;

    db.query(detailsSql, [paymentId], (err, results) => {

        if (err) {
            console.error("Reject Payment Details Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to find payment details."
            });
        }

        if (results.length === 0 || results[0].payment_status !== "pending") {
            return res.status(404).json({
                success: false,
                message: "Pending payment not found."
            });
        }

        const payment = results[0];

        const updateSql = `
            UPDATE cf_payments
            SET
                payment_status = 'rejected',
                admin_remarks = ?,
                verification_date = NOW()
            WHERE payment_id = ?
              AND payment_status = 'pending'
        `;

        db.query(updateSql, [reason, paymentId], (updateError, updateResult) => {

            if (updateError) {
                console.error("Reject Payment Error:", updateError);

                return res.status(500).json({
                    success: false,
                    message: "Unable to reject payment."
                });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(409).json({
                    success: false,
                    message: "This payment has already been processed."
                });
            }

            const notificationSql = `
                INSERT INTO cf_notifications
                (user_id, title, message)
                VALUES (?, ?, ?)
            `;

            db.query(
                notificationSql,
                [
                    payment.user_id,
                    "Fee Payment Rejected",
                    "Your fee payment proof has been rejected. Reason: " +
                    reason +
                    ". Please upload a new payment proof for the same application."
                ],
                (notificationError) => {

                    if (notificationError) {
                        console.error(
                            "Payment Rejection Notification Error:",
                            notificationError
                        );
                    }

                    res.json({
                        success: true,
                        message: "Payment rejected successfully."
                    });

                }
            );

        });

    });

});

module.exports = router;
