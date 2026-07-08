# Smart AgriTech 18 WOW Pro

Bản web app HTML/CSS/JavaScript thuần, giữ đúng 18 chức năng Smart AgriTech và mục Quản lý người dùng dành riêng cho Admin.

## Cách chạy

1. Giải nén file zip.
2. Mở `index.html` bằng trình duyệt.
3. Bấm **Đăng ký** để tạo tài khoản đầu tiên. Tài khoản đầu tiên tự động là **Admin**.
4. Admin vào **Quản lý người dùng** để tạo tài khoản User/Nông dân.

## Lưu ý quan trọng

- Không có dữ liệu mẫu sẵn.
- Tất cả dữ liệu do người dùng tự thêm sẽ lưu trong `localStorage` của trình duyệt.
- Admin thấy và thao tác toàn bộ dữ liệu.
- User/Nông dân chỉ thấy và thao tác dữ liệu thuộc tài khoản của mình.
- Cộng đồng bắt đầu trống, mỗi tài khoản chỉ like một lần trên mỗi bài viết.

## 18 chức năng

1. AI chẩn đoán bệnh cây từ ảnh chụp lá
2. Hệ thống tưới thông minh IoT
3. Quản lý trang trại thông minh Dashboard
4. Truy xuất nguồn gốc nông sản bằng QR Code
5. Quản lý từng cây bằng QR Code
6. Dự đoán năng suất mùa vụ bằng AI
7. AI cảnh báo nguy cơ mất mùa
8. Theo dõi sức khỏe đất và đề xuất luân canh
9. Trợ lý AI tư vấn canh tác
10. Nhật ký canh tác điện tử
11. Quản lý chi phí, doanh thu, lợi nhuận
12. Theo dõi sinh trưởng cây qua ảnh định kỳ
13. Cảnh báo sâu bệnh cộng đồng theo khu vực
14. Bản đồ nguồn nước và cảnh báo hạn hán/ngập úng
15. Quản lý nhà kính thông minh
16. Quản lý nhiều khu vực trồng và phân quyền người dùng
17. Dashboard trực quan IoT, biểu đồ, thống kê
18. Nền tảng chia sẻ dữ liệu giữa các nông hộ


## Bản sửa mới
- Sửa lỗi trang Quản lý người dùng báo `rows.join is not a function`.
- Đổi nút `Ctrl K` thành icon danh sách chức năng.
- Sau khi đăng ký, hệ thống chuyển về trang đăng nhập; người dùng phải đăng nhập mới vào hệ thống.
- Dữ liệu vẫn bắt đầu trống, không có dữ liệu mẫu.
