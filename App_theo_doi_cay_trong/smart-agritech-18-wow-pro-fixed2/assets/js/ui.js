const UI = (() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
  const icon = name => `<i data-lucide="${esc(name)}" aria-hidden="true"></i>`;

  function icons(root = document) {
    if (!window.lucide) return;
    window.lucide.createIcons({ attrs: { 'stroke-width': 2 } });
  }

  const money = value => new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0
  }).format(Number(value || 0));

  const date = value => {
    if (!value) return 'Chưa ghi';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Chưa ghi' : parsed.toLocaleDateString('vi-VN');
  };

  const dateTime = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Chưa ghi' : parsed.toLocaleString('vi-VN');
  };

  function toast(title, message = '', type = 'success') {
    const wrap = $('#toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    el.innerHTML = `<strong>${esc(title)}</strong>${message ? `<div class="muted">${esc(message)}</div>` : ''}`;
    wrap.appendChild(el);
    window.setTimeout(() => el.remove(), 3600);
  }

  const eyeIcon = showing => icon(showing ? 'eye-off' : 'eye');

  function bindEyes(root = document) {
    $$('[data-toggle-password]', root).forEach(button => {
      button.innerHTML = eyeIcon(false);
      button.onclick = () => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (!input) return;
        const showing = input.type === 'password';
        input.type = showing ? 'text' : 'password';
        button.innerHTML = eyeIcon(showing);
        button.setAttribute('aria-label', showing ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        button.title = showing ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
        icons(button);
      };
    });
    icons(root);
  }

  function setFieldError(field, message = '', root = document) {
    const box = root.querySelector(`[data-field="${field}"]`) || document.querySelector(`[data-field="${field}"]`);
    if (!box) return;
    box.classList.toggle('invalid', Boolean(message));
    const error = $('.error', box);
    if (error) error.textContent = message;
  }

  function clearErrors(root = document) {
    $$('.field', root).forEach(field => {
      field.classList.remove('invalid');
      const error = $('.error', field);
      if (error) error.textContent = '';
    });
  }

  const required = value => String(value ?? '').trim().length > 0;
  const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  const passwordScore = password => {
    let score = 0;
    if ((password || '').length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };
  const strongPassword = password => passwordScore(password) >= 4;
  const numberBetween = (value, min, max) => Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;

  function closeModal() {
    const root = $('#modalRoot');
    if (root) root.innerHTML = '';
  }

  function modal(title, body, onSubmit, options = {}) {
    const root = $('#modalRoot');
    const submitLabel = options.submitLabel || 'Lưu thay đổi';
    const submitClass = options.submitClass || 'primary-btn';
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <div class="modal-head">
            <h2 id="modalTitle">${esc(title)}</h2>
            <button class="icon-btn" data-close-modal type="button" aria-label="Đóng" title="Đóng">${icon('x')}</button>
          </div>
          <form id="modalForm" novalidate>
            ${body}
            <div class="toolbar">
              <button class="secondary-btn" data-close-modal type="button">Bỏ qua</button>
              <button class="${submitClass}" type="submit">${esc(submitLabel)}</button>
            </div>
          </form>
        </div>
      </div>`;
    bindEyes(root);
    $$('[data-close-modal]', root).forEach(button => { button.onclick = closeModal; });
    $('[data-modal-backdrop]', root).onclick = event => { if (event.target === event.currentTarget) closeModal(); };
    $('#modalForm', root).onsubmit = event => {
      event.preventDefault();
      clearErrors(root);
      if (onSubmit(new FormData(event.currentTarget), root) !== false) closeModal();
    };
    const firstInput = $('input:not([type="hidden"]), select, textarea', root);
    window.setTimeout(() => firstInput?.focus(), 0);
  }

  function dialog(title, body) {
    const root = $('#modalRoot');
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <div class="modal-head">
            <h2 id="modalTitle">${esc(title)}</h2>
            <button class="icon-btn" data-close-modal type="button" aria-label="Đóng" title="Đóng">${icon('x')}</button>
          </div>
          <div class="dialog-body">${body}</div>
          <div class="toolbar dialog-actions"><button class="secondary-btn" data-close-modal type="button">Đóng</button></div>
        </div>
      </div>`;
    $$('[data-close-modal]', root).forEach(button => { button.onclick = closeModal; });
    $('[data-modal-backdrop]', root).onclick = event => { if (event.target === event.currentTarget) closeModal(); };
    icons(root);
  }

  function confirm(message, action) {
    modal('Xác nhận thao tác', `<p>${esc(message)}</p><p class="muted">Thao tác này không thể hoàn tác.</p>`, () => {
      action();
      return true;
    }, { submitLabel: 'Xác nhận', submitClass: 'danger-btn' });
  }

  const optionsUsers = (selected = '') => Store.get().users
    .map(user => `<option value="${esc(user.id)}" ${selected === user.id ? 'selected' : ''}>${esc(user.username)} - ${esc(CONFIG.roleLabels[user.role])}</option>`)
    .join('');

  const ownerName = id => Store.get().users.find(user => user.id === id)?.username || 'Tài khoản đã xóa';

  function imgPreview(file, callback) {
    if (!file || !file.size) { callback(''); return; }
    if (!file.type.startsWith('image/')) {
      toast('Không đọc được ảnh', 'Hãy chọn tệp JPG, PNG hoặc WebP.', 'danger');
      callback('');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast('Ảnh quá lớn', 'Hãy chọn ảnh nhỏ hơn 12 MB.', 'danger');
      callback('');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => { toast('Không đọc được ảnh', 'Bạn thử chọn lại ảnh khác nhé.', 'danger'); callback(''); };
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => { toast('Ảnh không hợp lệ', 'Bạn thử chọn lại ảnh khác nhé.', 'danger'); callback(''); };
      image.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', .82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  const formInput = (name, label, value = '', type = 'text', span = false, extra = '') => `
    <div class="field ${span ? 'span-2' : ''}" data-field="${esc(name)}">
      <label for="field-${esc(name)}">${esc(label)}</label>
      <input id="field-${esc(name)}" name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" placeholder="${esc(label)}" ${extra} />
      <small class="error"></small>
    </div>`;

  const formSelect = (name, label, options, value = '', span = false) => `
    <div class="field ${span ? 'span-2' : ''}" data-field="${esc(name)}">
      <label for="field-${esc(name)}">${esc(label)}</label>
      <select id="field-${esc(name)}" name="${esc(name)}">
        ${options.map(option => `<option value="${esc(option.value)}" ${String(option.value) === String(value) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}
      </select>
      <small class="error"></small>
    </div>`;

  const formText = (name, label, value = '', span = true) => `
    <div class="field ${span ? 'span-2' : ''}" data-field="${esc(name)}">
      <label for="field-${esc(name)}">${esc(label)}</label>
      <textarea id="field-${esc(name)}" name="${esc(name)}" placeholder="${esc(label)}">${esc(value)}</textarea>
      <small class="error"></small>
    </div>`;

  const empty = (text = 'Chưa có thông tin ở mục này.') => `
    <div class="empty">
      ${icon('sprout')}
      <h3>${esc(text)}</h3>
      <p class="muted">Thêm bản ghi đầu tiên khi bạn sẵn sàng.</p>
    </div>`;

  function qrBox(payload, small = true, label = 'Mở mã QR') {
    return `<button class="qr-box ${small ? 'small' : ''}" type="button" data-qr-value="${encodeURIComponent(payload)}" aria-label="${esc(label)}" title="${esc(label)}"></button>`;
  }

  function renderQRCodes(root = document) {
    if (!window.QRCode) return;
    $$('[data-qr-value]', root).forEach(box => {
      const payload = decodeURIComponent(box.dataset.qrValue || '');
      const size = box.classList.contains('small') ? 50 : 152;
      box.innerHTML = '';
      try {
        new window.QRCode(box, {
          text: payload,
          width: size,
          height: size,
          colorDark: '#14261b',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
      } catch (error) {
        console.error('Không thể tạo mã QR', error);
        box.innerHTML = icon('qr-code');
        box.title = 'Mã QR này có quá nhiều thông tin';
        icons(box);
      }
    });
  }

  function downloadQr(box, fileName = 'ma-qr.png') {
    const image = $('img', box);
    const canvas = $('canvas', box);
    const href = image?.src || canvas?.toDataURL('image/png');
    if (!href) return toast('Chưa tạo được mã QR', 'Bạn thử mở lại mục này nhé.', 'danger');
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    link.click();
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('#modalRoot')?.children.length) closeModal();
  });

  return {
    $, $$, esc, icon, icons, money, date, dateTime, toast, eyeIcon, bindEyes,
    setFieldError, clearErrors, required, emailOk, strongPassword, passwordScore,
    numberBetween, modal, dialog, confirm, optionsUsers, ownerName, imgPreview,
    formInput, formSelect, formText, empty, qrBox, renderQRCodes, downloadQr
  };
})();
