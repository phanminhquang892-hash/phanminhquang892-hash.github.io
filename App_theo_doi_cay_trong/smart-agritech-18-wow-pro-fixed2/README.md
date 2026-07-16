# Smart AgriTech

Ứng dụng web quản lý nông trại với đúng 18 chức năng. Dự án dùng HTML, CSS và JavaScript thuần; không cần cài đặt thư viện để sử dụng.

## Mở ứng dụng

Mở tệp `index.html` bằng trình duyệt. Tài khoản đầu tiên được tạo sẽ có quyền **Quản lý**; các tài khoản tạo sau có quyền **Nông hộ**.

Thông tin được lưu trong `localStorage` của chính trình duyệt đang dùng. Khi đổi trình duyệt, xóa dữ liệu trang web hoặc chuyển sang máy khác, dữ liệu sẽ không tự đi theo.

## Quyền sử dụng

- **Quản lý** xem được toàn bộ dữ liệu, tạo tài khoản, giao người phụ trách, đổi mật khẩu và tạm khóa tài khoản.
- **Nông hộ** chỉ xem và chỉnh sửa dữ liệu thuộc tài khoản của mình.
- Cảnh báo sâu bệnh và góc chia sẻ là dữ liệu chung; mọi nông hộ đều xem được nhưng chỉ người đăng hoặc người quản lý mới được sửa, xóa.

## 18 chức năng

1. Chẩn đoán bệnh lá
2. Tưới thông minh
3. Tổng quan nông trại
4. Truy xuất nguồn gốc bằng QR
5. Hồ sơ từng cây bằng QR
6. Ước tính năng suất
7. Cảnh báo rủi ro mùa vụ
8. Sức khỏe đất và luân canh
9. Hỏi đáp canh tác
10. Nhật ký canh tác
11. Thu chi mùa vụ
12. Theo dõi sinh trưởng
13. Cảnh báo sâu bệnh cộng đồng
14. Bản đồ nguồn nước
15. Quản lý nhà kính
16. Khu vực và người phụ trách
17. Biểu đồ và thống kê
18. Góc chia sẻ nhà vườn

## Ghi chú vận hành

- Mã QR được tạo ngay trong trình duyệt, có thể mở lớn và tải xuống.
- Ảnh lá và ảnh sinh trưởng được thu nhỏ trước khi lưu để hạn chế đầy bộ nhớ trình duyệt.
- Kết quả chẩn đoán, ước tính năng suất và hỏi đáp là hỗ trợ ban đầu dựa trên dữ liệu người dùng nhập; không thay thế kết luận của cán bộ nông nghiệp tại địa phương.
- Trạng thái tưới và thiết bị nhà kính trong bản web là thông tin vận hành được ghi nhận tại ứng dụng; để điều khiển thiết bị vật lý cần kết nối thêm phần cứng và máy chủ phù hợp.
