// lắng nghe sự kiện khi toàn bộ nội dung html đã tải xong
document.addEventListener("DOMContentLoaded", () => {
  // khai báo các biến lưu trữ phần tử dom thường dùng
  const postsGrid = document.querySelector(".posts-grid");
  const authBox = document.querySelector(".auth-buttons");
  const myPostBtn = document.querySelector(".tabs a:nth-child(2)");
  const searchInput = document.querySelector(".search-box input");

  // lấy thông tin người dùng đang đăng nhập từ bộ nhớ cục bộ
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // hàm hiển thị thông báo dạng toast (đưa lên đầu để dùng ngay lập tức)
  const showToast = (msg, type = "success") => {
    let toast = document.getElementById("toast");
    // tự động tạo toast nếu html chưa có
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    toast.style.display = "block";

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
      toast.style.display = "none";
    }, 2000);
  };

  // kiểm tra xem tài khoản có đang bị khóa hay không (áp dụng khi tải lại trang)
  if (currentUser) {
    const usersList = JSON.parse(localStorage.getItem("users")) || [];
    const checkStatus = usersList.find(u => u.id === currentUser.id);
    
    if (checkStatus && checkStatus.status === "blocked") {
      localStorage.removeItem("user");
      showToast("tài khoản của bạn đã bị khóa!", "error");
      setTimeout(() => {
        window.location.href = "../html/login.html";
      }, 1500);
      return; // dừng toàn bộ quá trình render trang web
    }
  }

  // tự động đá người dùng ra ngay lập tức nếu admin vừa khóa (áp dụng theo thời gian thực)
  window.addEventListener("storage", (e) => {
    if (e.key === "users" && currentUser) {
      const updatedUsers = JSON.parse(e.newValue) || [];
      const checkUser = updatedUsers.find(u => u.id === currentUser.id);
      
      if (checkUser && checkUser.status === "blocked") {
        localStorage.removeItem("user");
        showToast("tài khoản của bạn vừa bị khóa!", "error");
        setTimeout(() => {
          window.location.href = "../html/login.html";
        }, 1500);
      }
    }
  });

  // khởi tạo các thành phần giao diện cơ bản (modal xác nhận, đổi mật khẩu)
  const initUI = () => {
    if (!document.getElementById("confirmBox")) {
      const modal = document.createElement("div");
      modal.id = "confirmBox";
      modal.innerHTML = `
        <div class="confirm-overlay">
          <div class="confirm-modal">
            <h3 class="confirm-title">xác nhận</h3>
            <p id="confirmText" class="confirm-text">xác nhận?</p>
            <div class="confirm-actions">
              <button type="button" id="cancelBtn" class="confirm-btn btn-cancel">hủy</button>
              <button type="button" id="okBtn" class="confirm-btn btn-ok">đồng ý</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    if (!document.getElementById("changePassModal")) {
      const modal = document.createElement("div");
      modal.id = "changePassModal";
      modal.className = "modal";
      modal.innerHTML = `
        <div class="modal-box">
          <h3>đổi mật khẩu</h3>
          <input type="password" id="newPass" placeholder="mật khẩu mới">
          <input type="password" id="confirmPass" placeholder="nhập lại mật khẩu">
          <p id="passError" class="error-text"></p>
          <div class="modal-actions">
            <button type="button" id="cancelChange">hủy</button>
            <button type="button" id="confirmChange">xác nhận</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  };

  initUI();

  // hàm hiển thị hộp thoại xác nhận bằng promise 
  const confirmModal = (text) => {
    return new Promise((resolve) => {
      const overlay = document.querySelector(".confirm-overlay");
      const confirmText = document.getElementById("confirmText");
      const okBtn = document.getElementById("okBtn");
      const cancelBtn = document.getElementById("cancelBtn");

      confirmText.innerText = text;
      overlay.classList.add("show");

      const close = (value) => {
        overlay.classList.remove("show");
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        resolve(value);
      };

      okBtn.onclick = () => close(true);
      cancelBtn.onclick = () => close(false);
    });
  };

  // hàm lấy và gộp họ tên đầy đủ của người dùng
  const getName = () => {
    const first = currentUser?.firstname || currentUser?.firstName || "";
    const last = currentUser?.lastname || currentUser?.lastName || "";
    return `${first} ${last}`.trim();
  };

  // xử lý xác thực người dùng và trình đơn tài khoản cá nhân
  if (currentUser) {
    const name = getName();
    // tạo avatar bằng 2 chữ cái đầu nếu không có ảnh
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "U";

    authBox.innerHTML = `
      <div class="user-menu">
        ${currentUser.avatar 
            ? `<img src="${currentUser.avatar}" class="avatar" id="avatar" style="width:40px; height:40px; border-radius:50%; cursor:pointer; object-fit:cover;">`
            : `<div class="avatar" id="avatar" style="width:40px; height:40px; border-radius:50%; cursor:pointer; background:#e5e7eb; display:flex; align-items:center; justify-content:center; font-weight:600; color:#374151;">${initials}</div>`
        }

        <div class="dropdown" id="dropdown" style="width: 280px; padding: 8px 0;">
          <div class="user-info" style="display:flex; gap:12px; padding:8px 16px 12px;">
            ${currentUser.avatar 
                ? `<img src="${currentUser.avatar}" class="avatar-small" style="width:45px; height:45px; border-radius:50%; object-fit:cover;">`
                : `<div class="avatar-small" style="width:45px; height:45px; border-radius:50%; background:#e5e7eb; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:16px; color:#374151;">${initials}</div>`
            }
            <div style="flex:1; overflow:hidden;">
              <p class="name" style="margin:0; font-size:16px; font-weight:500; color:#111;">${name || "người dùng"}</p>
              <p class="email" style="margin:2px 0 0 0; font-size:14px; color:#4b5563; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${currentUser.email || ""}</p>
            </div>
          </div>

          <div class="menu-item" id="viewProfile">view profile</div>
          <div class="menu-item" id="updateAvatar">update profile picture</div>
          <div class="menu-item" id="changePassword">change password</div> 

          <div class="divider" style="height:1px; background:#e5e7eb; margin:0 16px 8px;"></div>

          <div style="padding: 0 10px;">
              <div class="menu-item logout" id="logoutBtn" style="padding:10px 12px; cursor:pointer; font-size:15px; color:#111; background:#f3f4f6; border-radius: 6px;">đăng xuất</div>
          </div>
        </div>
      </div>
    `;

    const avatar = document.getElementById("avatar");
    const dropdown = document.getElementById("dropdown");

    avatar.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    };

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-menu")) {
        dropdown.classList.remove("show");
      }
    });

    document.getElementById("viewProfile").onclick = () => {
      showToast("trang profile đang phát triển", "info");
      dropdown.classList.remove("show");
    };

    document.getElementById("updateAvatar").onclick = () => {
      dropdown.classList.remove("show");

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result;

          avatar.src = base64;
          document.querySelector('.avatar-small').src = base64;

          currentUser.avatar = base64;
          localStorage.setItem("user", JSON.stringify(currentUser));

          let users = JSON.parse(localStorage.getItem("users")) || [];
          users = users.map((u) => {
            if (u.id === currentUser.id) {
              u.avatar = base64;
            }
            return u;
          });
          localStorage.setItem("users", JSON.stringify(users));

          showToast("cập nhật ảnh thành công");
        };

        reader.readAsDataURL(file);
      };

      fileInput.click();
    };

    document.getElementById("changePassword").onclick = () => {
      dropdown.classList.remove("show");
      const modal = document.getElementById("changePassModal");
      const newPassInput = document.getElementById("newPass");
      const confirmPassInput = document.getElementById("confirmPass");
      const passError = document.getElementById("passError");

      passError.innerText = "";
      newPassInput.value = "";
      confirmPassInput.value = "";
      modal.classList.add("show");

      document.getElementById("cancelChange").onclick = () => {
        modal.classList.remove("show");
      };

      document.getElementById("confirmChange").onclick = () => {
        passError.innerText = "";
        const p1 = newPassInput.value.trim();
        const p2 = confirmPassInput.value.trim();

        if (!p1) {
          passError.innerText = "không được để trống";
          return;
        }
        if (p1.length < 6) {
          passError.innerText = "mật khẩu ≥ 6 ký tự";
          return;
        }
        if (p1 !== p2) {
          passError.innerText = "mật khẩu không trùng khớp";
          return;
        }

        let users = JSON.parse(localStorage.getItem("users")) || [];
        users = users.map((u) => {
          if (u.id === currentUser.id) {
            u.password = p1;
          }
          return u;
        });

        localStorage.setItem("users", JSON.stringify(users));
        currentUser.password = p1;
        localStorage.setItem("user", JSON.stringify(currentUser));

        modal.classList.remove("show");
        showToast("đổi mật khẩu thành công");
      };
    };

    document.getElementById("logoutBtn").onclick = async () => {
      dropdown.classList.remove("show");

      const ok = await confirmModal("bạn có chắc muốn đăng xuất không?");
      if (!ok) return;

      localStorage.removeItem("user");
      showToast("đã đăng xuất", "info");

      setTimeout(() => {
        window.location.href = "../html/login.html";
      }, 1000);
    };
  } else {
    authBox.innerHTML = `
      <button type="button" onclick="location.href='../html/register.html'">đăng ký</button>
      <button type="button" onclick="location.href='../html/login.html'">đăng nhập</button>
    `;
  }

  // xử lý click vào tab all my posts khi chưa đăng nhập
  if (myPostBtn) {
    myPostBtn.addEventListener("click", (e) => {
      if (!currentUser) {
        e.preventDefault();
        showToast("bạn cần đăng nhập để xem tính năng này", "error");
        setTimeout(() => {
          window.location.href = "../html/login.html";
        }, 1500);
      }
    });
  }

  // chức năng quản lý bình luận: chuyển sang trang timeline
  window.openComments = (postId) => {
    window.location.href = `../html/timeline.html?id=${postId}`;
  };

  // quản lý trạng thái và logic cho tìm kiếm, danh mục, phân trang
  let allArticles = JSON.parse(localStorage.getItem("articles")) || [];
  let currentPage = 1;
  const pageSize = 6; 
  let currentCategory = "all";
  let currentKeyword = "";
  let currentFilteredCount = 0; 

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentKeyword = e.target.value.toLowerCase().trim();
      currentPage = 1; 
      render();
    });
  }

  const renderCategories = () => {
    const categoriesBox = document.getElementById("categories");
    if (!categoriesBox) return;

    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    if (!categories.length) {
      categoriesBox.innerHTML = "<span>chưa có chủ đề</span>";
      return;
    }

    categoriesBox.innerHTML =
      `<span class="active" onclick="filterByCategory('all', event)">all</span>` +
      categories.map(c => `<span onclick="filterByCategory('${c.name}', event)">${c.name}</span>`).join("");
  };

  window.filterByCategory = (name, event) => {
    currentCategory = name;
    currentPage = 1;
    render();

    if (event) {
      const spans = document.querySelectorAll("#categories span");
      spans.forEach(s => s.classList.remove("active"));
      event.target.classList.add("active");
    }
  };

  // hàm hiển thị danh sách bài viết ra giao diện chính
  const render = () => {
    if (!postsGrid) return;

    let filtered = allArticles.filter(a => a.status === "Public");

    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    }

    if (currentKeyword) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(currentKeyword) ||
        a.content.toLowerCase().includes(currentKeyword) ||
        (a.category && a.category.toLowerCase().includes(currentKeyword))
      );
    }

    currentFilteredCount = filtered.length;
    const totalPages = Math.ceil(currentFilteredCount / pageSize);

    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const listToRender = filtered.slice(start, start + pageSize);

    if (!listToRender.length) {
      postsGrid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #666; padding: 40px;'>không tìm thấy bài viết nào phù hợp.</p>";
      renderPagination(0);
      return;
    }

    // in cấu trúc html cho từng bài viết
    postsGrid.innerHTML = listToRender.map(a => `
      <article class="post-card">
        <img src="${a.image || '../img/Image.png'}" alt="Thumbnail" style="border-radius: 4px; object-fit: cover;">
        <div class="post-meta">
          <span>ngày: ${new Date(a.createdAt).toISOString().split('T')[0]}</span>
          <span class="arrow">↗</span>
        </div>
        <h3>${a.title}</h3>
        <p>${a.content}</p>
        
        <div class="post-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px;">
            <div style="display: flex; gap: 12px; align-items: center;">
                <span style="color: #6941C6; background: #F9F5FF; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                    ${a.category || "bài viết"}
                </span>

                <span style="font-size: 13px; color: #64748b; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 4px; white-space: nowrap;" onclick="openComments(${a.id})">
                    <img src="../img/Vector.png" style="width: 14px; height: 14px; border-radius: 0;" alt="cmt"> bình luận
                </span>
            </div>
        </div>
      </article>
    `).join("");

    renderPagination(totalPages);
  };

  // khối xử lý tính toán và hiển thị thanh phân trang
  const renderPagination = (totalPages) => {
    let paginationBox = document.querySelector(".pagination");

    if (!paginationBox) {
      paginationBox = document.createElement("div");
      paginationBox.className = "pagination";
      postsGrid.parentElement.appendChild(paginationBox);
    }

    if (totalPages <= 1) {
      paginationBox.innerHTML = "";
      return;
    }

    let html = `<a href="#" class="prev" onclick="goPrev(event)" style="${currentPage === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}">← previous</a>`;
    html += `<div class="pages">`;

    let pagesArr = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pagesArr.push(i);
    } else {
      if (currentPage <= 3) {
        pagesArr = [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
      } else if (currentPage >= totalPages - 2) {
        pagesArr = [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
      } else {
        pagesArr = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }

    pagesArr.forEach(p => {
      if (p === '...') {
        html += `<span>...</span>`;
      } else {
        html += `<a href="#" class="${p === currentPage ? "active" : ""}" onclick="goPage(${p}, event)">${p}</a>`;
      }
    });

    html += `</div>`;
    html += `<a href="#" class="next" onclick="goNext(event)" style="${currentPage === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}">next →</a>`;

    paginationBox.innerHTML = html;
  };

  window.goPage = (p, event) => {
    if (event) event.preventDefault();
    currentPage = p;
    render();
  };

  window.goPrev = (event) => {
    if (event) event.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      render();
    }
  };

  window.goNext = (event) => {
    if (event) event.preventDefault();
    const totalPages = Math.ceil(currentFilteredCount / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      render();
    }
  };

  renderCategories();
  render();
});