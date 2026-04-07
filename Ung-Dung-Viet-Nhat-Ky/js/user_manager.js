import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

    // kiểm tra quyền admin
    if (typeof window.checkLogin === "function") window.checkLogin(true);
    else if (typeof checkLogin === "function") checkLogin(true);

    // lấy DOM
    const searchInput = document.querySelector(".search-box input");
    const tbody = document.querySelector(".users-table tbody");
    const prevBtn = document.querySelector(".pagination .prev");
    const nextBtn = document.querySelector(".pagination .next");
    const pagesWrap = document.querySelector(".pagination .pages");
    const sortTrigger = document.querySelector(".name-col .sort");
    const pill = document.querySelector(".pill");
    const logoutLink = document.querySelector(".menu-item.logout");

    const pageSize = 5;
    let currentPage = 1;
    let sortAsc = true;
    let totalPages = 1;

    // Mảng lưu dữ liệu người dùng từ Firebase
    let usersData = [];

    // Tải dữ liệu từ Firebase
    const loadUsersFromFirebase = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            usersData = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() });
            });
            render();
        } catch (error) {
            console.error("Lỗi tải dữ liệu user:", error);
            showToast("❌ Lỗi tải dữ liệu máy chủ", "error");
        }
    };

    // lấy danh sách user
    const getUsers = () => {
        return usersData;
    };

    // chuẩn hóa dữ liệu user
    const normalizeUser = (user) => ({
        ...user,
        status: user.status || "active"
    });

    // lấy tên đầy đủ
    const getFullName = (user) => {
        const first = user.firstName || user.firstname || "";
        const last = user.lastName || user.lastname || "";
        const name = `${first} ${last}`.trim();

        if (name) {
            return name;
        }

        if (user.name) {
            return user.name;
        }

        if (user.email) {
            return user.email.split("@")[0];
        }

        return "Unknown";
    };

    // lấy username
    const getUsername = (user) => {
        if (user.username) {
            return user.username;
        }

        const name = getFullName(user).toLowerCase().replace(/\s+/g, ".");
        return `@${name}`;
    };

    // tạo avatar chữ
    const getAvatarText = (user) => {
        const name = getFullName(user);
        const parts = name.split(" ").filter(Boolean);

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        if (parts.length === 0) return "U";

        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    // lọc + sắp xếp sửa tìm kiếm
    const getFilteredSortedUsers = () => {
        const query = searchInput.value.trim().toLowerCase();
        const users = getUsers().map(normalizeUser);

        const filtered = users.filter((user) => {
            const fullName = getFullName(user).toLowerCase();
            const email = (user.email || "").toLowerCase();
            const username = (getUsername(user) || "").toLowerCase();

            return (
                fullName.includes(query) ||
                email.includes(query) ||
                username.includes(query)
            );
        });

        filtered.sort((a, b) => {
            const aName = getFullName(a).toLowerCase();
            const bName = getFullName(b).toLowerCase();
            const compare = aName.localeCompare(bName, "vi");

            return sortAsc ? compare : -compare;
        });

        return filtered;
    };

    // render phân trang
    const renderPages = () => {
        if (!pagesWrap) return;
        pagesWrap.innerHTML = "";

        for (let i = 1; i <= totalPages; i++) {
            const pageLink = document.createElement("a");
            pageLink.href = "#";
            pageLink.className = `page-num${i === currentPage ? " active" : ""}`;
            pageLink.textContent = i;

            pageLink.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = i;
                render();
            });

            pagesWrap.appendChild(pageLink);
        }
    };

    // render danh sách user
    const render = () => {
        const users = getFilteredSortedUsers();

        totalPages = Math.max(1, Math.ceil(users.length / pageSize));

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const start = (currentPage - 1) * pageSize;
        const pageUsers = users.slice(start, start + pageSize);

        if (pill) pill.textContent = `${users.length} users`;

        if (tbody) {
            tbody.innerHTML = pageUsers.map((user) => {
                const statusText = user.status === "blocked" ? "đã chặn" : "hoạt động";
                const actionBlockClass = user.status === "blocked" ? "disabled" : "";
                const actionUnblockClass = user.status === "blocked" ? "" : "disabled";

                return `
                    <tr>
                        <td class="name-cell">
                            ${user.avatar
                        ? `<img src="${user.avatar}" class="avatar" />`
                        : `<div class="avatar avatar-text">${getAvatarText(user)}</div>`
                    }
                            <div class="user-info">
                                <div class="full-name">${getFullName(user)}</div>
                                <div class="username">${getUsername(user)}</div>
                            </div>
                        </td>
                        <td class="status-cell">${statusText}</td>
                        <td class="email-cell">${user.email || ""}</td>
                        <td class="actions-cell">
                            <a href="#" class="action-link block ${actionBlockClass}" data-action="block" data-id="${user.id}">block</a>
                            <a href="#" class="action-link unblock ${actionUnblockClass}" data-action="unblock" data-id="${user.id}">unblock</a>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        renderPages();

        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    };

    // xử lý block / unblock TRÊN FIREBASE
    if (tbody) {
        tbody.addEventListener("click", async (e) => {
            const actionLink = e.target.closest(".action-link");

            if (!actionLink) {
                return;
            }

            e.preventDefault();

            const action = actionLink.dataset.action;
            const id = actionLink.dataset.id; // Firebase ID là string nên không dùng Number() nữa

            const users = getUsers();
            const index = users.findIndex((user) => user.id === id);

            if (index === -1) {
                return;
            }

            try {
                if (action === "block") {
                    if (users[index].status === "blocked") {
                        showToast("❌ Tài khoản đã bị khóa trước đó", "error");
                        return;
                    }

                    // Cập nhật Firebase
                    await updateDoc(doc(db, "users", id), { status: "blocked" });
                    
                    // Cập nhật Local
                    users[index].status = "blocked";
                    showToast("✅ Đã khóa tài khoản thành công", "success");
                }

                if (action === "unblock") {
                    if (users[index].status !== "blocked") {
                        showToast("❌ Tài khoản đang được mở khóa rồi", "error");
                        return;
                    }

                    // Cập nhật Firebase
                    await updateDoc(doc(db, "users", id), { status: "active" });
                    
                    // Cập nhật Local
                    users[index].status = "active";
                    showToast("✅ Đã mở khóa tài khoản thành công", "success");
                }

                render();
            } catch (error) {
                console.error("Lỗi cập nhật trạng thái:", error);
                showToast("❌ Lỗi kết nối đến máy chủ", "error");
            }
        });
    }

    // tìm kiếm
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            currentPage = 1;
            render();
        });
    }

    // sắp xếp
    if (sortTrigger) {
        sortTrigger.addEventListener("click", (e) => {
            e.preventDefault();
            sortAsc = !sortAsc;
            sortTrigger.textContent = sortAsc ? "A→Z" : "Z→A";
            currentPage = 1;
            render();
        });
    }

    // nút prev
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                render();
            }
        });
    }

    // nút next
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                render();
            }
        });
    }

    // logout
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("admin");
            window.location.href = "../html/login.html";
        });
    }

    // hiển thị toast
    const showToast = (message, type = "success") => {
        const container = document.getElementById("toast-container");
        if (!container) return;

        //  lấy tất cả toast hiện tại
        const currentToasts = container.querySelectorAll(".toast");

        //  nếu đã đủ 4 thì xóa cái cũ nhất
        if (currentToasts.length >= 4) {
            currentToasts[0].remove();
        }

        // tạo toast mới
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerText = message;

        container.appendChild(toast);

        // tự xoá sau 2s
        setTimeout(() => {
            toast.remove();
        }, 2000);
    };

    // Chạy tải dữ liệu từ Firebase lần đầu tiên
    await loadUsersFromFirebase();
});