const CONFIG = {
  appKey: 'smart_agritech_18_wow_pro_v2_fixed',
  themeKey: 'smart_agritech_18_wow_theme',
  modules: [
    { id: 'admin-users', group: 'QUẢN TRỊ', adminOnly: true, icon: 'users', title: 'Quản lý tài khoản', desc: 'Tạo tài khoản, giao quyền và kiểm soát người có thể xem dữ liệu.' },
    { id: 'ai-diagnosis', group: '18 CHỨC NĂNG', icon: 'scan-search', title: 'Chẩn đoán bệnh lá', desc: 'Ghi nhận ảnh và triệu chứng để nhận hướng xử lý ban đầu.' },
    { id: 'iot-irrigation', group: '18 CHỨC NĂNG', icon: 'droplets', title: 'Tưới thông minh', desc: 'Theo dõi độ ẩm và điều khiển trạng thái tưới cho từng khu vực.' },
    { id: 'farm-dashboard', group: '18 CHỨC NĂNG', icon: 'layout-dashboard', title: 'Tổng quan nông trại', desc: 'Xem nhanh tình hình cây trồng, công việc và tài chính.' },
    { id: 'trace-qr', group: '18 CHỨC NĂNG', icon: 'package-check', title: 'Truy xuất nguồn gốc', desc: 'Tạo mã QR có thể quét cho từng lô nông sản.' },
    { id: 'plant-qr', group: '18 CHỨC NĂNG', icon: 'trees', title: 'Hồ sơ từng cây', desc: 'Lưu thông tin và mã QR riêng cho từng cây.' },
    { id: 'yield-ai', group: '18 CHỨC NĂNG', icon: 'chart-no-axes-combined', title: 'Ước tính năng suất', desc: 'Tính sản lượng dự kiến từ diện tích và điều kiện chăm sóc.' },
    { id: 'risk-ai', group: '18 CHỨC NĂNG', icon: 'triangle-alert', title: 'Cảnh báo rủi ro mùa vụ', desc: 'Ghi nhận nguy cơ và việc cần làm cho từng khu vực.' },
    { id: 'soil-health', group: '18 CHỨC NĂNG', icon: 'flask-conical', title: 'Sức khỏe đất & luân canh', desc: 'Theo dõi pH, độ ẩm và nhận gợi ý cải tạo đất.' },
    { id: 'ai-assistant', group: '18 CHỨC NĂNG', icon: 'messages-square', title: 'Hỏi đáp canh tác', desc: 'Trao đổi nhanh về tưới, đất, sâu bệnh và chăm cây.' },
    { id: 'farming-diary', group: '18 CHỨC NĂNG', icon: 'notebook-tabs', title: 'Nhật ký canh tác', desc: 'Ghi lại những việc đã làm trên từng khu vực.' },
    { id: 'finance', group: '18 CHỨC NĂNG', icon: 'wallet-cards', title: 'Thu chi mùa vụ', desc: 'Theo dõi chi phí, doanh thu và lợi nhuận.' },
    { id: 'growth-monitor', group: '18 CHỨC NĂNG', icon: 'sprout', title: 'Theo dõi sinh trưởng', desc: 'Lưu ảnh, chiều cao và số lá theo từng lần đo.' },
    { id: 'pest-alerts', group: '18 CHỨC NĂNG', icon: 'bug', title: 'Cảnh báo sâu bệnh', desc: 'Chia sẻ tình hình sâu bệnh theo khu vực.' },
    { id: 'water-map', group: '18 CHỨC NĂNG', icon: 'map-pinned', title: 'Bản đồ nguồn nước', desc: 'Đánh dấu nơi có nước, hạn hán hoặc ngập úng.' },
    { id: 'greenhouse', group: '18 CHỨC NĂNG', icon: 'warehouse', title: 'Quản lý nhà kính', desc: 'Theo dõi và bật tắt thiết bị trong nhà kính.' },
    { id: 'zones-permission', group: '18 CHỨC NĂNG', icon: 'map', title: 'Khu vực & người phụ trách', desc: 'Quản lý vùng trồng và phân công người chăm sóc.' },
    { id: 'visual-dashboard', group: '18 CHỨC NĂNG', icon: 'chart-column-big', title: 'Biểu đồ & thống kê', desc: 'So sánh nhanh dữ liệu vận hành đã ghi nhận.' },
    { id: 'farmer-social', group: '18 CHỨC NĂNG', icon: 'users-round', title: 'Góc chia sẻ nhà vườn', desc: 'Trao đổi kinh nghiệm và tình hình canh tác.' }
  ],
  collections: [
    'diagnoses', 'irrigations', 'traceBatches', 'plants', 'yieldPredictions',
    'riskAlerts', 'soilTests', 'assistantChats', 'diaries', 'finances',
    'growths', 'pestAlerts', 'waterPoints', 'greenhouseDevices', 'zones', 'socialPosts'
  ],
  collectionLabels: {
    diagnoses: 'Lần chẩn đoán',
    irrigations: 'Cấu hình tưới',
    traceBatches: 'Lô truy xuất',
    plants: 'Hồ sơ cây',
    yieldPredictions: 'Lần ước tính',
    riskAlerts: 'Cảnh báo mùa vụ',
    soilTests: 'Mẫu đất',
    assistantChats: 'Tin nhắn hỏi đáp',
    diaries: 'Mục nhật ký',
    finances: 'Giao dịch',
    growths: 'Lần đo sinh trưởng',
    pestAlerts: 'Tin sâu bệnh',
    waterPoints: 'Điểm nguồn nước',
    greenhouseDevices: 'Thiết bị nhà kính',
    zones: 'Khu vực trồng',
    socialPosts: 'Bài chia sẻ'
  },
  roleLabels: { admin: 'Quản lý', user: 'Nông hộ' }
};
