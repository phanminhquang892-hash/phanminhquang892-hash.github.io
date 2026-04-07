// kéo các hàm cần thiết từ thư viện firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// đoạn mã cấu hình dự án của bạn (lấy từ ảnh 5)
const firebaseConfig = {
  apiKey: "AIzaSyB4kkcdoY6huxRoRiKgA4tqOxhoPOGB23I",
  authDomain: "ung-dung-nhat-ky.firebaseapp.com",
  projectId: "ung-dung-nhat-ky",
  storageBucket: "ung-dung-nhat-ky.firebasestorage.app",
  messagingSenderId: "1065402367385",
  appId: "1:1065402367385:web:9f6a7621dec8ffe8a7e708",
  measurementId: "G-SHQEE710JY"
};

// khởi tạo firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // kho dữ liệu

// xuất biến db để các trang đăng ký, đăng nhập khác sử dụng
export { db };