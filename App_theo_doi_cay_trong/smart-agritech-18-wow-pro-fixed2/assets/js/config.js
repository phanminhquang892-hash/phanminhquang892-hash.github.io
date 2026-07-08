const CONFIG = {
  appKey: 'smart_agritech_18_wow_pro_v2_fixed',
  themeKey: 'smart_agritech_18_wow_theme',
  modules: [
    { id:'admin-users', group:'QUẢN TRỊ', adminOnly:true, icon:'🛡️', title:'Quản lý người dùng', desc:'Admin quản lý tài khoản, vai trò và trạng thái người dùng.' },
    { id:'ai-diagnosis', group:'18 CHỨC NĂNG', icon:'🤖', title:'AI chẩn đoán bệnh cây', desc:'Upload ảnh lá, AI mock phân tích bệnh và lưu lịch sử.' },
    { id:'iot-irrigation', group:'18 CHỨC NĂNG', icon:'💧', title:'Tưới thông minh IoT', desc:'Theo dõi độ ẩm, thời tiết và bật/tắt tưới tự động.' },
    { id:'farm-dashboard', group:'18 CHỨC NĂNG', icon:'📊', title:'Smart Farm Dashboard', desc:'Bảng điều khiển tổng hợp toàn trang trại thông minh.' },
    { id:'trace-qr', group:'18 CHỨC NĂNG', icon:'🏷️', title:'Truy xuất nguồn gốc QR', desc:'Tạo QR mock cho lô nông sản lúc thu hoạch.' },
    { id:'plant-qr', group:'18 CHỨC NĂNG', icon:'🌳', title:'Quản lý từng cây QR', desc:'Quản lý từng cây bằng mã QR riêng.' },
    { id:'yield-ai', group:'18 CHỨC NĂNG', icon:'🔮', title:'Dự đoán năng suất AI', desc:'Dự đoán năng suất mùa vụ bằng mô phỏng AI.' },
    { id:'risk-ai', group:'18 CHỨC NĂNG', icon:'⚠️', title:'AI cảnh báo mất mùa', desc:'Cảnh báo nguy cơ mất mùa theo thời tiết và lịch sử.' },
    { id:'soil-health', group:'18 CHỨC NĂNG', icon:'🧪', title:'Sức khỏe đất & luân canh', desc:'Theo dõi pH, độ ẩm đất và đề xuất luân canh.' },
    { id:'ai-assistant', group:'18 CHỨC NĂNG', icon:'💬', title:'Trợ lý AI canh tác', desc:'Chatbot tư vấn theo giống cây và tình huống.' },
    { id:'farming-diary', group:'18 CHỨC NĂNG', icon:'📒', title:'Nhật ký canh tác điện tử', desc:'Ghi lịch gieo trồng, bón phân, phun thuốc, thu hoạch.' },
    { id:'finance', group:'18 CHỨC NĂNG', icon:'💰', title:'Chi phí - Doanh thu - Lợi nhuận', desc:'Quản lý tài chính từng vụ mùa.' },
    { id:'growth-monitor', group:'18 CHỨC NĂNG', icon:'🌿', title:'Theo dõi sinh trưởng', desc:'Theo dõi chiều cao, số lá và ảnh định kỳ.' },
    { id:'pest-alerts', group:'18 CHỨC NĂNG', icon:'🪲', title:'Cảnh báo sâu bệnh cộng đồng', desc:'Gửi cảnh báo sâu bệnh theo khu vực.' },
    { id:'water-map', group:'18 CHỨC NĂNG', icon:'🗺️', title:'Bản đồ nguồn nước + hạn/ngập', desc:'Bản đồ mock điểm nước, hạn hán, ngập úng.' },
    { id:'greenhouse', group:'18 CHỨC NĂNG', icon:'🏡', title:'Nhà kính thông minh', desc:'Điều khiển thiết bị và môi trường nhà kính.' },
    { id:'zones-permission', group:'18 CHỨC NĂNG', icon:'🧑‍🌾', title:'Khu vực trồng + phân quyền', desc:'Quản lý vùng trồng và phân công người phụ trách.' },
    { id:'visual-dashboard', group:'18 CHỨC NĂNG', icon:'📈', title:'Dashboard biểu đồ & thống kê', desc:'Biểu đồ trực quan IoT, tài chính và vận hành.' },
    { id:'farmer-social', group:'18 CHỨC NĂNG', icon:'👥', title:'Chia sẻ dữ liệu nông hộ', desc:'Nền tảng cộng đồng chia sẻ kinh nghiệm và dữ liệu.' }
  ],
  collections: ['diagnoses','irrigations','traceBatches','plants','yieldPredictions','riskAlerts','soilTests','assistantChats','diaries','finances','growths','pestAlerts','waterPoints','greenhouseDevices','zones','socialPosts'],
  roleLabels: { admin:'Quản trị viên', user:'Nông dân/User' }
};
