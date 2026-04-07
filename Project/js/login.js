// LẤY DOM
const email = document.getElementById("loginEmail");
const password = document.getElementById("loginPassword");
const form = document.querySelector("form");

const errorEmail = document.getElementById("error_email");
const errorPassword = document.getElementById("error_password");
const status = document.getElementById("status");

// BIẾN
let statusTimeout;

// ADMIN MẶC ĐỊNH
const admins = [
    {
        id: 1,
        firstname: "Lê",
        lastname: "Minh Thu",
        email: "minhthu@gmail.com",
        password: "123456",
        role: "admin"
    },
    {
        id: 2,
        firstname: "Vũ",
        lastname: "Hồng Vân",
        email: "hongvan@yahoo.com",
        password: "abc123",
        role: "admin"
    }
];

// HÀM HIỂN THỊ TOAST
const showToast = (message, type = "success") => {
    const container = document.getElementById("toast-container");

    // Lấy danh sách toast hiện tại
    const toasts = container.querySelectorAll(".toast");

    // Nếu đã có 4 toast thì xoá cái đầu tiên
    if (toasts.length >= 4) {
        toasts[0].remove();
    }

    // Tạo toast mới
    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.innerText = message;

    container.appendChild(toast);

    // Tự động xoá sau 2 giây
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2000);
};

// XỬ LÝ ĐĂNG NHẬP
form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Reset lỗi
    errorEmail.innerText = "";
    errorPassword.innerText = "";
    status.style.display = "none";

    const userEmail = email.value.trim();
    const pass = password.value.trim();

    let isValid = true;

    // Kiểm tra rỗng
    if (!userEmail) {
        errorEmail.innerText = "Không được để trống";
        isValid = false;
    }

    if (!pass) {
        errorPassword.innerText = "Không được để trống";
        isValid = false;
    }

    if (!isValid) return;

    // Lấy danh sách user từ localStorage
    const users = JSON.parse(localStorage.getItem("users")) || [];

    // Tìm admin
    const admin = admins.find(
        (a) => a.email == userEmail && a.password == pass
    );

    // Tìm user thường
    const user = users.find(
        (u) => u.email == userEmail && u.password == pass
    );

    // ĐĂNG NHẬP ADMIN
    if (admin) {
        localStorage.setItem("admin", JSON.stringify(admin));
        // localStorage.removeItem("user");

        status.innerHTML = "✅ đăng nhập admin thành công";

        setTimeout(() => {
            window.location.href = "../html/user_manager.html";
        }, 1000);

        return;
    }
    // ĐĂNG NHẬP USER
    if (user) {

        if (user.status == "blocked") {
            showToast("❌ Tài khoản đã bị chặn bởi admin", "error");
            return;
        }

        localStorage.setItem("user", JSON.stringify(user));
        // localStorage.removeItem("admin"); 

        status.innerText = "✅ Đăng nhập thành công";

        setTimeout(() => {
            window.location.href = "../html/index.html";
        }, 1000);

        return;
    }
    // Sai tài khoản
    errorPassword.innerText = "Email hoặc mật khẩu không đúng";
    password.focus();
});

// XÓA LỖI KHI NHẬP
[email, password].forEach((input) => {
    input.addEventListener("input", () => {
        if (input == email) errorEmail.innerText = "";
        if (input == password) errorPassword.innerText = "";
    });
});