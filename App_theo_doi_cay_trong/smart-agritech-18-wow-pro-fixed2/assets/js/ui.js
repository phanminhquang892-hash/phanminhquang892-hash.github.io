const UI = (() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const esc = (v='') => String(v ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const money = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const date = v => v ? new Date(v).toLocaleDateString('vi-VN') : '—';
  const toast = (title, msg='', type='success') => {
    const wrap = $('#toastWrap'); const el = document.createElement('div'); el.className = `toast ${type}`; el.innerHTML = `<strong>${esc(title)}</strong>${msg?`<div class="muted">${esc(msg)}</div>`:''}`; wrap.appendChild(el); setTimeout(()=>el.remove(), 3300);
  };
  const eyeIcon = (off=false) => off ? `<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c5 0 9 4.4 10 7- .4 1.1-1.3 2.5-2.6 3.7"/><path d="M6.5 6.8C4.3 8.2 2.8 10.4 2 12c1 2.6 5 7 10 7 1.7 0 3.2-.5 4.5-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>` : `<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const bindEyes = (root=document) => $$('[data-toggle-password]', root).forEach(btn => { btn.innerHTML = eyeIcon(false); btn.onclick = () => { const input = document.getElementById(btn.dataset.togglePassword); if(!input) return; const show = input.type === 'password'; input.type = show ? 'text' : 'password'; btn.innerHTML = eyeIcon(show); }; });
  const setFieldError = (field, message='') => { const box = document.querySelector(`[data-field="${field}"]`); if(!box) return; box.classList.toggle('invalid', !!message); const err = $('.error', box); if(err) err.textContent = message; };
  const clearErrors = (root=document) => $$('.field', root).forEach(f => { f.classList.remove('invalid'); const e = $('.error', f); if(e) e.textContent=''; });
  const required = (val) => String(val ?? '').trim().length > 0;
  const emailOk = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val||'').trim());
  const passwordScore = (pw) => { let s=0; if((pw||'').length>=8)s++; if(/[A-Z]/.test(pw))s++; if(/[a-z]/.test(pw))s++; if(/\d/.test(pw))s++; if(/[^A-Za-z0-9]/.test(pw))s++; return s; };
  const strongPassword = pw => passwordScore(pw) >= 4;
  const modal = (title, body, onSubmit) => {
    const root = $('#modalRoot'); root.innerHTML = `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close-modal type="button">×</button></div><form id="modalForm" novalidate>${body}<div class="toolbar"><button class="ghost-btn" data-close-modal type="button">Hủy</button><button class="primary-btn" type="submit">Lưu</button></div></form></div></div>`;
    bindEyes(root); $$('[data-close-modal]', root).forEach(b => b.onclick = () => root.innerHTML='');
    $('#modalForm').onsubmit = (e) => { e.preventDefault(); clearErrors(root); if(onSubmit(new FormData(e.currentTarget)) !== false){ root.innerHTML=''; } };
  };
  const confirm = (message, action) => { modal('Xác nhận', `<p class="muted">${esc(message)}</p>`, () => { action(); return true; }); };
  const optionsUsers = (selected='') => Store.get().users.map(u => `<option value="${u.id}" ${selected===u.id?'selected':''}>${esc(u.username)} - ${CONFIG.roleLabels[u.role]}</option>`).join('');
  const ownerName = (id) => Store.get().users.find(u => u.id === id)?.username || '—';
  const imgPreview = (file, cb) => { if(!file){ cb(''); return; } const reader = new FileReader(); reader.onload = () => cb(reader.result); reader.readAsDataURL(file); };
  const formInput = (name,label,value='',type='text',span=false,extra='') => `<div class="field ${span?'span-2':''}" data-field="${name}"><label>${esc(label)}</label><input name="${esc(name)}" type="${type}" value="${esc(value)}" placeholder="${esc(label)}" ${extra}/><small class="error"></small></div>`;
  const formSelect = (name,label,options,value='',span=false) => `<div class="field ${span?'span-2':''}" data-field="${name}"><label>${esc(label)}</label><select name="${esc(name)}">${options.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`).join('')}</select><small class="error"></small></div>`;
  const formText = (name,label,value='',span=true) => `<div class="field ${span?'span-2':''}" data-field="${name}"><label>${esc(label)}</label><textarea name="${esc(name)}" placeholder="${esc(label)}">${esc(value)}</textarea><small class="error"></small></div>`;
  const empty = (text='Chưa có dữ liệu. Hãy thêm dữ liệu mới để bắt đầu.') => `<div class="empty"><h3>🌱 ${esc(text)}</h3><p class="muted">Hệ thống không có dữ liệu mẫu sẵn theo yêu cầu của bạn.</p></div>`;
  return { $, $$, esc, money, date, toast, eyeIcon, bindEyes, setFieldError, clearErrors, required, emailOk, strongPassword, passwordScore, modal, confirm, optionsUsers, ownerName, imgPreview, formInput, formSelect, formText, empty };
})();
