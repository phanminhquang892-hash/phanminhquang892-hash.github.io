// lắng nghe sự kiện khi tài liệu html đã tải xong
document.addEventListener("DOMContentLoaded", () => {

    // khai báo các biến dom cơ bản
    const postsGrid = document.querySelector(".posts-grid");
    const authBox = document.querySelector(".auth-buttons");
    const searchInput = document.querySelector(".search-box input");
    
    // lấy thông tin người dùng và danh sách bài viết từ bộ nhớ tạm
    let currentUser = JSON.parse(localStorage.getItem("user"));
    let allArticles = JSON.parse(localStorage.getItem("articles")) || [];

    // hàm hiển thị thông báo (đưa lên trên cùng để dùng ngay lập tức khi kiểm tra tài khoản)
    const showToast = (msg, type = "success") => {
        let toast = document.getElementById("toast");
        // nếu chưa có thẻ toast trong html thì tự động tạo
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
            return; // dừng không cho hiển thị giao diện bên dưới nữa
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

    // các biến trạng thái để điều khiển giao diện
    let isMyPostMode = true; // mặc định hiển thị bài của mình
    let keyword = "";
    let currentPage = 1;
    const pageSize = 6; 
    let currentFilteredCount = 0;

    // khởi tạo các thành phần giao diện ẩn (hộp thoại xác nhận)
    const initUI = () => {
        if (!document.getElementById("confirmBox")) {
            const modal = document.createElement("div");
            modal.id = "confirmBox";
            modal.innerHTML = `
                <div class="confirm-overlay">
                  <div class="confirm-modal">
                    <h3 class="confirm-title">xác nhận</h3>
                    <p id="confirmText" class="confirm-text">bạn có chắc chắn?</p>
                    <div class="confirm-actions">
                      <button id="cancelBtn" class="confirm-btn btn-cancel">hủy</button>
                      <button id="okBtn" class="confirm-btn btn-ok">đồng ý</button>
                    </div>
                  </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    };

    initUI();

    // hàm mở hộp thoại xác nhận
    const confirmModal = (text) => {
        return new Promise((resolve) => {
            const box = document.querySelector(".confirm-overlay");
            const okBtn = document.getElementById("okBtn");
            const cancelBtn = document.getElementById("cancelBtn");
            
            document.getElementById("confirmText").innerText = text;
            box.classList.add("show");

            const close = (val) => {
                box.classList.remove("show");
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                resolve(val);
            };

            okBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
        });
    };

    // lấy họ tên người dùng
    const getName = () => {
        const first = currentUser?.firstName || currentUser?.firstname || "";
        const last = currentUser?.lastName || currentUser?.lastname || "";
        return `${first} ${last}`.trim();
    };

    // xử lý hiển thị thông tin tài khoản trên thanh điều hướng và chức năng đăng xuất
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
                        <p class="email" style="margin:2px 0 0 0; font-size:14px; color:#4b5563; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${currentUser.email}</p>
                    </div>
                </div>
                
                <div class="divider" style="height:1px; background:#e5e7eb; margin:0 16px 8px;"></div>
                
                <div style="padding: 0 10px;">
                    <div class="menu-item logout" id="logoutBtn" style="padding:10px 12px; cursor:pointer; font-size:15px; color:#111; background:#f3f4f6; border-radius: 6px;">đăng xuất</div>
                </div>
            </div>
        </div>
        `;

        const avatar = document.getElementById("avatar");
        const dropdown = document.getElementById("dropdown");

        // bật tắt dropdown khi click vào ảnh đại diện
        avatar.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("show");
        };

        // tự động ẩn dropdown khi click ra vùng trống
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".user-menu")) dropdown.classList.remove("show");
        });

        // xử lý đăng xuất
        document.getElementById("logoutBtn").onclick = async () => {
            dropdown.classList.remove("show");
            const ok = await confirmModal("bạn có chắc muốn đăng xuất?");
            if (!ok) return;

            localStorage.removeItem("user");
            showToast("đã đăng xuất", "info");
            setTimeout(() => { window.location.href = "../html/login.html"; }, 1000);
        };
    } else {
        // hiển thị nút đăng nhập nếu chưa đăng nhập
        authBox.innerHTML = `
        <button onclick="location.href='../html/register.html'">đăng ký</button>
        <button onclick="location.href='../html/login.html'">đăng nhập</button>
        `;
    }

    // xử lý nút thêm bài viết mới
    const addTitle = document.querySelector(".main-title");
    if (addTitle) {
        addTitle.style.cursor = "pointer";
        addTitle.onclick = () => {
            if (!currentUser) {
                showToast("bạn cần đăng nhập để viết bài", "error");
                setTimeout(() => { window.location.href = "../html/login.html"; }, 1500);
                return;
            }
            window.location.href = "../html/add-new-article.html";
        };
    }

    // chuyển hướng sang trang chi tiết (timeline) để xem bình luận
    window.openComments = (postId) => {
        window.location.href = `../html/timeline.html?id=${postId}`;
    };

    // hàm lọc dữ liệu lõi loại bỏ bài viết của admin
    const getFilteredArticles = () => {
        let list = [...allArticles];

        // loại bỏ hoàn toàn các bài viết do admin đăng
        list = list.filter(a => a.userId !== 1 && a.userId !== 2);

        // lọc theo từ khóa tìm kiếm
        if (keyword) {
            list = list.filter(a =>
                a.title.toLowerCase().includes(keyword) ||
                a.content.toLowerCase().includes(keyword) ||
                (a.category && a.category.toLowerCase().includes(keyword))
            );
        }

        // lọc theo bộ lọc tab
        if (isMyPostMode) {
            list = list.filter(a => currentUser && a.userId === currentUser.id);
        } else {
            list = list.filter(a => {
                if (a.status === "Public") return true;
                if (currentUser && a.userId === currentUser.id) return true;
                return false;
            });
        }

        return list.reverse(); 
    };

    // hàm in danh sách bài viết ra giao diện
    const render = () => {
        if (!postsGrid) return;

        let list = getFilteredArticles();
        currentFilteredCount = list.length;
        
        const totalPages = Math.ceil(currentFilteredCount / pageSize);
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

        const start = (currentPage - 1) * pageSize;
        const listToRender = list.slice(start, start + pageSize);

        if (!listToRender.length) {
            postsGrid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #666; padding: 40px;'>không tìm thấy bài viết nào phù hợp.</p>";
            renderPagination(0);
            return;
        }

        // dựng lại cấu trúc bài viết chuẩn hình thiết kế
        postsGrid.innerHTML = listToRender.map(a => `
            <article class="post-card">
                <img src="${a.image || '../img/Image.png'}" alt="Thumbnail" style="border-radius: 4px; object-fit: cover;"/>
                <div class="post-meta">
                   <span>Date: ${new Date(a.createdAt).toISOString().split('T')[0]}</span>
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
                            <img src="../img/Vector.png" style="width: 14px; height: 14px; border-radius: 0;"> bình luận
                        </span>
                    </div>

                    ${currentUser && a.userId === currentUser.id ? `
                        <div style="display: flex; gap: 8px;">
                            <a href="#" onclick="editPost(${a.id}, event)" style="color:#c11574; background:#fce7f3; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap;">edit your post</a>
                            <a href="#" onclick="deletePost(${a.id}, event)" style="color:#ef4444; background:#FEE2E2; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap;">delete</a>
                        </div>
                    ` : ""}

                </div>
            </article>
        `).join("");

        renderPagination(totalPages);
    };

    // hàm in thanh phân trang
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

    // các hàm xử lý sự kiện chuyển trang
    window.goPage = (p, event) => {
        if(event) event.preventDefault();
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

    // hàm chỉnh sửa bài viết: chuyển hướng sang trang add-new-article kèm id
    window.editPost = (id, event) => {
        event.preventDefault();
        window.location.href = `../html/add-new-article.html?editId=${id}`;
    };

    // hàm xóa bài viết
    window.deletePost = async (id, event) => {
        event.preventDefault();
        const ok = await confirmModal("bạn có chắc chắn muốn xóa bài viết này?");
        if (!ok) return;

        let articles = JSON.parse(localStorage.getItem("articles")) || [];
        articles = articles.filter(a => a.id !== id);

        localStorage.setItem("articles", JSON.stringify(articles));
        allArticles = articles;
        render();
        showToast("đã xóa bài viết");
    };

    // sự kiện tìm kiếm theo thời gian thực
    searchInput?.addEventListener("input", (e) => {
        keyword = e.target.value.toLowerCase().trim();
        currentPage = 1;
        render();
    });

    // các hàm chuyển đổi tab được gán vào window để gọi từ html
    window.showAllPosts = (event) => {
        if(event) event.preventDefault();
        isMyPostMode = false;
        currentPage = 1;
        document.querySelectorAll(".tabs a").forEach(a => a.classList.remove("active"));
        document.querySelector(".tabs a:nth-child(1)").classList.add("active");
        render();
    };

    window.showMyPosts = (event) => {
        if(event) event.preventDefault();
        if (!currentUser) {
            showToast("vui lòng đăng nhập để xem tính năng này", "error");
            return;
        }
        isMyPostMode = true;
        currentPage = 1;
        document.querySelectorAll(".tabs a").forEach(a => a.classList.remove("active"));
        document.querySelector(".tabs a:nth-child(2)").classList.add("active");
        render();
    };
    
    // chạy hàm hiển thị lần đầu tiên
    render();
});