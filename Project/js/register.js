const textInputs = document.querySelectorAll('input[type="text"]');
const firstName = textInputs[0];
const lastName = textInputs[1];
const email = document.querySelector('input[type="email"]');
const password = document.querySelectorAll('input[type="password"]')[0];
const confirmPassword = document.querySelectorAll('input[type="password"]')[1];
const form = document.querySelector("form");
const status = document.getElementById("status");

// error elements
const errorFirstName = document.getElementById("error_firstName");
const errorLastName = document.getElementById("error_lastName");
const errorEmail = document.getElementById("error_email");
const errorPassword = document.getElementById("error_password");
const errorConfirm = document.getElementById("error_confirmPassword");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

form.addEventListener("submit", (e) => {
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
        errorFirstName.innerText = "Không được để trống";
        isValid = false;
    }

    if (!lName) {
        errorLastName.innerText = "Không được để trống";
        isValid = false;
    }

    if (!userEmail) {
        errorEmail.innerText = "Không được để trống";
        isValid = false;
    } else if (!emailRegex.test(userEmail)) {
        errorEmail.innerText = "Email không đúng định dạng";
        isValid = false;
    }

    if (!pass) {
        errorPassword.innerText = "Không được để trống";
        isValid = false;
    } else if (pass.length < 6) {
        errorPassword.innerText = "Mật khẩu ≥ 6 ký tự";
        isValid = false;
    }

    if (!confirmPass) {
        errorConfirm.innerText = "Không được để trống";
        isValid = false;
    } else if (pass !== confirmPass) {
        errorConfirm.innerText = "Mật khẩu không trùng";
        isValid = false;
    }

    if (!isValid) return;

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const isExist = users.find(user => user.email === userEmail);
    if (isExist) {
        errorEmail.innerText = "Email đã tồn tại";
        return;
    }

    const newUser = {
        id: Date.now(),
        firstName: fName,
        lastName: lName,
        email: userEmail,
        password: pass
    };

    localStorage.setItem("users", JSON.stringify([...users, newUser]));

    // hiển thị thành công
    status.style.display = "block";

    setTimeout(() => {
        window.location.href = "../html/login.html";
    }, 1500);
});

// xóa lỗi khi nhập lại
[firstName, lastName, email, password, confirmPassword].forEach(input => {
    input.addEventListener("input", () => {
        const error = input.parentElement.querySelector(".error");
        if (error) error.innerText = "";
    });
});