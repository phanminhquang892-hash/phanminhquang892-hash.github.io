const Modules = (() => {
  const val = (form, key) => String(form.get(key) || '').trim();
  const num = (form, key) => Number(form.get(key) || 0);
  const recentFirst = (items, key = 'createdAt') => [...items].sort((a, b) => String(b[key] || b.createdAt || '').localeCompare(String(a[key] || a.createdAt || '')));
  const canEdit = item => {
    const user = Store.currentUser();
    return Boolean(user && (user.role === 'admin' || item.ownerId === user.id || item.createdBy === user.id));
  };

  function userSelectField(ownerId) {
    const user = Store.currentUser();
    if (user?.role !== 'admin') return '';
    return `<div class="field span-2" data-field="ownerId"><label for="field-ownerId">Người phụ trách</label><select id="field-ownerId" name="ownerId">${UI.optionsUsers(ownerId || user.id)}</select><small class="error"></small></div>`;
  }

  function actions(collection, item) {
    if (!canEdit(item)) return '<span class="pill">Chỉ xem</span>';
    return `<div class="row-actions"><button class="soft-btn" data-edit="${collection}" data-id="${item.id}" type="button">${UI.icon('pencil')}Sửa</button><button class="danger-btn" data-del="${collection}" data-id="${item.id}" type="button">${UI.icon('trash-2')}Xóa</button></div>`;
  }

  function bindCommon(root, collection, editMap) {
    UI.$$(`[data-del="${collection}"]`, root).forEach(button => {
      button.onclick = () => UI.confirm('Xóa bản ghi này?', () => {
        if (!Store.remove(collection, button.dataset.id)) return UI.toast('Không thể xóa', 'Bạn không có quyền thay đổi bản ghi này.', 'danger');
        UI.toast('Đã xóa bản ghi');
        App.render();
      });
    });
    UI.$$(`[data-edit="${collection}"]`, root).forEach(button => {
      button.onclick = () => editMap[collection]?.(button.dataset.id);
    });
  }

  function table(headers, rows) {
    const body = Array.isArray(rows) ? rows.join('') : String(rows || '');
    return `<div class="table-wrap"><table><thead><tr>${headers.map(header => `<th>${UI.esc(header)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function kpi(iconName, label, value, sub = '') {
    return `<div class="card kpi"><div><p class="muted">${UI.esc(label)}</p><div class="num">${UI.esc(value)}</div>${sub ? `<small class="muted">${UI.esc(sub)}</small>` : ''}</div><div class="icon">${UI.icon(iconName)}</div></div>`;
  }

  function addButton(id, label, iconName = 'plus') {
    return `<button class="primary-btn" id="${id}" type="button">${UI.icon(iconName)}${UI.esc(label)}</button>`;
  }

  function hero(title, description, button = '') {
    return `<div class="card hero-card"><p class="eyebrow">Thông tin đang theo dõi</p><h2>${UI.esc(title)}</h2><p class="muted">${UI.esc(description)}</p>${button}</div>`;
  }

  function sectionShell(title, description, inner, button = '') {
    return `${hero(title, description, button)}<div class="card">${inner}</div>`;
  }

  function requireFields(fields) {
    const errors = {};
    fields.forEach(([name, label, value]) => {
      if (!UI.required(value)) errors[name] = `Bạn nhập ${label.toLowerCase()} nhé.`;
    });
    return errors;
  }

  function rangeError(errors, name, label, value, min, max) {
    if (UI.required(value) && !UI.numberBetween(value, min, max)) errors[name] = `${label} cần nằm trong khoảng ${min} đến ${max}.`;
  }

  function positiveError(errors, name, label, value) {
    if (UI.required(value) && (!Number.isFinite(Number(value)) || Number(value) <= 0)) errors[name] = `${label} cần lớn hơn 0.`;
  }

  function showModalErrors(errors, root) {
    Object.entries(errors).forEach(([key, message]) => UI.setFieldError(key, message, root));
  }

  function saveRecord(collection, record, message) {
    if (!Store.upsert(collection, record)) {
      UI.toast('Chưa lưu được', 'Bạn kiểm tra lại quyền truy cập rồi thử lại.', 'danger');
      return false;
    }
    UI.toast(message);
    App.render();
    return true;
  }

  function duplicate(collection, key, value, currentId = '') {
    const normalized = String(value || '').trim().toLocaleLowerCase('vi');
    return Store.get()[collection].some(item => item.id !== currentId && String(item[key] || '').trim().toLocaleLowerCase('vi') === normalized);
  }

  /* Quản trị tài khoản - không tính trong 18 chức năng */
  function adminUsers() {
    const current = Store.currentUser();
    if (current?.role !== 'admin') return '<div class="card"><h2>Bạn không có quyền mở mục này</h2></div>';
    const state = Store.get();
    const rows = state.users.map(user => `<tr>
      <td><strong>${UI.esc(user.username)}</strong><br><small class="muted">${UI.esc(user.email)}</small></td>
      <td><span class="pill ${user.role === 'admin' ? 'gold' : ''}">${UI.esc(CONFIG.roleLabels[user.role])}</span></td>
      <td>${user.locked ? '<span class="pill danger">Tạm khóa</span>' : '<span class="pill">Đang dùng</span>'}</td>
      <td>${UI.date(user.createdAt)}</td>
      <td><div class="row-actions"><button class="soft-btn" data-user-edit="${user.id}" type="button">${UI.icon('pencil')}Sửa</button><button class="soft-btn" data-user-pass="${user.id}" type="button">${UI.icon('key-round')}Đổi mật khẩu</button>${user.id !== current.id ? `<button class="danger-btn" data-user-del="${user.id}" type="button">${UI.icon('trash-2')}Xóa</button>` : ''}</div></td>
    </tr>`).join('');
    const logRows = state.logs.slice(0, 30).map(log => `<tr><td>${UI.dateTime(log.createdAt)}</td><td>${UI.esc(log.action)}</td><td>${UI.esc(log.detail)}</td></tr>`);
    return `${hero('Quản lý tài khoản', 'Tạo tài khoản, giao quyền và tạm khóa khi cần.', addButton('addUserBtn', 'Thêm tài khoản', 'user-plus'))}
      <div class="grid grid-3">
        ${kpi('users', 'Tổng tài khoản', state.users.length, 'Đã tạo trên trình duyệt này')}
        ${kpi('shield-check', 'Người quản lý', state.users.filter(user => user.role === 'admin').length, 'Có thể xem toàn bộ dữ liệu')}
        ${kpi('lock-keyhole', 'Đang tạm khóa', state.users.filter(user => user.locked).length, 'Không thể đăng nhập')}
      </div>
      <div class="card"><div class="toolbar"><h3>Danh sách tài khoản</h3></div>${table(['Tài khoản', 'Quyền', 'Trạng thái', 'Ngày tạo', 'Thao tác'], rows)}</div>
      <div class="card"><div class="toolbar"><h3>Hoạt động gần đây</h3></div>${logRows.length ? table(['Thời gian', 'Hoạt động', 'Chi tiết'], logRows) : UI.empty('Chưa có hoạt động nào')}</div>`;
  }

  function bindAdminUsers(root) {
    const openUserModal = (id = '') => {
      const user = Store.get().users.find(item => item.id === id) || {};
      const passwordField = id ? '' : `<div class="field" data-field="password"><label for="admin-password">Mật khẩu ban đầu</label><div class="input-action"><input id="admin-password" name="password" type="password" placeholder="Từ 8 ký tự"><button class="eye-btn" type="button" data-toggle-password="admin-password" aria-label="Hiện mật khẩu"></button></div><small class="error"></small></div>`;
      UI.modal(id ? 'Sửa tài khoản' : 'Thêm tài khoản', `<div class="form-grid">
        ${UI.formInput('username', 'Tên tài khoản', user.username || '')}
        ${UI.formInput('email', 'Email', user.email || '', 'email')}
        ${passwordField}
        ${UI.formSelect('role', 'Quyền sử dụng', [{ value: 'user', label: 'Nông hộ' }, { value: 'admin', label: 'Quản lý' }], user.role || 'user')}
        ${UI.formSelect('locked', 'Trạng thái', [{ value: '0', label: 'Đang dùng' }, { value: '1', label: 'Tạm khóa' }], user.locked ? '1' : '0')}
      </div>`, (form, modalRoot) => {
        const payload = { username: val(form, 'username'), email: val(form, 'email'), password: val(form, 'password'), role: val(form, 'role'), locked: val(form, 'locked') === '1' };
        const result = id ? Auth.updateUser(id, payload) : Auth.createByAdmin(payload);
        if (!result.ok) { showModalErrors(result.errors, modalRoot); return false; }
        UI.toast(id ? 'Đã cập nhật tài khoản' : 'Đã thêm tài khoản');
        App.render();
        return true;
      });
    };

    UI.$('#addUserBtn', root)?.addEventListener('click', () => openUserModal());
    UI.$$('[data-user-edit]', root).forEach(button => { button.onclick = () => openUserModal(button.dataset.userEdit); });
    UI.$$('[data-user-pass]', root).forEach(button => {
      button.onclick = () => UI.modal('Đổi mật khẩu', `<div class="field" data-field="password"><label for="new-password">Mật khẩu mới</label><div class="input-action"><input id="new-password" name="password" type="password" placeholder="Từ 8 ký tự"><button class="eye-btn" type="button" data-toggle-password="new-password" aria-label="Hiện mật khẩu"></button></div><small class="error"></small></div>`, (form, modalRoot) => {
        const result = Auth.changePassword(button.dataset.userPass, val(form, 'password'));
        if (!result.ok) { UI.setFieldError('password', result.message, modalRoot); return false; }
        UI.toast('Đã đổi mật khẩu');
        return true;
      });
    });
    UI.$$('[data-user-del]', root).forEach(button => {
      button.onclick = () => UI.confirm('Xóa tài khoản và toàn bộ dữ liệu thuộc tài khoản này?', () => {
        const result = Auth.deleteUser(button.dataset.userDel);
        if (!result.ok) return UI.toast('Chưa thể xóa', result.message, 'danger');
        UI.toast('Đã xóa tài khoản');
        App.render();
      });
    });
  }

  /* 1. Chẩn đoán bệnh lá */
  function assessSymptoms(note) {
    const text = note.toLocaleLowerCase('vi');
    const highWords = ['thối', 'mốc', 'đen', 'rụng hàng loạt', 'lan nhanh', 'héo cả cây'];
    const mediumWords = ['đốm', 'vàng', 'xoăn', 'rệp', 'sâu', 'héo', 'cháy mép'];
    if (highWords.some(word => text.includes(word))) return {
      level: 'Cao',
      result: 'Triệu chứng có dấu hiệu tiến triển mạnh',
      advice: 'Tách cây bị nặng, bỏ lá hư và kiểm tra mặt dưới lá. Hạn chế tưới lên lá; nếu tình trạng tiếp tục lan, nên nhờ cán bộ kỹ thuật tại địa phương kiểm tra trực tiếp.'
    };
    if (mediumWords.some(word => text.includes(word))) return {
      level: 'Trung bình',
      result: 'Có dấu hiệu cần theo dõi sát',
      advice: 'Đánh dấu cây, kiểm tra độ ẩm đất và chụp lại sau 2-3 ngày. Giữ vườn thông thoáng, loại bỏ lá bệnh và chưa nên phun thuốc khi chưa xác định rõ nguyên nhân.'
    };
    return {
      level: 'Thấp',
      result: 'Chưa thấy dấu hiệu nghiêm trọng từ mô tả',
      advice: 'Tiếp tục theo dõi trong 3-5 ngày, giữ lịch tưới ổn định và bổ sung mô tả nếu màu lá hoặc vết bệnh thay đổi.'
    };
  }

  function aiDiagnosis() {
    const list = recentFirst(Store.ownerFilter(Store.get().diagnoses));
    const rows = list.map(item => `<tr>
      <td>${item.image ? `<img src="${item.image}" class="preview-img" style="width:72px;height:58px;object-fit:cover;margin:0" alt="Ảnh lá ${UI.esc(item.crop)}">` : 'Chưa có ảnh'}</td>
      <td><strong>${UI.esc(item.crop)}</strong><br><small class="muted">${UI.esc(item.result)}</small></td>
      <td><span class="pill ${item.level === 'Cao' ? 'danger' : item.level === 'Trung bình' ? 'gold' : ''}">${UI.esc(item.level)}</span></td>
      <td>${UI.esc(item.advice)}</td>
      <td>${actions('diagnoses', item)}</td>
    </tr>`).join('');
    return sectionShell('Chẩn đoán bệnh lá', 'Chụp rõ lá bị bệnh và mô tả điều bạn quan sát được để nhận hướng xử lý ban đầu.', `
      <div class="upload-zone">
        <label class="file-label" for="diagFile">${UI.icon('image-plus')}<span><strong>Chọn ảnh lá cây</strong><br><small class="muted">Ảnh rõ, đủ sáng sẽ dễ theo dõi hơn</small></span></label>
        <input id="diagFile" class="hidden" type="file" accept="image/*">
        <img id="diagPreview" class="preview-img hidden" alt="Ảnh lá đã chọn">
        <div class="grid grid-2">
          <div class="field"><label for="diagCrop">Tên hoặc giống cây</label><input id="diagCrop" placeholder="Ví dụ: cà chua"></div>
          <div class="field"><label for="diagNote">Triệu chứng quan sát được</label><input id="diagNote" placeholder="Ví dụ: lá vàng và có đốm nâu"></div>
        </div>
        <button class="primary-btn" id="runDiag" type="button">${UI.icon('scan-search')}Đánh giá ảnh lá</button>
      </div>
      <div class="toolbar" style="margin-top:18px"><h3>Lịch sử đánh giá</h3></div>
      ${list.length ? table(['Ảnh', 'Cây & kết quả', 'Mức lưu ý', 'Việc nên làm', 'Thao tác'], rows) : UI.empty('Chưa có lần đánh giá nào')}`);
  }

  function editDiagnosis(id) {
    const item = Store.get().diagnoses.find(record => record.id === id) || {};
    UI.modal('Sửa kết quả đánh giá', `<div class="form-grid">
      ${UI.formInput('crop', 'Tên hoặc giống cây', item.crop || '')}
      ${UI.formSelect('level', 'Mức lưu ý', [{ value: 'Thấp', label: 'Thấp' }, { value: 'Trung bình', label: 'Trung bình' }, { value: 'Cao', label: 'Cao' }], item.level || 'Thấp')}
      ${UI.formText('note', 'Triệu chứng đã ghi', item.note || '')}
      ${UI.formInput('result', 'Kết quả ban đầu', item.result || '', 'text', true)}
      ${UI.formText('advice', 'Việc nên làm', item.advice || '')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['crop', 'tên cây', val(form, 'crop')], ['result', 'kết quả', val(form, 'result')], ['advice', 'việc nên làm', val(form, 'advice')]]);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('diagnoses', { ...item, crop: val(form, 'crop'), note: val(form, 'note'), level: val(form, 'level'), result: val(form, 'result'), advice: val(form, 'advice'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã cập nhật kết quả');
    });
  }

  function bindAiDiagnosis(root) {
    let imageData = '';
    UI.$('#diagFile', root)?.addEventListener('change', event => {
      UI.imgPreview(event.target.files[0], source => {
        if (!source) return;
        imageData = source;
        const preview = UI.$('#diagPreview', root);
        preview.src = source;
        preview.classList.remove('hidden');
      });
    });
    UI.$('#runDiag', root)?.addEventListener('click', () => {
      const crop = UI.$('#diagCrop', root).value.trim();
      const note = UI.$('#diagNote', root).value.trim();
      if (!imageData) return UI.toast('Bạn chưa chọn ảnh lá', 'Hãy chọn một ảnh rõ trước khi đánh giá.', 'danger');
      if (!crop) return UI.toast('Bạn chưa nhập tên cây', 'Cho biết loại cây để kết quả dễ hiểu hơn.', 'danger');
      if (!note) return UI.toast('Bạn chưa mô tả triệu chứng', 'Ghi ngắn gọn màu lá, vết đốm hoặc tình trạng héo.', 'danger');
      const assessment = assessSymptoms(note);
      saveRecord('diagnoses', { crop, note, image: imageData, ...assessment }, 'Đã lưu kết quả đánh giá');
    });
  }

  /* 2. Tưới thông minh */
  function pumpFor(item) {
    if (item.mode !== 'Tự động theo độ ẩm') return item.pump || 'Tắt';
    if (item.weather === 'Mưa') return 'Tắt';
    return Number(item.humidity) < Number(item.threshold || 45) ? 'Bật' : 'Tắt';
  }

  function iotIrrigation() {
    const list = recentFirst(Store.ownerFilter(Store.get().irrigations));
    const average = list.length ? Math.round(list.reduce((sum, item) => sum + Number(item.humidity || 0), 0) / list.length) : 0;
    const rows = list.map(item => `<tr>
      <td><strong>${UI.esc(item.zone)}</strong><br><small class="muted">${UI.esc(item.mode)}</small></td>
      <td>${Number(item.humidity || 0)}%<br><small class="muted">Ngưỡng ${Number(item.threshold || 45)}%</small></td>
      <td>${UI.esc(item.weather)}</td>
      <td><span class="pill ${item.pump === 'Bật' ? 'gold' : ''}">${UI.esc(item.pump)}</span></td>
      <td><div class="row-actions">${canEdit(item) ? `<button class="soft-btn toggle-btn ${item.pump === 'Bật' ? 'active' : ''}" data-irrigation-toggle="${item.id}" type="button">${UI.icon('power')}${item.mode === 'Tự động theo độ ẩm' ? 'Cập nhật' : item.pump === 'Bật' ? 'Tắt bơm' : 'Bật bơm'}</button>` : ''}${actions('irrigations', item)}</div></td>
    </tr>`).join('');
    return `${hero('Tưới thông minh', 'Ghi độ ẩm thực tế; chế độ tự động sẽ quyết định bật bơm theo ngưỡng bạn đặt.', addButton('addIrrigation', 'Thêm khu vực tưới'))}
      <div class="grid grid-3">
        ${kpi('gauge', 'Độ ẩm trung bình', `${average}%`, 'Từ các khu vực đã ghi')}
        ${kpi('sliders-horizontal', 'Khu vực đã cài', list.length, 'Mỗi khu vực một ngưỡng riêng')}
        ${kpi('power', 'Máy bơm đang bật', list.filter(item => item.pump === 'Bật').length, 'Trạng thái hiện tại')}
      </div>
      <div class="card">${list.length ? table(['Khu vực', 'Độ ẩm', 'Thời tiết', 'Máy bơm', 'Thao tác'], rows) : UI.empty('Chưa có khu vực tưới nào')}</div>`;
  }

  function editIrrigation(id = '') {
    const item = Store.get().irrigations.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa khu vực tưới' : 'Thêm khu vực tưới', `<div class="form-grid">
      ${UI.formInput('zone', 'Khu vực', item.zone || '')}
      ${UI.formInput('humidity', 'Độ ẩm hiện tại (%)', item.humidity ?? '', 'number', false, 'min="0" max="100"')}
      ${UI.formInput('threshold', 'Bật tưới khi dưới (%)', item.threshold ?? 45, 'number', false, 'min="0" max="100"')}
      ${UI.formSelect('weather', 'Thời tiết', [{ value: 'Nắng', label: 'Nắng' }, { value: 'Mưa', label: 'Mưa' }, { value: 'Âm u', label: 'Âm u' }, { value: 'Gió mạnh', label: 'Gió mạnh' }], item.weather || 'Nắng')}
      ${UI.formSelect('mode', 'Cách điều khiển', [{ value: 'Tự động theo độ ẩm', label: 'Tự động theo độ ẩm' }, { value: 'Thủ công', label: 'Thủ công' }], item.mode || 'Tự động theo độ ẩm')}
      ${UI.formSelect('pump', 'Trạng thái khi điều khiển thủ công', [{ value: 'Tắt', label: 'Tắt' }, { value: 'Bật', label: 'Bật' }], item.pump || 'Tắt')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['zone', 'khu vực', val(form, 'zone')], ['humidity', 'độ ẩm', val(form, 'humidity')], ['threshold', 'ngưỡng tưới', val(form, 'threshold')]]);
      rangeError(errors, 'humidity', 'Độ ẩm', val(form, 'humidity'), 0, 100);
      rangeError(errors, 'threshold', 'Ngưỡng tưới', val(form, 'threshold'), 0, 100);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      const record = { ...item, zone: val(form, 'zone'), humidity: num(form, 'humidity'), threshold: num(form, 'threshold'), weather: val(form, 'weather'), mode: val(form, 'mode'), pump: val(form, 'pump'), ownerId: val(form, 'ownerId') || item.ownerId };
      record.pump = pumpFor(record);
      return saveRecord('irrigations', record, 'Đã lưu khu vực tưới');
    });
  }

  function bindIrrigation(root) {
    UI.$$('[data-irrigation-toggle]', root).forEach(button => {
      button.onclick = () => {
        const item = Store.get().irrigations.find(record => record.id === button.dataset.irrigationToggle);
        if (!item) return;
        const next = item.mode === 'Tự động theo độ ẩm' ? pumpFor(item) : item.pump === 'Bật' ? 'Tắt' : 'Bật';
        saveRecord('irrigations', { ...item, pump: next }, next === 'Bật' ? 'Đã bật máy bơm' : 'Đã tắt máy bơm');
      };
    });
  }

  /* 3. Tổng quan nông trại */
  function farmDashboard() {
    const state = Store.get();
    const own = collection => Store.ownerFilter(state[collection]);
    const income = own('finances').filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expense = own('finances').filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const diaries = recentFirst(own('diaries'), 'date').slice(0, 5);
    const filled = CONFIG.collections.filter(collection => own(collection).length > 0).length;
    const recentRows = diaries.map(item => `<tr><td>${UI.date(item.date)}</td><td><strong>${UI.esc(item.title)}</strong><br><small class="muted">${UI.esc(item.type)}</small></td><td>${UI.esc(item.zone)}</td></tr>`);
    return `${hero('Tổng quan nông trại', 'Những con số quan trọng được tổng hợp từ dữ liệu bạn đã ghi ở 18 chức năng.')}
      <div class="grid grid-4">
        ${kpi('map', 'Khu vực trồng', own('zones').length, 'Đang được theo dõi')}
        ${kpi('trees', 'Cây có hồ sơ', own('plants').length, 'Có mã QR riêng')}
        ${kpi('droplets', 'Máy bơm đang bật', own('irrigations').filter(item => item.pump === 'Bật').length, 'Kiểm tra trước khi rời vườn')}
        ${kpi('wallet-cards', 'Lợi nhuận tạm tính', UI.money(income - expense), 'Doanh thu trừ chi phí')}
      </div>
      <div class="grid grid-2">
        <div class="card"><div class="toolbar"><h3>Việc đã ghi gần đây</h3></div>${recentRows.length ? table(['Ngày', 'Công việc', 'Khu vực'], recentRows) : UI.empty('Chưa có nhật ký canh tác')}</div>
        <div class="card"><h3>Mức độ cập nhật dữ liệu</h3><p class="muted">${filled} trên ${CONFIG.collections.length} nhóm thông tin đã có dữ liệu.</p><div class="metric-bar"><span style="width:${Math.round(filled / CONFIG.collections.length * 100)}%"></span></div><div class="metric-row"><div class="metric-row-head"><span>Cảnh báo mùa vụ</span><strong>${own('riskAlerts').filter(item => item.level === 'Cao').length} mức cao</strong></div></div><div class="metric-row"><div class="metric-row-head"><span>Tin sâu bệnh</span><strong>${Store.get().pestAlerts.length} tin</strong></div></div><div class="metric-row"><div class="metric-row-head"><span>Mẫu đất</span><strong>${own('soilTests').length} mẫu</strong></div></div></div>
      </div>`;
  }

  /* 4. Truy xuất nguồn gốc bằng QR */
  const qrText = (value, maxLength) => String(value || 'Chua ghi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, '')
    .slice(0, maxLength);
  const tracePayload = item => `AGRI|LO:${qrText(item.batch, 18)}|SP:${qrText(item.product, 18)}|NOI:${qrText(item.origin, 22)}|TH:${qrText(item.harvestDate, 10)}`;
  const plantPayload = item => `AGRI|CAY:${qrText(item.code, 18)}|TEN:${qrText(item.name, 18)}|KV:${qrText(item.zone, 18)}|NGAY:${qrText(item.plantedAt, 10)}|TT:${qrText(item.status, 12)}`;

  function traceQr() {
    const list = recentFirst(Store.ownerFilter(Store.get().traceBatches), 'harvestDate');
    const rows = list.map(item => `<tr>
      <td class="qr-cell"><span data-open-trace="${item.id}">${UI.qrBox(tracePayload(item), true, `Mở mã QR lô ${item.batch}`)}</span></td>
      <td><strong>${UI.esc(item.batch)}</strong><br><small class="muted">${UI.esc(item.product)}</small></td>
      <td>${UI.esc(item.origin || 'Chưa ghi')}</td><td>${UI.date(item.harvestDate)}</td><td>${actions('traceBatches', item)}</td>
    </tr>`).join('');
    return sectionShell('Truy xuất nguồn gốc', 'Mỗi lô nông sản có một mã QR chứa thông tin nguồn gốc và ngày thu hoạch.', list.length ? table(['Mã QR', 'Lô hàng', 'Nguồn gốc', 'Thu hoạch', 'Thao tác'], rows) : UI.empty('Chưa có lô nông sản nào'), addButton('addTrace', 'Thêm lô nông sản'));
  }

  function editTrace(id = '') {
    const item = Store.get().traceBatches.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa lô nông sản' : 'Thêm lô nông sản', `<div class="form-grid">
      ${UI.formInput('batch', 'Mã lô', item.batch || '')}
      ${UI.formInput('product', 'Tên nông sản', item.product || '')}
      ${UI.formInput('origin', 'Nguồn gốc hoặc khu vực', item.origin || '')}
      ${UI.formInput('harvestDate', 'Ngày thu hoạch', item.harvestDate || new Date().toISOString().slice(0, 10), 'date')}
      ${UI.formText('process', 'Quy trình canh tác', item.process || '')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['batch', 'mã lô', val(form, 'batch')], ['product', 'tên nông sản', val(form, 'product')], ['origin', 'nguồn gốc', val(form, 'origin')], ['harvestDate', 'ngày thu hoạch', val(form, 'harvestDate')]]);
      if (duplicate('traceBatches', 'batch', val(form, 'batch'), item.id)) errors.batch = 'Mã lô này đã được dùng.';
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('traceBatches', { ...item, batch: val(form, 'batch'), product: val(form, 'product'), origin: val(form, 'origin'), harvestDate: val(form, 'harvestDate'), process: val(form, 'process'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu lô nông sản');
    });
  }

  function openTraceQr(item) {
    UI.dialog(`Mã QR lô ${item.batch}`, `<div class="dialog-body-inner qr-detail">
      ${UI.qrBox(tracePayload(item), false, `Mã QR lô ${item.batch}`)}
      <div><dl class="detail-list"><dt>Nông sản</dt><dd>${UI.esc(item.product)}</dd><dt>Nguồn gốc</dt><dd>${UI.esc(item.origin || 'Chưa ghi')}</dd><dt>Ngày thu hoạch</dt><dd>${UI.date(item.harvestDate)}</dd><dt>Quy trình</dt><dd>${UI.esc(item.process || 'Chưa ghi')}</dd></dl><button class="secondary-btn" id="downloadQr" type="button" style="margin-top:16px">${UI.icon('download')}Tải mã QR</button></div>
    </div>`);
    const modalRoot = UI.$('#modalRoot');
    UI.renderQRCodes(modalRoot);
    UI.icons(modalRoot);
    UI.$('#downloadQr', modalRoot).onclick = () => UI.downloadQr(UI.$('.qr-box', modalRoot), `lo-${item.batch}.png`);
  }

  function bindTraceQr(root) {
    UI.$$('[data-open-trace]', root).forEach(wrapper => { wrapper.onclick = () => { const item = Store.get().traceBatches.find(record => record.id === wrapper.dataset.openTrace); if (item) openTraceQr(item); }; });
  }

  /* 5. Hồ sơ từng cây bằng QR */
  function plantQr() {
    const list = recentFirst(Store.ownerFilter(Store.get().plants), 'plantedAt');
    const rows = list.map(item => `<tr>
      <td class="qr-cell"><span data-open-plant="${item.id}">${UI.qrBox(plantPayload(item), true, `Mở mã QR cây ${item.code}`)}</span></td>
      <td><strong>${UI.esc(item.code)}</strong><br><small class="muted">${UI.esc(item.name)}</small></td>
      <td>${UI.esc(item.zone || 'Chưa ghi')}</td><td>${UI.date(item.plantedAt)}</td><td><span class="pill ${item.status === 'Bệnh' ? 'danger' : item.status === 'Theo dõi' ? 'gold' : ''}">${UI.esc(item.status)}</span></td><td>${actions('plants', item)}</td>
    </tr>`).join('');
    return sectionShell('Hồ sơ từng cây', 'Lưu thông tin riêng của từng cây và dùng mã QR để mở hồ sơ nhanh.', list.length ? table(['Mã QR', 'Cây', 'Khu vực', 'Ngày trồng', 'Trạng thái', 'Thao tác'], rows) : UI.empty('Chưa có hồ sơ cây nào'), addButton('addPlant', 'Thêm hồ sơ cây'));
  }

  function editPlant(id = '') {
    const item = Store.get().plants.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa hồ sơ cây' : 'Thêm hồ sơ cây', `<div class="form-grid">
      ${UI.formInput('code', 'Mã cây', item.code || '')}
      ${UI.formInput('name', 'Tên hoặc giống cây', item.name || '')}
      ${UI.formInput('zone', 'Khu vực', item.zone || '')}
      ${UI.formInput('plantedAt', 'Ngày trồng', item.plantedAt || new Date().toISOString().slice(0, 10), 'date')}
      ${UI.formSelect('status', 'Trạng thái', [{ value: 'Khỏe', label: 'Khỏe' }, { value: 'Theo dõi', label: 'Cần theo dõi' }, { value: 'Bệnh', label: 'Có dấu hiệu bệnh' }, { value: 'Thu hoạch', label: 'Đã thu hoạch' }], item.status || 'Khỏe')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['code', 'mã cây', val(form, 'code')], ['name', 'tên cây', val(form, 'name')], ['zone', 'khu vực', val(form, 'zone')], ['plantedAt', 'ngày trồng', val(form, 'plantedAt')]]);
      if (duplicate('plants', 'code', val(form, 'code'), item.id)) errors.code = 'Mã cây này đã được dùng.';
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('plants', { ...item, code: val(form, 'code'), name: val(form, 'name'), zone: val(form, 'zone'), plantedAt: val(form, 'plantedAt'), status: val(form, 'status'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu hồ sơ cây');
    });
  }

  function openPlantQr(item) {
    UI.dialog(`Hồ sơ cây ${item.code}`, `<div class="dialog-body-inner qr-detail">
      ${UI.qrBox(plantPayload(item), false, `Mã QR cây ${item.code}`)}
      <div><dl class="detail-list"><dt>Tên cây</dt><dd>${UI.esc(item.name)}</dd><dt>Khu vực</dt><dd>${UI.esc(item.zone || 'Chưa ghi')}</dd><dt>Ngày trồng</dt><dd>${UI.date(item.plantedAt)}</dd><dt>Trạng thái</dt><dd>${UI.esc(item.status)}</dd></dl><button class="secondary-btn" id="downloadQr" type="button" style="margin-top:16px">${UI.icon('download')}Tải mã QR</button></div>
    </div>`);
    const modalRoot = UI.$('#modalRoot');
    UI.renderQRCodes(modalRoot);
    UI.icons(modalRoot);
    UI.$('#downloadQr', modalRoot).onclick = () => UI.downloadQr(UI.$('.qr-box', modalRoot), `cay-${item.code}.png`);
  }

  function bindPlantQr(root) {
    UI.$$('[data-open-plant]', root).forEach(wrapper => { wrapper.onclick = () => { const item = Store.get().plants.find(record => record.id === wrapper.dataset.openPlant); if (item) openPlantQr(item); }; });
  }

  /* 6. Ước tính năng suất */
  function yieldAi() {
    const list = recentFirst(Store.ownerFilter(Store.get().yieldPredictions));
    const rows = list.map(item => `<tr><td><strong>${UI.esc(item.crop)}</strong><br><small class="muted">${UI.esc(item.season || 'Chưa ghi vụ')}</small></td><td>${Number(item.area || 0).toLocaleString('vi-VN')} ha</td><td><strong>${Number(item.predicted || 0).toLocaleString('vi-VN')} kg</strong></td><td><span class="pill">${Number(item.confidence || 0)}% độ tin cậy</span></td><td>${actions('yieldPredictions', item)}</td></tr>`).join('');
    return sectionShell('Ước tính năng suất', 'Dùng năng suất chuẩn, diện tích, thời tiết và mức chăm sóc để ước tính sản lượng.', list.length ? table(['Cây & vụ', 'Diện tích', 'Sản lượng dự kiến', 'Mức tin cậy', 'Thao tác'], rows) : UI.empty('Chưa có lần ước tính nào'), addButton('addYield', 'Tạo ước tính'));
  }

  function editYield(id = '') {
    const item = Store.get().yieldPredictions.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa ước tính năng suất' : 'Tạo ước tính năng suất', `<div class="form-grid">
      ${UI.formInput('crop', 'Tên hoặc giống cây', item.crop || '')}
      ${UI.formInput('season', 'Vụ mùa', item.season || '')}
      ${UI.formInput('area', 'Diện tích (ha)', item.area ?? '', 'number', false, 'min="0.01" step="0.01"')}
      ${UI.formInput('baseline', 'Năng suất chuẩn (kg/ha)', item.baseline ?? 1800, 'number', false, 'min="1"')}
      ${UI.formInput('rain', 'Điều kiện thời tiết (1-100)', item.rain ?? 60, 'number', false, 'min="1" max="100"')}
      ${UI.formInput('care', 'Mức chăm sóc (1-100)', item.care ?? 70, 'number', false, 'min="1" max="100"')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['crop', 'tên cây', val(form, 'crop')], ['season', 'vụ mùa', val(form, 'season')], ['area', 'diện tích', val(form, 'area')], ['baseline', 'năng suất chuẩn', val(form, 'baseline')]]);
      positiveError(errors, 'area', 'Diện tích', val(form, 'area'));
      positiveError(errors, 'baseline', 'Năng suất chuẩn', val(form, 'baseline'));
      rangeError(errors, 'rain', 'Điều kiện thời tiết', val(form, 'rain'), 1, 100);
      rangeError(errors, 'care', 'Mức chăm sóc', val(form, 'care'), 1, 100);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      const area = num(form, 'area');
      const baseline = num(form, 'baseline');
      const rain = num(form, 'rain');
      const care = num(form, 'care');
      const conditionFactor = .55 + rain * .0025 + care * .0025;
      const predicted = Math.round(area * baseline * conditionFactor);
      const confidence = Math.round(55 + Math.min(rain, care) * .35);
      return saveRecord('yieldPredictions', { ...item, crop: val(form, 'crop'), season: val(form, 'season'), area, baseline, rain, care, predicted, confidence, ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu ước tính năng suất');
    });
  }

  /* 7. Cảnh báo rủi ro mùa vụ */
  function riskAi() {
    const list = recentFirst(Store.ownerFilter(Store.get().riskAlerts));
    const rows = list.map(item => `<tr><td><strong>${UI.esc(item.zone)}</strong><br><small class="muted">${UI.esc(item.crop)}</small></td><td><span class="pill ${item.level === 'Cao' ? 'danger' : item.level === 'Trung bình' ? 'gold' : ''}">${UI.esc(item.level)}</span></td><td>${UI.esc(item.reason)}</td><td>${UI.esc(item.action)}</td><td>${actions('riskAlerts', item)}</td></tr>`).join('');
    return sectionShell('Cảnh báo rủi ro mùa vụ', 'Ghi lại nguy cơ tại từng khu vực và việc cần làm để không bỏ sót.', list.length ? table(['Khu vực', 'Mức rủi ro', 'Nguyên nhân', 'Việc cần làm', 'Thao tác'], rows) : UI.empty('Chưa có cảnh báo mùa vụ'), addButton('addRisk', 'Thêm cảnh báo'));
  }

  function editRisk(id = '') {
    const item = Store.get().riskAlerts.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa cảnh báo mùa vụ' : 'Thêm cảnh báo mùa vụ', `<div class="form-grid">
      ${UI.formInput('zone', 'Khu vực', item.zone || '')}
      ${UI.formInput('crop', 'Tên hoặc giống cây', item.crop || '')}
      ${UI.formSelect('weather', 'Nguy cơ chính', [{ value: 'Hạn hán', label: 'Hạn hán' }, { value: 'Ngập úng', label: 'Ngập úng' }, { value: 'Sâu bệnh', label: 'Sâu bệnh' }, { value: 'Nắng nóng', label: 'Nắng nóng' }, { value: 'Gió mạnh', label: 'Gió mạnh' }], item.weather || 'Hạn hán')}
      ${UI.formSelect('level', 'Mức rủi ro', [{ value: 'Thấp', label: 'Thấp' }, { value: 'Trung bình', label: 'Trung bình' }, { value: 'Cao', label: 'Cao' }], item.level || 'Trung bình')}
      ${UI.formText('reason', 'Điều bạn đang quan sát', item.reason || '')}
      ${UI.formText('action', 'Việc cần làm', item.action || '')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['zone', 'khu vực', val(form, 'zone')], ['crop', 'tên cây', val(form, 'crop')], ['reason', 'điều đang quan sát', val(form, 'reason')], ['action', 'việc cần làm', val(form, 'action')]]);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('riskAlerts', { ...item, zone: val(form, 'zone'), crop: val(form, 'crop'), weather: val(form, 'weather'), level: val(form, 'level'), reason: val(form, 'reason'), action: val(form, 'action'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu cảnh báo mùa vụ');
    });
  }

  /* 8. Sức khỏe đất và luân canh */
  function soilRecommendation(ph, moisture, nutrient) {
    const advice = [];
    if (ph < 5.5) advice.push('đất đang chua, nên kiểm tra nhu cầu bón vôi');
    else if (ph > 7.5) advice.push('đất đang kiềm, nên tăng phân hữu cơ hoai mục');
    else advice.push('pH đang ở mức phù hợp với nhiều loại rau màu');
    if (moisture < 30) advice.push('độ ẩm thấp, cần kiểm tra lịch tưới');
    else if (moisture > 80) advice.push('đất khá ướt, cần cải thiện thoát nước');
    else advice.push('độ ẩm đang trong khoảng dễ chăm sóc');
    advice.push(nutrient ? `dinh dưỡng đã ghi: ${nutrient}` : 'có thể luân canh cây họ đậu để bổ sung hữu cơ');
    return advice.join('; ') + '.';
  }

  function soilHealth() {
    const list = recentFirst(Store.ownerFilter(Store.get().soilTests));
    const rows = list.map(item => `<tr><td><strong>${UI.esc(item.zone)}</strong><br><small class="muted">${UI.esc(item.nutrient || 'Chưa ghi NPK')}</small></td><td>${Number(item.ph || 0).toLocaleString('vi-VN')}</td><td>${Number(item.moisture || 0)}%</td><td>${UI.esc(item.recommend)}</td><td>${actions('soilTests', item)}</td></tr>`).join('');
    return sectionShell('Sức khỏe đất & luân canh', 'Ghi chỉ số đo thực tế để nhận gợi ý cải tạo và luân canh phù hợp.', list.length ? table(['Khu vực', 'pH', 'Độ ẩm', 'Nhận xét', 'Thao tác'], rows) : UI.empty('Chưa có mẫu đất nào'), addButton('addSoil', 'Thêm mẫu đất'));
  }

  function editSoil(id = '') {
    const item = Store.get().soilTests.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa mẫu đất' : 'Thêm mẫu đất', `<div class="form-grid">
      ${UI.formInput('zone', 'Khu vực lấy mẫu', item.zone || '')}
      ${UI.formInput('ph', 'pH đất (0-14)', item.ph ?? '', 'number', false, 'min="0" max="14" step="0.1"')}
      ${UI.formInput('moisture', 'Độ ẩm (%)', item.moisture ?? '', 'number', false, 'min="0" max="100"')}
      ${UI.formInput('nutrient', 'Ghi chú dinh dưỡng NPK', item.nutrient || '')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['zone', 'khu vực lấy mẫu', val(form, 'zone')], ['ph', 'pH đất', val(form, 'ph')], ['moisture', 'độ ẩm', val(form, 'moisture')]]);
      rangeError(errors, 'ph', 'pH đất', val(form, 'ph'), 0, 14);
      rangeError(errors, 'moisture', 'Độ ẩm', val(form, 'moisture'), 0, 100);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      const ph = num(form, 'ph');
      const moisture = num(form, 'moisture');
      const nutrient = val(form, 'nutrient');
      return saveRecord('soilTests', { ...item, zone: val(form, 'zone'), ph, moisture, nutrient, recommend: soilRecommendation(ph, moisture, nutrient), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu mẫu đất');
    });
  }

  /* 9. Hỏi đáp canh tác */
  function assistantReply(question) {
    const text = question.toLocaleLowerCase('vi');
    const state = Store.get();
    const own = collection => Store.ownerFilter(state[collection]);
    if (/(tưới|nước|độ ẩm)/.test(text)) {
      const latest = recentFirst(own('irrigations'))[0];
      return latest ? `Tại ${latest.zone}, độ ẩm đang ghi là ${latest.humidity}% và máy bơm đang ${String(latest.pump).toLowerCase()}. Ngưỡng tưới hiện tại là ${latest.threshold || 45}%. Bạn nên đo lại độ ẩm trước khi đổi lịch tưới.` : 'Bạn nên đo độ ẩm ở độ sâu rễ, tưới vào sáng sớm và tránh để nước đọng lâu quanh gốc.';
    }
    if (/(đất|ph|luân canh|npk)/.test(text)) {
      const latest = recentFirst(own('soilTests'))[0];
      return latest ? `Mẫu gần nhất tại ${latest.zone} có pH ${latest.ph} và độ ẩm ${latest.moisture}%. Nhận xét đã lưu: ${latest.recommend}` : 'Bạn hãy đo pH và độ ẩm trước. Khi chưa có kết quả, ưu tiên bổ sung hữu cơ hoai mục và giữ đất thoát nước tốt.';
    }
    if (/(sâu|bệnh|đốm|vàng lá|rệp)/.test(text)) {
      const latest = recentFirst(state.pestAlerts)[0];
      return latest ? `Tin gần nhất là ${latest.pest} tại ${latest.area}, mức ${String(latest.level).toLowerCase()}. Bạn nên kiểm tra mặt dưới lá và cách ly cây có triệu chứng rõ trước.` : 'Hãy chụp rõ cả hai mặt lá, kiểm tra xem bệnh xuất hiện ở cây non hay cây già và ghi lại tốc độ lan. Không nên phun thuốc khi chưa xác định được nguyên nhân.';
    }
    if (/(thu|chi|lợi nhuận|tiền|doanh thu)/.test(text)) {
      const finances = own('finances');
      const income = finances.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const expense = finances.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return `Theo các giao dịch đã ghi, doanh thu là ${UI.money(income)}, chi phí là ${UI.money(expense)} và chênh lệch hiện tại là ${UI.money(income - expense)}.`;
    }
    if (/(năng suất|sản lượng|thu hoạch)/.test(text)) {
      const latest = recentFirst(own('yieldPredictions'))[0];
      return latest ? `Lần ước tính gần nhất cho ${latest.crop} là ${Number(latest.predicted).toLocaleString('vi-VN')} kg trên ${latest.area} ha. Đây là số tham khảo; bạn nên cập nhật lại điểm thời tiết và chăm sóc khi điều kiện thay đổi.` : 'Bạn cần diện tích, năng suất chuẩn, tình hình thời tiết và mức chăm sóc để có một ước tính ban đầu.';
    }
    return 'Bạn mô tả cụ thể tên cây, khu vực và điều đang quan sát nhé. Mình có thể hỗ trợ về tưới nước, đất, sâu bệnh, năng suất hoặc thu chi dựa trên dữ liệu đã ghi.';
  }

  function aiAssistant() {
    const messages = [...Store.ownerFilter(Store.get().assistantChats)].sort((a, b) => {
      const byTime = String(a.createdAt).localeCompare(String(b.createdAt));
      if (byTime) return byTime;
      return a.role === 'me' ? -1 : 1;
    });
    const content = messages.map(message => `<div class="msg ${message.role === 'me' ? 'me' : ''}">${UI.esc(message.text)}<br><small>${new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small></div>`).join('');
    return sectionShell('Hỏi đáp canh tác', 'Đặt câu hỏi bằng lời của bạn; câu trả lời sẽ dùng những thông tin đã ghi trong nông trại.', `<div class="chat-box" id="chatBox">${content || '<p class="muted">Bạn có thể hỏi về tưới, đất, sâu bệnh, năng suất hoặc thu chi.</p>'}</div><div class="search-row" style="margin-top:12px"><input id="chatInput" placeholder="Ví dụ: Khu A có cần tưới thêm không?"><button class="primary-btn" id="sendChat" type="button">${UI.icon('send')}Gửi</button><button class="danger-btn" id="clearChat" type="button">${UI.icon('trash-2')}Xóa cuộc trò chuyện</button></div>`);
  }

  function bindAssistant(root) {
    const send = () => {
      const input = UI.$('#chatInput', root);
      const text = input.value.trim();
      if (!text) return UI.toast('Bạn chưa nhập câu hỏi', 'Viết điều bạn đang cần hỗ trợ nhé.', 'danger');
      const askedAt = Date.now();
      Store.upsert('assistantChats', { role: 'me', text, createdAt: new Date(askedAt).toISOString() });
      Store.upsert('assistantChats', { role: 'bot', text: assistantReply(text), createdAt: new Date(askedAt + 1).toISOString() });
      input.value = '';
      App.render();
    };
    UI.$('#sendChat', root)?.addEventListener('click', send);
    UI.$('#chatInput', root)?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); send(); } });
    UI.$('#clearChat', root)?.addEventListener('click', () => UI.confirm('Xóa cuộc trò chuyện của tài khoản này?', () => {
      const current = Store.currentUser();
      const state = Store.get();
      state.assistantChats = state.assistantChats.filter(item => item.ownerId !== current.id && item.createdBy !== current.id);
      Store.set(state);
      UI.toast('Đã xóa cuộc trò chuyện');
      App.render();
    }));
    const box = UI.$('#chatBox', root);
    if (box) box.scrollTop = box.scrollHeight;
  }

  /* 10. Nhật ký canh tác */
  function farmingDiary() {
    const list = recentFirst(Store.ownerFilter(Store.get().diaries), 'date');
    const rows = list.map(item => `<tr><td>${UI.date(item.date)}</td><td><strong>${UI.esc(item.title)}</strong><br><small class="muted">${UI.esc(item.note || 'Không có ghi chú')}</small></td><td><span class="pill">${UI.esc(item.type)}</span></td><td>${UI.esc(item.zone)}</td><td>${actions('diaries', item)}</td></tr>`).join('');
    return sectionShell('Nhật ký canh tác', 'Ghi lại công việc đã làm để dễ đối chiếu khi cây có thay đổi.', list.length ? table(['Ngày', 'Công việc', 'Loại việc', 'Khu vực', 'Thao tác'], rows) : UI.empty('Chưa có mục nhật ký nào'), addButton('addDiary', 'Ghi công việc'));
  }

  function editDiary(id = '') {
    const item = Store.get().diaries.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa công việc' : 'Ghi công việc mới', `<div class="form-grid">
      ${UI.formInput('date', 'Ngày thực hiện', item.date || new Date().toISOString().slice(0, 10), 'date')}
      ${UI.formSelect('type', 'Loại việc', [{ value: 'Gieo trồng', label: 'Gieo trồng' }, { value: 'Bón phân', label: 'Bón phân' }, { value: 'Tưới nước', label: 'Tưới nước' }, { value: 'Phun thuốc', label: 'Phun thuốc' }, { value: 'Thu hoạch', label: 'Thu hoạch' }, { value: 'Khác', label: 'Việc khác' }], item.type || 'Gieo trồng')}
      ${UI.formInput('title', 'Công việc đã làm', item.title || '', 'text', true)}
      ${UI.formInput('zone', 'Khu vực', item.zone || '')}
      ${userSelectField(item.ownerId)}
      ${UI.formText('note', 'Ghi chú thêm', item.note || '')}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['date', 'ngày thực hiện', val(form, 'date')], ['title', 'công việc đã làm', val(form, 'title')], ['zone', 'khu vực', val(form, 'zone')]]);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('diaries', { ...item, date: val(form, 'date'), type: val(form, 'type'), title: val(form, 'title'), zone: val(form, 'zone'), note: val(form, 'note'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu công việc');
    });
  }

  /* 11. Thu chi mùa vụ */
  function finance() {
    const list = recentFirst(Store.ownerFilter(Store.get().finances), 'date');
    const income = list.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expense = list.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const rows = list.map(item => `<tr><td>${UI.date(item.date)}</td><td><span class="pill ${item.type === 'expense' ? 'danger' : ''}">${item.type === 'income' ? 'Doanh thu' : 'Chi phí'}</span></td><td><strong>${UI.money(item.amount)}</strong></td><td>${UI.esc(item.title)}</td><td>${UI.esc(item.season || 'Chưa ghi')}</td><td>${actions('finances', item)}</td></tr>`).join('');
    return `${hero('Thu chi mùa vụ', 'Ghi từng khoản thu và chi để biết số tiền còn lại của mùa vụ.', addButton('addFinance', 'Thêm khoản thu chi'))}
      <div class="grid grid-3">${kpi('circle-dollar-sign', 'Doanh thu', UI.money(income))}${kpi('receipt', 'Chi phí', UI.money(expense))}${kpi('landmark', 'Chênh lệch', UI.money(income - expense), income - expense >= 0 ? 'Đang dương' : 'Đang âm')}</div>
      <div class="card">${list.length ? table(['Ngày', 'Loại', 'Số tiền', 'Nội dung', 'Vụ mùa', 'Thao tác'], rows) : UI.empty('Chưa có khoản thu chi nào')}</div>`;
  }

  function editFinance(id = '') {
    const item = Store.get().finances.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa khoản thu chi' : 'Thêm khoản thu chi', `<div class="form-grid">
      ${UI.formInput('date', 'Ngày ghi nhận', item.date || new Date().toISOString().slice(0, 10), 'date')}
      ${UI.formSelect('type', 'Loại khoản', [{ value: 'expense', label: 'Chi phí' }, { value: 'income', label: 'Doanh thu' }], item.type || 'expense')}
      ${UI.formInput('amount', 'Số tiền (đồng)', item.amount ?? '', 'number', false, 'min="1" step="1000"')}
      ${UI.formInput('season', 'Vụ mùa', item.season || '')}
      ${UI.formInput('title', 'Nội dung khoản thu chi', item.title || '', 'text', true)}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['date', 'ngày ghi nhận', val(form, 'date')], ['amount', 'số tiền', val(form, 'amount')], ['title', 'nội dung', val(form, 'title')]]);
      positiveError(errors, 'amount', 'Số tiền', val(form, 'amount'));
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('finances', { ...item, date: val(form, 'date'), type: val(form, 'type'), amount: num(form, 'amount'), season: val(form, 'season'), title: val(form, 'title'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu khoản thu chi');
    });
  }

  /* 12. Theo dõi sinh trưởng */
  function growthMonitor() {
    const list = recentFirst(Store.ownerFilter(Store.get().growths), 'date');
    const rows = list.map(item => `<tr><td>${item.image ? `<img src="${item.image}" class="preview-img" style="width:72px;height:58px;object-fit:cover;margin:0" alt="Ảnh ${UI.esc(item.plant)}">` : 'Chưa có ảnh'}</td><td><strong>${UI.esc(item.plant)}</strong><br><small class="muted">${UI.date(item.date)}</small></td><td>${Number(item.height || 0).toLocaleString('vi-VN')} cm</td><td>${Number(item.leaves || 0)} lá</td><td>${UI.esc(item.note || 'Không có ghi chú')}</td><td>${actions('growths', item)}</td></tr>`).join('');
    return sectionShell('Theo dõi sinh trưởng', 'Chụp ảnh định kỳ và ghi số đo để so sánh sự thay đổi của cây.', list.length ? table(['Ảnh', 'Cây & ngày đo', 'Chiều cao', 'Số lá', 'Ghi chú', 'Thao tác'], rows) : UI.empty('Chưa có lần đo sinh trưởng nào'), addButton('addGrowth', 'Thêm lần đo'));
  }

  function editGrowth(id = '') {
    const item = Store.get().growths.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa lần đo sinh trưởng' : 'Thêm lần đo sinh trưởng', `<div class="form-grid">
      ${UI.formInput('plant', 'Tên hoặc mã cây', item.plant || '')}
      ${UI.formInput('date', 'Ngày đo', item.date || new Date().toISOString().slice(0, 10), 'date')}
      ${UI.formInput('height', 'Chiều cao (cm)', item.height ?? '', 'number', false, 'min="0" step="0.1"')}
      ${UI.formInput('leaves', 'Số lá', item.leaves ?? '', 'number', false, 'min="0" step="1"')}
      ${UI.formInput('imageFile', id ? 'Thay ảnh (không bắt buộc)' : 'Ảnh cây', '', 'file', true, 'accept="image/*"')}
      ${UI.formText('note', 'Ghi chú thay đổi', item.note || '')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const file = form.get('imageFile');
      const errors = requireFields([['plant', 'tên hoặc mã cây', val(form, 'plant')], ['date', 'ngày đo', val(form, 'date')], ['height', 'chiều cao', val(form, 'height')], ['leaves', 'số lá', val(form, 'leaves')]]);
      if (!id && (!file || !file.size)) errors.imageFile = 'Bạn chọn ảnh cây cho lần đo đầu tiên nhé.';
      if (Number(val(form, 'height')) < 0) errors.height = 'Chiều cao không thể là số âm.';
      if (!Number.isInteger(Number(val(form, 'leaves'))) || Number(val(form, 'leaves')) < 0) errors.leaves = 'Số lá cần là số nguyên từ 0 trở lên.';
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      const persist = image => {
        const saved = saveRecord('growths', { ...item, plant: val(form, 'plant'), date: val(form, 'date'), height: num(form, 'height'), leaves: num(form, 'leaves'), note: val(form, 'note'), image: image || item.image, ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu lần đo sinh trưởng');
        if (saved) UI.$('#modalRoot').innerHTML = '';
      };
      if (file?.size) { UI.imgPreview(file, source => { if (source) persist(source); }); return false; }
      return persist('');
    });
  }

  /* 13. Cảnh báo sâu bệnh cộng đồng */
  function pestAlerts() {
    const list = recentFirst(Store.get().pestAlerts, 'date');
    const rows = list.map(item => `<tr><td><strong>${UI.esc(item.area)}</strong><br><small class="muted">${UI.esc(item.pest)}</small></td><td><span class="pill ${item.level === 'Cao' ? 'danger' : item.level === 'Trung bình' ? 'gold' : ''}">${UI.esc(item.level)}</span></td><td>${UI.esc(item.detail)}</td><td>${UI.date(item.date)}</td><td><small class="muted">${UI.esc(UI.ownerName(item.createdBy))}</small></td><td>${actions('pestAlerts', item)}</td></tr>`).join('');
    return sectionShell('Cảnh báo sâu bệnh', 'Mọi nông hộ đều xem được cảnh báo; mỗi người chỉ sửa hoặc xóa tin mình đã đăng.', list.length ? table(['Khu vực & sâu bệnh', 'Mức độ', 'Chi tiết', 'Ngày phát hiện', 'Người đăng', 'Thao tác'], rows) : UI.empty('Chưa có cảnh báo sâu bệnh nào'), addButton('addPest', 'Đăng cảnh báo'));
  }

  function editPest(id = '') {
    const item = Store.get().pestAlerts.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa cảnh báo sâu bệnh' : 'Đăng cảnh báo sâu bệnh', `<div class="form-grid">
      ${UI.formInput('area', 'Khu vực', item.area || '')}
      ${UI.formInput('pest', 'Loại sâu bệnh', item.pest || '')}
      ${UI.formSelect('level', 'Mức độ', [{ value: 'Thấp', label: 'Thấp' }, { value: 'Trung bình', label: 'Trung bình' }, { value: 'Cao', label: 'Cao' }], item.level || 'Trung bình')}
      ${UI.formInput('date', 'Ngày phát hiện', item.date || new Date().toISOString().slice(0, 10), 'date')}
      ${UI.formText('detail', 'Dấu hiệu và vị trí đã thấy', item.detail || '')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['area', 'khu vực', val(form, 'area')], ['pest', 'loại sâu bệnh', val(form, 'pest')], ['date', 'ngày phát hiện', val(form, 'date')], ['detail', 'dấu hiệu đã thấy', val(form, 'detail')]]);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('pestAlerts', { ...item, area: val(form, 'area'), pest: val(form, 'pest'), level: val(form, 'level'), date: val(form, 'date'), detail: val(form, 'detail'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã đăng cảnh báo sâu bệnh');
    });
  }

  /* 14. Bản đồ nguồn nước */
  function pinPosition(item) {
    const hash = [...String(item.name || item.id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return { left: 10 + hash % 80, top: 15 + Math.floor(hash / 7) % 70 };
  }

  function waterMap() {
    const list = recentFirst(Store.ownerFilter(Store.get().waterPoints));
    const pins = list.map(item => { const position = pinPosition(item); return `<div class="map-pin" style="left:${position.left}%;top:${position.top}%">${UI.icon(item.type === 'Nguồn nước' ? 'droplet' : item.type === 'Hạn hán' ? 'sun' : 'waves')} ${UI.esc(item.name)}</div>`; }).join('');
    const rows = list.map(item => `<tr><td><strong>${UI.esc(item.name)}</strong><br><small class="muted">${UI.esc(item.location || 'Chưa ghi vị trí')}</small></td><td><span class="pill ${item.type !== 'Nguồn nước' ? item.level === 'Cao' ? 'danger' : 'gold' : 'info'}">${UI.esc(item.type)}</span></td><td>${UI.esc(item.level)}</td><td>${UI.esc(item.note || 'Không có ghi chú')}</td><td>${actions('waterPoints', item)}</td></tr>`).join('');
    return sectionShell('Bản đồ nguồn nước', 'Đánh dấu nơi có nước, hạn hán hoặc ngập úng để cả đội dễ theo dõi.', `<div class="water-map-canvas">${pins || '<div class="empty" style="margin:24px">Chưa có điểm nào trên bản đồ</div>'}</div><div style="height:14px"></div>${list.length ? table(['Tên điểm & vị trí', 'Loại', 'Mức độ', 'Ghi chú', 'Thao tác'], rows) : UI.empty('Chưa có điểm nguồn nước nào')}`, addButton('addWater', 'Thêm điểm'));
  }

  function editWater(id = '') {
    const item = Store.get().waterPoints.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa điểm trên bản đồ' : 'Thêm điểm trên bản đồ', `<div class="form-grid">
      ${UI.formInput('name', 'Tên điểm', item.name || '')}
      ${UI.formSelect('type', 'Loại điểm', [{ value: 'Nguồn nước', label: 'Nguồn nước' }, { value: 'Hạn hán', label: 'Hạn hán' }, { value: 'Ngập úng', label: 'Ngập úng' }], item.type || 'Nguồn nước')}
      ${UI.formSelect('level', 'Mức độ', [{ value: 'Thấp', label: 'Thấp' }, { value: 'Trung bình', label: 'Trung bình' }, { value: 'Cao', label: 'Cao' }], item.level || 'Thấp')}
      ${UI.formInput('location', 'Mô tả vị trí', item.location || '')}
      ${UI.formText('note', 'Ghi chú', item.note || '')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['name', 'tên điểm', val(form, 'name')], ['location', 'mô tả vị trí', val(form, 'location')]]);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('waterPoints', { ...item, name: val(form, 'name'), type: val(form, 'type'), level: val(form, 'level'), location: val(form, 'location'), note: val(form, 'note'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu điểm trên bản đồ');
    });
  }

  /* 15. Quản lý nhà kính */
  function greenhouse() {
    const list = recentFirst(Store.ownerFilter(Store.get().greenhouseDevices));
    const rows = list.map(item => `<tr><td><strong>${UI.esc(item.name)}</strong><br><small class="muted">${UI.esc(item.house)}</small></td><td>${UI.esc(item.type)}</td><td><span class="pill ${item.status === 'Bật' ? 'gold' : ''}">${UI.esc(item.status)}</span></td><td>${UI.esc(item.auto)}</td><td><div class="row-actions">${canEdit(item) ? `<button class="soft-btn toggle-btn ${item.status === 'Bật' ? 'active' : ''}" data-greenhouse-toggle="${item.id}" type="button">${UI.icon('power')}${item.status === 'Bật' ? 'Tắt' : 'Bật'}</button>` : ''}${actions('greenhouseDevices', item)}</div></td></tr>`).join('');
    return sectionShell('Quản lý nhà kính', 'Theo dõi và bật tắt quạt, đèn, phun sương hoặc cảm biến trong từng nhà kính.', list.length ? table(['Thiết bị', 'Loại', 'Trạng thái', 'Tự động', 'Thao tác'], rows) : UI.empty('Chưa có thiết bị nhà kính nào'), addButton('addGreenhouse', 'Thêm thiết bị'));
  }

  function editGreenhouse(id = '') {
    const item = Store.get().greenhouseDevices.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa thiết bị nhà kính' : 'Thêm thiết bị nhà kính', `<div class="form-grid">
      ${UI.formInput('name', 'Tên thiết bị', item.name || '')}
      ${UI.formInput('house', 'Tên nhà kính', item.house || '')}
      ${UI.formSelect('type', 'Loại thiết bị', [{ value: 'Quạt', label: 'Quạt' }, { value: 'Đèn', label: 'Đèn' }, { value: 'Phun sương', label: 'Phun sương' }, { value: 'Cảm biến', label: 'Cảm biến' }], item.type || 'Quạt')}
      ${UI.formSelect('status', 'Trạng thái', [{ value: 'Tắt', label: 'Tắt' }, { value: 'Bật', label: 'Bật' }], item.status || 'Tắt')}
      ${UI.formSelect('auto', 'Chế độ tự động', [{ value: 'Có', label: 'Có' }, { value: 'Không', label: 'Không' }], item.auto || 'Không')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['name', 'tên thiết bị', val(form, 'name')], ['house', 'tên nhà kính', val(form, 'house')]]);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('greenhouseDevices', { ...item, name: val(form, 'name'), house: val(form, 'house'), type: val(form, 'type'), status: val(form, 'status'), auto: val(form, 'auto'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu thiết bị nhà kính');
    });
  }

  function bindGreenhouse(root) {
    UI.$$('[data-greenhouse-toggle]', root).forEach(button => {
      button.onclick = () => {
        const item = Store.get().greenhouseDevices.find(record => record.id === button.dataset.greenhouseToggle);
        if (!item) return;
        const status = item.status === 'Bật' ? 'Tắt' : 'Bật';
        saveRecord('greenhouseDevices', { ...item, status }, status === 'Bật' ? 'Đã bật thiết bị' : 'Đã tắt thiết bị');
      };
    });
  }

  /* 16. Khu vực và người phụ trách */
  function zonesPermission() {
    const list = recentFirst(Store.ownerFilter(Store.get().zones));
    const rows = list.map(item => `<tr><td><strong>${UI.esc(item.name)}</strong><br><small class="muted">${UI.esc(item.crop)}</small></td><td>${Number(item.area || 0).toLocaleString('vi-VN')} ha</td><td>${UI.esc(UI.ownerName(item.ownerId))}</td><td><span class="pill ${item.status === 'Thu hoạch' ? 'gold' : ''}">${UI.esc(item.status)}</span></td><td>${actions('zones', item)}</td></tr>`).join('');
    return sectionShell('Khu vực & người phụ trách', 'Chia nông trại thành từng khu và giao người chịu trách nhiệm chăm sóc.', list.length ? table(['Khu vực & cây trồng', 'Diện tích', 'Người phụ trách', 'Trạng thái', 'Thao tác'], rows) : UI.empty('Chưa có khu vực trồng nào'), addButton('addZone', 'Thêm khu vực'));
  }

  function editZone(id = '') {
    const item = Store.get().zones.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa khu vực trồng' : 'Thêm khu vực trồng', `<div class="form-grid">
      ${UI.formInput('name', 'Tên khu vực', item.name || '')}
      ${UI.formInput('crop', 'Cây đang trồng', item.crop || '')}
      ${UI.formInput('area', 'Diện tích (ha)', item.area ?? '', 'number', false, 'min="0.01" step="0.01"')}
      ${UI.formSelect('status', 'Trạng thái', [{ value: 'Chuẩn bị đất', label: 'Chuẩn bị đất' }, { value: 'Đang trồng', label: 'Đang trồng' }, { value: 'Thu hoạch', label: 'Đang thu hoạch' }, { value: 'Tạm nghỉ', label: 'Tạm nghỉ' }], item.status || 'Đang trồng')}
      ${userSelectField(item.ownerId)}
    </div>`, (form, modalRoot) => {
      const errors = requireFields([['name', 'tên khu vực', val(form, 'name')], ['crop', 'cây đang trồng', val(form, 'crop')], ['area', 'diện tích', val(form, 'area')]]);
      positiveError(errors, 'area', 'Diện tích', val(form, 'area'));
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('zones', { ...item, name: val(form, 'name'), crop: val(form, 'crop'), area: num(form, 'area'), status: val(form, 'status'), ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu khu vực trồng');
    });
  }

  /* 17. Biểu đồ và thống kê */
  function visualDashboard() {
    const state = Store.get();
    const selected = ['zones', 'plants', 'irrigations', 'diaries', 'soilTests', 'growths', 'riskAlerts', 'finances'];
    const values = selected.map(collection => ({ collection, count: Store.ownerFilter(state[collection]).length }));
    const max = Math.max(1, ...values.map(item => item.count));
    const bars = values.map(item => `<div class="metric-row"><div class="metric-row-head"><span>${UI.esc(CONFIG.collectionLabels[item.collection])}</span><strong>${item.count}</strong></div><div class="metric-bar"><span style="width:${item.count / max * 100}%"></span></div></div>`).join('');
    const finances = Store.ownerFilter(state.finances);
    const income = finances.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expense = finances.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const total = CONFIG.collections.reduce((sum, collection) => sum + Store.ownerFilter(state[collection]).length, 0);
    return `${hero('Biểu đồ & thống kê', 'So sánh nhanh khối lượng dữ liệu vận hành đã ghi trong nông trại.')}
      <div class="grid grid-3">${kpi('database', 'Tổng bản ghi', total, 'Trong 18 chức năng')}${kpi('trending-up', 'Doanh thu', UI.money(income))}${kpi('trending-down', 'Chi phí', UI.money(expense))}</div>
      <div class="grid grid-2"><div class="card"><h3>Mức độ cập nhật theo nhóm</h3>${bars}</div><div class="card"><h3>Tình hình cần chú ý</h3><div class="metric-row"><div class="metric-row-head"><span>Rủi ro mùa vụ mức cao</span><strong>${Store.ownerFilter(state.riskAlerts).filter(item => item.level === 'Cao').length}</strong></div></div><div class="metric-row"><div class="metric-row-head"><span>Cây đang có dấu hiệu bệnh</span><strong>${Store.ownerFilter(state.plants).filter(item => item.status === 'Bệnh').length}</strong></div></div><div class="metric-row"><div class="metric-row-head"><span>Máy bơm đang bật</span><strong>${Store.ownerFilter(state.irrigations).filter(item => item.pump === 'Bật').length}</strong></div></div><div class="metric-row"><div class="metric-row-head"><span>Thiết bị nhà kính đang bật</span><strong>${Store.ownerFilter(state.greenhouseDevices).filter(item => item.status === 'Bật').length}</strong></div></div></div></div>`;
  }

  /* 18. Góc chia sẻ nhà vườn */
  function farmerSocial() {
    const posts = recentFirst(Store.get().socialPosts);
    const user = Store.currentUser();
    const cards = posts.map(post => {
      const liked = (post.likes || []).includes(user.id);
      const comments = (post.comments || []).map(comment => `<div class="comment"><strong>${UI.esc(UI.ownerName(comment.userId))}</strong>: ${UI.esc(comment.text)}<br><small class="muted">${UI.dateTime(comment.createdAt)}</small></div>`).join('');
      return `<article class="card post"><div class="post-head"><div><strong>${UI.esc(post.title)}</strong><br><small class="muted">${UI.esc(UI.ownerName(post.createdBy))} · ${UI.dateTime(post.createdAt)}</small></div>${canEdit(post) ? `<div class="row-actions"><button class="soft-btn" data-social-edit="${post.id}" type="button">${UI.icon('pencil')}Sửa</button><button class="danger-btn" data-social-del="${post.id}" type="button">${UI.icon('trash-2')}Xóa</button></div>` : ''}</div><p>${UI.esc(post.content)}</p><button class="ghost-btn" data-like="${post.id}" type="button">${UI.icon('heart')}${liked ? 'Bỏ thích' : 'Thích'} (${(post.likes || []).length})</button><div>${comments}</div><div class="search-row" style="margin-top:12px"><input data-comment-input="${post.id}" placeholder="Viết bình luận..."><button class="soft-btn" data-comment="${post.id}" type="button">${UI.icon('message-circle')}Bình luận</button></div></article>`;
    }).join('');
    return `${hero('Góc chia sẻ nhà vườn', 'Đăng kinh nghiệm, trao đổi tình hình và trò chuyện với các nông hộ khác.', addButton('addSocial', 'Đăng bài', 'square-pen'))}<div class="grid">${cards || UI.empty('Chưa có bài chia sẻ nào')}</div>`;
  }

  function editSocial(id = '') {
    const item = Store.get().socialPosts.find(record => record.id === id) || {};
    UI.modal(id ? 'Sửa bài chia sẻ' : 'Đăng bài chia sẻ', `<div class="form-grid">${UI.formInput('title', 'Tiêu đề', item.title || '', 'text', true)}${UI.formText('content', 'Nội dung chia sẻ', item.content || '')}${userSelectField(item.ownerId)}</div>`, (form, modalRoot) => {
      const errors = requireFields([['title', 'tiêu đề', val(form, 'title')], ['content', 'nội dung chia sẻ', val(form, 'content')]]);
      if (Object.keys(errors).length) { showModalErrors(errors, modalRoot); return false; }
      return saveRecord('socialPosts', { ...item, title: val(form, 'title'), content: val(form, 'content'), likes: item.likes || [], comments: item.comments || [], ownerId: val(form, 'ownerId') || item.ownerId }, 'Đã lưu bài chia sẻ');
    });
  }

  function bindSocial(root) {
    UI.$('#addSocial', root)?.addEventListener('click', () => editSocial());
    UI.$$('[data-social-edit]', root).forEach(button => { button.onclick = () => editSocial(button.dataset.socialEdit); });
    UI.$$('[data-social-del]', root).forEach(button => { button.onclick = () => UI.confirm('Xóa bài chia sẻ này?', () => { Store.remove('socialPosts', button.dataset.socialDel); UI.toast('Đã xóa bài chia sẻ'); App.render(); }); });
    UI.$$('[data-like]', root).forEach(button => {
      button.onclick = () => {
        const state = Store.get();
        const user = Store.currentUser();
        const post = state.socialPosts.find(item => item.id === button.dataset.like);
        if (!post) return;
        post.likes = post.likes || [];
        post.likes = post.likes.includes(user.id) ? post.likes.filter(id => id !== user.id) : [...post.likes, user.id];
        Store.set(state);
        App.render();
      };
    });
    const addComment = postId => {
      const input = UI.$(`[data-comment-input="${postId}"]`, root);
      const text = input.value.trim();
      if (!text) return UI.toast('Bạn chưa viết bình luận', '', 'danger');
      const state = Store.get();
      const post = state.socialPosts.find(item => item.id === postId);
      if (!post) return;
      post.comments = post.comments || [];
      post.comments.push({ id: Store.id('comment'), userId: Store.currentUser().id, text, createdAt: Store.nowISO() });
      Store.set(state);
      App.render();
    };
    UI.$$('[data-comment]', root).forEach(button => { button.onclick = () => addComment(button.dataset.comment); });
    UI.$$('[data-comment-input]', root).forEach(input => { input.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); addComment(input.dataset.commentInput); } }; });
  }

  const renderMap = {
    'admin-users': adminUsers,
    'ai-diagnosis': aiDiagnosis,
    'iot-irrigation': iotIrrigation,
    'farm-dashboard': farmDashboard,
    'trace-qr': traceQr,
    'plant-qr': plantQr,
    'yield-ai': yieldAi,
    'risk-ai': riskAi,
    'soil-health': soilHealth,
    'ai-assistant': aiAssistant,
    'farming-diary': farmingDiary,
    finance,
    'growth-monitor': growthMonitor,
    'pest-alerts': pestAlerts,
    'water-map': waterMap,
    greenhouse,
    'zones-permission': zonesPermission,
    'visual-dashboard': visualDashboard,
    'farmer-social': farmerSocial
  };

  const addButtons = {
    addIrrigation: editIrrigation,
    addTrace: editTrace,
    addPlant: editPlant,
    addYield: editYield,
    addRisk: editRisk,
    addSoil: editSoil,
    addDiary: editDiary,
    addFinance: editFinance,
    addGrowth: editGrowth,
    addPest: editPest,
    addWater: editWater,
    addGreenhouse: editGreenhouse,
    addZone: editZone
  };

  const editMap = {
    diagnoses: editDiagnosis,
    irrigations: editIrrigation,
    traceBatches: editTrace,
    plants: editPlant,
    yieldPredictions: editYield,
    riskAlerts: editRisk,
    soilTests: editSoil,
    diaries: editDiary,
    finances: editFinance,
    growths: editGrowth,
    pestAlerts: editPest,
    waterPoints: editWater,
    greenhouseDevices: editGreenhouse,
    zones: editZone
  };

  function bind(id, root) {
    if (id === 'admin-users') bindAdminUsers(root);
    if (id === 'ai-diagnosis') bindAiDiagnosis(root);
    if (id === 'iot-irrigation') bindIrrigation(root);
    if (id === 'trace-qr') bindTraceQr(root);
    if (id === 'plant-qr') bindPlantQr(root);
    if (id === 'ai-assistant') bindAssistant(root);
    if (id === 'greenhouse') bindGreenhouse(root);
    if (id === 'farmer-social') bindSocial(root);
    Object.entries(addButtons).forEach(([buttonId, handler]) => UI.$(`#${buttonId}`, root)?.addEventListener('click', () => handler()));
    Object.keys(editMap).forEach(collection => bindCommon(root, collection, editMap));
    UI.icons(root);
  }

  return {
    render: id => (renderMap[id] || farmDashboard)(),
    bind
  };
})();
