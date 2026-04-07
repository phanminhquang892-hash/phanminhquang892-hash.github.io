import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Lắng nghe sự kiện khi toàn bộ nội dung HTML đã tải xong
document.addEventListener("DOMContentLoaded", async () => {
    // Lấy mã định danh của bài viết từ thanh địa chỉ trang web (Firebase dùng chuỗi)
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    // Lấy thông tin người dùng từ bộ nhớ cục bộ
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const postMain = document.querySelector(".post-main");

    let post = null;
    let allComments = [];

    // Hàm tiện ích để lấy họ tên đầy đủ của người dùng
    const getName = (userObj) => {
        if (!userObj) return "Người dùng";
        const first = userObj.firstName || userObj.firstname || "";
        const last = userObj.lastName || userObj.lastname || "";
        return `${first} ${last}`.trim() || "Ẩn danh";
    };

    // Biến lưu trữ mã định danh của bình luận đang được bấm trả lời
    let activeReplyId = null;

    // TẢI DỮ LIỆU TỪ FIREBASE
    const loadData = async () => {
        try {
            // Lấy dữ liệu bài viết
            const docSnap = await getDoc(doc(db, "articles", postId));
            if (!docSnap.exists()) {
                document.querySelector(".post-layout").innerHTML = "<h2 style='padding:20px;'>Bài viết không tồn tại hoặc đã bị xóa.</h2>";
                return;
            }
            post = { id: docSnap.id, ...docSnap.data() };

            // Lấy tất cả bình luận
            const cmtSnap = await getDocs(collection(db, "comments"));
            allComments = [];
            cmtSnap.forEach(doc => {
                allComments.push({ id: doc.id, ...doc.data() });
            });

            renderTimeline();
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            document.querySelector(".post-layout").innerHTML = "<h2 style='padding:20px;'>Lỗi tải dữ liệu từ máy chủ.</h2>";
        }
    };

    // Hàm chịu trách nhiệm vẽ toàn bộ giao diện bài viết và bình luận
    const renderTimeline = () => {
        // Lọc ra những bình luận thuộc bài viết này
        const postComments = allComments.filter(c => c.postId === postId);
        
        // Phân loại để tìm ra các bình luận gốc không phải là câu trả lời của ai
        const topLevelComments = postComments.filter(c => !c.parentId);

        // Chuẩn bị đoạn mã HTML để hiển thị nội dung bài viết chính
        let html = `
            <img class="avatar main-avatar" src="${post.image || '../img/Chip.png'}" alt="avatar" style="border-radius: 8px; object-fit: cover;">
            
            <div class="post-card">
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <div class="post-actions">
                    <div class="action-item">
                        <span>Chủ đề: ${post.category || "Bài viết"}</span>
                    </div>
                    <div class="action-item" style="margin-left: 20px;">
                        <span>${postComments.length} Phản hồi</span>
                        <img src="../img/Vector.png" alt="comment" class="action-icon">
                    </div>
                </div>
            </div>

            <div class="view-comments">
                Tất cả bình luận (${postComments.length})
                <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>
            
            <div style="margin: 0 0 24px 18px; display: flex; gap: 10px; align-items: flex-start;">
                <input type="text" id="newCommentInput" placeholder="Viết bình luận của bạn..." style="flex:1; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-size: 14px; margin:0;">
                <button onclick="window.submitComment(null)" style="background: #0D6EFD; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; margin:0;">Gửi</button>
            </div>
        `;

        // Lặp qua danh sách bình luận gốc để vẽ giao diện từng bình luận
        if (topLevelComments.length === 0) {
            html += `<p style="margin: 0 0 20px 18px; color: #666; font-size: 14px;">Chưa có bình luận nào.</p>`;
        } else {
            topLevelComments.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(c => {
                // Đếm số lượt thích và kiểm tra xem người dùng hiện tại đã thích chưa
                const likesCount = c.likes ? c.likes.length : 0;
                const isLiked = currentUser && c.likes && c.likes.includes(currentUser.id);
                
                // Lọc ra các câu trả lời trực tiếp cho bình luận gốc này
                const replies = postComments.filter(reply => reply.parentId === c.id);

                // LƯU Ý: id của Firebase là chuỗi nên phải bọc trong '${c.id}'
                html += `
                    <div class="comment-item">
                        <img class="avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName)}&background=random" alt="avatar">
                        <div class="comment-box">
                            <div class="comment-text1" style="font-weight:bold; color:#111; font-size:14px; margin-bottom:4px;">
                                ${c.userName} <span style="font-weight:normal; color:#999; font-size:11px; margin-left:6px;">${new Date(c.date).toLocaleDateString()}</span>
                            </div>
                            <div class="comment-text2" style="font-size:14px; line-height:1.5;">${c.text}</div>
                            
                            <div class="comment-actions" style="margin-top: 8px;">
                                <span style="cursor:pointer; color: ${isLiked ? '#0D6EFD' : '#64748b'}" onclick="window.toggleLike('${c.id}')">${likesCount} Thích</span>
                                <img src="../img/Icon (1).png" alt="like" class="comment-icon" style="cursor:pointer;" onclick="window.toggleLike('${c.id}')">
                                
                                <span style="cursor:pointer; margin-left: 15px;" onclick="window.toggleReplyBox('${c.id}')">${replies.length} Phản hồi</span>
                                <img src="../img/Vector.png" alt="comment" class="comment-icon" style="cursor:pointer;" onclick="window.toggleReplyBox('${c.id}')">
                            </div>
                        </div>
                    </div>
                `;

                // Nếu người dùng đang bấm trả lời bình luận này thì hiển thị ô nhập liệu phản hồi
                if (activeReplyId === c.id) {
                    html += `
                        <div style="margin: 0 0 16px 54px; display: flex; gap: 10px; align-items: flex-start;">
                            <input type="text" id="replyInput_${c.id}" placeholder="Viết câu trả lời..." style="flex:1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-size: 13px; margin:0;">
                            <button onclick="window.submitComment('${c.id}')" style="background: #0D6EFD; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; margin:0;">Phản hồi</button>
                        </div>
                    `;
                }

                // Nếu bình luận gốc này có câu trả lời thì hiển thị lùi vào trong để dễ phân biệt
                if (replies.length > 0) {
                    html += `<div style="margin-left: 36px; border-left: 2px solid #e5e7eb; padding-left: 16px; margin-bottom: 16px;">`;
                    replies.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(reply => {
                        const rLikesCount = reply.likes ? reply.likes.length : 0;
                        const rIsLiked = currentUser && reply.likes && reply.likes.includes(currentUser.id);
                        
                        html += `
                            <div class="comment-item" style="margin-bottom: 12px; margin-left:0;">
                                <img class="avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(reply.userName)}&background=random" alt="avatar" style="width:26px; height:26px;">
                                <div class="comment-box" style="min-height: auto; padding: 8px 12px;">
                                    <div class="comment-text1" style="font-size:13px; margin-bottom:4px; font-weight:bold; color:#111;">
                                        ${reply.userName} <span style="font-weight:normal; color:#999; font-size:10px; margin-left:6px;">${new Date(reply.date).toLocaleDateString()}</span>
                                    </div>
                                    <div class="comment-text2" style="font-size:13px; margin-bottom:6px;">${reply.text}</div>
                                    <div class="comment-actions">
                                        <span style="cursor:pointer; font-size:12px; color: ${rIsLiked ? '#0D6EFD' : '#64748b'}" onclick="window.toggleLike('${reply.id}')">${rLikesCount} Thích</span>
                                        <img src="../img/Icon (1).png" alt="like" class="comment-icon" style="cursor:pointer; width:14px;" onclick="window.toggleLike('${reply.id}')">
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    html += `</div>`;
                }
            });
        }

        // Cập nhật toàn bộ mã HTML vừa tạo vào khung hiển thị chính
        postMain.innerHTML = html;
    };

    // HÀM XỬ LÝ THẢ TIM (CẬP NHẬT LÊN FIREBASE)
    window.toggleLike = async (commentId) => {
        if (!currentUser) {
            alert("Vui lòng đăng nhập để thả tim!");
            return;
        }
        
        const cmtIndex = allComments.findIndex(c => c.id === commentId);
        
        if (cmtIndex !== -1) {
            const cmt = allComments[cmtIndex];
            if (!cmt.likes) cmt.likes = [];
            
            const hasLiked = cmt.likes.includes(currentUser.id);
            const cmtRef = doc(db, "comments", commentId);

            try {
                // Cập nhật lên Firebase
                if (hasLiked) {
                    await updateDoc(cmtRef, { likes: arrayRemove(currentUser.id) });
                    cmt.likes = cmt.likes.filter(id => id !== currentUser.id); // Cập nhật mảng cục bộ
                } else {
                    await updateDoc(cmtRef, { likes: arrayUnion(currentUser.id) });
                    cmt.likes.push(currentUser.id); // Cập nhật mảng cục bộ
                }
                
                // Cập nhật lại giao diện ngay lập tức
                renderTimeline(); 
            } catch (error) {
                console.error("Lỗi thả tim:", error);
            }
        }
    };

    // Hàm bật hoặc tắt ô nhập văn bản khi người dùng muốn phản hồi một bình luận
    window.toggleReplyBox = (commentId) => {
        // Đóng ô nhập nếu bấm lại đúng nút phản hồi đó hoặc mở ô nhập mới nếu bấm nút khác
        activeReplyId = activeReplyId === commentId ? null : commentId;
        renderTimeline();
    };

    // HÀM LƯU BÌNH LUẬN MỚI LÊN FIREBASE
    window.submitComment = async (parentId = null) => {
        if (!currentUser) {
            alert("Vui lòng đăng nhập để bình luận!");
            return;
        }

        // Phân biệt id của ô nhập liệu dựa trên việc đây là bình luận mới hay là phản hồi
        const inputId = parentId ? `replyInput_${parentId}` : "newCommentInput";
        const inputEl = document.getElementById(inputId);
        const text = inputEl.value.trim();

        if (!text) {
            alert("Vui lòng nhập nội dung!");
            return;
        }

        const newComment = {
            postId: postId,
            userId: currentUser.id,
            userName: getName(currentUser),
            text: text,
            date: new Date().toISOString(),
            likes: [],           
            parentId: parentId   
        };

        try {
            // Thêm vào Firebase
            const docRef = await addDoc(collection(db, "comments"), newComment);
            
            // Cập nhật UI ngay lập tức
            allComments.push({ id: docRef.id, ...newComment });
            activeReplyId = null; 
            renderTimeline(); 
        } catch (error) {
            console.error("Lỗi gửi bình luận:", error);
            alert("Đã xảy ra lỗi khi gửi bình luận.");
        }
    };

    // Lắng nghe sự kiện bấm nút quay lại trang trước
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) {
        backBtn.onclick = () => {
            window.history.back();
        };
    }

    // Tải dữ liệu lần đầu
    await loadData();
});