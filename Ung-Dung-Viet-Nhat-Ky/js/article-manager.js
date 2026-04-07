import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc, deleteDoc } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

    // kiểm tra quyền admin
    if (typeof window.checkLogin === "function") window.checkLogin(true); 
    else if (typeof checkLogin === "function") checkLogin(true);

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

    // hàm mở modal dùng chung (chủ yếu dùng cho xác nhận Xóa)
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

    let articles = [];

    // trạng thái phân trang
    let currentPage = 1;
    let pageSize = 5;

    // Load data Firebase
    const loadArticles = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "articles"));
            articles = [];
            querySnapshot.forEach((doc) => {
                articles.push({ id: doc.id, ...doc.data() });
            });
            // Sắp xếp mới nhất lên đầu
            articles.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            render();
        } catch (error) {
            console.error("Lỗi tải bài viết:", error);
        }
    };

    // render danh sách bài viết
    const render = () => {
        let start = (currentPage - 1) * pageSize;
        let list = articles.slice(start, start + pageSize);

        if(!table) return;

        table.innerHTML = list.map(a => `
        <tr>
            <td><img class="thumb" src="${a.image || '../img/default.png'}" /></td>
            <td>${a.title}</td>
            <td>${a.category || ''}</td>
            <td class="ellipsis">${a.content}</td>
            <td>
                <span class="status ${a.status === 'Public' ? 'public' : 'private'}">
                    ${a.status}
                </span>
            </td>
            <td>
                <select onchange="window.changeStatus('${a.id}', this.value)">
                    <option value="Public" ${a.status === 'Public' ? 'selected' : ''}>Public</option>
                    <option value="Private" ${a.status === 'Private' ? 'selected' : ''}>Private</option>
                </select>
            </td>
            <td class="actions">
                <button class="btn btn-edit" onclick="window.editArticle('${a.id}')">Sửa</button>
                <button class="btn btn-delete" onclick="window.deleteArticle('${a.id}')">Xóa</button>
            </td>
        </tr>
        `).join("");

        renderPagination();
    };

    // chuyển sang trang thêm bài viết
    if(addBtn) {
        addBtn.onclick = () => {
            window.location.href = "../html/add-new-article.html";
        };
    }

    // xóa bài viết
    window.deleteArticle = async (id) => {
        const yes = await openModal({
            title: "Xác nhận",
            message: "Bạn chắc chắn muốn xóa?"
        });

        if (!yes) return;

        try {
            await deleteDoc(doc(db, "articles", id));
            articles = articles.filter(a => a.id !== id);
            
            const totalPage = Math.ceil(articles.length / pageSize);
            if (currentPage > totalPage && totalPage > 0) currentPage = totalPage;
            
            render();
        } catch (error) {
            alert("Lỗi khi xóa!");
        }
    };

    // CHỈNH SỬA BÀI VIẾT: CHUYỂN HƯỚNG SANG TRANG THÊM/SỬA KÈM ID BÀI VIẾT
    window.editArticle = (id) => {
        window.location.href = `../html/add-new-article.html?editId=${id}`;
    };

    // thay đổi trạng thái
    window.changeStatus = async (id, value) => {
        let newStatus = value === "Public" ? "Public" : "Private";
        try {
            await updateDoc(doc(db, "articles", id), { status: newStatus });
            let article = articles.find(a => a.id === id);
            if (article) article.status = newStatus;
            render();
        } catch (error) {
            alert("Lỗi khi đổi trạng thái!");
        }
    };

    // render phân trang
    const renderPagination = () => {
        const totalPage = Math.ceil(articles.length / pageSize);
        const pages = document.querySelector(".pages");
        if (!pages) return;

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
                   onclick="window.goPage(${i}, event)">
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
    window.goPage = (p, event) => {
        if(event) event.preventDefault();
        currentPage = p;
        render();
    };

    // nút trang trước
    const prevBtn = document.querySelector(".prev");
    if(prevBtn) {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                render();
            }
        };
    }

    // nút trang sau
    const nextBtn = document.querySelector(".next");
    if(nextBtn) {
        nextBtn.onclick = (e) => {
            e.preventDefault();
            const totalPage = Math.ceil(articles.length / pageSize);
            if (currentPage < totalPage) {
                currentPage++;
                render();
            }
        };
    }

    await loadArticles();
});
