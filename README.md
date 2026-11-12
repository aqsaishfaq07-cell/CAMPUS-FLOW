CAMPUS-FLOW
Summer Semester Enrollment Portal
CAMPUS-FLOW is a university-style summer semester enrollment portal
built as a full-stack practice project. It provides separate dashboards
for students, teachers, and administrators, with enrollment, fee-proof
verification, attendance, assignments, and academic communication
features.
Project type: Academic / portfolio practice project
Status: Completed practice project
Stack: HTML, CSS, JavaScript, Node.js, Express.js, MySQL
Screenshots
Add your own screenshots to the screenshots/ folder and use the
suggested filenames below. Replace these placeholders with the actual
images when you add them.

  Login                     Student Dashboard
  screenshots/login.png   screenshots/student-dashboard.png
  Teacher Dashboard                     Admin Dashboard
  screenshots/teacher-dashboard.png   screenshots/admin-dashboard.png
  Course Enrollment                     Fee Verification
  screenshots/course-enrollment.png   screenshots/fee-verification.png
Features
Student
- Login using pre-created account credentials.
- View available course offerings.
- Select courses for summer enrollment.
- View selected credit hours and calculated enrollment fee.
- Submit fee proof for administrative verification.
- Check fee verification and enrollment status.
- View notifications and announcements.
- View attendance and assignments after enrollment approval.
- Access timetable and assigned course information when available.
Teacher
- View assigned courses.
- Mark student attendance using Present and Absent statuses.
- Upload assignments for assigned courses.
- View student assignment submissions.
- Post course announcements.
- Access teaching-related course information.
Administrator
- Manage student and teacher information.
- Manage course offerings and teacher assignments.
- Review submitted fee proofs and update verification status.
- Send notifications and publish announcements.
- Manage teacher active/inactive status and course assignments.
Technology Stack
  Layer                   Technologies
  Frontend                HTML5, CSS3, JavaScript
Backend                 Node.js, Express.js
Database                MySQL
Database driver         mysql2
File uploads            Multer
Environment variables   dotenv
Version control         Git and GitHub
Project Structure
summer_enrollment/
├── backend/
│   ├── routes/
│   │   ├── admin-api.js
│   │   ├── auth.js
│   │   ├── student-api.js
│   │   └── teacher-api.js
│   ├── db.js
│   ├── seed-users.js
│   └── server.js
├── css/
├── database/
│   └── campus_flow_db.sql
├── html/
├── images/
├── js/
├── .gitignore
├── package.json
└── package-lock.json
Run Locally
1. Clone the repository
git clone https://github.com/YOUR-USERNAME/CAMPUS-FLOW.git
cd CAMPUS-FLOW
Replace YOUR-USERNAME with your GitHub username.
2. Install dependencies
npm install
3. Create the MySQL database
1. Open MySQL Workbench.
2. Create a database named campus_flow_db, or import the supplied SQL
   file.
3. To import the file, use Server → Data Import, select Import
   from Self-Contained File, choose database/campus_flow_db.sql,
   and start the import.
4. Confirm that the tables have been created.
4. Configure environment variables
Create a .env file in the project root (the same folder as
package.json):
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_flow_db
Use your own local MySQL credentials. Do not commit .env to GitHub.
5. Start the server
node backend/server.js
Open the application at:
http://localhost:3000
Database Setup Notes
- The database export is included as a setup example for local
  practice.
- The project uses a local MySQL database by default.
- Create or use the demo accounts supplied for your local setup.
- Never use real student records or real passwords in a public
  repository.
Security Notes
- Database credentials are read from environment variables.
- .env, node_modules/, and uploaded files are excluded through
  .gitignore.
- The repository is intended for learning and demonstration. Review
  authentication, authorization, file-upload validation, and
  deployment settings before using it with real users or sensitive
  data.
- Do not reuse demo credentials in a live environment.
Future Improvements
- Deploy the application with a hosted backend and managed MySQL
  database.
- Add automated tests for API routes and enrollment rules.
- Improve input validation, error handling, and audit logging.
- Add production-ready authentication and password hashing review.
- Add responsive UI refinements and accessibility checks.
Learning Goals
This project was created to practise: - Building a multi-role full-stack
web application. - Connecting an Express.js backend to MySQL. -
Designing REST-style routes and handling GET/POST requests. - Managing
enrollment and fee-verification workflows. - Handling file uploads. -
Using Git and GitHub for version control.
Author
Aqsa Ishfaq
BS Software Engineering Student
- GitHub: @aqsaishfaq07
Support
If you find this project useful for learning, please consider giving the
repository a ⭐ on GitHub. Feedback and suggestions are welcome.
