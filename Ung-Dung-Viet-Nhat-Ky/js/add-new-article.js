import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  // lấy các phần tử dom
  const titleInput = document.getElementById("title");
  const categorySelect = document.getElementById("category");
  const errorCategory = document.getElementById("errorCategory");
  const contentInput = document.getElementById("content");
  const statusRadios = document.querySelectorAll("input[name='status']");
  const btn = document.querySelector(".add-btn");
  const formTitle = document.querySelector(".form-title");
  const closeBtn = document.querySelector(".close-btn"); // nút x

  const errorTitle = document.getElementById("errorTitle");
  const errorContent = document.getElementById("errorContent");

  const uploadBox = document.querySelector(".upload-box");
  const fileName = document.getElementById("fileName");
  const toast = document.getElementById("toast");

  // lưu vết trang trước để nút "x" biết đường về
  const currentRef = document.referrer;
  
  if (currentRef && !currentRef.includes("add-new-article.html")) {
      sessionStorage.setItem("returnUrl", currentRef);
  }

  // tạo thẻ input file ẩn để tải ảnh lên
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  let imageData = "../img/default.png";

  // hàm xác định người dùng đang đăng nhập (admin hay user)
  const getCurrentUser = () => {
    const admin = JSON.parse(localStorage.getItem("admin"));
    const user = JSON.parse(localStorage.getItem("user"));
    const ref = document.referrer || "";

    if (!sessionStorage.getItem("activeRole")) {
      if (ref.includes("article-manager.html") || ref.includes("user_manager.html")) {
        sessionStorage.setItem("activeRole", "admin");
      } else if (ref.includes("homepage.html") || ref.includes("index.html")) {
        sessionStorage.setItem("activeRole", "user");
      }
    }

    const activeRole = sessionStorage.getItem("activeRole");
    if (activeRole === "admin") return admin || user;
    if (activeRole === "user") return user || admin;

    return user || admin;
  };

  const currentUser = getCurrentUser();

  // hàm tải và hiển thị danh mục TỪ FIREBASE
  const loadCategories = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        categorySelect.innerHTML = `<option value="">-- chọn danh mục --</option>`;
        querySnapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.data().name;
            option.textContent = doc.data().name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Lỗi tải danh mục:", error);
    }
  };

  await loadCategories();

  // kiểm tra chế độ sửa bài viết
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('editId'); // Firebase dùng string ID
  let articleToEdit = null;

  if (editId) {
    try {
      const docSnap = await getDoc(doc(db, "articles", editId));
      if (docSnap.exists()) {
        articleToEdit = docSnap.data();
        
        // đổi tiêu đề và nút thành cập nhật
        formTitle.innerText = "📝 Edit Article";
        btn.innerText = "Update";
        
        // điền sẵn dữ liệu cũ
        titleInput.value = articleToEdit.title;
        contentInput.value = articleToEdit.content;
        categorySelect.value = articleToEdit.category;
        
        statusRadios.forEach((r) => {
          if (r.value.toLowerCase() === articleToEdit.status.toLowerCase()) {
            r.checked = true;
          }
        });

        if (articleToEdit.image && articleToEdit.image !== "../img/default.png") {
          imageData = articleToEdit.image;
          fileName.innerText = "đã có ảnh minh họa";
          const uploadIcon = document.querySelector(".upload-icon");
          const uploadText = document.querySelector(".upload-text");
          if (uploadIcon) uploadIcon.style.display = "none";
          if (uploadText) uploadText.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu bài viết cũ:", error);
    }
  }

  // sự kiện khi bấm nút x (đóng)
  if (closeBtn) {
    closeBtn.onclick = () => {
      const returnUrl = sessionStorage.getItem("returnUrl");
      
      if (returnUrl) {
          window.location.href = returnUrl;
      } else {
          const role = currentUser?.role?.toLowerCase();
          if (role === "admin") {
            window.location.href = "../html/article-manager.html";
          } else {
            window.location.href = "../html/homepage.html";
          }
      }
    };
  }

  // sự kiện bấm vào hộp tải ảnh
  uploadBox.onclick = () => {
    fileInput.click();
  };

  // xử lý hiển thị tên file khi đã chọn ảnh
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileName.innerText = file.name;

    const uploadIcon = document.querySelector(".upload-icon");
    const uploadText = document.querySelector(".upload-text");

    if (uploadIcon) uploadIcon.style.display = "none";
    if (uploadText) uploadText.style.display = "none";

    const reader = new FileReader();
    reader.onload = () => {
      imageData = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // hàm hiển thị thông báo
  const showToast = (message) => {
    toast.innerText = message;
    toast.style.display = "block";

    setTimeout(() => {
      toast.style.display = "none";
    }, 2000);
  };

  // xử lý sự kiện lưu bài viết (thêm mới hoặc cập nhật) LÊN FIREBASE
  btn.onclick = async () => {
    if (!currentUser) {
      alert("bạn chưa đăng nhập!");
      return;
    }

    errorTitle.innerText = "";
    errorContent.innerText = "";
    errorCategory.innerText = "";

    const title = titleInput.value.trim();
    const category = categorySelect.value;
    const content = contentInput.value.trim();

    let status = "Public";
    statusRadios.forEach((r) => {
      if (r.checked && r.value === "private") {
        status = "Private";
      }
    });

    let isValid = true;
    if (!category) {
      errorCategory.innerText = "không được để trống chủ đề!";
      isValid = false;
    }
    if (!title) {
      errorTitle.innerText = "không được để trống tiêu đề!";
      isValid = false;
    }
    if (!content) {
      errorContent.innerText = "không được để trống nội dung!";
      isValid = false;
    }

    if (!isValid) return;

    try {
      if (editId && articleToEdit) {
        // chế độ cập nhật
        await updateDoc(doc(db, "articles", editId), {
          title: title,
          category: category,
          content: content,
          status: status,
          image: imageData
        });
        showToast("cập nhật bài viết thành công!");
      } else {
        // chế độ thêm mới
        await addDoc(collection(db, "articles"), {
          title: title,
          category: category,
          content: content,
          status: status,
          image: imageData,
          userId: currentUser.id,
          createdAt: new Date().toISOString()
        });
        showToast("thêm bài viết mới thành công!");
      }

      // chuyển hướng về trang cũ sau khi lưu
      setTimeout(() => {
        const returnUrl = sessionStorage.getItem("returnUrl");
        if (returnUrl) {
            window.location.href = returnUrl;
        } else {
            const role = currentUser.role?.toLowerCase();
            if (role === "admin") {
              window.location.href = "../html/article-manager.html";
            } else {
              window.location.href = "../html/homepage.html";
            }
        }
      }, 1500);

    } catch (error) {
      console.error("Lỗi lưu bài:", error);
      alert("Có lỗi xảy ra khi lưu lên server");
    }
  };
});