import { db } from "./firebase-config.js";
import { collection, getDocs, doc, getDoc, deleteDoc } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

    const postsGrid = document.querySelector(".posts-grid");
    const authBox = document.querySelector(".auth-buttons");
    const searchInput = document.querySelector(".search-box input");
    
    // Lấy thông tin user hiện tại
    let currentUser = JSON.parse(localStorage.getItem("user"));
    let allArticles = []; // Kho chứa bài viết tải từ Firebase

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

    // Kiểm tra tài khoản có bị khóa không từ Firebase
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
            console.error("Lỗi kiểm tra block:", e);
        }
    }

    let isMyPostMode = true; // Mặc định ở trang homepage.html là tab "All my posts"
    let keyword = "";
    let currentPage = 1;
    const pageSize = 6; 
    let currentFilteredCount = 0;

    // Dựng giao diện Modal Xác nhận
    const initUI = () => {
        if (!document.getElementById("confirmBox")) {
            const modal = document.createElement("div");
            modal.id = "confirmBox";
            modal.innerHTML = `
                <div class="confirm-overlay">
                  <div class="confirm-modal">
                    <h3 class="confirm-title">Xác nhận</h3>
                    <p id="confirmText" class="confirm-text">Bạn có chắc chắn?</p>
                    <div class="confirm-actions">
                      <button id="cancelBtn" class="confirm-btn btn-cancel">Hủy</button>
                      <button id="okBtn" class="confirm-btn btn-ok">Đồng ý</button>
                    </div>
                  </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    };
    initUI();

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

    const getName = () => {
        const first = currentUser?.firstName || currentUser?.firstname || "";
        const last = currentUser?.lastName || currentUser?.lastname || "";
        return `${first} ${last}`.trim();
    };

    // Render thông tin Avatar & User Menu
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
                        <p class="email" style="margin:2px 0 0 0; font-size:14px; color:#4b5563; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${currentUser.email}</p>
                    </div>
                </div>
                <div class="divider" style="height:1px; background:#e5e7eb; margin:0 16px 8px;"></div>
                <div style="padding: 0 10px;">
                    <div class="menu-item logout" id="logoutBtn" style="padding:10px 12px; cursor:pointer; font-size:15px; color:#111; background:#f3f4f6; border-radius: 6px;">Đăng xuất</div>
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

        document.getElementById("logoutBtn").onclick = async () => {
            dropdown.classList.remove("show");
            const ok = await confirmModal("Bạn có chắc muốn đăng xuất?");
            if (!ok) return;

            localStorage.removeItem("user");
            showToast("Đã đăng xuất", "info");
            setTimeout(() => { window.location.href = "../html/login.html"; }, 1000);
        };
    } else {
        authBox.innerHTML = `
        <button onclick="location.href='../html/register.html'">Đăng ký</button>
        <button onclick="location.href='../html/login.html'">Đăng nhập</button>
        `;
    }

    const addTitle = document.querySelector(".main-title");
    if (addTitle) {
        addTitle.style.cursor = "pointer";
        addTitle.onclick = () => {
            if (!currentUser) {
                showToast("Bạn cần đăng nhập để viết bài", "error");
                setTimeout(() => { window.location.href = "../html/login.html"; }, 1500);
                return;
            }
            window.location.href = "../html/add-new-article.html";
        };
    }

    window.openComments = (postId) => {
        window.location.href = `../html/timeline.html?id=${postId}`;
    };

    // ĐOẠN QUAN TRỌNG: TẢI BÀI VIẾT TỪ FIREBASE
    const loadArticles = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "articles"));
            allArticles = [];
            querySnapshot.forEach(doc => {
                allArticles.push({ id: doc.id, ...doc.data() });
            });
            render();
        } catch (error) {
            console.error("Lỗi tải bài viết:", error);
        }
    };

    // Hàm lọc dữ liệu kết hợp chuẩn hóa ID sang String
    const getFilteredArticles = () => {
        let list = [...allArticles];

        if (keyword) {
            list = list.filter(a =>
                (a.title || "").toLowerCase().includes(keyword) ||
                (a.content || "").toLowerCase().includes(keyword) ||
                (a.category && a.category.toLowerCase().includes(keyword))
            );
        }

        if (isMyPostMode) {
            // Lọc chính xác ID (chuyển sang string để tránh lệch kiểu dữ liệu)
            list = list.filter(a => currentUser && String(a.userId) === String(currentUser.id));
        } else {
            list = list.filter(a => String(a.status).toLowerCase() === "public");
            list = list.filter(a => a.userId != 1 && a.userId != 2 && a.role !== 'admin');
        }

        // Bài mới lên đầu
        list.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        return list; 
    };

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

        postsGrid.innerHTML = listToRender.map(a => `
            <article class="post-card">
                <img src="${a.image || '../img/Image.png'}" alt="Thumbnail" style="border-radius: 4px; object-fit: cover;"/>
                <div class="post-meta">
                   <span>Date: ${new Date(a.createdAt).toISOString().split('T')[0]}</span>
                </div>
                <h3>${a.title}</h3>
                <p style="overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${a.content}</p>
                
                <div class="post-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px;">
                    
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <span style="color: #6941C6; background: #F9F5FF; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                            ${a.category || "Bài viết"}
                        </span>
                        
                        <span style="font-size: 13px; color: #64748b; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 4px; white-space: nowrap;" onclick="window.openComments('${a.id}')">
                            <img src="../img/Vector.png" style="width: 14px; height: 14px; border-radius: 0;"> Bình luận
                        </span>
                    </div>

                    ${currentUser && String(a.userId) === String(currentUser.id) ? `
                        <div style="display: flex; gap: 8px;">
                            <a href="#" onclick="window.editPost('${a.id}', event)" style="color:#c11574; background:#fce7f3; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap;">Sửa</a>
                            <a href="#" onclick="window.deletePost('${a.id}', event)" style="color:#ef4444; background:#FEE2E2; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap;">Xóa</a>
                        </div>
                    ` : ""}

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

        let html = `<a href="#" class="prev" onclick="window.goPrev(event)" style="${currentPage === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}">← Previous</a>`;
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
        html += `<a href="#" class="next" onclick="window.goNext(event)" style="${currentPage === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}">Next →</a>`;

        paginationBox.innerHTML = html;
    };

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

    window.editPost = (id, event) => {
        event.preventDefault();
        window.location.href = `../html/add-new-article.html?editId=${id}`;
    };

    window.deletePost = async (id, event) => {
        event.preventDefault();
        const ok = await confirmModal("Bạn có chắc chắn muốn xóa bài viết này?");
        if (!ok) return;

        try {
            await deleteDoc(doc(db, "articles", id));
            allArticles = allArticles.filter(a => a.id !== id);
            render();
            showToast("Đã xóa bài viết");
        } catch (error) {
            console.error("Lỗi xóa bài:", error);
            showToast("Lỗi hệ thống khi xóa", "error");
        }
    };

    searchInput?.addEventListener("input", (e) => {
        keyword = e.target.value.toLowerCase().trim();
        currentPage = 1;
        render();
    });

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
            showToast("Vui lòng đăng nhập để xem tính năng này", "error");
            return;
        }
        isMyPostMode = true;
        currentPage = 1;
        document.querySelectorAll(".tabs a").forEach(a => a.classList.remove("active"));
        document.querySelector(".tabs a:nth-child(2)").classList.add("active");
        render();
    };
    
    // TẢI LẦN ĐẦU
    await loadArticles();
});
