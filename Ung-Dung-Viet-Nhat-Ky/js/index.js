import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc, deleteDoc } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  // khai báo các biến lưu trữ phần tử dom thường dùng
  const postsGrid = document.querySelector(".posts-grid");
  const authBox = document.querySelector(".auth-buttons");
  const myPostBtn = document.querySelector(".tabs a:nth-child(2)");
  const searchInput = document.querySelector(".search-box input");

  // lấy thông tin người dùng đang đăng nhập từ bộ nhớ cục bộ
  let currentUser = JSON.parse(localStorage.getItem("user"));

  // hàm hiển thị thông báo dạng toast
  const showToast = (msg, type = "success") => {
    let toast = document.getElementById("toast");
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

  // CHECK BLOCK TỪ FIREBASE KHI TẢI TRANG
  if (currentUser) {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.id));
        if (userDoc.exists() && userDoc.data().status === "blocked") {
            localStorage.removeItem("user");
            showToast("tài khoản của bạn đã bị khóa!", "error");
            setTimeout(() => { window.location.href = "../html/login.html"; }, 1500);
            return;
        }
    } catch (e) {
        console.error("Lỗi check block:", e);
    }
  }

  // khởi tạo UI
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

  const getName = () => {
    const first = currentUser?.firstname || currentUser?.firstName || "";
    const last = currentUser?.lastname || currentUser?.lastName || "";
    return `${first} ${last}`.trim();
  };

  // UI USER AUTH
  if (currentUser) {
    const name = getName();
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
      if (!e.target.closest(".user-menu")) dropdown.classList.remove("show");
    });

    document.getElementById("viewProfile").onclick = () => {
      showToast("trang profile đang phát triển", "info");
      dropdown.classList.remove("show");
    };

    // UPDATE AVATAR LÊN FIREBASE
    document.getElementById("updateAvatar").onclick = () => {
      dropdown.classList.remove("show");

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
          const base200 = reader.result;

          try {
              // Cập nhật Firebase
              await updateDoc(doc(db, "users", currentUser.id), { avatar: base200 });
              
              // Cập nhật UI
              avatar.src = base200;
              document.querySelector('.avatar-small').src = base200;

              // Cập nhật Local (phiên hiện tại)
              currentUser.avatar = base200;
              localStorage.setItem("user", JSON.stringify(currentUser));

              showToast("cập nhật ảnh thành công");
          } catch(err) {
              alert("Lỗi cập nhật ảnh lên server");
          }
        };
        reader.readAsDataURL(file);
      };
      fileInput.click();
    };

    // UPDATE PASSWORD LÊN FIREBASE
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

      document.getElementById("cancelChange").onclick = () => modal.classList.remove("show");

      document.getElementById("confirmChange").onclick = async () => {
        passError.innerText = "";
        const p1 = newPassInput.value.trim();
        const p2 = confirmPassInput.value.trim();

        if (!p1) return passError.innerText = "không được để trống";
        if (p1.length < 6) return passError.innerText = "mật khẩu ≥ 6 ký tự";
        if (p1 !== p2) return passError.innerText = "mật khẩu không trùng khớp";

        try {
            await updateDoc(doc(db, "users", currentUser.id), { password: p1 });
            
            currentUser.password = p1;
            localStorage.setItem("user", JSON.stringify(currentUser));

            modal.classList.remove("show");
            showToast("đổi mật khẩu thành công");
        } catch (e) {
            passError.innerText = "Lỗi kết nối máy chủ";
        }
      };
    };

    document.getElementById("logoutBtn").onclick = async () => {
      dropdown.classList.remove("show");
      const ok = await confirmModal("bạn có chắc muốn đăng xuất không?");
      if (!ok) return;

      localStorage.removeItem("user");
      showToast("đã đăng xuất", "info");
      setTimeout(() => { window.location.href = "../html/login.html"; }, 1000);
    };
  } else {
    if(authBox) {
        authBox.innerHTML = `
        <button type="button" onclick="location.href='../html/register.html'">đăng ký</button>
        <button type="button" onclick="location.href='../html/login.html'">đăng nhập</button>
        `;
    }
  }

  if (myPostBtn) {
    myPostBtn.addEventListener("click", (e) => {
      if (!currentUser) {
        e.preventDefault();
        showToast("bạn cần đăng nhập để xem tính năng này", "error");
        setTimeout(() => { window.location.href = "../html/login.html"; }, 1500);
      }
    });
  }

  window.openComments = (postId) => {
    window.location.href = `../html/timeline.html?id=${postId}`;
  };

  // LOAD DATA TỪ FIREBASE
  let allArticles = [];
  let allCategories = [];
  let currentPage = 1;
  const pageSize = 6; 
  let currentCategory = "all";
  let currentKeyword = "";
  let currentFilteredCount = 0; 

  const loadData = async () => {
      try {
          const [artSnap, catSnap] = await Promise.all([
              getDocs(collection(db, "articles")),
              getDocs(collection(db, "categories"))
          ]);

          allArticles = [];
          artSnap.forEach(doc => allArticles.push({ id: doc.id, ...doc.data() }));

          allCategories = [];
          catSnap.forEach(doc => allCategories.push({ id: doc.id, ...doc.data() }));

          renderCategories();
          render();
      } catch (error) {
          console.error("Lỗi tải dữ liệu:", error);
      }
  };

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

    if (!allCategories.length) {
      categoriesBox.innerHTML = "<span>chưa có chủ đề</span>";
      return;
    }

    categoriesBox.innerHTML =
      `<span class="active" onclick="window.filterByCategory('all', event)">all</span>` +
      allCategories.map(c => `<span onclick="window.filterByCategory('${c.name}', event)">${c.name}</span>`).join("");
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

    // Sắp xếp mới nhất
    filtered.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

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

    postsGrid.innerHTML = listToRender.map(a => `
      <article class="post-card">
        <img src="${a.image || '../img/Image.png'}" alt="Thumbnail" style="border-radius: 4px; object-fit: cover;">
        <div class="post-meta">
          <span>ngày: ${new Date(a.createdAt).toISOString().split('T')[0]}</span>
          <span class="arrow">↗</span>
        </div>
        <h3>${a.title}</h3>
        <p style="overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${a.content}</p>
        
        <div class="post-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px;">
            <div style="display: flex; gap: 12px; align-items: center;">
                <span style="color: #6941C6; background: #F9F5FF; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                    ${a.category || "bài viết"}
                </span>

                <span style="font-size: 13px; color: #64748b; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 4px; white-space: nowrap;" onclick="window.openComments('${a.id}')">
                    <img src="../img/Vector.png" style="width: 14px; height: 14px; border-radius: 0;" alt="cmt"> bình luận
                </span>
            </div>
        </div>
      </article>
    `).join("");

    renderPagination(totalPages);
  };

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

    let html = `<a href="#" class="prev" onclick="window.goPrev(event)" style="${currentPage === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}">← previous</a>`;
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
        html += `<a href="#" class="${p === currentPage ? "active" : ""}" onclick="window.goPage(${p}, event)">${p}</a>`;
      }
    });

    html += `</div>`;
    html += `<a href="#" class="next" onclick="window.goNext(event)" style="${currentPage === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}">next →</a>`;

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

  await loadData();
});