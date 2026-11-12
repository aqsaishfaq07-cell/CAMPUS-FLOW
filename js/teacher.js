
// =====================================
// TEACHER DASHBOARD OVERVIEW
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    loadTeacherOverview();
    loadTeacherCourses();
    loadTeacherStudents();
    loadAttendanceCourses();
    loadMarksCourses();
    loadMarksRecords();
    loadAssignmentCourses();
    loadTeacherAssignments();
    loadSubmittedAssignments(); 
    loadTeacherTimetable();
    loadTeacherNotifications();
    setupAssignmentModal();
    setupAnnouncementModal();
    loadTeacherAnnouncements();


});


// =====================================
// LOAD TEACHER OVERVIEW
// =====================================

async function loadTeacherOverview() {

    try {

        const response = await fetch("/api/teacher/overview");

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to load teacher overview");
            return;
        }

        const teacher = data.teacher;
        const stats = data.stats;


        // =====================================
        // TEACHER INFORMATION
        // =====================================

        document.getElementById("teacherId").textContent =
            teacher.teacher_code || "N/A";

        document.getElementById("teacherName").textContent =
            teacher.full_name || "N/A";

        document.getElementById("teacherDepartment").textContent =
            teacher.department_name || "N/A";


        // =====================================
        // HEADER PROFILE
        // =====================================

        document.getElementById("headerTeacherName").textContent =
            teacher.full_name || "Teacher";

        document.getElementById("teacherAvatar").textContent =
            teacher.full_name
                ? teacher.full_name.charAt(0).toUpperCase()
                : "T";


        // =====================================
        // WELCOME SECTION
        // =====================================

        document.getElementById("welcomeTeacherName").textContent =
            `Welcome, ${teacher.full_name || "Teacher"}!`;


        // =====================================
        // STATISTICS
        // =====================================

        document.getElementById("totalCourses").textContent =
            stats.totalCourses;

        document.getElementById("totalStudents").textContent =
            stats.totalStudents;

        document.getElementById("totalAssignments").textContent =
            stats.totalAssignments;

        document.getElementById("totalAttendance").textContent =
            stats.totalAttendance;


    } catch (error) {

        console.error("Teacher Overview Error:", error);

        alert("Unable to connect to the server!");

    }

}


// =====================================
// LOAD TEACHER ASSIGNED COURSES
// =====================================

async function loadTeacherCourses() {

    try {

        const response = await fetch("/api/teacher/courses");

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to load courses");
            return;
        }

        const courses = data.courses;

        const tableContainer = document.getElementById("coursesTableContainer");
        const emptyState = document.getElementById("coursesEmptyState");
        const tableBody = document.getElementById("coursesTableBody");

        tableBody.innerHTML = "";

        if (courses.length === 0) {

            tableContainer.style.display = "none";
            emptyState.style.display = "block";

            return;
        }

        emptyState.style.display = "none";
        tableContainer.style.display = "block";

        courses.forEach(course => {

            const row = document.createElement("tr");

            const values = [
                course.subject_code,
                course.subject_name,
                course.credit_hours,
                `${course.session_name} (${course.start_year}-${course.end_year})`,
                course.offering_status
            ];

            values.forEach(value => {

                const cell = document.createElement("td");

                cell.textContent = value ?? "N/A";

                row.appendChild(cell);

            });

            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error("Teacher Courses Error:", error);

        alert("Unable to load assigned courses!");

    }

}


// =====================================
// LOAD TEACHER'S ENROLLED STUDENTS
// =====================================

async function loadTeacherStudents() {

    try {

        const response = await fetch("/api/teacher/students");

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to load students");
            return;
        }

        const students = data.students;

        const tableBody = document.querySelector("#students table tbody");

        tableBody.innerHTML = "";

        if (students.length === 0) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td colspan="4" class="empty-table">
                    No enrolled students available.
                </td>
            `;

            tableBody.appendChild(row);

            return;
        }

        students.forEach(student => {

            const row = document.createElement("tr");

            const values = [
                student.registration_no,
                student.full_name,
                `${student.subject_code} - ${student.subject_name}`,
                student.session_name
            ];

            values.forEach(value => {

                const cell = document.createElement("td");

                cell.textContent = value ?? "N/A";

                row.appendChild(cell);

            });

            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error("Teacher Students Error:", error);

        alert("Unable to load enrolled students!");

    }

}


// =====================================
// ATTENDANCE POPUP OPEN / CLOSE
// =====================================

const attendancePopup = document.getElementById("attendancePopup");

document.getElementById("openAttendancePopup").addEventListener("click", () => {
    attendancePopup.style.display = "flex";
});

document.getElementById("closeAttendancePopup").addEventListener("click", () => {
    attendancePopup.style.display = "none";
});

document.getElementById("cancelAttendanceBtn").addEventListener("click", () => {
    attendancePopup.style.display = "none";
});

// Close popup when clicking outside
attendancePopup.addEventListener("click", (event) => {

    if (event.target === attendancePopup) {
        attendancePopup.style.display = "none";
    }

});


// =====================================
// LOAD ATTENDANCE COURSES
// =====================================

async function loadAttendanceCourses() {

    const courseSelect = document.getElementById("attendanceCourse");

    try {

        const response = await fetch("/api/teacher/courses");
        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to load courses");
            return;
        }

        courseSelect.innerHTML = '<option value="">Select Course</option>';

        data.courses.forEach(course => {

            const option = document.createElement("option");

            option.value = course.offering_id;

            option.textContent =
                `${course.subject_code} - ${course.subject_name} (${course.session_name})`;

            courseSelect.appendChild(option);

        });

    } catch (error) {

        console.error("Attendance Courses Error:", error);
        alert("Unable to load attendance courses!");

    }

}


// =====================================
// LOAD STUDENTS FOR SELECTED COURSE
// =====================================

document.getElementById("attendanceCourse").addEventListener("change", loadAttendanceStudents);


async function loadAttendanceStudents() {

    const offeringId = document.getElementById("attendanceCourse").value;

    const tableBody = document.getElementById("attendanceStudentsBody");

    tableBody.innerHTML = "";

    if (!offeringId) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-table">
                    Select a course to load students.
                </td>
            </tr>
        `;

        return;
    }

    try {

        const response = await fetch(`/api/teacher/students/${offeringId}`);

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to load students");
            return;
        }

        const students = data.students;

        if (students.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-table">
                        No approved students enrolled in this course.
                    </td>
                </tr>
            `;

            return;
        }

        students.forEach(student => {

            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            idCell.textContent = student.registration_no;

            const nameCell = document.createElement("td");
            nameCell.textContent = student.full_name;

            const statusCell = document.createElement("td");

            const presentId = `present_${student.enrollment_course_id}`;
            const absentId = `absent_${student.enrollment_course_id}`;
            const radioName = `attendance_${student.enrollment_course_id}`;

            statusCell.innerHTML = `
                <label for="${presentId}">
                    <input type="radio"
                        id="${presentId}"
                        name="${radioName}"
                        value="present">
                    Present
                </label>

                <label for="${absentId}" style="margin-left: 12px;">
                    <input type="radio"
                        id="${absentId}"
                        name="${radioName}"
                        value="absent">
                    Absent
                </label>
            `;

            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(statusCell);

            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error("Attendance Students Error:", error);
        alert("Unable to load course students!");

    }

}


// =====================================
// SAVE ATTENDANCE
// =====================================

document.getElementById("saveAttendanceBtn").addEventListener("click", saveAttendance);


async function saveAttendance() {

    const offeringId = document.getElementById("attendanceCourse").value;
    const attendanceDate = document.getElementById("attendanceDate").value;

    const tableBody = document.getElementById("attendanceStudentsBody");

    if (!offeringId) {
        alert("Please select a course.");
        return;
    }

    if (!attendanceDate) {
        alert("Please select attendance date.");
        return;
    }

    const checkedOptions = tableBody.querySelectorAll(
        'input[type="radio"]:checked'
    );

    const allOptions = tableBody.querySelectorAll(
        'input[type="radio"]'
    );

    if (allOptions.length === 0) {
        alert("No students available for attendance.");
        return;
    }

    const totalStudents = new Set(
        Array.from(allOptions).map(input => input.name)
    ).size;

    if (checkedOptions.length !== totalStudents) {
        alert("Please mark attendance for every student.");
        return;
    }

    const attendance = Array.from(checkedOptions).map(input => {

        const enrollmentCourseId = input.name.replace("attendance_", "");

        return {
            enrollment_course_id: Number(enrollmentCourseId),
            status: input.value
        };

    });

    try {

        const response = await fetch("/api/teacher/attendance", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                offering_id: Number(offeringId),
                attendance_date: attendanceDate,
                attendance: attendance
            })

        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to save attendance.");
            return;
        }

        alert(data.message);

        document.getElementById("attendancePopup").style.display = "none";

        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-table">
                    Select a course to load students.
                </td>
            </tr>
        `;

        document.getElementById("attendanceCourse").value = "";
        document.getElementById("attendanceDate").value = "";

    } catch (error) {

        console.error("Save Attendance Error:", error);

        alert("Unable to save attendance!");

    }

}

// =====================================
// UPLOAD MARKS POPUP OPEN / CLOSE
// =====================================

const marksPopup = document.getElementById("marksPopup");

document.getElementById("openMarksPopup").addEventListener("click", () => {
    marksPopup.style.display = "flex";
});

document.getElementById("closeMarksPopup").addEventListener("click", () => {
    marksPopup.style.display = "none";
});

document.getElementById("cancelMarksPopup").addEventListener("click", () => {
    marksPopup.style.display = "none";
});

marksPopup.addEventListener("click", (event) => {

    if (event.target === marksPopup) {
        marksPopup.style.display = "none";
    }

});


// =====================================
// LOAD TEACHER ASSIGNED COURSES FOR MARKS
// =====================================

async function loadMarksCourses() {

    const courseSelect = document.getElementById("marksCourse");

    try {

        const response = await fetch("/api/teacher/courses");
        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to load assigned courses.");
            return;
        }

        courseSelect.innerHTML = '<option value="">Select Course</option>';

        data.courses.forEach(course => {

            const option = document.createElement("option");

            option.value = course.offering_id;

            option.textContent =
                `${course.subject_code} - ${course.subject_name} (${course.session_name})`;

            courseSelect.appendChild(option);

        });

    } catch (error) {

        console.error("Marks Courses Error:", error);
        alert("Unable to load assigned courses.");

    }

}


// =====================================
// LOAD STUDENTS WHEN COURSE IS SELECTED
// =====================================

document.getElementById("marksCourse").addEventListener(
    "change",
    loadMarksStudents
);


async function loadMarksStudents() {

    const offeringId = document.getElementById("marksCourse").value;

    const tableBody = document.getElementById("studentMarksBody");

    tableBody.innerHTML = "";

    if (!offeringId) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Select a course to load enrolled students.
                </td>
            </tr>
        `;

        return;
    }

    try {

        const response = await fetch(
            `/api/teacher/students/${offeringId}`
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to load students.");
            return;
        }

        const students = data.students;

        if (students.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No approved students enrolled in this course.
                    </td>
                </tr>
            `;

            return;
        }

        students.forEach(student => {

            const row = document.createElement("tr");

            const registrationCell = document.createElement("td");
            registrationCell.textContent = student.registration_no;

            const nameCell = document.createElement("td");
            nameCell.textContent = student.full_name;

            const marksCell = document.createElement("td");

            const marksInput = document.createElement("input");

            marksInput.type = "number";
            marksInput.min = "0";
            marksInput.step = "0.5";
            marksInput.required = true;
            marksInput.placeholder = "Obtained Marks";

            marksInput.className = "student-obtained-marks";

            marksInput.dataset.enrollmentCourseId =
                student.enrollment_course_id;

            marksCell.appendChild(marksInput);

            row.appendChild(registrationCell);
            row.appendChild(nameCell);
            row.appendChild(marksCell);

            tableBody.appendChild(row);

        });

        updateMarksInputLimits();

    } catch (error) {

        console.error("Marks Students Error:", error);

        alert("Unable to load enrolled students.");

    }

}


// =====================================
// UPDATE STUDENT MARKS INPUT LIMITS
// =====================================

document.getElementById("totalMarks").addEventListener(
    "input",
    updateMarksInputLimits
);


function updateMarksInputLimits() {

    const totalMarks = Number(
        document.getElementById("totalMarks").value
    );

    const marksInputs = document.querySelectorAll(
        ".student-obtained-marks"
    );

    marksInputs.forEach(input => {

        if (totalMarks > 0) {
            input.max = totalMarks;
        } else {
            input.removeAttribute("max");
        }

    });

}


// =====================================
// SAVE MARKS TO DATABASE
// =====================================

document.getElementById("marksForm").addEventListener(
    "submit",
    saveStudentMarks
);


async function saveStudentMarks(event) {

    event.preventDefault();

    const offeringId = document.getElementById("marksCourse").value;

    const assessmentType =
        document.getElementById("assessmentType").value;

    const assessmentTitle =
        document.getElementById("assessmentTitle").value.trim();

    const totalMarks =
        Number(document.getElementById("totalMarks").value);

    const assessmentDate =
        document.getElementById("assessmentDate").value;

    const marksInputs = document.querySelectorAll(
        ".student-obtained-marks"
    );

    if (!offeringId) {
        alert("Please select a course.");
        return;
    }

    if (!assessmentType || !assessmentTitle || !assessmentDate) {
        alert("Please complete all assessment details.");
        return;
    }

    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
        alert("Please enter valid total marks.");
        return;
    }

    if (marksInputs.length === 0) {
        alert("No approved students available for this course.");
        return;
    }

    const marks = [];

    for (const input of marksInputs) {

        const obtainedMarks = Number(input.value);

        if (
            input.value === "" ||
            !Number.isFinite(obtainedMarks) ||
            obtainedMarks < 0 ||
            obtainedMarks > totalMarks
        ) {
            alert(
                "Please enter valid marks for every student. Marks cannot exceed total marks."
            );

            input.focus();
            return;
        }

        marks.push({
            enrollment_course_id:
                Number(input.dataset.enrollmentCourseId),

            obtained_marks: obtainedMarks
        });

    }

    const saveButton = document.getElementById("saveMarksBtn");

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {

        const response = await fetch("/api/teacher/marks", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                offering_id: Number(offeringId),
                assessment_type: assessmentType,
                assessment_title: assessmentTitle,
                total_marks: totalMarks,
                assessment_date: assessmentDate,
                marks: marks
            })

        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to save marks.");
            return;
        }

        alert(data.message);

        document.getElementById("marksForm").reset();

        document.getElementById("studentMarksBody").innerHTML = `
            <tr>
                <td colspan="3">
                    Select a course to load enrolled students.
                </td>
            </tr>
        `;

        marksPopup.style.display = "none";

        await loadMarksRecords();

    } catch (error) {

        console.error("Save Student Marks Error:", error);

        alert("Unable to save student marks.");

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = "Save Marks";

    }

}


// =====================================
// LOAD UPLOADED MARKS RECORDS
// =====================================

async function loadMarksRecords() {

    const emptyState = document.getElementById("marksEmptyState");
    const tableContainer = document.getElementById("marksTableContainer");
    const tableBody = document.getElementById("marksRecordsBody");

    try {

        const response = await fetch("/api/teacher/marks");
        const data = await response.json();

        if (!response.ok) {
            console.error(data.message);
            return;
        }

        tableBody.innerHTML = "";

        if (data.records.length === 0) {

            emptyState.style.display = "block";
            tableContainer.style.display = "none";

            return;
        }

        emptyState.style.display = "none";
        tableContainer.style.display = "block";

        data.records.forEach(record => {

            const row = document.createElement("tr");

            const values = [
                `${record.subject_code} - ${record.subject_name} (${record.session_name})`,
                `${record.assessment_title} (${record.assessment_type})`,
                record.total_marks,
                record.assessment_date
            ];

            values.forEach(value => {

                const cell = document.createElement("td");

                cell.textContent = value ?? "N/A";

                row.appendChild(cell);

            });

            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error("Load Marks Records Error:", error);

    }

}


// ===============================
// ASSIGNMENT POPUP
// ===============================

function setupAssignmentModal() {

    const openBtn = document.getElementById("openAssignmentModal");
    const closeBtn = document.getElementById("closeAssignmentModal");
    const modal = document.getElementById("assignmentModal");
    const form = document.getElementById("assignmentForm");

    if (!openBtn || !closeBtn || !modal || !form) {
        console.error("Assignment popup elements not found");
        return;
    }

    // Open popup
    openBtn.addEventListener("click", function (e) {

        e.preventDefault();

        modal.style.display = "flex";

    });

    // Close popup
    closeBtn.addEventListener("click", function () {

        modal.style.display = "none";

    });

    // Close popup when clicking outside
    modal.addEventListener("click", function (e) {

        if (e.target === modal) {
            modal.style.display = "none";
        }

    });

    // Submit assignment
    form.addEventListener("submit", createAssignment);

}


// ===============================
// LOAD ASSIGNED COURSES
// ===============================

async function loadAssignmentCourses() {

    const courseSelect = document.getElementById("assignment-course");

    if (!courseSelect) return;

    try {

        const response = await fetch("/api/teacher/courses");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load courses");
        }

        courseSelect.innerHTML = `
            <option value="">Select Assigned Course</option>
        `;

        data.courses.forEach(course => {

            const option = document.createElement("option");

            option.value = course.offering_id;

            option.textContent =
                `${course.subject_code} - ${course.subject_name} 
                (${course.session_name || course.start_year + "-" + course.end_year})`;

            courseSelect.appendChild(option);

        });

    } catch (error) {

        console.error("Assignment courses error:", error);

        courseSelect.innerHTML = `
            <option value="">Unable to load assigned courses</option>
        `;

    }

}


// ===============================
// CREATE ASSIGNMENT
// ===============================

async function createAssignment(e) {

    e.preventDefault();

    const form = document.getElementById("assignmentForm");
    const submitBtn = form.querySelector(".submit-btn");

    const formData = new FormData(form);

    try {

        submitBtn.disabled = true;
        submitBtn.textContent = "Creating...";

        const response = await fetch("/api/teacher/assignments", {

            method: "POST",

            body: formData

        });

       const responseText = await response.text();

console.log("HTTP Status:", response.status);
console.log("Server Response:", responseText);

let data;

try {
    data = JSON.parse(responseText);
} catch (error) {
    throw new Error(
        "Backend returned HTML instead of JSON. Check browser console and backend terminal."
    );
}

if (!response.ok || !data.success) {
    throw new Error(data.message || "Assignment creation failed");
}

        alert("Assignment created successfully!");

        form.reset();

        document.getElementById("assignmentModal").style.display = "none";

        await loadTeacherAssignments();

    } catch (error) {

        console.error("Create assignment error:", error);

        alert(error.message || "Unable to create assignment");

    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = "Create Assignment";

    }

}


// ===============================
// LOAD TEACHER ASSIGNMENTS
// ===============================
// =====================================
// LOAD TEACHER ASSIGNMENTS
// =====================================

async function loadTeacherAssignments() {

    const assignmentList = document.getElementById("assignmentList");

    if (!assignmentList) return;

    try {

        const response = await fetch("/api/teacher/assignments");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load assignments");
        }

        const assignments = data.assignments || [];

        assignmentList.innerHTML = "";

        if (assignments.length === 0) {

            assignmentList.innerHTML = `
                <div class="empty-state" id="assignmentEmptyState">

                    <div class="empty-icon">▣</div>

                    <h3>No Assignments Created Yet</h3>

                    <p>Your created assignments will appear here.</p>

                </div>
            `;

            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "teacher-assignments-table-wrapper";

        const table = document.createElement("table");
        table.className = "teacher-assignments-table";

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Course</th>
                    <th>Assignment Title</th>
                    <th>Description</th>
                    <th>Due Date</th>
                    <th>Attachment</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement("tbody");

        assignments.forEach(assignment => {

            const row = document.createElement("tr");

            // COURSE
            const courseCell = document.createElement("td");

            courseCell.textContent =
                `${assignment.subject_code || ""} - ${assignment.subject_name || "N/A"} (${assignment.session_name || "N/A"})`;

            // TITLE
            const titleCell = document.createElement("td");

            titleCell.textContent = assignment.title;

            // DESCRIPTION
            const descriptionCell = document.createElement("td");

            descriptionCell.textContent =
                assignment.description || "No description provided";

            // DUE DATE
            const dueDateCell = document.createElement("td");

            dueDateCell.textContent = assignment.due_date
                ? new Date(assignment.due_date).toLocaleString()
                : "N/A";

            // ATTACHMENT
            const attachmentCell = document.createElement("td");

            if (assignment.attachment_path) {

                const fileLink = document.createElement("a");

                fileLink.href =
                    "/" + assignment.attachment_path.replace(/^\/+/, "");

                fileLink.target = "_blank";
                fileLink.rel = "noopener noreferrer";
                fileLink.textContent = "View File";

                attachmentCell.appendChild(fileLink);

            } else {

                attachmentCell.textContent = "No File";

            }

            row.append(
                courseCell,
                titleCell,
                descriptionCell,
                dueDateCell,
                attachmentCell
            );

            tbody.appendChild(row);

        });

        table.appendChild(tbody);
        wrapper.appendChild(table);
        assignmentList.appendChild(wrapper);

    } catch (error) {

        console.error("Load assignments error:", error);

        assignmentList.innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load Assignments</h3>
                <p>Please try again later.</p>
            </div>
        `;

    }

}

// =====================================
// TEACHER ANNOUNCEMENT POPUP
// =====================================

function setupAnnouncementModal() {

    const modal = document.getElementById("announcementModal");
    const addBtn = document.getElementById("addAnnouncementBtn");
    const closeBtn = document.getElementById("closeAnnouncementBtn");
    const cancelBtn = document.getElementById("cancelAnnouncementBtn");
    const form = document.getElementById("announcementForm");

    if (!modal || !addBtn || !closeBtn || !cancelBtn || !form) {
        return;
    }

    // OPEN POPUP
    addBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    // CLOSE POPUP
    function closeModal() {
        modal.style.display = "none";
    }

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    // CLOSE WHEN CLICKING OUTSIDE POPUP
    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            closeModal();
        }

    });

    // CLOSE WITH ESCAPE KEY
    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeModal();
        }

    });

    // LOAD ASSIGNED COURSES
    loadAnnouncementCourses();

}


// =====================================
// LOAD COURSES IN ANNOUNCEMENT DROPDOWN
// =====================================

async function loadAnnouncementCourses() {

    const courseSelect = document.getElementById("announcement-course");

    if (!courseSelect) return;

    try {

        const response = await fetch("/api/teacher/courses");

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to load courses.");
        }

        courseSelect.innerHTML = `
            <option value="">Select Assigned Course</option>
        `;

        result.courses.forEach(course => {

            const option = document.createElement("option");

            option.value = course.offering_id;

            option.textContent =
                `${course.subject_code} - ${course.subject_name} (${course.session_name})`;

            courseSelect.appendChild(option);

        });

    } catch (error) {

        console.error("Announcement Courses Error:", error);

        courseSelect.innerHTML = `
            <option value="">Unable to load courses</option>
        `;

    }

}
// =====================================
// CREATE TEACHER ANNOUNCEMENT
// =====================================

const announcementForm = document.getElementById("announcementForm");

if (announcementForm) {

    announcementForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const offering_id = document.getElementById("announcement-course").value;
        const title = document.getElementById("announcement-title").value.trim();
        const message = document.getElementById("announcement-message").value.trim();

        if (!offering_id || !title || !message) {
            alert("Please fill all announcement fields.");
            return;
        }

        try {

            const response = await fetch("/api/teacher/announcements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    offering_id,
                    title,
                    message
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to publish announcement.");
            }

            alert("Announcement published successfully!");

            announcementForm.reset();

            document.getElementById("announcementModal").style.display = "none";

            loadTeacherAnnouncements();

        } catch (error) {

            console.error("Publish Announcement Error:", error);
            alert(error.message);

        }

    });

}


// =====================================
// LOAD TEACHER ANNOUNCEMENTS
// =====================================
// =====================================
// LOAD TEACHER ANNOUNCEMENTS
// =====================================

async function loadTeacherAnnouncements() {

    const list = document.getElementById("teacherAnnouncementsList");

    if (!list) return;

    try {

        const response = await fetch("/api/teacher/announcements");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to load announcements.");
        }

        list.innerHTML = "";

        if (result.announcements.length === 0) {

            list.innerHTML = `
                <div class="empty-state">
                    <p>No announcements published yet.</p>
                </div>
            `;

            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "teacher-announcements-table-wrapper";

        const table = document.createElement("table");
        table.className = "teacher-announcements-table";

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Course</th>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Published At</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement("tbody");

        result.announcements.forEach(announcement => {

            const row = document.createElement("tr");

            const courseCell = document.createElement("td");
            courseCell.textContent =
                `${announcement.subject_code} - ${announcement.subject_name} (${announcement.session_name})`;

            const titleCell = document.createElement("td");
            titleCell.textContent = announcement.title;

            const messageCell = document.createElement("td");
            messageCell.textContent = announcement.message;

            const dateCell = document.createElement("td");
            dateCell.textContent =
                new Date(announcement.created_at).toLocaleString();

            row.append(
                courseCell,
                titleCell,
                messageCell,
                dateCell
            );

            tbody.appendChild(row);

        });

        table.appendChild(tbody);
        wrapper.appendChild(table);
        list.appendChild(wrapper);

    } catch (error) {

        console.error("Load Announcements Error:", error);

        list.innerHTML = `
            <div class="empty-state">
                <p>Unable to load announcements.</p>
            </div>
        `;

    }

}

// =====================================
// LOAD SUBMITTED ASSIGNMENTS
// =====================================

async function loadSubmittedAssignments() {

    const tableBody = document.getElementById(
        "submittedAssignmentsTableBody"
    );

    try {

        const response = await fetch("/api/teacher/submitted-assignments");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load submissions");
        }

        tableBody.innerHTML = "";

        if (data.submissions.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">No assignments submitted yet.</td>
                </tr>
            `;

            return;
        }

        data.submissions.forEach(submission => {

            const row = document.createElement("tr");

            // COURSE
            const courseCell = document.createElement("td");
            courseCell.textContent =
                `${submission.subject_code} - ${submission.subject_name}`;

            // ASSIGNMENT
            const assignmentCell = document.createElement("td");
            assignmentCell.textContent = submission.assignment_title;

            // STUDENT NAME
            const studentCell = document.createElement("td");
            studentCell.textContent = submission.full_name;

            // REGISTRATION NUMBER
            const regCell = document.createElement("td");
            regCell.textContent = submission.registration_no;

            // SUBMITTED FILE
            const fileCell = document.createElement("td");

            if (submission.submission_path) {

                const fileLink = document.createElement("a");

                fileLink.href =
                    "/" + submission.submission_path.replace(/^\/+/, "");

                fileLink.textContent = "View File";
                fileLink.target = "_blank";

                fileCell.appendChild(fileLink);

            } else {

                fileCell.textContent = "No File";

            }

            // SUBMITTED DATE
            const dateCell = document.createElement("td");

            dateCell.textContent = submission.submitted_at
                ? new Date(submission.submitted_at).toLocaleString()
                : "N/A";

            // STATUS
            const statusCell = document.createElement("td");
            statusCell.textContent = submission.submission_status;

            row.appendChild(courseCell);
            row.appendChild(assignmentCell);
            row.appendChild(studentCell);
            row.appendChild(regCell);
            row.appendChild(fileCell);
            row.appendChild(dateCell);
            row.appendChild(statusCell);

            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error("Submitted Assignments Error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">Failed to load submitted assignments.</td>
            </tr>
        `;

    }

}

// =====================================
// LOAD TEACHER TIMETABLE
// =====================================

async function loadTeacherTimetable() {

    const timetableList = document.getElementById("teacherTimetableList");

    if (!timetableList) return;

    try {

        const response = await fetch("/api/teacher/timetable");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load timetable.");
        }

        timetableList.innerHTML = "";

        if (data.timetable.length === 0) {

            timetableList.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">▦</div>

                    <h3>No Timetable Available</h3>

                    <p>
                        Your timetable will appear here when assigned by admin.
                    </p>

                </div>
            `;

            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "teacher-timetable-table-wrapper";

        const table = document.createElement("table");
        table.className = "teacher-timetable-table";

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Course</th>
                    <th>Session</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Room</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement("tbody");

        data.timetable.forEach(item => {

            const row = document.createElement("tr");

            const values = [
                item.day_of_week,
                `${item.subject_code} - ${item.subject_name}`,
                item.session_name,
                item.start_time,
                item.end_time,
                item.room_no || "N/A"
            ];

            values.forEach(value => {

                const cell = document.createElement("td");

                cell.textContent = value ?? "N/A";

                row.appendChild(cell);

            });

            tbody.appendChild(row);

        });

        table.appendChild(tbody);
        wrapper.appendChild(table);
        timetableList.appendChild(wrapper);

    } catch (error) {

        console.error("Teacher Timetable Error:", error);

        timetableList.innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load Timetable</h3>
                <p>Please try again later.</p>
            </div>
        `;

    }

}

// =====================================
// LOAD TEACHER NOTIFICATIONS
// =====================================

async function loadTeacherNotifications() {

    const notificationList = document.getElementById("teacherNotificationsList");

    if (!notificationList) return;

    try {

        const response = await fetch("/api/teacher/notifications");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load notifications.");
        }

        notificationList.innerHTML = "";

        if (data.notifications.length === 0) {

            notificationList.innerHTML = `
                <div class="notification-item">
                    <div>
                        <h4>No Notifications</h4>
                        <p>You don't have any notifications from admin yet.</p>
                    </div>
                </div>
            `;

            return;
        }

        data.notifications.forEach(notification => {

            const item = document.createElement("div");
            item.className = "notification-item";

            const dot = document.createElement("div");
            dot.className = "notification-dot";

            const content = document.createElement("div");

            const title = document.createElement("h4");
            title.textContent = notification.title;

            const message = document.createElement("p");
            message.textContent = notification.message;

            const date = document.createElement("span");

            date.textContent = notification.created_at
                ? new Date(notification.created_at).toLocaleDateString()
                : "Recent";

            content.appendChild(title);
            content.appendChild(message);

            item.appendChild(dot);
            item.appendChild(content);
            item.appendChild(date);

            notificationList.appendChild(item);

        });

    } catch (error) {

        console.error("Teacher Notifications Error:", error);

        notificationList.innerHTML = `
            <div class="notification-item">
                <div>
                    <h4>Unable to Load Notifications</h4>
                    <p>Please try again later.</p>
                </div>
            </div>
        `;
    }
}