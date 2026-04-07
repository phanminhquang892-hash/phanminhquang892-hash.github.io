document.addEventListener("DOMContentLoaded", () => {
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
  
  // nếu có trang trước đó và trang đó không phải chính là trang add-new-article (tránh bị kẹt vòng lặp khi f5)
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

  // kiểm tra chế độ sửa bài viết
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('editId');
  let articles = JSON.parse(localStorage.getItem("articles")) || [];
  let articleToEdit = null;

  if (editId) {
    articleToEdit = articles.find(a => a.id === Number(editId));
    
    if (articleToEdit) {
      // đổi tiêu đề và nút thành cập nhật
      formTitle.innerText = "📝 Edit Article";
      btn.innerText = "Update";
      
      // điền sẵn dữ liệu cũ
      titleInput.value = articleToEdit.title;
      contentInput.value = articleToEdit.content;
      
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
  }

  // sự kiện khi bấm nút x (đóng)
  if (closeBtn) {
    closeBtn.onclick = () => {
      const returnUrl = sessionStorage.getItem("returnUrl");
      
      // ưu tiên trả về chính xác trang vừa rời đi 
      if (returnUrl) {
          window.location.href = returnUrl;
      } else {
          // backup dự phòng: nếu không có lịch sử , thì check role
          const currentUser = getCurrentUser();
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

  // hàm tải và hiển thị danh mục
  const loadCategories = () => {
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    categorySelect.innerHTML = `<option value="">-- chọn danh mục --</option>`;

    categories.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.name;
      option.textContent = c.name;
      categorySelect.appendChild(option);
    });

    if (articleToEdit) {
      categorySelect.value = articleToEdit.category;
    }
  };

  loadCategories();

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

  // xử lý sự kiện lưu bài viết (thêm mới hoặc cập nhật)
  btn.onclick = () => {
    const currentUser = getCurrentUser();

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

    if (editId && articleToEdit) {
      // chế độ cập nhật
      articleToEdit.title = title;
      articleToEdit.category = category;
      articleToEdit.content = content;
      articleToEdit.status = status;
      articleToEdit.image = imageData;

      localStorage.setItem("articles", JSON.stringify(articles));
      showToast("cập nhật bài viết thành công!");
    } else {
      // chế độ thêm mới
      articles.push({
        id: Date.now(),
        title,
        category,
        content,
        status,
        image: imageData,
        userId: currentUser.id,
        createdAt: new Date().toISOString()
      });

      localStorage.setItem("articles", JSON.stringify(articles));
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
    }, 2000);
  };
});