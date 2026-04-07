import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const email = document.getElementById("loginEmail");
const password = document.getElementById("loginPassword");
const form = document.querySelector("form");

const errorEmail = document.getElementById("error_email");
const errorPassword = document.getElementById("error_password");
const status = document.getElementById("status");

const admins = [
    { id: 1, firstname: "Lê", lastname: "Minh Thu", email: "minhthu@gmail.com", password: "123456", role: "admin" },
    { id: 2, firstname: "Vũ", lastname: "Hồng Vân", email: "hongvan@yahoo.com", password: "abc123", role: "admin" }
];

const showToast = (message, type = "success") => {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toasts = container.querySelectorAll(".toast");
    if (toasts.length >= 4) toasts[0].remove();

    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
};

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEmail.innerText = "";
    errorPassword.innerText = "";
    status.style.display = "none";

    const userEmail = email.value.trim();
    const pass = password.value.trim();
    let isValid = true;

    if (!userEmail) { errorEmail.innerText = "Không được để trống"; isValid = false; }
    if (!pass) { errorPassword.innerText = "Không được để trống"; isValid = false; }
    if (!isValid) return;

    // Đăng nhập Admin
    const admin = admins.find(a => a.email == userEmail && a.password == pass);
    if (admin) {
        localStorage.setItem("admin", JSON.stringify(admin));
        status.style.display = "block";
        status.innerHTML = "✅ đăng nhập admin thành công";
        setTimeout(() => window.location.href = "../html/user_manager.html", 1000);
        return;
    }

    // Đăng nhập User
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", userEmail), where("password", "==", pass));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            userData.id = userDoc.id;

            if (userData.status == "blocked") {
                showToast("❌ Tài khoản đã bị chặn bởi admin", "error");
                return;
            }

            localStorage.setItem("user", JSON.stringify(userData));
            status.style.display = "block";
            status.innerText = "✅ Đăng nhập thành công";
            setTimeout(() => window.location.href = "../html/index.html", 1000);
        } else {
            errorPassword.innerText = "Email hoặc mật khẩu không đúng";
            password.focus();
        }
    } catch (error) {
        console.error(error);
        showToast("Lỗi kết nối máy chủ", "error");
    }
});

[email, password].forEach((input) => {
    input.addEventListener("input", () => {
        if (input == email) errorEmail.innerText = "";
        if (input == password) errorPassword.innerText = "";
    });
});