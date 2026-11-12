document.addEventListener("DOMContentLoaded", () => {
    loadStudentOverview();

    // ADMIN NOTIFICATIONS BUTTON
    document.getElementById("showAdminNotifications")
        ?.addEventListener("click", () => {
            openStudentNotifications("admin");
        });

    // TEACHER NOTIFICATIONS BUTTON
    document.getElementById("showTeacherNotifications")
        ?.addEventListener("click", () => {
            openStudentNotifications("teacher");
        });

    // CLOSE POPUP
    document.getElementById("closeStudentNotifications")
        ?.addEventListener("click", closeStudentNotifications);

    // CLOSE POPUP ON OUTSIDE CLICK
    document.getElementById("studentNotificationsModal")
        ?.addEventListener("click", (event) => {
            if (event.target.id === "studentNotificationsModal") {
                closeStudentNotifications();
            }
        });
});


let allStudentAnnouncements = [];
// LOAD STUDENT OVERVIEW
async function loadStudentOverview() {

    try {

        const response = await fetch("/api/student/overview");
        const data = await response.json();

        if (!response.ok) {
            console.error(data.message || "Failed to load student overview");
            return;
        }

        const student = data.student;
const stats = data.stats;

updateAcademicAccess(student.application_status);
showPaymentStatus(student);

// Load enrolled courses only after approval
if (student.application_status === "approved") {
    await loadMyCourses();
    await loadStudentAttendance();
    await loadStudentAssignments();
    await loadStudentMarks();
    await loadStudentAnnouncements();
}

console.log(
    "Academic Section:",
    document.getElementById("courses").className
);

        // HEADER PROFILE
        document.querySelector(".header-profile h4").textContent =
            student.full_name;

        document.querySelector(".header-profile .avatar").textContent =
            student.full_name.charAt(0).toUpperCase();


        // WELCOME SECTION
        document.querySelector(".welcome-section h1").textContent =
            `Welcome, ${student.full_name}!`;

        document.querySelector(".session-badge h3").textContent =
            student.session_name;


        // STUDENT INFORMATION
        const studentInfo = document.querySelectorAll(
            ".student-info-section .info-item h3"
        );

        studentInfo[0].textContent = student.registration_no;
        studentInfo[1].textContent = student.full_name;
        studentInfo[2].textContent = student.session_name;
        studentInfo[3].textContent = student.department_name;


        // OVERVIEW STATISTICS
        
document.getElementById("enrolledSubjectsCount").textContent =
    stats.enrolled_subjects;

document.getElementById("creditHoursCount").textContent =
    `${stats.credit_hours} / ${student.max_credit_hours}`;

document.getElementById("assignmentCount").textContent =
    stats.assignment_count;

document.getElementById("notificationCount").textContent =
    stats.unread_notifications;


    } catch (error) {

        console.error("Student Overview Error:", error);

    }
}
// // LOCK / UNLOCK ACADEMIC SECTIONS
function updateAcademicAccess(applicationStatus) {

    const isApproved = applicationStatus === "approved";

    // Hide Course Enrollment after approval
    const enrollmentSection = document.getElementById("enrollment");

    if (enrollmentSection) {
        enrollmentSection.style.display = isApproved ? "none" : "";
    }

    const enrollmentLink = document.querySelector(
        '.sidebar-menu a[href="#enrollment"]'
    );

    if (enrollmentLink) {
        enrollmentLink.style.display = isApproved ? "none" : "";
    }

    // Academic sections
    const academicSections = [
    document.getElementById("courses"),
    document.getElementById("attendance"),
    document.getElementById("assignments"),
    document.getElementById("grades"),
    document.getElementById("notifications")
];
    academicSections.forEach(section => {

        if (!section) return;

        section.classList.toggle("academic-locked", !isApproved);

        let lockMessage = section.querySelector(".academic-lock-message");

        if (!isApproved && !lockMessage) {

            lockMessage = document.createElement("div");
            lockMessage.className = "academic-lock-message";

            lockMessage.innerHTML = `
                <i class="fa-solid fa-lock"></i>
                <h3>Academic Section Locked</h3>
                <p>Your academic access will unlock after admin approves your enrollment.</p>
            `;

            section.appendChild(lockMessage);
        }

        if (isApproved && lockMessage) {
            lockMessage.remove();
        }
    });

    // Sidebar academic links
   const academicLinks = document.querySelectorAll(
    '.sidebar-menu a[href="#courses"], ' +
    '.sidebar-menu a[href="#attendance"], ' +
    '.sidebar-menu a[href="#assignments"], ' +
    '.sidebar-menu a[href="#grades"], ' +
    '.sidebar-menu a[href="#notifications"]'
);

    academicLinks.forEach(link => {
        link.classList.toggle("academic-link-locked", !isApproved);
        link.setAttribute("aria-disabled", String(!isApproved));
    });
}
// SHOW PAYMENT STATUS AND REJECTION MESSAGE
function showPaymentStatus(student) {

    const statusBox = document.getElementById("paymentStatusMessage");

    if (!statusBox) return;

    statusBox.innerHTML = "";

    if (student.payment_status === "rejected") {

        statusBox.innerHTML = `
            <div class="payment-rejection-message">

                <div class="rejection-heading">
                    <i class="fa-solid fa-circle-exclamation"></i>

                    <div>
                        <h3>Payment Proof Rejected</h3>
                        <span>Action Required</span>
                    </div>
                </div>

                <div class="rejection-reason">
                    <strong>Admin's Remarks</strong>
                    <p id="paymentRejectionReason"></p>
                </div>

                <p class="rejection-instruction">
                    Your selected courses are saved.
                    Please upload a new payment receipt to continue
                    your enrollment.
                </p>

            </div>
        `;

        statusBox.querySelector("#paymentRejectionReason").textContent =
            student.admin_remarks || "No rejection reason provided.";

    }

    else if (student.payment_status === "pending") {

        statusBox.innerHTML = `
            <div class="payment-pending-message">

                <i class="fa-solid fa-clock"></i>

                <div>
                    <h3>Payment Verification Pending</h3>
                    <p>Your payment proof is waiting for admin verification.</p>
                </div>

            </div>
        `;
    }
}


 // LOAD STUDENT'S ENROLLED COURSES
async function loadMyCourses() {

    const coursesSection = document.getElementById("courses");
    const emptyState = coursesSection.querySelector(".empty-state");

    // Create courses container
    let coursesList = document.getElementById("myCoursesList");

    if (!coursesList) {
        coursesList = document.createElement("div");
        coursesList.id = "myCoursesList";
        coursesList.className = "my-courses-grid";

        const heading = coursesSection.querySelector(".section-heading");
        heading.insertAdjacentElement("afterend", coursesList);
    }

    coursesList.innerHTML = `
        <div class="empty-state">
            <h3>Loading Courses...</h3>
            <p>Please wait while your courses load.</p>
        </div>
    `;

    try {

        const response = await fetch("/api/student/my-courses");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load courses.");
        }

        // No enrolled courses
        if (data.courses.length === 0) {

            coursesList.innerHTML = "";

            if (emptyState) {
                emptyState.style.display = "flex";
            }

            return;
        }

        // Hide original empty message
        if (emptyState) {
            emptyState.style.display = "none";
        }

        coursesList.innerHTML = "";

        // Display enrolled courses
       // DISPLAY ENROLLED COURSES IN TABLE
coursesList.innerHTML = `
    <div class="my-courses-table-wrapper">
        <table class="my-courses-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Credit Hours</th>
                    <th>Teacher</th>
                </tr>
            </thead>

            <tbody>
                ${data.courses.map((course, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${course.subject_code}</td>
                        <td>${course.subject_name}</td>
                        <td>${course.credit_hours}</td>
                        <td>${course.teacher_name || "Not Assigned"}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    </div>
`;
    } catch (error) {

        console.error("My Courses Error:", error);

        coursesList.innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load Courses</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// LOAD STUDENT ATTENDANCE
async function loadStudentAttendance() {

    const attendanceSection = document.getElementById("attendance");
    const emptyState = attendanceSection.querySelector(".empty-state");

    let attendanceList = document.getElementById("studentAttendanceList");

    if (!attendanceList) {
        attendanceList = document.createElement("div");
        attendanceList.id = "studentAttendanceList";

        const heading = attendanceSection.querySelector(".section-heading");
        heading.insertAdjacentElement("afterend", attendanceList);
    }

    attendanceList.innerHTML = `
        <p>Loading attendance...</p>
    `;

    try {

        const response = await fetch("/api/student/attendance");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load attendance.");
        }

        if (data.attendance.length === 0) {

            attendanceList.innerHTML = "";

            if (emptyState) {
                emptyState.style.display = "flex";
            }

            return;
        }

        if (emptyState) {
            emptyState.style.display = "none";
        }

        attendanceList.innerHTML = `
            <div class="student-attendance-table-wrapper">
                <table class="student-attendance-table">

                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Total Classes</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Attendance</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${data.attendance.map(item => `
                            <tr>
                                <td>
                                    <strong>${item.subject_code}</strong>
                                    <span class="attendance-subject-name">
                                        ${item.subject_name}
                                    </span>
                                </td>

                                <td>${item.total_classes}</td>
                                <td>${item.present_classes}</td>
                                <td>${item.absent_classes}</td>

                                <td>
                                    <span class="attendance-percentage">
                                        ${item.attendance_percentage}%
                                    </span>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>

                </table>
            </div>
        `;

    } catch (error) {

        console.error("Student Attendance Error:", error);

        attendanceList.innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load Attendance</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// LOAD STUDENT ASSIGNMENTS
async function loadStudentAssignments() {

    const assignmentsSection = document.getElementById("assignments");
    const emptyState = assignmentsSection.querySelector(".empty-state");

    let assignmentsList = document.getElementById("studentAssignmentsList");

    if (!assignmentsList) {
        assignmentsList = document.createElement("div");
        assignmentsList.id = "studentAssignmentsList";

        const heading = assignmentsSection.querySelector(".section-heading");
        heading.insertAdjacentElement("afterend", assignmentsList);
    }

    assignmentsList.innerHTML = "<p>Loading assignments...</p>";

    try {

        const response = await fetch("/api/student/assignments");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load assignments.");
        }

        if (data.assignments.length === 0) {
            assignmentsList.innerHTML = `
                <div class="empty-state">
                    <h3>No Assignments Available</h3>
                    <p>Your teachers have not uploaded any assignments yet.</p>
                </div>
            `;
            return;
        }

        if (emptyState) {
            emptyState.style.display = "none";
        }

        assignmentsList.innerHTML = `
            <div class="my-courses-table-wrapper">
                <table class="my-courses-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Subject</th>
                            <th>Assignment</th>
                            <th>Description</th>
                            <th>Teacher</th>
                            <th>Due Date</th>
                            <th>Assignment File</th>
                            <th>Submission Status</th>
                            <th>Marks</th>
                            <th>My Submission</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${data.assignments.map((assignment, index) => {

                            const isSubmitted = Boolean(assignment.submission_path);
                            const isOpen = new Date(assignment.due_date) >= new Date();

                            let submissionOptions = "";

                            if (isSubmitted && isOpen) {

                                submissionOptions = `
                                    <a class="assignment-action-btn view-btn"
                                       href="/${assignment.submission_path}"
                                       target="_blank">View Submission</a>

                                    <input type="file"
                                           class="submission-file"
                                           data-file-input="${assignment.assignment_id}"
                                           data-action="replace-file"
                                           accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                                           hidden>

                                    <button type="button"
                                            class="assignment-action-btn replace-btn"
                                            data-action="replace"
                                            data-assignment-id="${assignment.assignment_id}">
                                        Replace
                                    </button>

                                    <button type="button"
                                            class="assignment-action-btn delete-btn"
                                            data-action="delete"
                                            data-assignment-id="${assignment.assignment_id}">
                                        Delete
                                    </button>
                                `;

                            } else if (isSubmitted && !isOpen) {

                                submissionOptions = `
                                    <a class="assignment-action-btn view-btn"
                                       href="/${assignment.submission_path}"
                                       target="_blank">View Submission</a>
                                    <p>Portal Closed</p>
                                `;

                            } else if (!isSubmitted && isOpen) {

                                submissionOptions = `
                                    <input type="file"
                                           class="submission-file"
                                           data-file-input="${assignment.assignment_id}"
                                           accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png">

                                    <button type="button"
                                            class="assignment-action-btn upload-btn"
                                            data-action="upload"
                                            data-assignment-id="${assignment.assignment_id}">
                                        Upload Assignment
                                    </button>
                                `;

                            } else {

                                submissionOptions = `
                                    <p>Not Submitted</p>
                                    <p>Portal Closed</p>
                                `;
                            }

                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${assignment.subject_code}</td>
                                    <td>${assignment.title}</td>
                                    <td>${assignment.description || "N/A"}</td>
                                    <td>${assignment.teacher_name}</td>
                                    <td>${new Date(assignment.due_date).toLocaleString()}</td>

                                    <td>
                                        ${assignment.attachment_path
                                            ? `<a href="/${assignment.attachment_path}" target="_blank">View File</a>`
                                            : "No File"}
                                    </td>

                                    <td>${assignment.submission_status || "Not Submitted"}</td>
                                    <td>${assignment.marks ?? "Pending"}</td>
                                    <td>${submissionOptions}</td>
                                </tr>
                            `;

                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;

        // UPLOAD / REPLACE / DELETE BUTTONS

        async function uploadStudentFile(assignmentId, file) {

            if (!file) {
                alert("Please select a file first.");
                return;
            }

            const formData = new FormData();
            formData.append("submission", file);

            try {

                const uploadResponse = await fetch(
                    `/api/student/assignments/${assignmentId}/submit`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadData.message || "Upload failed.");
                }

                alert(uploadData.message);
                await loadStudentAssignments();

            } catch (error) {
                alert(error.message);
            }
        }

        assignmentsList.onclick = async (event) => {

            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const action = button.dataset.action;
            const assignmentId = button.dataset.assignmentId;

            if (action === "replace") {

                const fileInput = assignmentsList.querySelector(
                    `[data-file-input="${assignmentId}"]`
                );

                fileInput.click();
            }

            if (action === "upload") {

                const fileInput = assignmentsList.querySelector(
                    `[data-file-input="${assignmentId}"]`
                );

                await uploadStudentFile(assignmentId, fileInput.files[0]);
            }

            if (action === "delete") {

                const confirmed = confirm(
                    "Are you sure you want to delete your submitted assignment?"
                );

                if (!confirmed) return;

                try {

                    const deleteResponse = await fetch(
                        `/api/student/assignments/${assignmentId}/submission`,
                        {
                            method: "DELETE"
                        }
                    );

                    const deleteData = await deleteResponse.json();

                    if (!deleteResponse.ok) {
                        throw new Error(deleteData.message || "Delete failed.");
                    }

                    alert(deleteData.message);
                    await loadStudentAssignments();

                } catch (error) {
                    alert(error.message);
                }
            }
        };

        // REPLACE FILE SELECTION

        assignmentsList.onchange = async (event) => {

            const fileInput = event.target;

            if (fileInput.dataset.action !== "replace-file") return;

            const assignmentId = fileInput.dataset.fileInput;

            await uploadStudentFile(assignmentId, fileInput.files[0]);
        };

    } catch (error) {

        console.error("Student Assignments Error:", error);

        assignmentsList.innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load Assignments</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// LOAD STUDENT MARKS
async function loadStudentMarks() {

    const table = document.getElementById("studentMarksTable");
    const subjectFilter = document.getElementById("marksSubjectFilter");

    try {

        const response = await fetch("/api/student/marks");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load marks.");
        }

        // LOAD ENROLLED SUBJECTS IN DROPDOWN
        subjectFilter.innerHTML = `
            <option value="">All Subjects</option>
        `;

        (data.subjects || []).forEach(subject => {

            const option = document.createElement("option");

            option.value = subject.subject_code;
            option.textContent =
                `${subject.subject_code} - ${subject.subject_name}`;

            subjectFilter.appendChild(option);

        });

        // FILTER MARKS WHEN SUBJECT CHANGES
        subjectFilter.onchange = () => {
            renderStudentMarks(data.marks || [], subjectFilter.value);
        };

        // DISPLAY ALL MARKS INITIALLY
        renderStudentMarks(data.marks || [], "");

    } catch (error) {

        console.error("Student Marks Error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="9">Unable to load marks.</td>
            </tr>
        `;
    }
}


// DISPLAY SUBJECT-WISE MARKS
function renderStudentMarks(marks, subjectCode) {

    const table = document.getElementById("studentMarksTable");

    const filteredMarks = subjectCode
        ? marks.filter(mark => mark.subject_code === subjectCode)
        : marks;

    if (filteredMarks.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="9">No grades available for this subject yet.</td>
            </tr>
        `;

        return;
    }

    table.innerHTML = filteredMarks.map((mark, index) => {

        const obtainedMarks = mark.obtained_marks;

        const percentage = obtainedMarks === null
            ? "-"
            : (
                (Number(obtainedMarks) / Number(mark.total_marks)) * 100
            ).toFixed(2) + "%";

        const status = obtainedMarks === null
            ? "Pending"
            : "Marks Awarded";

        const assessmentDate = new Date(mark.assessment_date)
            .toLocaleDateString();

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${mark.subject_code} - ${mark.subject_name}</td>
                <td>${mark.assessment_type}</td>
                <td>${mark.assessment_title}</td>
                <td>${assessmentDate}</td>
                <td>${obtainedMarks === null ? "-" : obtainedMarks}</td>
                <td>${mark.total_marks}</td>
                <td>${percentage}</td>
                <td>${status}</td>
            </tr>
        `;

    }).join("");
}


// LOAD STUDENT ANNOUNCEMENTS

async function loadStudentAnnouncements() {

    try {

        const response = await fetch("/api/student/announcements");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load notifications.");
        }

        allStudentAnnouncements = [
            ...new Map(
                (data.announcements || []).map(item => [
                    item.announcement_id,
                    item
                ])
            ).values()
        ];

        console.log("Notifications loaded:", allStudentAnnouncements);

    } catch (error) {

        console.error("Student Announcements Error:", error);

        allStudentAnnouncements = [];
    }
}
// OPEN ADMIN OR TEACHER NOTIFICATIONS POPUP

function openStudentNotifications(type) {

    const modal = document.getElementById("studentNotificationsModal");
    const title = document.getElementById("studentNotificationsModalTitle");
    const list = document.getElementById("studentNotificationsModalList");

    const filteredNotifications = allStudentAnnouncements.filter(item => {

        if (type === "admin") {
            return item.teacher_id === null;
        }

        return item.teacher_id !== null;
    });

    title.textContent = type === "admin"
        ? "Admin Notifications"
        : "Teacher Notifications";

    if (filteredNotifications.length === 0) {

        list.innerHTML = `<p>No notifications available.</p>`;

    } else {

        list.innerHTML = filteredNotifications.map(item => {

            return `
                <div class="notification-card">

                    <h3>${item.title}</h3>
                    <p>${item.message}</p>

                    <small>
                        ${new Date(item.created_at).toLocaleString()}
                    </small>

                </div>
            `;

        }).join("");
    }

    modal.style.display = "flex";
}



// CLOSE NOTIFICATIONS POPUP
function closeStudentNotifications() {

    document.getElementById("studentNotificationsModal")
        .style.display = "none";
}


// EXPLORE COURSES ELEMENTS
const exploreButton = document.getElementById("openExploreCourses");
const exploreModal = document.getElementById("exploreCoursesModal");
const closeExploreButton = document.getElementById("closeExploreCourses");


// OPEN EXPLORE COURSES
exploreButton.addEventListener("click", () => {
    exploreModal.style.display = "flex";
    loadAvailableCourses();
});


// CLOSE EXPLORE COURSES
closeExploreButton.addEventListener("click", () => {
    exploreModal.style.display = "none";
});

// FEE VERIFICATION ELEMENTS
const feeModal = document.getElementById("feeVerificationModal");
const closeFeeButton = document.getElementById("closeFeeVerification");
const proceedPaymentButton = document.getElementById("openFeeVerification");


// PROCEED TO PAYMENT
proceedPaymentButton.addEventListener("click", () => {

    if (selectedCourses.length === 0) {
        return;
    }

    // UPDATE PAYMENT SUMMARY
    const totalAmount = selectedCourses.length * 5000;

    document.getElementById("feeCourseCount").textContent =
        selectedCourses.length;

    document.getElementById("feeTotalAmount").textContent =
        `Rs. ${totalAmount.toLocaleString("en-PK")}`;

    // CLOSE EXPLORE COURSES
    exploreModal.style.display = "none";

    // OPEN FEE VERIFICATION
    feeModal.style.display = "flex";

});


// CLOSE FEE VERIFICATION
closeFeeButton.addEventListener("click", () => {
    feeModal.style.display = "none";
});

// SUBMIT FEE PROOF AND ENROLLMENT
const feeProofForm = document.getElementById("feeProofForm");

feeProofForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (selectedCourses.length === 0) {
        alert("Please select courses first.");
        return;
    }

    const formData = new FormData(feeProofForm);

    const offeringIds = selectedCourses.map(course =>
        course.offering_id
    );

    formData.append("offering_ids", JSON.stringify(offeringIds));

    try {

        const response = await fetch("/api/student/submit-enrollment", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Submission failed.");
            return;
        }

        alert(data.message);

        feeModal.style.display = "none";
feeProofForm.reset();

await loadStudentOverview();

await loadAvailableCourses();

    } catch (error) {

        console.error("Fee Submission Error:", error);
        alert("Something went wrong while submitting your enrollment.");

    }
});


// LOAD AVAILABLE COURSES
async function loadAvailableCourses() {

    const coursesList = document.getElementById("availableCoursesList");

    coursesList.innerHTML = `
        <div class="empty-state">
            <h3>Loading Courses...</h3>
            <p>Please wait while available courses load.</p>
        </div>
    `;

    selectedCourses = [];
    updateEnrollmentSummary();

    document.getElementById("credit-error").style.display = "none";

    try {

        const response = await fetch("/api/student/courses");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load courses.");
        }

        // STUDENT SUMMARY
        document.getElementById("exploreStudentName").textContent =
            document.querySelector(".header-profile h4").textContent;

        document.getElementById("exploreStudentId").textContent =
            document.querySelectorAll(".student-info-section .info-item h3")[0].textContent;

        document.getElementById("exploreStudentSession").textContent =
            data.session;

        document.getElementById("exploreCreditLimit").textContent =
            `${data.max_credit_hours} Credit Hours`;

        // CHECK EXISTING ENROLLMENT
        const isRejected =
            data.enrollment?.payment_status === "rejected";

        const isPaymentPending =
            data.enrollment?.payment_status === "pending";

        const savedIds = (data.selected_offering_ids || []).map(Number);

        // RESTORE PREVIOUSLY SELECTED COURSES
        if (data.enrollment) {

            selectedCourses = data.courses.filter(course =>
                savedIds.includes(Number(course.offering_id))
            );
        }

        updateEnrollmentSummary();

        // NO AVAILABLE COURSES
        if (data.courses.length === 0) {

            coursesList.innerHTML = `
                <div class="empty-state">
                    <h3>No Courses Available</h3>
                    <p>No courses have been offered for your academic session.</p>
                </div>
            `;

            return;
        }

        // DISPLAY COURSES
        coursesList.innerHTML = "";

        data.courses.forEach(course => {

            const courseCard = document.createElement("div");
            courseCard.className = "course-card";

            const isPreviouslySelected = savedIds.includes(
                Number(course.offering_id)
            );

            courseCard.innerHTML = `
                <label class="course-select-label">

                    <input
                        type="checkbox"
                        class="course-select-checkbox"
                        value="${course.offering_id}"
                        ${isPreviouslySelected ? "checked" : ""}
                        ${data.enrollment ? "disabled" : ""}
                    >

                    <span class="custom-checkbox"></span>

                    <span class="select-text">
                        ${isPreviouslySelected
                            ? "Selected Course"
                            : "Select Course"}
                    </span>

                </label>

                <div class="course-info">

                    <span class="course-code">
                        ${course.subject_code}
                    </span>

                    <h3>${course.subject_name}</h3>

                    <p>
                        <i class="fa-solid fa-chalkboard-user"></i>
                        ${course.teacher_name || "Not Assigned"}
                    </p>

                    <p>
                        <i class="fa-solid fa-book"></i>
                        ${course.credit_hours} Credit Hours
                    </p>

                </div>
            `;

            const checkbox = courseCard.querySelector(
                ".course-select-checkbox"
            );

            checkbox.addEventListener("change", () => {

                const errorMessage =
                    document.getElementById("credit-error");

                if (checkbox.checked) {

                    const currentCredits = selectedCourses.reduce(
                        (total, item) =>
                            total + Number(item.credit_hours),
                        0
                    );

                    const newTotal =
                        currentCredits + Number(course.credit_hours);

                    if (newTotal > Number(data.max_credit_hours)) {

                        checkbox.checked = false;
                        errorMessage.style.display = "block";
                        return;
                    }

                    selectedCourses.push(course);

                } else {

                    selectedCourses = selectedCourses.filter(
                        item =>
                            Number(item.offering_id) !==
                            Number(course.offering_id)
                    );
                }

                errorMessage.style.display = "none";
                updateEnrollmentSummary();

            });

            coursesList.appendChild(courseCard);

        });

        // PAYMENT BUTTON STATUS
        const proceedButton =
            document.getElementById("openFeeVerification");

        if (isRejected) {

            proceedButton.textContent = "Upload New Receipt";

            proceedButton.disabled = selectedCourses.length === 0;

        } else if (isPaymentPending) {

            proceedButton.textContent = "Payment Under Review";
            proceedButton.disabled = true;

        } else if (data.enrollment) {

            proceedButton.textContent = "Enrollment Submitted";
            proceedButton.disabled = true;

        } else {

            proceedButton.textContent = "Proceed to Payment";
        }

    } catch (error) {

        console.error("Load Available Courses Error:", error);

        coursesList.innerHTML = `
            <div class="empty-state">
                <h3>Server Error</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// UPDATE ENROLLMENT SUMMARY
function updateEnrollmentSummary() {

    const selectedList = document.getElementById("selectedCoursesList");
    const courseCount = document.getElementById("selectedCourseCount");
    const creditHours = document.getElementById("selectedCreditHours");
    const totalFee = document.getElementById("totalEnrollmentFee");
    const proceedButton = document.getElementById("openFeeVerification");

    const maxCreditsText =
        document.getElementById("exploreCreditLimit").textContent;

    const maxCredits = parseInt(maxCreditsText) || 0;

    const totalCredits = selectedCourses.reduce(
        (total, course) => total + Number(course.credit_hours),
        0
    );

    const totalAmount = selectedCourses.length * 5000;

    // SELECTED COURSE LIST
    if (selectedCourses.length === 0) {

        selectedList.innerHTML = `
            <p class="no-selection">No courses selected yet.</p>
        `;

    } else {

        selectedList.innerHTML = "";

        selectedCourses.forEach(course => {

            const item = document.createElement("div");
            item.className = "selected-course-item";

            item.innerHTML = `
                <div>
                    <strong>${course.subject_name}</strong>
                    <span>${course.subject_code}</span>
                </div>
                <strong>${course.credit_hours} Credits</strong>
            `;

            selectedList.appendChild(item);

        });

    }

    // UPDATE TOTALS
    courseCount.textContent = selectedCourses.length;
    creditHours.textContent = `${totalCredits} / ${maxCredits}`;
    totalFee.textContent = `Rs. ${totalAmount.toLocaleString("en-PK")}`;

    // ENABLE OR DISABLE BUTTON
    proceedButton.disabled = selectedCourses.length === 0;
}


