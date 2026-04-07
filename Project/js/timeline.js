// Lắng nghe sự kiện khi toàn bộ nội dung HTML đã tải xong
document.addEventListener("DOMContentLoaded", () => {
    // Lấy mã định danh của bài viết từ thanh địa chỉ trang web
    const urlParams = new URLSearchParams(window.location.search);
    const postId = Number(urlParams.get('id'));

    // Lấy dữ liệu bài viết và thông tin người dùng từ bộ nhớ cục bộ
    const articles = JSON.parse(localStorage.getItem("articles")) || [];
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const post = articles.find(a => a.id === postId);

    // Kiểm tra nếu bài viết không tồn tại thì báo lỗi và dừng chạy mã
    if (!post) {
        document.querySelector(".post-layout").innerHTML = "<h2 style='padding:20px;'>Bài viết không tồn tại hoặc đã bị xóa.</h2>";
        return;
    }

    const postMain = document.querySelector(".post-main");

    // Hàm tiện ích để lấy họ tên đầy đủ của người dùng
    const getName = (userObj) => {
        if (!userObj) return "Người dùng";
        const first = userObj.firstName || userObj.firstname || "";
        const last = userObj.lastName || userObj.lastname || "";
        return `${first} ${last}`.trim() || "Ẩn danh";
    };

    // Biến lưu trữ mã định danh của bình luận đang được bấm trả lời
    let activeReplyId = null;

    // Hàm chịu trách nhiệm vẽ toàn bộ giao diện bài viết và bình luận
    const renderTimeline = () => {
        // Lấy danh sách toàn bộ bình luận và lọc ra những bình luận thuộc bài viết này
        let allComments = JSON.parse(localStorage.getItem("comments")) || [];
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
                <button onclick="submitComment(null)" style="background: #0D6EFD; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; margin:0;">Gửi</button>
            </div>
        `;

        // Lặp qua danh sách bình luận gốc để vẽ giao diện từng bình luận
        if (topLevelComments.length === 0) {
            html += `<p style="margin: 0 0 20px 18px; color: #666; font-size: 14px;">Chưa có bình luận nào.</p>`;
        } else {
            topLevelComments.forEach(c => {
                // Đếm số lượt thích và kiểm tra xem người dùng hiện tại đã thích chưa
                const likesCount = c.likes ? c.likes.length : 0;
                const isLiked = currentUser && c.likes && c.likes.includes(currentUser.id);
                
                // Lọc ra các câu trả lời trực tiếp cho bình luận gốc này
                const replies = postComments.filter(reply => reply.parentId === c.id);

                html += `
                    <div class="comment-item">
                        <img class="avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName)}&background=random" alt="avatar">
                        <div class="comment-box">
                            <div class="comment-text1" style="font-weight:bold; color:#111; font-size:14px; margin-bottom:4px;">
                                ${c.userName} <span style="font-weight:normal; color:#999; font-size:11px; margin-left:6px;">${new Date(c.date).toLocaleDateString()}</span>
                            </div>
                            <div class="comment-text2" style="font-size:14px; line-height:1.5;">${c.text}</div>
                            
                            <div class="comment-actions" style="margin-top: 8px;">
                                <span style="cursor:pointer; color: ${isLiked ? '#0D6EFD' : '#64748b'}" onclick="toggleLike(${c.id})">${likesCount} Thích</span>
                                <img src="../img/Icon (1).png" alt="like" class="comment-icon" style="cursor:pointer;" onclick="toggleLike(${c.id})">
                                
                                <span style="cursor:pointer; margin-left: 15px;" onclick="toggleReplyBox(${c.id})">${replies.length} Phản hồi</span>
                                <img src="../img/Vector.png" alt="comment" class="comment-icon" style="cursor:pointer;" onclick="toggleReplyBox(${c.id})">
                            </div>
                        </div>
                    </div>
                `;

                // Nếu người dùng đang bấm trả lời bình luận này thì hiển thị ô nhập liệu phản hồi
                if (activeReplyId === c.id) {
                    html += `
                        <div style="margin: 0 0 16px 54px; display: flex; gap: 10px; align-items: flex-start;">
                            <input type="text" id="replyInput_${c.id}" placeholder="Viết câu trả lời..." style="flex:1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-size: 13px; margin:0;">
                            <button onclick="submitComment(${c.id})" style="background: #0D6EFD; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; margin:0;">Phản hồi</button>
                        </div>
                    `;
                }

                // Nếu bình luận gốc này có câu trả lời thì hiển thị lùi vào trong để dễ phân biệt
                if (replies.length > 0) {
                    html += `<div style="margin-left: 36px; border-left: 2px solid #e5e7eb; padding-left: 16px; margin-bottom: 16px;">`;
                    replies.forEach(reply => {
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
                                        <span style="cursor:pointer; font-size:12px; color: ${rIsLiked ? '#0D6EFD' : '#64748b'}" onclick="toggleLike(${reply.id})">${rLikesCount} Thích</span>
                                        <img src="../img/Icon (1).png" alt="like" class="comment-icon" style="cursor:pointer; width:14px;" onclick="toggleLike(${reply.id})">
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

    // Hàm xử lý hành động thả tim hoặc bỏ thả tim cho bình luận
    window.toggleLike = (commentId) => {
        if (!currentUser) {
            alert("Vui lòng đăng nhập để thả tim!");
            return;
        }
        
        let allComments = JSON.parse(localStorage.getItem("comments")) || [];
        const cmtIndex = allComments.findIndex(c => c.id === commentId);
        
        if (cmtIndex !== -1) {
            // Tạo mảng chứa người thả tim nếu bình luận chưa có
            if (!allComments[cmtIndex].likes) allComments[cmtIndex].likes = [];
            
            const userIndex = allComments[cmtIndex].likes.indexOf(currentUser.id);
            if (userIndex !== -1) {
                // Xóa mã người dùng khỏi mảng nếu họ đã thả tim trước đó
                allComments[cmtIndex].likes.splice(userIndex, 1);
            } else {
                // Thêm mã người dùng vào mảng nếu họ chưa thả tim
                allComments[cmtIndex].likes.push(currentUser.id);
            }
            
            localStorage.setItem("comments", JSON.stringify(allComments));
            // Cập nhật lại giao diện ngay lập tức
            renderTimeline(); 
        }
    };

    // Hàm bật hoặc tắt ô nhập văn bản khi người dùng muốn phản hồi một bình luận
    window.toggleReplyBox = (commentId) => {
        // Đóng ô nhập nếu bấm lại đúng nút phản hồi đó hoặc mở ô nhập mới nếu bấm nút khác
        activeReplyId = activeReplyId === commentId ? null : commentId;
        renderTimeline();
    };

    // Hàm lưu nội dung bình luận mới vào hệ thống
    window.submitComment = (parentId = null) => {
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

        let allComments = JSON.parse(localStorage.getItem("comments")) || [];
        
        allComments.push({
            id: Date.now(),
            postId: postId,
            userId: currentUser.id,
            userName: getName(currentUser),
            text: text,
            date: new Date().toISOString(),
            likes: [],           
            parentId: parentId   
        });
        
        localStorage.setItem("comments", JSON.stringify(allComments));
        
        // Đặt lại trạng thái ẩn ô nhập phản hồi và vẽ lại giao diện
        activeReplyId = null; 
        renderTimeline(); 
    };

    // Khởi chạy hàm vẽ giao diện lần đầu tiên khi trang vừa tải xong
    renderTimeline();

    // Lắng nghe sự kiện bấm nút quay lại trang trước
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) {
        backBtn.onclick = () => {
            window.history.back();
        };
    }
});