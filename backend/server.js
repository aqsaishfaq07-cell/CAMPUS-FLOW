const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const app = express();
const adminRoutes = require("./routes/admin-api");
const teacherRoutes = require("./routes/teacher-api");
const studentRoutes = require("./routes/student-api");
console.log("STUDENT ROUTES IMPORTED");
// Default page: Login
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../html/index.html"));
});
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend files
app.use(express.static(path.join(__dirname, '..')));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Session configuration
app.use(session({
    secret: 'campus-flow-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}));




app.use('/api', authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);

app.use("/api/student", (req, res, next) => {
    console.log("Student API request:", req.method, req.url);
    next();
}, studentRoutes);



// Server
const PORT = 3000;


app.listen(3000, () => {
    console.log("CAMPUS-FLOW server running successfully!");
    console.log("Open: http://localhost:3000");
});