document.addEventListener("DOMContentLoaded", () => {

    // kiểm tra quyền admin
    checkLogin(true); 

    // lấy DOM
    const table = document.getElementById("articleTable");
    const addBtn = document.getElementById("addArticleBtn");

    // DOM modal
    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalInput = document.getElementById("modalInput");
    const modalCancel = document.getElementById("modalCancel");
    const modalOk = document.getElementById("modalOk");

    // hàm mở modal dùng chung
    const openModal = ({ title, message, showInput = false, inputValue = "" }) => {
        return new Promise((resolve) => {
            modalTitle.innerText = title;
            modalMessage.innerText = message;

            modalInput.style.display = showInput ? "block" : "none";
            modalInput.value = inputValue;

            modal.classList.add("show");

            modalCancel.onclick = () => {
                modal.classList.remove("show");
                resolve(null);
            };

            modalOk.onclick = () => {
                let value = showInput ? modalInput.value : true;
                modal.classList.remove("show");
                resolve(value);
            };
        });
    };


    let articles = JSON.parse(localStorage.getItem("articles")) || [];


    // trạng thái phân trang
    let currentPage = 1;
    let pageSize = 5;

    // render danh sách bài viết
    const render = () => {
        let start = (currentPage - 1) * pageSize;
        let list = articles.slice(start, start + pageSize);

        table.innerHTML = list.map(a => `
        <tr>
            <td><img class="thumb" src="${a.image}" /></td>
            <td>${a.title}</td>
            <td>${a.category}</td>
            <td class="ellipsis">${a.content}</td>
            <td>
                <span class="status ${a.status === 'Public' ? 'public' : 'private'}">
                    ${a.status}
                </span>
            </td>
            <td>
                <select onchange="changeStatus(${a.id}, this.value)">
                    <option value="Public" ${a.status === 'Public' ? 'selected' : ''}>Public</option>
                    <option value="Private" ${a.status === 'Private' ? 'selected' : ''}>Private</option>
                </select>
            </td>
            <td class="actions">
                <button class="btn btn-edit" onclick="editArticle(${a.id})">Sửa</button>
                <button class="btn btn-delete" onclick="deleteArticle(${a.id})">Xóa</button>
            </td>
        </tr>
        `).join("");

        renderPagination();
    };

    // chuyển sang trang thêm bài viết
    addBtn.onclick = () => {
        window.location.href = "../html/add-new-article.html";
    };

    // xóa bài viết
    const deleteArticle = async (id) => {
        const yes = await openModal({
            title: "Xác nhận",
            message: "Bạn chắc chắn muốn xóa?"
        });

        if (!yes) {
            return;
        }

        articles = articles.filter(a => a.id !== id);
        localStorage.setItem("articles", JSON.stringify(articles));
        render();
    };

    // chỉnh sửa bài viết
    const editArticle = async (id) => {
        let article = articles.find(a => a.id === id);

        const title = await openModal({
            title: "Sửa bài viết",
            message: "Nhập tiêu đề",
            showInput: true,
            inputValue: article.title
        });

        if (!title) {
            return;
        }

        const content = await openModal({
            title: "Sửa bài viết",
            message: "Nhập nội dung",
            showInput: true,
            inputValue: article.content
        });

        if (!content) {
            return;
        }

       /*  const category = await openModal({
            title: "Sửa bài viết",
            message: "Nhập chủ đề",
            showInput: true,
            inputValue: article.category
        });

        if (!category) {
            return;
        } */

        article.title = title;
        article.content = content;
        // article.category = category;

        localStorage.setItem("articles", JSON.stringify(articles));
        render();
    };

    // thay đổi trạng thái
    const changeStatus = (id, value) => {
        let article = articles.find(a => a.id === id);

        if (value === "Public") {
            article.status = "Public";
        } else {
            article.status = "Private";
        }

        localStorage.setItem("articles", JSON.stringify(articles));
        render();
    };

    // render phân trang
    const renderPagination = () => {
        const totalPage = Math.ceil(articles.length / pageSize);
        const pages = document.querySelector(".pages");

        pages.innerHTML = "";

        for (let i = 1; i <= totalPage; i++) {
            if (
                i === 1 ||
                i === totalPage ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                pages.innerHTML += `
                <a href="#" 
                   class="page ${i === currentPage ? 'active' : ''}"
                   onclick="goPage(${i})">
                   ${i}
                </a>
                `;
            } else if (
                i === currentPage - 2 ||
                i === currentPage + 2
            ) {
                pages.innerHTML += `<span class="dots">...</span>`;
            }
        }
    };

    // chuyển trang
    const goPage = (p) => {
        currentPage = p;
        render();
    };

    // nút trang trước
    document.querySelector(".prev").onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            render();
        }
    };

    // nút trang sau
    document.querySelector(".next").onclick = () => {
        const totalPage = Math.ceil(articles.length / pageSize);

        if (currentPage < totalPage) {
            currentPage++;
            render();
        }
    };

    

    // gán global
    window.editArticle = editArticle;
    window.deleteArticle = deleteArticle;
    window.changeStatus = changeStatus;
    window.goPage = goPage;

    render();
});