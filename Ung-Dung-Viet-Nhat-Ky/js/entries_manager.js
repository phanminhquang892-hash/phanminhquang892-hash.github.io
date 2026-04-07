// 1. Sửa đường dẫn import (./ thay vì .)
import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

    // kiểm tra quyền admin
    if (typeof window.checkLogin === "function") window.checkLogin(true); 
    else if (typeof checkLogin === "function") checkLogin(true);

    // lấy DOM
    const input = document.getElementById("categoryName");
    const btn = document.getElementById("addCategoryBtn");
    const table = document.getElementById("categoryTable");
    const search = document.getElementById("searchCategory");
    const error = document.getElementById("errorCategory");

    // DOM modal
    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalInput = document.getElementById("modalInput");
    const modalCancel = document.getElementById("modalCancel");
    const modalOk = document.getElementById("modalOk");

    // dữ liệu
    let categories = [];

    // trạng thái
    let currentPage = 1;
    let pageSize = 5;
    let isAsc = true;

    // mở modal dùng chung (Giữ nguyên logic cũ)
    const openModal = ({ title, message, showInput = false, inputValue = "", okText = "Đồng ý" }) => {
        return new Promise((resolve) => {
            modalTitle.innerText = title;
            modalMessage.innerText = message;
            modalInput.style.display = showInput ? "block" : "none";
            modalInput.value = inputValue;
            modalOk.innerText = okText;

            modal.classList.add("show");

            const closeModal = () => {
                modal.classList.remove("show");
            };

            modalCancel.onclick = () => {
                closeModal();
                resolve(null);
            };

            modalOk.onclick = () => {
                const value = showInput ? modalInput.value : true;
                closeModal();
                resolve(value);
            };

            modal.onclick = (e) => {
                if (e.target === modal) {
                    closeModal();
                    resolve(null);
                }
            };
        });
    };

    const showConfirmModal = (message) => {
        return openModal({ title: "Xác nhận", message, showInput: false, okText: "Xác nhận" });
    };

    const showPromptModal = (message, defaultValue = "") => {
        return openModal({ title: "Chỉnh sửa", message, showInput: true, inputValue: defaultValue, okText: "Lưu" });
    };

    // LOAD DATA TỪ FIREBASE
    const loadCategories = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "categories"));
            categories = [];
            querySnapshot.forEach((doc) => {
                categories.push({ id: doc.id, name: doc.data().name });
            });
            render();
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
        }
    };

    // RENDER DANH SÁCH (Bao gồm Tìm kiếm & Sắp xếp)
    const render = () => {
        let keyword = search.value.toLowerCase();

        let filtered = categories.filter(c =>
            c.name.toLowerCase().includes(keyword)
        );

        // Sắp xếp A-Z hoặc Z-A
        filtered.sort((a, b) =>
            isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );

        // Phân trang
        let start = (currentPage - 1) * pageSize;
        let list = filtered.slice(start, start + pageSize);

        if(!table) return;

        table.innerHTML = list.map((c, index) => `
            <tr>
                <td class="col-stt">${start + index + 1}</td>
                <td>${c.name}</td>
                <td class="actions-cell">
                    <button onclick="window.editCategory('${c.id}')">✏️</button>
                    <button onclick="window.deleteCategory('${c.id}')">❌</button>
                </td>
            </tr>
        `).join("");

        renderPagination(filtered.length);
    };

    // THÊM DANH MỤC LÊN FIREBASE
    btn.onclick = async () => {
        error.innerText = "";
        let name = input.value.trim();

        if (!name) {
            error.innerText = "Không được để trống!";
            return;
        }

        let exist = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (exist) {
            error.innerText = "Category đã tồn tại!";
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "categories"), { name });
            categories.push({ id: docRef.id, name });
            input.value = "";
            render();
        } catch (e) {
            alert("Lỗi khi thêm lên Firebase!");
        }
    };

    // XÓA DANH MỤC TRÊN FIREBASE
    window.deleteCategory = async (id) => {
        const ok = await showConfirmModal("Bạn chắc chắn muốn xóa?");
        if (!ok) return;

        try {
            await deleteDoc(doc(db, "categories", id));
            categories = categories.filter(c => c.id !== id);
            
            const totalPage = Math.ceil(categories.length / pageSize);
            if (currentPage > totalPage && totalPage > 0) currentPage = totalPage;

            render();
        } catch (e) {
            alert("Lỗi khi xóa trên Firebase!");
        }
    };

    // SỬA DANH MỤC TRÊN FIREBASE
    window.editCategory = async (id) => {
        let category = categories.find(c => c.id === id);
        if (!category) return;

        const newName = await showPromptModal("Nhập tên mới:", category.name);
        if (newName === null) return;

        const trimmedName = newName.trim();
        if (!trimmedName || trimmedName === category.name) return;

        try {
            await updateDoc(doc(db, "categories", id), { name: trimmedName });
            category.name = trimmedName;
            render();
        } catch (e) {
            alert("Lỗi khi sửa trên Firebase!");
        }
    };

    // TÌM KIẾM REAL-TIME
    if(search) {
        search.addEventListener("input", () => {
            currentPage = 1;
            render();
        });
    }

    // ĐỔI KIỂU SẮP XẾP
    const titleEl = document.querySelector(".entries-title");
    if(titleEl) {
        titleEl.onclick = () => {
            isAsc = !isAsc;
            render();
        };
        titleEl.style.cursor = "pointer";
    }

    // RENDER PHÂN TRANG
    const renderPagination = (total) => {
        let totalPage = Math.ceil(total / pageSize);
        let paginationHTML = "";

        for (let i = 1; i <= totalPage; i++) {
            paginationHTML += `
                <button onclick="window.goPage(${i})"
                    style="${i === currentPage ? 'font-weight:bold; background:#e5e7eb;' : ''}">
                    ${i}
                </button>
            `;
        }

        const titleList = document.querySelector(".list-title");
        if(titleList) {
            titleList.innerHTML = "📋 Category List " + paginationHTML;
        }
    };

    window.goPage = (p) => {
        currentPage = p;
        render();
    };

    // KHỞI CHẠY
    await loadCategories();
});