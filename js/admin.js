
document.addEventListener("DOMContentLoaded", () => {

    const offeringModal = document.getElementById("offeringModal");
    const addOfferingBtn = document.getElementById("addOfferingBtn");
    const closeOfferingBtn = document.getElementById("closeOfferingBtn");
    const cancelOfferingBtn = document.getElementById("cancelOfferingBtn");
    const offeringForm = document.getElementById("offeringForm");

    addOfferingBtn.addEventListener("click", () => {
        offeringModal.classList.add("show");
    });

    function closeOfferingModal() {
        offeringModal.classList.remove("show");
        offeringForm.reset();
        document.querySelectorAll("#sessionCheckboxList input[type='checkbox']")
    .forEach(checkbox => checkbox.checked = false);

updateSelectedSessions();
    }

    closeOfferingBtn.addEventListener("click", closeOfferingModal);

    cancelOfferingBtn.addEventListener("click", closeOfferingModal);

    offeringModal.addEventListener("click", (event) => {
        if (event.target === offeringModal) {
            closeOfferingModal();
        }
    });


    // =====================================
    // COURSE OFFERING
    // =====================================

    const offeringSubject = document.getElementById("offeringSubject");
    const offeringDepartment = document.getElementById("offeringDepartment");
    const offeringTeacher = document.getElementById("offeringTeacher");
    const offeringSession = document.getElementById("offeringSession");


    // LOAD SUBJECTS
    async function loadOfferingSubjects() {
        try {
            const response = await fetch("/api/admin/subjects");
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            offeringSubject.innerHTML = '<option value="">Select Subject</option>';

            result.data.forEach(subject => {
                if (Number(subject.is_active) !== 1) return;

                const option = document.createElement("option");
                option.value = subject.subject_id;
                option.textContent = subject.subject_code + " - " + subject.subject_name;
                option.dataset.departmentId = subject.department_id;
                option.dataset.departmentName = subject.department_name;

                offeringSubject.appendChild(option);
            });

        } catch (error) {
            console.error("Offering Subjects Error:", error);
        }
    }


    // SHOW DEPARTMENT AUTOMATICALLY
    offeringSubject.addEventListener("change", () => {
        const selectedOption = offeringSubject.options[offeringSubject.selectedIndex];

        offeringDepartment.innerHTML = '<option value="">Select Department</option>';

        if (!selectedOption.value) return;

        const option = document.createElement("option");
        option.value = selectedOption.dataset.departmentId;
        option.textContent = selectedOption.dataset.departmentName;
        option.selected = true;

        offeringDepartment.appendChild(option);
    });


    // LOAD TEACHERS
    async function loadOfferingTeachers() {
        try {
            const response = await fetch("/api/admin/teachers");
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            offeringTeacher.innerHTML = '<option value="">Select Teacher</option>';

            result.data.forEach(teacher => {
                if (teacher.account_status !== "active") return;

                const option = document.createElement("option");
                option.value = teacher.teacher_id;
                option.textContent = teacher.full_name;

                offeringTeacher.appendChild(option);
            });

        } catch (error) {
            console.error("Offering Teachers Error:", error);
        }
    }


    // LOAD SESSIONS
    async function loadOfferingSessions() {
    try {
        const response = await fetch("/api/admin/sessions");
        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        offeringSession.innerHTML = "";

        const sessionList = document.getElementById("sessionCheckboxList");

        sessionList.innerHTML = "";

        result.data.forEach(session => {

            const option = document.createElement("option");
            option.value = session.session_id;
            option.textContent = session.session_name;

            offeringSession.appendChild(option);

            const label = document.createElement("label");
            label.className = "session-checkbox";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = session.session_id;

            const span = document.createElement("span");
            span.textContent = session.session_name;

            checkbox.addEventListener("change", () => {

                option.selected = checkbox.checked;

                updateSelectedSessions();

            });

            label.appendChild(checkbox);
            label.appendChild(span);

            sessionList.appendChild(label);

        });

        updateSelectedSessions();

    } catch (error) {
        console.error("Offering Sessions Error:", error);
    }
}

// =====================================
// VIEW ALL COURSE OFFERINGS POPUP
// =====================================

const viewOfferingsBtn = document.getElementById("viewOfferingsBtn");
const viewOfferingsModal = document.getElementById("viewOfferingsModal");
const closeOfferingsListBtn = document.getElementById("closeOfferingsListBtn");

// OPEN POPUP
viewOfferingsBtn.addEventListener("click", async () => {
    viewOfferingsModal.classList.add("show");
    await loadOfferings();
});

// CLOSE POPUP
function closeOfferingsListPopup() {
    viewOfferingsModal.classList.remove("show");
}

closeOfferingsListBtn.addEventListener("click", closeOfferingsListPopup);

// CLOSE ON OUTSIDE CLICK
viewOfferingsModal.addEventListener("click", (event) => {
    if (event.target === viewOfferingsModal) {
        closeOfferingsListPopup();
    }
});

// UPDATE SELECTED SESSION NAMES

function updateSelectedSessions() {

    const selected = Array.from(offeringSession.selectedOptions)
        .map(option => option.textContent);

    document.getElementById("selectedSessionText").textContent =
        selected.length ? selected.join(", ") : "Select Session";
}


// OPEN / CLOSE DROPDOWN

document.getElementById("sessionDropdownBtn").addEventListener("click", () => {
    document.getElementById("sessionCheckboxList")
        .classList.toggle("show");
});

    // DISPLAY OFFERINGS
    async function loadOfferings() {
        const offeringsTable = document.getElementById("offeringsTable");

        try {
            const response = await fetch("/api/admin/offerings");
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            offeringsTable.innerHTML = "";

            if (!result.data || result.data.length === 0) {
                offeringsTable.innerHTML = `
                    <tr><td colspan="7">No course offerings found.</td></tr>
                `;
                return;
            }

            result.data.forEach(offering => {
                const row = document.createElement("tr");

                const values = [
                    offering.subject_code + " - " + offering.subject_name,
                    offering.department_name,
                    offering.teacher_name +
    (offering.teacher_status === "inactive" ? " (Inactive)" : " (Active)"),
                    offering.session_name,
                    offering.capacity,
                    offering.offering_status === "available" ? "Available" : "Unavailable"
                ];

                values.forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "-";
                    row.appendChild(cell);
                });

                const actionCell = document.createElement("td");
                const viewButton = document.createElement("button");

                viewButton.type = "button";
                viewButton.className = "view-btn";
                viewButton.textContent = "View";

                viewButton.addEventListener("click", () => {
                    alert(
                        "Course Offering Details\n\n" +
                        "Subject: " + offering.subject_name +
                        "\nDepartment: " + offering.department_name +
                        "\nTeacher: " + offering.teacher_name +
                        "\nSession: " + offering.session_name +
                        "\nCapacity: " + offering.capacity
                    );
                });

                actionCell.appendChild(viewButton);
                row.appendChild(actionCell);

                offeringsTable.appendChild(row);
            });

        } catch (error) {
            console.error("Load Offerings Error:", error);

            offeringsTable.innerHTML = `
                <tr><td colspan="7">Unable to load course offerings.</td></tr>
            `;
        }
    }


    // SAVE COURSE OFFERING
    offeringForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const subject_id = offeringSubject.value;
        const teacher_id = offeringTeacher.value;
        const session_id = Array.from(offeringSession.selectedOptions)
            .map(option => option.value);
        const capacity = document.getElementById("offeringCapacity").value;
        const status = document.getElementById("offeringStatus").value;

        try {
            const response = await fetch("/api/admin/offerings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    subject_id,
                    teacher_id,
                    session_id,
                    capacity,
                    status
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Unable to save offering.");
                return;
            }

            alert("Course offering added successfully!");

            closeOfferingModal();

            await loadOfferings();

        } catch (error) {
            console.error("Offering Save Error:", error);
            alert("Server connection failed. Please try again.");
        }
    });


    // =====================================
    // SUBJECT MANAGEMENT POPUP
    // =====================================

    const subjectModal = document.getElementById("subjectModal");
    const addSubjectBtn = document.getElementById("addSubjectBtn");
    const closeSubjectBtn = document.getElementById("closeSubjectBtn");
    const cancelSubjectBtn = document.getElementById("cancelSubjectBtn");
    const subjectForm = document.getElementById("subjectForm");


    // OPEN POPUP
    addSubjectBtn.addEventListener("click", () => {
        subjectModal.classList.add("show");
    });


    // CLOSE POPUP
    function closeSubjectModal() {
        subjectModal.classList.remove("show");
        subjectForm.reset();
    }

    closeSubjectBtn.addEventListener("click", closeSubjectModal);

    cancelSubjectBtn.addEventListener("click", closeSubjectModal);


    // CLOSE ON OUTSIDE CLICK
    subjectModal.addEventListener("click", (event) => {
        if (event.target === subjectModal) {
            closeSubjectModal();
        }
    });
    // =====================================
// VIEW ALL SUBJECTS POPUP
// =====================================

const viewSubjectsBtn = document.getElementById("viewSubjectsBtn");
const viewSubjectsModal = document.getElementById("viewSubjectsModal");
const closeSubjectsBtn = document.getElementById("closeSubjectsBtn");

// OPEN POPUP
viewSubjectsBtn.addEventListener("click", async () => {
    viewSubjectsModal.classList.add("show");
    await loadSubjects();
});

// CLOSE POPUP
function closeSubjectsPopup() {
    viewSubjectsModal.classList.remove("show");
}

closeSubjectsBtn.addEventListener("click", closeSubjectsPopup);

// CLOSE ON OUTSIDE CLICK
viewSubjectsModal.addEventListener("click", (event) => {
    if (event.target === viewSubjectsModal) {
        closeSubjectsPopup();
    }
});


    // SAVE SUBJECT TO DATABASE
    subjectForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const subject_code = document.getElementById("subjectCode").value.trim();
        const subject_name = document.getElementById("subjectName").value.trim();
        const department_id = document.getElementById("subjectDepartment").value;
        const credit_hours = document.getElementById("subjectCredits").value;
        const status = document.getElementById("subjectStatus").value;

        try {
            const response = await fetch("/api/admin/subjects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    subject_code,
                    subject_name,
                    department_id,
                    credit_hours,
                    status
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Unable to save subject.");
                return;
            }

            alert("Subject added successfully!");

            closeSubjectModal();

            await loadSubjects();
            await loadOfferingSubjects();

        } catch (error) {
            console.error("Subject Save Error:", error);
            alert("Server connection failed. Please try again.");
        }
    });


    // =====================================
    // DEPARTMENT MANAGEMENT POPUP
    // =====================================

    const departmentModal = document.getElementById("departmentModal");
    const addDepartmentBtn = document.getElementById("addDepartmentBtn");
    const closeDepartmentBtn = document.getElementById("closeDepartmentBtn");
    const cancelDepartmentBtn = document.getElementById("cancelDepartmentBtn");
    const departmentForm = document.getElementById("departmentForm");


    // OPEN POPUP
    addDepartmentBtn.addEventListener("click", () => {
        departmentModal.classList.add("show");
    });


    // CLOSE POPUP
    function closeDepartmentModal() {
        departmentModal.classList.remove("show");
        departmentForm.reset();
    }

    closeDepartmentBtn.addEventListener("click", closeDepartmentModal);

    cancelDepartmentBtn.addEventListener("click", closeDepartmentModal);


    // CLOSE WHEN CLICKING OUTSIDE
    departmentModal.addEventListener("click", (event) => {
        if (event.target === departmentModal) {
            closeDepartmentModal();
        }
    });


    // SAVE DEPARTMENT TO DATABASE
    departmentForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const department_code = document.getElementById("departmentCode").value.trim();
        const department_name = document.getElementById("departmentName").value.trim();

        try {
            const response = await fetch("http://localhost:3000/api/admin/departments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    department_code,
                    department_name
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Unable to save department.");
                return;
            }

            alert("Department added successfully!");

            closeDepartmentModal();

            await loadStudentDepartments();
await loadTeacherDepartments();
await loadSubjectDepartments();
await loadDepartments();

        } catch (error) {
            console.error("Department Save Error:", error);
            alert("Server connection failed. Please try again.");
        }
    });


// =====================================
// VIEW DEPARTMENTS
// =====================================

const viewDepartmentsBtn = document.getElementById("viewDepartmentsBtn");
const departmentsViewModal = document.getElementById("departmentsViewModal");
const closeDepartmentsViewBtn = document.getElementById("closeDepartmentsViewBtn");

viewDepartmentsBtn.addEventListener("click", () => {
    departmentsViewModal.classList.add("show");
});

closeDepartmentsViewBtn.addEventListener("click", () => {
    departmentsViewModal.classList.remove("show");
});

departmentsViewModal.addEventListener("click", (event) => {
    if (event.target === departmentsViewModal) {
        departmentsViewModal.classList.remove("show");
    }
});


    // =====================================
    // STUDENT MANAGEMENT POPUP
    // =====================================

    const studentModal = document.getElementById("studentModal");
    const addStudentBtn = document.getElementById("addStudentBtn");
    // VIEW STUDENT POPUP
const viewStudentModal = document.getElementById("viewStudentModal");
const closeViewStudentBtn = document.getElementById("closeViewStudentBtn");
const closeViewStudentBtn2 = document.getElementById("closeViewStudentBtn2");

let selectedStudentId = null;

// CLOSE VIEW POPUP
function closeViewStudentPopup() {
    viewStudentModal.classList.remove("show");
    selectedStudentId = null;
}

closeViewStudentBtn.addEventListener("click", closeViewStudentPopup);
closeViewStudentBtn2.addEventListener("click", closeViewStudentPopup);

viewStudentModal.addEventListener("click", (event) => {
    if (event.target === viewStudentModal) {
        closeViewStudentPopup();
    }
});

// =====================================
// VIEW STUDENTS POPUP
// =====================================

const viewStudentsBtn = document.getElementById("viewStudentsBtn");
const studentsViewModal = document.getElementById("studentsViewModal");
const closeStudentsViewBtn = document.getElementById("closeStudentsViewBtn");

viewStudentsBtn.addEventListener("click", () => {
    studentsViewModal.classList.add("show");
});

closeStudentsViewBtn.addEventListener("click", () => {
    studentsViewModal.classList.remove("show");
});

studentsViewModal.addEventListener("click", (event) => {
    if (event.target === studentsViewModal) {
        studentsViewModal.classList.remove("show");
    }
});

// =====================================
// ACTIVATE / DEACTIVATE STUDENT
// =====================================

const toggleStudentStatusBtn = document.getElementById("toggleStudentStatusBtn");

toggleStudentStatusBtn.addEventListener("click", async () => {

    if (!selectedStudentId) {
        alert("Please select a student.");
        return;
    }

    const currentStatus = document.getElementById("viewStudentStatus")
        .value.toLowerCase();

    const newStatus = currentStatus === "active" ? "inactive" : "active";

    const confirmMessage = newStatus === "inactive"
        ? "Are you sure you want to deactivate this student?"
        : "Are you sure you want to activate this student?";

    if (!confirm(confirmMessage)) return;

    try {
        const response = await fetch(
            `/api/admin/students/${selectedStudentId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    account_status: newStatus
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Unable to update student status.");
            return;
        }

        document.getElementById("viewStudentStatus").value =
            newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

        toggleStudentStatusBtn.textContent =
            newStatus === "active"
                ? "Deactivate Student"
                : "Activate Student";

        alert(result.message);

        await loadStudents();

    } catch (error) {
        console.error("Student Status Error:", error);
        alert("Unable to update student status.");
    }
});

    const closeStudentBtn = document.getElementById("closeStudentBtn");
    const cancelStudentBtn = document.getElementById("cancelStudentBtn");
    const studentForm = document.getElementById("studentForm");


    // OPEN POPUP
    addStudentBtn.addEventListener("click", () => {
        studentModal.classList.add("show");
    });


    // CLOSE POPUP
    function closeStudentPopup() {
        studentModal.classList.remove("show");
        studentForm.reset();
    }

    closeStudentBtn.addEventListener("click", closeStudentPopup);

    cancelStudentBtn.addEventListener("click", closeStudentPopup);


    // CLOSE WHEN CLICKING OUTSIDE
    studentModal.addEventListener("click", (event) => {
        if (event.target === studentModal) {
            closeStudentPopup();
        }
    });


    // SAVE STUDENT TO DATABASE
    studentForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const registration_no =
            document.getElementById("studentId").value.trim();

        const full_name =
            document.getElementById("studentName").value.trim();

        const father_name =
            document.getElementById("studentFatherName").value.trim();

        const email =
            document.getElementById("studentEmail").value.trim();

        const department_id =
            document.getElementById("studentDepartment").value;

        const session_id =
            document.getElementById("studentSession").value;

        const password =
            document.getElementById("studentPassword").value;

        try {

            const response = await fetch(
                "http://localhost:3000/api/admin/students",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        registration_no,
                        full_name,
                        father_name,
                        email,
                        department_id,
                        session_id,
                        password
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Unable to save student.");
                return;
            }

            alert("Student added successfully!");

            closeStudentPopup();

            await loadStudents();

        } catch (error) {

            console.error("Student Save Error:", error);

            alert("Server connection failed. Please try again.");

        }

    });


    // =====================================
    // DISPLAY STUDENTS
    // =====================================

    async function loadStudents() {

        const studentsTable = document.getElementById("studentsTable");

        try {

            const [studentResponse, departmentResponse, sessionResponse] =
                await Promise.all([

                    fetch("http://localhost:3000/api/admin/students"),

                    fetch("http://localhost:3000/api/admin/departments"),

                    fetch("http://localhost:3000/api/admin/sessions")

                ]);

            const studentResult = await studentResponse.json();
            const departmentResult = await departmentResponse.json();
            const sessionResult = await sessionResponse.json();

            if (
                !studentResponse.ok ||
                !departmentResponse.ok ||
                !sessionResponse.ok
            ) {
                throw new Error("Unable to load student information.");
            }

            studentsTable.innerHTML = "";

            if (!studentResult.data || studentResult.data.length === 0) {

                studentsTable.innerHTML = `
                    <tr>
                        <td colspan="7">No students found.</td>
                    </tr>
                `;

                return;
            }


            // CREATE DEPARTMENT AND SESSION LOOKUP

            const departmentMap = new Map(
                departmentResult.data.map(department => [
                    String(department.department_id),
                    department.department_name
                ])
            );

            const sessionMap = new Map(
                sessionResult.data.map(session => [
                    String(session.session_id),
                    session.session_name
                ])
            );


            // DISPLAY STUDENTS

            studentResult.data.forEach(student => {

                const row = document.createElement("tr");

                const values = [
                    student.registration_no,
                    student.full_name,
                    departmentMap.get(String(student.department_id)) || "-",
                    sessionMap.get(String(student.session_id)) || "-",
                    student.email
                ];

                values.forEach(value => {

                    const cell = document.createElement("td");

                    cell.textContent = value || "-";

                    row.appendChild(cell);

                });


                // STATUS

                const statusCell = document.createElement("td");

                const status = document.createElement("span");

                const active =
                    !student.account_status ||
                    student.account_status.toLowerCase() === "active";

                status.className = active
                    ? "status approved"
                    : "status";

                status.textContent = active ? "Active" : "Inactive";

                statusCell.appendChild(status);

                row.appendChild(statusCell);


                // VIEW BUTTON

                const actionCell = document.createElement("td");

                const viewButton = document.createElement("button");

                viewButton.type = "button";
                viewButton.className = "view-btn";
                viewButton.textContent = "View";

                viewButton.addEventListener("click", () => {

    selectedStudentId = student.student_id;

    document.getElementById("viewStudentId").value =
        student.registration_no || "";

    document.getElementById("viewStudentName").value =
        student.full_name || "";

    document.getElementById("viewStudentFatherName").value =
        student.father_name || "N/A";

    document.getElementById("viewStudentEmail").value =
        student.email || "";

    document.getElementById("viewStudentDepartment").value =
        departmentMap.get(String(student.department_id)) || "-";

    document.getElementById("viewStudentSession").value =
        sessionMap.get(String(student.session_id)) || "-";

    const status = String(student.account_status || "active").toLowerCase();

    document.getElementById("viewStudentStatus").value =
        status.charAt(0).toUpperCase() + status.slice(1);

    document.getElementById("toggleStudentStatusBtn").textContent =
        status === "active" ? "Deactivate Student" : "Activate Student";

    viewStudentModal.classList.add("show");
});

                actionCell.appendChild(viewButton);

                row.appendChild(actionCell);

                studentsTable.appendChild(row);

            });

        } catch (error) {

            console.error("Load Students Error:", error);

            studentsTable.innerHTML = `
                <tr>
                    <td colspan="7">Unable to load students.</td>
                </tr>
            `;

        }

    }


    // =====================================
    // TEACHER MANAGEMENT POPUP
    // =====================================

    const teacherModal = document.getElementById("teacherModal");
    const addTeacherBtn = document.getElementById("addTeacherBtn");
    const closeTeacherModal = document.getElementById("closeTeacherModal");
    const cancelTeacherModal = document.getElementById("cancelTeacherModal");
    const teacherForm = document.getElementById("teacherForm");


    // OPEN POPUP
    addTeacherBtn.addEventListener("click", () => {
        teacherModal.classList.add("show");
    });


    // CLOSE POPUP
    function closeTeacherPopup() {
        teacherModal.classList.remove("show");
        teacherForm.reset();
    }

    closeTeacherModal.addEventListener("click", closeTeacherPopup);

    cancelTeacherModal.addEventListener("click", closeTeacherPopup);


    // CLOSE WHEN CLICKING OUTSIDE
    teacherModal.addEventListener("click", (event) => {
        if (event.target === teacherModal) {
            closeTeacherPopup();
        }
    });

    // =====================================
// VIEW ALL TEACHERS POPUP
// =====================================

const viewTeachersBtn = document.getElementById("viewTeachersBtn");
const viewTeachersListModal = document.getElementById("viewTeachersListModal");
const closeTeachersListBtn = document.getElementById("closeTeachersListBtn");

// OPEN POPUP
viewTeachersBtn.addEventListener("click", async () => {
    viewTeachersListModal.classList.add("show");
    await loadTeachers();
});

// CLOSE POPUP
function closeTeachersListPopup() {
    viewTeachersListModal.classList.remove("show");
}

closeTeachersListBtn.addEventListener("click", closeTeachersListPopup);

// CLOSE ON OUTSIDE CLICK
viewTeachersListModal.addEventListener("click", (event) => {
    if (event.target === viewTeachersListModal) {
        closeTeachersListPopup();
    }
});

    // =====================================
    // VIEW TEACHER DETAILS POPUP
    // =====================================

    const viewTeacherModal = document.getElementById("viewTeacherModal");
    const closeViewTeacherBtn = document.getElementById("closeViewTeacherBtn");
    const closeViewTeacherBtn2 = document.getElementById("closeViewTeacherBtn2");
    

    function closeViewTeacherPopup() {
        viewTeacherModal.classList.remove("show");
    }

    closeViewTeacherBtn.addEventListener("click", closeViewTeacherPopup);

    closeViewTeacherBtn2.addEventListener("click", closeViewTeacherPopup);

    viewTeacherModal.addEventListener("click", (event) => {
        if (event.target === viewTeacherModal) {
            closeViewTeacherPopup();
        }
    });

    // SAVE TEACHER TO DATABASE
    teacherForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const teacher_code = document.getElementById("teacherId").value.trim();
        const full_name = document.getElementById("teacherName").value.trim();
        const email = document.getElementById("teacherEmail").value.trim();
        const department_id = document.getElementById("teacherDepartment").value;
        const password = document.getElementById("teacherPassword").value;

        try {
            const response = await fetch("/api/admin/teachers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    teacher_code,
                    full_name,
                    email,
                    department_id,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Unable to save teacher.");
                return;
            }

            alert("Teacher added successfully!");

            closeTeacherPopup();

            await loadTeachers();
            await loadOfferingTeachers();

        } catch (error) {
            console.error("Teacher Save Error:", error);
            alert("Server connection failed. Please try again.");
        }
    });
const teacherSessionModal = document.getElementById("teacherSessionModal");
const closeTeacherSessionModal = document.getElementById("closeTeacherSessionModal");
const cancelTeacherSession = document.getElementById("cancelTeacherSession");
const toggleTeacherStatusBtn = document.getElementById("toggleTeacherStatusBtn");

function closeTeacherSessionPopup() {
    teacherSessionModal.classList.remove("show");
}

closeTeacherSessionModal.addEventListener("click", closeTeacherSessionPopup);
cancelTeacherSession.addEventListener("click", closeTeacherSessionPopup);

teacherSessionModal.addEventListener("click", (event) => {
    if (event.target === teacherSessionModal) {
        closeTeacherSessionPopup();
    }
});

// LOAD TEACHER DEACTIVATION SESSIONS
async function loadTeacherDeactivateSessions() {

    const sessionSelect = document.getElementById("teacherDeactivateSession");

    sessionSelect.innerHTML = '<option value="">Loading sessions...</option>';

    try {
        const response = await fetch(
            `/api/admin/teachers/${selectedTeacherId}/sessions`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        sessionSelect.innerHTML = '<option value="">Select Session</option>';

        if (!result.data || result.data.length === 0) {
            sessionSelect.innerHTML = '<option value="">No assigned sessions found</option>';
            return;
        }

        result.data.forEach(session => {
            const option = document.createElement("option");
            option.value = session.session_id;
            option.textContent = session.session_name;
            sessionSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Teacher Sessions Error:", error);
        sessionSelect.innerHTML = '<option value="">Unable to load sessions</option>';
    }
}
// DEACTIVATE OR REACTIVATE TEACHER
toggleTeacherStatusBtn.addEventListener("click", async () => {

    const status = document.getElementById("viewTeacherStatus").value.toLowerCase();

    // DEACTIVATE
    if (status === "active") {

        teacherSessionModal.classList.add("show");
        loadTeacherDeactivateSessions();
        return;
    }

    // REACTIVATE
    if (status === "inactive") {

        if (!confirm("Are you sure you want to reactivate this teacher?")) {
            return;
        }

        try {

            const response = await fetch(
                `/api/admin/teachers/${selectedTeacherId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "active"
                    })
                }
            );

            const responseText = await response.text();

console.log("Status:", response.status);
console.log("Response:", responseText);

let result;

try {
    result = JSON.parse(responseText);
} catch (error) {
    alert("Server returned HTML instead of JSON. Check Console.");
    return;
}

            if (!response.ok) {
                alert(result.message || "Unable to activate teacher.");
                return;
            }

            alert(result.message);

            document.getElementById("viewTeacherStatus").value = "Active";
            toggleTeacherStatusBtn.textContent = "Deactivate Teacher";

            await loadTeachers();

        } catch (error) {

            console.error("Teacher Activation Error:", error);
            alert("Unable to activate teacher.");

        }
    }

});

// CHECK SELECTED SESSION COURSES
document.getElementById("checkTeacherSessionBtn").addEventListener("click", async () => {

    const sessionId = document.getElementById("teacherDeactivateSession").value;

    if (!sessionId) {
        alert("Please select an academic session.");
        return;
    }

    try {
        const sessionsResponse = await fetch(
            `/api/admin/teachers/${selectedTeacherId}/sessions`
        );

        const sessionsResult = await sessionsResponse.json();

        if (!sessionsResponse.ok) {
            throw new Error(sessionsResult.message);
        }

        let allCourses = [];

        for (const session of sessionsResult.data) {

            const response = await fetch(
                `/api/admin/teachers/${selectedTeacherId}/sessions/${session.session_id}/courses`
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            result.data.forEach(course => {
                allCourses.push({
                    ...course,
                    session_name: session.session_name
                });
            });
        }

        const coursesWithStudents = allCourses.filter(
            course => Number(course.enrolled_students) > 0
        );

        const replacementSection = document.getElementById("teacherReplacementSection");
        const replacementList = document.getElementById("teacherReplacementList");
        const confirmBtn = document.getElementById("confirmTeacherDeactivation");

        replacementList.innerHTML = "";

        if (coursesWithStudents.length === 0) {

            replacementSection.style.display = "none";
            confirmBtn.style.display = "inline-block";

            alert("No approved students are enrolled in any assigned session. Teacher can be deactivated.");

        } else {

            const teachersResponse = await fetch("/api/admin/teachers");
            const teachersResult = await teachersResponse.json();

            if (!teachersResponse.ok) {
                throw new Error(teachersResult.message);
            }

            const activeTeachers = teachersResult.data.filter(teacher =>
                teacher.account_status === "active" &&
                Number(teacher.teacher_id) !== Number(selectedTeacherId)
            );

            coursesWithStudents.forEach(course => {

                const group = document.createElement("div");
                group.className = "form-group";

                const label = document.createElement("label");

                label.textContent =
                    `${course.session_name} | ${course.subject_code} | ${course.enrolled_students} approved students`;

                const select = document.createElement("select");

                select.className = "replacement-teacher-select";
                select.dataset.offeringId = course.offering_id;
                select.required = true;

                select.innerHTML =
                    '<option value="">Select Replacement Teacher</option>';

                activeTeachers.forEach(teacher => {

                    const option = document.createElement("option");

                    option.value = teacher.teacher_id;
                    option.textContent =
                        `${teacher.full_name} (${teacher.teacher_code})`;

                    select.appendChild(option);
                });

                group.appendChild(label);
                group.appendChild(select);

                replacementList.appendChild(group);
            });

            replacementSection.style.display = "block";
            confirmBtn.style.display = "inline-block";
        }

    } catch (error) {
        console.error("Teacher Course Check Error:", error);
        alert("Unable to check assigned courses and students.");
    }
});

// CONFIRM TEACHER DEACTIVATION
document.getElementById("confirmTeacherDeactivation").addEventListener("click", async () => {

    const replacementSelects = document.querySelectorAll(
        "#teacherReplacementList .replacement-teacher-select"
    );

    const replacements = [];

    for (const select of replacementSelects) {

        if (!select.value) {
            alert("Please select a replacement teacher for every course.");
            return;
        }

        replacements.push({
            offering_id: Number(select.dataset.offeringId),
            teacher_id: Number(select.value)
        });
    }

    const confirm = window.confirm(
        "Are you sure you want to deactivate this teacher?"
    );

    if (!confirm) return;

    try {

        const response = await fetch(
            `/api/admin/teachers/${selectedTeacherId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
               body: JSON.stringify({
    status: "inactive",
    session_id: Number(
        document.getElementById("teacherDeactivateSession").value
    ),
    replacements: replacements
})
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        alert(result.message);

        teacherSessionModal.classList.remove("show");
        viewTeacherModal.classList.remove("show");

        document.getElementById("viewTeacherStatus").value = "Inactive";
        document.getElementById("toggleTeacherStatusBtn").textContent =
            "Activate Teacher";

        document.getElementById("teacherReplacementList").innerHTML = "";
        document.getElementById("teacherReplacementSection").style.display = "none";
        document.getElementById("confirmTeacherDeactivation").style.display = "none";

        loadTeachers();

    } catch (error) {

        console.error("Teacher Deactivation Error:", error);
        alert(error.message || "Unable to deactivate teacher.");

    }

});

    // LOAD TEACHER DEPARTMENTS

    async function loadTeacherDepartments() {
        const select = document.getElementById("teacherDepartment");

        try {
            const response = await fetch("/api/admin/departments");
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            select.innerHTML = '<option value="">Select Department</option>';

            result.data.forEach(dept => {
                const option = document.createElement("option");

                option.value = dept.department_id;
                option.textContent = dept.department_name;

                select.appendChild(option);
            });

        } catch (error) {
            console.error("Teacher Department Error:", error);

            select.innerHTML =
                '<option value="">Unable to load departments</option>';
        }
    }


    // =====================================
    // LOAD SUBJECT DEPARTMENTS
    // =====================================

    async function loadSubjectDepartments() {
        const select = document.getElementById("subjectDepartment");

        try {
            const response = await fetch("/api/admin/departments");
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            select.innerHTML = '<option value="">Select Department</option>';

            result.data.forEach(dept => {
                const option = document.createElement("option");

                option.value = dept.department_id;
                option.textContent = dept.department_name;

                select.appendChild(option);
            });

        } catch (error) {
            console.error("Subject Department Error:", error);

            select.innerHTML =
                '<option value="">Unable to load departments</option>';
        }
    }


    // =====================================
    // DISPLAY SUBJECTS IN DASHBOARD
    // =====================================

    async function loadSubjects() {
        const subjectsTable = document.getElementById("subjectsTable");

        try {
            const response = await fetch("/api/admin/subjects");
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            subjectsTable.innerHTML = "";

            if (!result.data || result.data.length === 0) {
                subjectsTable.innerHTML = `
                    <tr>
                        <td colspan="7">No subjects found.</td>
                    </tr>
                `;
                return;
            }

            result.data.forEach(subject => {
                const row = document.createElement("tr");

                const values = [
                    subject.subject_code,
                    subject.subject_name,
                    subject.department_name,
                    subject.credit_hours,
                    "Rs. 5,000"
                ];

                values.forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "-";
                    row.appendChild(cell);
                });


                // STATUS

                const statusCell = document.createElement("td");
                const status = document.createElement("span");

                const active = Number(subject.is_active) === 1;

                status.className = active
                    ? "status approved"
                    : "status";

                status.textContent = active ? "Active" : "Inactive";

                statusCell.appendChild(status);
                row.appendChild(statusCell);


                // VIEW BUTTON

                const actionCell = document.createElement("td");
                const viewButton = document.createElement("button");

                viewButton.type = "button";
                viewButton.className = "view-btn";
                viewButton.textContent = "View";

                viewButton.addEventListener("click", () => {
                    alert(
                        "Subject Details\n\n" +
                        "Subject Code: " + subject.subject_code +
                        "\nSubject Name: " + subject.subject_name +
                        "\nDepartment: " + subject.department_name +
                        "\nCredit Hours: " + subject.credit_hours +
                        "\nFee: Rs. 5,000" +
                        "\nStatus: " + (active ? "Active" : "Inactive")
                    );
                });

                actionCell.appendChild(viewButton);
                row.appendChild(actionCell);

                subjectsTable.appendChild(row);
            });

        } catch (error) {
            console.error("Load Subjects Error:", error);

            subjectsTable.innerHTML = `
                <tr>
                    <td colspan="7">Unable to load subjects.</td>
                </tr>
            `;
        }
    }


    // =====================================
    // DISPLAY TEACHERS
    // =====================================

    async function loadTeachers() {
        const teachersTable = document.getElementById("teachersTable");

        try {
            const response = await fetch("/api/admin/teachers");
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            teachersTable.innerHTML = "";

            if (!result.data || result.data.length === 0) {
                teachersTable.innerHTML = `
                    <tr>
                        <td colspan="7">No teachers found.</td>
                    </tr>
                `;
                return;
            }

            result.data.forEach(teacher => {
                const row = document.createElement("tr");

                const values = [
                    teacher.teacher_code,
                    teacher.full_name,
                    teacher.department_name,
                    teacher.email,
                    teacher.assigned_subjects
                ];

                values.forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "-";
                    row.appendChild(cell);
                });

                const statusCell = document.createElement("td");
                const status = document.createElement("span");

                const active = teacher.account_status === "active";

                status.className = active ? "status approved" : "status";
                status.textContent = active ? "Active" : "Inactive";

                statusCell.appendChild(status);
                row.appendChild(statusCell);

                const actionCell = document.createElement("td");
                const viewButton = document.createElement("button");

                viewButton.type = "button";
                viewButton.className = "view-btn";
                viewButton.textContent = "Manage";

                viewButton.addEventListener("click", () => {

    selectedTeacherId = teacher.teacher_id;

    document.getElementById("viewTeacherId").value =
        teacher.teacher_code || "";

    document.getElementById("viewTeacherName").value =
        teacher.full_name || "";

    document.getElementById("viewTeacherEmail").value =
        teacher.email || "";

    document.getElementById("viewTeacherDepartment").value =
        teacher.department_name || "";

    document.getElementById("viewTeacherSubjects").value =
        teacher.assigned_subjects ?? "0";

    const status = String(teacher.account_status || "active").toLowerCase();

    document.getElementById("viewTeacherStatus").value =
        status.charAt(0).toUpperCase() + status.slice(1);

    document.getElementById("toggleTeacherStatusBtn").textContent =
        status === "active" ? "Deactivate Teacher" : "Activate Teacher";

    viewTeacherModal.classList.add("show");
});

                actionCell.appendChild(viewButton);
                row.appendChild(actionCell);

                teachersTable.appendChild(row);
            });

        } catch (error) {
            console.error("Load Teachers Error:", error);

            teachersTable.innerHTML = `
                <tr>
                    <td colspan="7">Unable to load teachers.</td>
                </tr>
            `;
        }
    }


    // =====================================
    // SESSION MANAGEMENT POPUP
    // =====================================

    const sessionModal = document.getElementById("sessionModal");
    const addSessionBtn = document.getElementById("addSessionBtn");
    const closeSessionBtn = document.getElementById("closeSessionBtn");
    const cancelSessionBtn = document.getElementById("cancelSessionBtn");
    const sessionForm = document.getElementById("sessionForm");


    // OPEN POPUP
    addSessionBtn.addEventListener("click", () => {
        sessionModal.classList.add("show");
    });


    // CLOSE POPUP
    function closeSessionModal() {
        sessionModal.classList.remove("show");
        sessionForm.reset();
    }

    closeSessionBtn.addEventListener("click", closeSessionModal);

    cancelSessionBtn.addEventListener("click", closeSessionModal);


    // CLOSE WHEN CLICKING OUTSIDE
    sessionModal.addEventListener("click", (event) => {
        if (event.target === sessionModal) {
            closeSessionModal();
        }
    });


    // SAVE SESSION TO DATABASE

    sessionForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const session_name = document.getElementById("sessionName").value.trim();
        const eligibility_rule = document.getElementById("sessionEligibility").value;
        const max_credits = document.getElementById("sessionCredits").value;
        const status = document.getElementById("sessionStatus").value;

        try {

            const response = await fetch("http://localhost:3000/api/admin/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    session_name,
                    eligibility_rule,
                    max_credits,
                    status
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Unable to save session.");
                return;
            }

            alert("Academic Session added successfully!");

            closeSessionModal();

            await loadStudentSessions();

        } catch (error) {

            console.error("Session Save Error:", error);

            alert("Server connection failed. Please try again.");

        }

    });

// =====================================
// VIEW ACADEMIC SESSIONS
// =====================================

const viewSessionsBtn = document.getElementById("viewSessionsBtn");
const sessionsViewModal = document.getElementById("sessionsViewModal");
const closeSessionsViewBtn = document.getElementById("closeSessionsViewBtn");

viewSessionsBtn.addEventListener("click", () => {
    sessionsViewModal.classList.add("show");
});

closeSessionsViewBtn.addEventListener("click", () => {
    sessionsViewModal.classList.remove("show");
});

sessionsViewModal.addEventListener("click", (event) => {
    if (event.target === sessionsViewModal) {
        sessionsViewModal.classList.remove("show");
    }
});

// =====================================
// EDIT SESSION RULE POPUP
// =====================================

const editRuleModal = document.getElementById("editRuleModal");
const editRuleForm = document.getElementById("editRuleForm");

const closeEditRuleBtn = document.getElementById("closeEditRuleBtn");
const cancelEditRuleBtn = document.getElementById("cancelEditRuleBtn");

let editingSessionId = null;

const sessionsTable = document.getElementById("sessionsTable");

sessionsTable.addEventListener("click", (event) => {

    const button = event.target.closest("button");

    if (!button || !button.textContent.includes("Edit Rule")) {
        return;
    }

    const row = button.closest("tr");
    const cells = row.querySelectorAll("td");

    editingSessionId = button.dataset.id;

    document.getElementById("editRuleSession").value =
        cells[0].textContent.trim();

    document.getElementById("editRuleCredits").value =
        cells[2].textContent.trim();

    document.getElementById("editRuleFee").value =
        cells[3].textContent.replace(/[^\d.]/g, "");

    editRuleModal.classList.add("show");
});

function closeEditRuleModal() {
    editRuleModal.classList.remove("show");
    editRuleForm.reset();
    editingSessionId = null;
}

closeEditRuleBtn.addEventListener("click", closeEditRuleModal);
cancelEditRuleBtn.addEventListener("click", closeEditRuleModal);

editRuleModal.addEventListener("click", (event) => {
    if (event.target === editRuleModal) {
        closeEditRuleModal();
    }
});


// UPDATE SESSION RULES

editRuleForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!editingSessionId) {
        alert("Please select a session.");
        return;
    }

    const max_credit_hours =
        document.getElementById("editRuleCredits").value;

    const enrollment_fee =
        document.getElementById("editRuleFee").value;

    try {

        const response = await fetch(
            `/api/admin/sessions/${editingSessionId}/rules`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    max_credit_hours,
                    enrollment_fee
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Unable to update session rules.");
            return;
        }

        alert(result.message);

        closeEditRuleModal();

        await loadSessions();

    } catch (error) {

        console.error("Update Session Rules Error:", error);

        alert("Unable to update session rules.");

    }

});

// =====================================
// ACTIVATE / DEACTIVATE SESSION
// =====================================

sessionsTable.addEventListener("click", async (event) => {

    const button = event.target.closest(".toggle-session-btn");

    if (!button) return;

    const sessionId = button.dataset.id;
    const currentStatus = Number(button.dataset.status);

    const newStatus = currentStatus === 1 ? 0 : 1;

    const confirmMessage = newStatus === 0
        ? "Are you sure you want to deactivate this session? Students will not be able to submit new enrollment applications."
        : "Are you sure you want to activate this session?";

    if (!confirm(confirmMessage)) return;

    try {

        const response = await fetch(
            `/api/admin/sessions/${sessionId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    is_active: newStatus
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Unable to update session status.");
            return;
        }

        alert(result.message);

        await loadSessions();
        await loadStudentSessions();
        await loadOfferingSessions();

    } catch (error) {

        console.error("Session Status Error:", error);

        alert("Unable to update session status.");

    }

});

    // =====================================
    // DISPLAY DEPARTMENTS FROM DATABASE
    // =====================================

    async function loadStudentDepartments() {
        const select = document.getElementById("studentDepartment");

        try {
            const response = await fetch("/api/admin/departments");
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            select.innerHTML = '<option value="">Select Department</option>';

            result.data.forEach(dept => {
                const option = document.createElement("option");
                option.value = dept.department_id;
                option.textContent = dept.department_name;
                select.appendChild(option);
            });

        } catch (error) {
            console.error("Department Dropdown Error:", error);
            select.innerHTML = '<option value="">Unable to load departments</option>';
        }
    }


    // =====================================
    // DISPLAY DEPARTMENTS IN DASHBOARD
    // =====================================

    async function loadDepartments() {
        const departmentsGrid = document.getElementById("departmentsGrid");

        try {
            const response = await fetch("/api/admin/departments");
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            departmentsGrid.innerHTML = "";

            result.data.forEach(department => {
                const card = document.createElement("div");

                card.className = "management-card";

                card.innerHTML = `
                    <i class="fa-solid fa-building"></i>
                    <h3>${department.department_name}</h3>
                    <p>Department Code: ${department.department_code}</p>
                    <button class="view-btn delete-department-btn" data-id="${department.department_id}">
    <i class="fa-solid fa-trash"></i>
</button>
                `;
// DELETE DEPARTMENT FUNCTIONALITY

const deleteButton = card.querySelector(".delete-department-btn");

deleteButton.addEventListener("click", async () => {

    const departmentId = Number(deleteButton.dataset.id.trim());

console.log("Department ID:", departmentId);
console.log("Delete URL:", `/api/admin/departments/${departmentId}`);

    const confirmDelete = confirm(
        "Are you sure you want to delete this department?"
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(
    `/api/admin/departments/${departmentId}`,
    {
        method: "DELETE"
    }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert(result.message);

        // Refresh department list and related dropdowns
        await loadDepartments();
        await loadStudentDepartments();
        await loadTeacherDepartments();
        await loadSubjectDepartments();

    } catch (error) {
        console.error("Delete Department Error:", error);
        alert("Unable to delete department. Please try again.");
    }

});
                departmentsGrid.appendChild(card);
            });

        } catch (error) {
            console.error("Load Departments Error:", error);
        }
    }


    // =====================================
    // DISPLAY ACADEMIC SESSIONS FROM DATABASE
    // =====================================

    async function loadStudentSessions() {
        const select = document.getElementById("studentSession");

        try {
            const response = await fetch("/api/admin/sessions");
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            select.innerHTML = '<option value="">Select Academic Session</option>';

          result.data.forEach(session => {

    if (Number(session.is_active) !== 1) return;

    const option = document.createElement("option");
    option.value = session.session_id;
    option.textContent = session.session_name;
    select.appendChild(option);
});

        } catch (error) {
            console.error("Session Dropdown Error:", error);
            select.innerHTML = '<option value="">Unable to load sessions</option>';
        }
    }
// =====================================
// LOAD ACADEMIC SESSIONS IN ADMIN TABLE
// =====================================

async function loadSessions() {

    const table = document.getElementById("sessionsTable");

    try {

        const response = await fetch("/api/admin/sessions");
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        table.innerHTML = "";

        if (!result.data || result.data.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6">No academic sessions found.</td>
                </tr>
            `;
            return;
        }

        result.data.forEach(session => {

            const row = document.createElement("tr");

            const eligibility = {
                any_subject: "Any subject",
                previously_studied: "Previously studied subjects",
                admin_selected: "Admin selected"
            };

            const active = Number(session.is_active) === 1;

            row.innerHTML = `
                <td>${session.session_name}</td>

                <td>${eligibility[session.eligibility_mode] || session.eligibility_mode}</td>

                <td>${session.max_credit_hours}</td>

                <td>Rs. ${Number(session.enrollment_fee).toLocaleString("en-PK")}</td>

                <td>
                    <span class="status ${active ? "approved" : ""}">
                        ${active ? "Active" : "Inactive"}
                    </span>
                </td>

                <td>
                    <button type="button"
                        class="view-btn edit-rule-btn"
                        data-id="${session.session_id}">
                        Edit Rule
                    </button>

                    <button type="button"
                        class="view-btn toggle-session-btn"
                        data-id="${session.session_id}"
                        data-status="${active ? 1 : 0}">
                        ${active ? "Deactivate" : "Activate"}
                    </button>
                </td>
            `;

            table.appendChild(row);

        });

    } catch (error) {

        console.error("Load Sessions Error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="6">Unable to load sessions.</td>
            </tr>
        `;

    }
}

    // =====================================
    // TIMETABLE POPUP
    // =====================================

    const scheduleModal = document.getElementById("scheduleModal");
    const addScheduleBtn = document.getElementById("addScheduleBtn");
    const closeScheduleBtn = document.getElementById("closeScheduleBtn");
    const cancelScheduleBtn = document.getElementById("cancelScheduleBtn");

    const scheduleForm = document.getElementById("scheduleForm");
    const scheduleOffering = document.getElementById("scheduleOffering");
    const timetableTable = document.getElementById("timetableTable");


    // OPEN POPUP
    addScheduleBtn.addEventListener("click", () => {
        scheduleModal.style.display = "flex";
        loadScheduleOfferings();
    });


    // CLOSE POPUP
    closeScheduleBtn.addEventListener("click", () => {
        scheduleModal.style.display = "none";
    });

    cancelScheduleBtn.addEventListener("click", () => {
        scheduleModal.style.display = "none";
    });
// =====================================
// VIEW TIMETABLE POPUP
// =====================================

const viewTimetableBtn = document.getElementById("viewTimetableBtn");
const viewTimetableModal = document.getElementById("viewTimetableModal");
const closeTimetableListBtn = document.getElementById("closeTimetableListBtn");

// OPEN POPUP
viewTimetableBtn.addEventListener("click", async () => {
    viewTimetableModal.classList.add("show");
    await loadTimetable();
});

// CLOSE POPUP
function closeTimetableListPopup() {
    viewTimetableModal.classList.remove("show");
}

closeTimetableListBtn.addEventListener("click", closeTimetableListPopup);

// CLOSE ON OUTSIDE CLICK
viewTimetableModal.addEventListener("click", (event) => {
    if (event.target === viewTimetableModal) {
        closeTimetableListPopup();
    }
});

    // =====================================
    // ANNOUNCEMENT POPUP
    // =====================================

    const addAnnouncementBtn = document.getElementById("addAnnouncementBtn");
    const announcementModal = document.getElementById("announcementModal");

    const closeAnnouncementBtn = document.getElementById("closeAnnouncementBtn");
    const cancelAnnouncementBtn = document.getElementById("cancelAnnouncementBtn");

    const announcementForm = document.getElementById("announcementForm");
const viewAnnouncementsBtn = document.getElementById("viewAnnouncementsBtn");
const viewAnnouncementsModal = document.getElementById("viewAnnouncementsModal");
const closeViewAnnouncementsBtn = document.getElementById("closeViewAnnouncementsBtn");

    // OPEN POPUP
    addAnnouncementBtn.addEventListener("click", () => {

        announcementModal.classList.add("show");
        document.body.style.overflow = "hidden";

    });


    // CLOSE POPUP
    closeAnnouncementBtn.addEventListener("click", () => {

        announcementModal.classList.remove("show");
        document.body.style.overflow = "";

    });

// =====================================
// VIEW SAVED ANNOUNCEMENTS
// =====================================

viewAnnouncementsBtn.addEventListener("click", async () => {

    viewAnnouncementsModal.classList.add("show");
    document.body.style.overflow = "hidden";

    await loadAnnouncements();

});


// CLOSE VIEW ANNOUNCEMENTS POPUP

closeViewAnnouncementsBtn.addEventListener("click", () => {

    viewAnnouncementsModal.classList.remove("show");
    document.body.style.overflow = "";

});
    // CANCEL POPUP
    cancelAnnouncementBtn.addEventListener("click", () => {

        announcementModal.classList.remove("show");
        document.body.style.overflow = "";

        announcementForm.reset();

    });


    // =====================================
    // LOAD COURSE OFFERINGS
    // =====================================

    async function loadScheduleOfferings() {

        try {
            const response = await fetch("/api/admin/offerings");
            const result = await response.json();

            scheduleOffering.innerHTML =
                '<option value="">Select Course Offering</option>';

            if (!result.success) {
                alert(result.message || "Unable to load course offerings.");
                return;
            }

            result.data.forEach(offering => {

                if (offering.offering_status !== "available") return;

                const option = document.createElement("option");

                option.value = offering.offering_id;

                option.textContent =
                    `${offering.subject_code} - ${offering.subject_name} | ${offering.teacher_name} | ${offering.session_name}`;

                scheduleOffering.appendChild(option);

            });

        } catch (error) {
            console.error("Load Schedule Offerings Error:", error);
        }
    }


    // =====================================
    // LOAD TIMETABLE
    // =====================================

    async function loadTimetable() {

        try {
            const response = await fetch("/api/admin/timetable");
            const result = await response.json();

            if (!result.success) {
                alert(result.message || "Unable to load timetable.");
                return;
            }

            timetableTable.innerHTML = "";

            result.data.forEach(schedule => {

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${schedule.subject_name}</td>
                    <td>${schedule.teacher_name}</td>
                    <td>${schedule.day_of_week}</td>
                    <td>${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}</td>
                    <td>${schedule.room_no || "-"}</td>
                    <td>Saved</td>
                `;

                timetableTable.appendChild(row);

            });

        } catch (error) {
            console.error("Load Timetable Error:", error);
        }
    }


    // =====================================
    // SAVE SCHEDULE
    // =====================================

    scheduleForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const scheduleData = {
            offering_id: scheduleOffering.value,
            day_of_week: document.getElementById("scheduleDay").value,
            start_time: document.getElementById("scheduleStartTime").value,
            end_time: document.getElementById("scheduleEndTime").value,
            room_no: document.getElementById("scheduleRoom").value
        };

        try {

            const response = await fetch("/api/admin/timetable", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(scheduleData)
            });

            const result = await response.json();

            if (!result.success) {
                alert(result.message || "Unable to save schedule.");
                return;
            }

            alert(result.message);

            scheduleForm.reset();
            scheduleModal.style.display = "none";

            loadTimetable();

        } catch (error) {
            console.error("Save Schedule Error:", error);
            alert("Something went wrong while saving schedule.");
        }

    });
// =====================================
// ADMIN DASHBOARD OVERVIEW
// =====================================
async function loadAdminOverview() {

    try {

        const response = await fetch("/api/admin/overview");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load overview.");
        }

        const stats = result.data;

        document.getElementById("totalStudentsCount").textContent =
            stats.totalStudents;

        document.getElementById("totalTeachersCount").textContent =
            stats.totalTeachers;

        document.getElementById("totalSubjectsCount").textContent =
            stats.totalSubjects;

        document.getElementById("pendingPaymentsCount").textContent =
            stats.pendingPayments;

        document.getElementById("totalEnrollmentsCount").textContent =
            stats.totalEnrollments;

        document.getElementById("approvedEnrollmentsCount").textContent =
            stats.approvedEnrollments;

    } catch (error) {

        console.error("Admin Overview Error:", error);

    }
}
    // INITIAL LOAD
loadAdminOverview();

    // =====================================
    // LOAD SAVED ANNOUNCEMENTS
    // =====================================

    const announcementsTable = document.getElementById("announcementsTable");

    async function loadAnnouncements() {

        try {

            const response = await fetch("/api/admin/announcements");
            const result = await response.json();

            if (!result.success) {
                alert(result.message || "Unable to load announcements.");
                return;
            }

            announcementsTable.innerHTML = "";

            if (result.data.length === 0) {
                announcementsTable.innerHTML = `
                    <tr>
                        <td colspan="4">No announcements available.</td>
                    </tr>
                `;
                return;
            }

            result.data.forEach(announcement => {

                const row = document.createElement("tr");

                const titleCell = document.createElement("td");
                titleCell.textContent = announcement.title;

                const messageCell = document.createElement("td");
                messageCell.textContent = announcement.message;

                const audienceCell = document.createElement("td");

                const audienceNames = {
                    students: "All Students",
                    teachers: "All Teachers",
                    both: "Students and Teachers"
                };

                audienceCell.textContent =
                    audienceNames[announcement.target_audience];

                const dateCell = document.createElement("td");

                dateCell.textContent = new Date(
                    announcement.created_at
                ).toLocaleDateString();

                row.appendChild(titleCell);
                row.appendChild(messageCell);
                row.appendChild(audienceCell);
                row.appendChild(dateCell);

                announcementsTable.appendChild(row);

            });

        } catch (error) {
            console.error("Load Announcements Error:", error);
        }

    }


    // =====================================
    // PUBLISH ANNOUNCEMENT
    // =====================================

    announcementForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const announcementData = {
            title: document.getElementById("announcementTitle").value.trim(),

            target_audience:
                document.getElementById("announcementAudience").value,

            message:
                document.getElementById("announcementMessage").value.trim()
        };

        try {

            const response = await fetch("/api/admin/announcements", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(announcementData)
            });

            const result = await response.json();

            if (!result.success) {
                alert(result.message || "Unable to publish announcement.");
                return;
            }

            alert(result.message);

            announcementForm.reset();

            announcementModal.classList.remove("show");
            document.body.style.overflow = "";

            await loadAnnouncements();

        } catch (error) {

            console.error("Publish Announcement Error:", error);
            alert("Something went wrong while publishing announcement.");

        }

    });



    // ==============================
    // ENROLLMENT APPLICATIONS
    // ==============================

    const enrollmentsTable = document.getElementById("enrollmentsTable");
    const enrollmentSearch = document.getElementById("enrollmentSearch");

    const enrollmentDetailsModal = document.getElementById("enrollmentDetailsModal");
    const feeDetailsModal = document.getElementById("feeDetailsModal");

    let currentEnrollmentId = null;
    let currentPaymentId = null;


    // API RESPONSE
    async function getAdminData(url, options = {}) {

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok || result.success === false) {
            throw new Error(result.message || "Request failed");
        }

        return result;
    }


    // LOAD ENROLLMENT APPLICATIONS
    async function loadEnrollmentApplications() {

        if (!enrollmentsTable) return;

        try {

            const result = await getAdminData("/api/admin/enrollments");
            const enrollments = result.data || [];

            enrollmentsTable.innerHTML = "";

            if (enrollments.length === 0) {
                enrollmentsTable.innerHTML = `
                    <tr>
                        <td colspan="7">No enrollment applications found.</td>
                    </tr>
                `;
                return;
            }

            enrollments.forEach(enrollment => {

                const row = document.createElement("tr");

                const applicationStatus =
                    enrollment.application_status === "approved" &&
                    enrollment.payment_status === "approved"
                        ? "Approved"
                        : enrollment.application_status === "rejected"
                            ? "Rejected"
                            : "Pending";

                const feeStatus = enrollment.payment_status
                    ? enrollment.payment_status.charAt(0).toUpperCase() +
                      enrollment.payment_status.slice(1)
                    : "Not Submitted";

                row.innerHTML = `
                    <td>${enrollment.registration_no || ""}</td>
                    <td>${enrollment.full_name || ""}</td>
                    <td>${enrollment.application_code || ""}</td>

                    <td>
                        <button type="button"
                            class="view-enrollment-btn"
                            data-id="${enrollment.enrollment_id}">
                            View Details
                        </button>
                    </td>

                    <td>
                        <button type="button"
                            class="view-fee-btn"
                            data-id="${enrollment.enrollment_id}">
                            View Fee
                        </button>
                    </td>

                    <td>${applicationStatus}</td>
                    <td>${feeStatus}</td>
                `;

                enrollmentsTable.appendChild(row);
            });

        } catch (error) {
            console.error("Enrollment Applications Error:", error);

            enrollmentsTable.innerHTML = `
                <tr>
                    <td colspan="7">Unable to load enrollment applications.</td>
                </tr>
            `;
        }
    }


    // VIEW ENROLLMENT DETAILS
    async function viewEnrollmentDetails(enrollmentId) {

        try {

            currentEnrollmentId = enrollmentId;

            const result = await getAdminData(
                `/api/admin/enrollments/${enrollmentId}`
            );

            const enrollment = result.data || {};
            const subjects = result.subjects || enrollment.subjects || [];

            document.getElementById("detailApplicationId").textContent =
                enrollment.application_code || "";

            document.getElementById("detailStudentId").textContent =
                enrollment.registration_no || "";

            document.getElementById("detailStudentName").textContent =
                enrollment.full_name || "";

            document.getElementById("detailSession").textContent =
                enrollment.session_name || "";

            document.getElementById("detailCredits").textContent =
                enrollment.total_credit_hours ?? 0;

            document.getElementById("detailTotalFee").textContent =
                `Rs. ${enrollment.total_fee ?? 0}`;

            document.getElementById("detailApplicationStatus").textContent =
                enrollment.application_status || "Pending";

            const subjectsContainer =
                document.getElementById("detailSubjects");

            subjectsContainer.innerHTML = "";

            if (subjects.length === 0) {
                subjectsContainer.textContent = "No subjects found.";
            } else {
                subjects.forEach(subject => {

                    const item = document.createElement("p");

                    item.textContent =
                        `${subject.subject_code || ""} - ${subject.subject_name || ""} (${subject.credit_hours || subject.credit_hours_snapshot || 0} Credits)`;

                    subjectsContainer.appendChild(item);
                });
            }

            enrollmentDetailsModal.showModal();

        } catch (error) {
            console.error("Enrollment Details Error:", error);
            alert("Unable to load enrollment details.");
        }
    }


    // VIEW FEE DETAILS
    async function viewFeeDetails(enrollmentId) {

        try {

            currentEnrollmentId = enrollmentId;

            const result = await getAdminData(
                `/api/admin/enrollments/${enrollmentId}/payment`
            );

            const payment = result.data;

            const feeActions = document.getElementById("feeVerificationActions");
            const rejectionBox = document.getElementById("paymentRejectionBox");
            const rejectionReason = document.getElementById("paymentRejectionReason");

            rejectionBox.style.display = "none";
            rejectionReason.value = "";

            if (!payment) {

                currentPaymentId = null;

                document.getElementById("detailTransactionId").textContent = "Not submitted";
                document.getElementById("detailPaymentMethod").textContent = "-";
                document.getElementById("detailPaymentAmount").textContent = "-";
                document.getElementById("detailPaymentDate").textContent = "-";
                document.getElementById("detailPaymentStatus").textContent = "Not Submitted";
                document.getElementById("detailAdminRemarks").textContent = "-";

                const proofLink = document.getElementById("detailPaymentProof");
                proofLink.removeAttribute("href");
                proofLink.style.display = "none";

                feeActions.style.display = "none";

            } else {

                currentPaymentId = payment.payment_id;

                document.getElementById("detailTransactionId").textContent =
                    payment.transaction_id || "-";

                document.getElementById("detailPaymentMethod").textContent =
                    payment.payment_method || "-";

                document.getElementById("detailPaymentAmount").textContent =
                    `Rs. ${payment.amount}`;

                document.getElementById("detailPaymentDate").textContent =
                    payment.payment_date || "-";

                document.getElementById("detailPaymentStatus").textContent =
                    payment.payment_status || "Pending";

                document.getElementById("detailAdminRemarks").textContent =
                    payment.admin_remarks || "-";

                const proofLink = document.getElementById("detailPaymentProof");

                if (payment.receipt_path) {
                    proofLink.href = payment.receipt_path;
                    proofLink.target = "_blank";
                    proofLink.style.display = "inline";
                } else {
                    proofLink.removeAttribute("href");
                    proofLink.style.display = "none";
                }

                feeActions.style.display =
                    payment.payment_status === "pending" ? "block" : "none";
            }

            feeDetailsModal.showModal();

        } catch (error) {
            console.error("Fee Details Error:", error);
            alert("Unable to load fee details.");
        }
    }


    // TABLE BUTTON CLICKS
    enrollmentsTable.addEventListener("click", event => {

        const enrollmentButton = event.target.closest(".view-enrollment-btn");
        const feeButton = event.target.closest(".view-fee-btn");

        if (enrollmentButton) {
            viewEnrollmentDetails(enrollmentButton.dataset.id);
        }

        if (feeButton) {
            viewFeeDetails(feeButton.dataset.id);
        }
    });


    // APPROVE PAYMENT
    document.getElementById("approvePaymentBtn").addEventListener("click", async () => {

        if (!currentPaymentId) return;

        if (!confirm("Are you sure you want to approve this payment?")) return;

        try {

            await getAdminData(
                `/api/admin/payments/${currentPaymentId}/approve`,
                { method: "POST" }
            );

            alert("Payment approved successfully.");

            feeDetailsModal.close();
            await loadEnrollmentApplications();

        } catch (error) {
            console.error("Approve Payment Error:", error);
            alert(error.message || "Unable to approve payment.");
        }
    });


    // SHOW REJECTION REASON BOX
    document.getElementById("rejectPaymentBtn").addEventListener("click", () => {

        document.getElementById("paymentRejectionBox").style.display = "block";
    });


    // CONFIRM PAYMENT REJECTION
    document.getElementById("confirmPaymentRejection").addEventListener("click", async () => {

        if (!currentPaymentId) return;

        const reason =
            document.getElementById("paymentRejectionReason").value.trim();

        if (!reason) {
            alert("Please enter a rejection reason.");
            return;
        }

        try {

            await getAdminData(
                `/api/admin/payments/${currentPaymentId}/reject`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ reason })
                }
            );

            alert("Payment rejected. Student can upload a new receipt.");

            feeDetailsModal.close();
            await loadEnrollmentApplications();

        } catch (error) {
            console.error("Reject Payment Error:", error);
            alert(error.message || "Unable to reject payment.");
        }
    });


    // CLOSE ENROLLMENT POPUP
    document.getElementById("closeEnrollmentDetails").addEventListener("click", () => {
        enrollmentDetailsModal.close();
    });

    document.getElementById("closeEnrollmentDetailsBtn").addEventListener("click", () => {
        enrollmentDetailsModal.close();
    });


    // CLOSE FEE POPUP
    document.getElementById("closeFeeDetails").addEventListener("click", () => {
        feeDetailsModal.close();
    });

    document.getElementById("closeFeeDetailsBtn").addEventListener("click", () => {
        feeDetailsModal.close();
    });


    // ENROLLMENT SEARCH
    enrollmentSearch.addEventListener("input", () => {

        const searchValue = enrollmentSearch.value.toLowerCase();

        enrollmentsTable.querySelectorAll("tr").forEach(row => {

            row.style.display = row.textContent.toLowerCase().includes(searchValue)
                ? ""
                : "none";
        });
    });


    // LOAD ANNOUNCEMENTS ON PAGE LOAD
    loadAnnouncements();


    // =====================================
    // LOAD BOTH SECTIONS WHEN PAGE OPENS
    // =====================================

    loadDepartments();
    loadStudentDepartments();
    loadStudentSessions();
    loadSessions();
    loadStudents();
    loadTeacherDepartments();
    loadTeachers();
    loadSubjectDepartments();
    loadSubjects();
    loadOfferingSubjects();
    loadOfferingTeachers();
    loadOfferingSessions();
    loadOfferings();
    loadEnrollmentApplications();
    // INITIAL LOAD

loadAdminOverview();
loadTimetable();

});
