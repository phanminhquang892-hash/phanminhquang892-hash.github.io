document.addEventListener("DOMContentLoaded", () => {

    // kiểm tra quyền admin
  checkLogin(true); 

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
    let categories = JSON.parse(localStorage.getItem("categories")) || [];

    // trạng thái
    let currentPage = 1;
    let pageSize = 5;
    let isAsc = true;

    // mở modal dùng chung
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

    // modal xác nhận
    const showConfirmModal = (message) => {
        return openModal({
            title: "Xác nhận",
            message,
            showInput: false,
            okText: "Xác nhận"
        });
    };

    // modal nhập dữ liệu
    const showPromptModal = (message, defaultValue = "") => {
        return openModal({
            title: "Chỉnh sửa",
            message,
            showInput: true,
            inputValue: defaultValue,
            okText: "Lưu"
        });
    };

    // render danh sách
    const render = () => {
        let keyword = search.value.toLowerCase();

        let filtered = categories.filter(c =>
            c.name.toLowerCase().includes(keyword)
        );

        // sắp xếp
        filtered.sort((a, b) =>
            isAsc
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
        );

        // phân trang
        let start = (currentPage - 1) * pageSize;
        let list = filtered.slice(start, start + pageSize);

        table.innerHTML = list.map((c, index) => `
            <tr>
                <td>${start + index + 1}</td>
                <td>${c.name}</td>
                <td>
                    <button onclick="editCategory(${c.id})">✏️</button>
                    <button onclick="deleteCategory(${c.id})">❌</button>
                </td>
            </tr>
        `).join("");

        renderPagination(filtered.length);
    };

    // thêm danh mục
    btn.onclick = () => {
        error.innerText = "";

        let name = input.value.trim();

        if (!name) {
            error.innerText = "Không được để trống!";
            return;
        }

        let exist = categories.find(
            c => c.name.toLowerCase() === name.toLowerCase()
        );

        if (exist) {
            error.innerText = "Category đã tồn tại!";
            return;
        }

        categories.push({
            id: Date.now(),
            name
        });

        localStorage.setItem("categories", JSON.stringify(categories));

        input.value = "";
        render();
    };

    // xóa danh mục
    const deleteCategory = async (id) => {
        const ok = await showConfirmModal("Bạn chắc chắn muốn xóa?");

        if (!ok) {
            return;
        }

        categories = categories.filter(c => c.id !== id);

        localStorage.setItem("categories", JSON.stringify(categories));
        render();
    };

    // sửa danh mục
    const editCategory = async (id) => {
        let category = categories.find(c => c.id === id);

        if (!category) {
            return;
        }

        const newName = await showPromptModal("Nhập tên mới:", category.name);

        if (newName === null) {
            return;
        }

        const trimmedName = newName.trim();

        if (!trimmedName) {
            return;
        }

        category.name = trimmedName;

        localStorage.setItem("categories", JSON.stringify(categories));
        render();
    };

    // tìm kiếm
    search.addEventListener("input", () => {
        currentPage = 1;
        render();
    });

    // đổi kiểu sắp xếp
    document.querySelector(".entries-title").onclick = () => {
        isAsc = !isAsc;
        render();
    };

    // render phân trang
    const renderPagination = (total) => {
        let totalPage = Math.ceil(total / pageSize);

        let paginationHTML = "";

        for (let i = 1; i <= totalPage; i++) {
            paginationHTML += `
                <button onclick="goPage(${i})"
                    style="${i === currentPage ? 'font-weight:bold;' : ''}">
                    ${i}
                </button>
            `;
        }

        document.querySelector(".list-title").innerHTML =
            "📋 Category List " + paginationHTML;
    };

    // chuyển trang
    const goPage = (p) => {
        currentPage = p;
        render();
    };

    

    // gán global
    window.editCategory = editCategory;
    window.deleteCategory = deleteCategory;
    window.goPage = goPage;

    // khởi chạy
    render();
});