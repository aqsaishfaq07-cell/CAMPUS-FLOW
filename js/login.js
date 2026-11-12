document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error("Login form not found!");
        return;
    }

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const login_id = document.getElementById("userId").value.trim();
        const password = document.getElementById("password").value;

        if (!login_id || !password) {
            alert("Please enter User ID and Password");
            return;
        }

        try {

            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    login_id: login_id,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login failed");
                return;
            }

            if (data.role === "admin") {
                window.location.href = "/html/admin-dashboard.html";
            }
            else if (data.role === "teacher") {
                window.location.href = "/html/teacher-dashboard.html";
            }
            else if (data.role === "student") {
                window.location.href = "/html/student-dashboard.html";
            }
            else {
                alert("Invalid role received from server");
            }

        } catch (error) {

            console.error("Login Error:", error);
            alert("Server connection failed!");

        }

    });

});