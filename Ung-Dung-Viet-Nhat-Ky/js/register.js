// kéo thư viện firebase từ trên mạng về
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// cấu hình hệ thống (từ dự án ung-dung-nhat-ky của bạn)
const firebaseConfig = {
    apiKey: "AIzaSyB4kkcdoY6huxRoRiKgA4tqOxhoPOGB23I",
    authDomain: "ung-dung-nhat-ky.firebaseapp.com",
    projectId: "ung-dung-nhat-ky",
    storageBucket: "ung-dung-nhat-ky.firebasestorage.app",
    messagingSenderId: "1065402367385",
    appId: "1:1065402367385:web:9174faa19aa70606a7e708",
    measurementId: "G-1VYLRM0BJC"
};

// khởi động kết nối với firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// tham chiếu đến bảng (collection) có tên là "users" trên mây
const usersCollection = collection(db, "users");

// lấy các phần tử dom
const textInputs = document.querySelectorAll('input[type="text"]');
const firstName = textInputs[0];
const lastName = textInputs[1];
const email = document.querySelector('input[type="email"]');
const password = document.querySelectorAll('input[type="password"]')[0];
const confirmPassword = document.querySelectorAll('input[type="password"]')[1];
const form = document.querySelector("form");
const status = document.getElementById("status");

// các thẻ hiển thị lỗi
const errorFirstName = document.getElementById("error_firstName");
const errorLastName = document.getElementById("error_lastName");
const errorEmail = document.getElementById("error_email");
const errorPassword = document.getElementById("error_password");
const errorConfirm = document.getElementById("error_confirmPassword");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// xử lý đăng ký (thêm chữ async vì cần chờ mạng gửi dữ liệu)
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // reset lỗi
    errorFirstName.innerText = "";
    errorLastName.innerText = "";
    errorEmail.innerText = "";
    errorPassword.innerText = "";
    errorConfirm.innerText = "";

    const fName = firstName.value.trim();
    const lName = lastName.value.trim();
    const userEmail = email.value.trim();
    const pass = password.value.trim();
    const confirmPass = confirmPassword.value.trim();

    let isValid = true;

    if (!fName) {
        errorFirstName.innerText = "không được để trống";
        isValid = false;
    }

    if (!lName) {
        errorLastName.innerText = "không được để trống";
        isValid = false;
    }

    if (!userEmail) {
        errorEmail.innerText = "không được để trống";
        isValid = false;
    } else if (!emailRegex.test(userEmail)) {
        errorEmail.innerText = "email không đúng định dạng";
        isValid = false;
    }

    if (!pass) {
        errorPassword.innerText = "không được để trống";
        isValid = false;
    } else if (pass.length < 6) {
        errorPassword.innerText = "mật khẩu ≥ 6 ký tự";
        isValid = false;
    }

    if (!confirmPass) {
        errorConfirm.innerText = "không được để trống";
        isValid = false;
    } else if (pass !== confirmPass) {
        errorConfirm.innerText = "mật khẩu không trùng";
        isValid = false;
    }

    if (!isValid) return;

    // ĐOẠN QUAN TRỌNG: LÀM VIỆC VỚI DATABASE TRÊN MẠNG
    try {
        // 1. kiểm tra xem email đã tồn tại trên mây chưa
        const q = query(usersCollection, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            errorEmail.innerText = "email đã tồn tại";
            return;
        }

        // 2. nếu chưa tồn tại, tạo tài khoản mới và đẩy lên firebase
        await addDoc(usersCollection, {
            id: Date.now(), // tạo mã id ngẫu nhiên
            firstName: fName,
            lastName: lName,
            email: userEmail,
            password: pass,
            status: "active", // mặc định mới đăng ký là hoạt động
            role: "user",     // mặc định là user thường
            createdAt: new Date().toISOString()
        });

        // hiển thị thông báo thành công
        status.style.display = "block";

        // chuyển về trang đăng nhập sau 1.5 giây
        setTimeout(() => {
            window.location.href = "../html/login.html";
        }, 1500);

    } catch (error) {
        console.error("lỗi khi kết nối với firebase:", error);
        alert("lỗi mạng! không thể kết nối tới máy chủ.");
    }
});

// xóa lỗi khi người dùng bắt đầu gõ lại
[firstName, lastName, email, password, confirmPassword].forEach(input => {
    input.addEventListener("input", () => {
        const error = input.parentElement.querySelector(".error");
        if (error) error.innerText = "";
    });
});