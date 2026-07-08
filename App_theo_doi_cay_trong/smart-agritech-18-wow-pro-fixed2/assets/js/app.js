const App = (() => {
  let activeModule = 'farm-dashboard';
  function init(){
    createSnow();
    UI.bindEyes(document);
    initTheme();
    bindAuth();
    bindGlobal();
    const user = Store.currentUser();
    if(user) showApp(); else showAuth();
  }
  function initTheme(){ const theme = localStorage.getItem(CONFIG.themeKey) || Store.get().settings.theme || 'light'; document.documentElement.dataset.theme = theme; UI.$('#themeBtn').textContent = theme === 'dark' ? '☀️' : '🌙'; }
  function toggleTheme(){ const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; localStorage.setItem(CONFIG.themeKey,next); const s=Store.get(); s.settings.theme=next; Store.set(s); UI.$('#themeBtn').textContent = next === 'dark' ? '☀️' : '🌙'; }
  function showAuth(){ UI.$('#authScreen').classList.remove('hidden'); UI.$('#appShell').classList.add('hidden'); updateFirstAdminHint(); }
  function showApp(){ UI.$('#authScreen').classList.add('hidden'); UI.$('#appShell').classList.remove('hidden'); renderNav(); render(); }
  function updateFirstAdminHint(){ const hint=UI.$('#firstAdminHint'); if(hint) hint.textContent = Store.get().users.length === 0 ? 'Tài khoản đầu tiên sẽ là Admin.' : 'Tài khoản mới sẽ là Nông dân/User.'; }
  function switchAuth(tab){ UI.$('#loginTab').classList.toggle('active',tab==='login'); UI.$('#registerTab').classList.toggle('active',tab==='register'); UI.$('#loginForm').classList.toggle('active',tab==='login'); UI.$('#registerForm').classList.toggle('active',tab==='register'); UI.clearErrors(UI.$('#authScreen')); updateFirstAdminHint(); }
  function bindAuth(){
    UI.$('#loginTab').onclick=()=>switchAuth('login'); UI.$('#registerTab').onclick=()=>switchAuth('register');
    UI.$('#regPassword').addEventListener('input', e => { const score = UI.passwordScore(e.target.value); UI.$('#strengthBar').style.width = `${score*20}%`; });
    UI.$('#registerForm').onsubmit = e => { e.preventDefault(); UI.clearErrors(e.currentTarget); const fd=new FormData(e.currentTarget); const res=Auth.register({ username:fd.get('regUsername'), email:fd.get('regEmail'), password:fd.get('regPassword'), confirm:fd.get('regConfirm') }); if(!res.ok){ Object.entries(res.errors).forEach(([k,v])=>UI.setFieldError(k,v)); return; } UI.toast('Đăng ký thành công','Vui lòng đăng nhập để vào hệ thống'); const identity = String(fd.get('regUsername') || fd.get('regEmail') || '').trim(); e.currentTarget.reset(); UI.$('#strengthBar').style.width = '0%'; switchAuth('login'); UI.$('#loginIdentity').value = identity; UI.$('#loginPassword').focus(); };
    UI.$('#loginForm').onsubmit = e => { e.preventDefault(); UI.clearErrors(e.currentTarget); const fd=new FormData(e.currentTarget); const res=Auth.login(fd.get('loginIdentity'), fd.get('loginPassword')); if(!res.ok){ Object.entries(res.errors).forEach(([k,v])=>UI.setFieldError(k,v)); return; } UI.toast('Đăng nhập thành công'); activeModule = res.user.role === 'admin' ? 'admin-users' : 'farm-dashboard'; showApp(); };
    UI.$('#wipeAuthBtn').onclick=()=>UI.confirm('Xóa toàn bộ dữ liệu cũ trong trình duyệt? Thao tác này giúp xử lý lỗi do bản cũ để lại.',()=>{Store.reset(); UI.toast('Đã xóa dữ liệu cũ'); switchAuth('register'); updateFirstAdminHint();});
  }
  function bindGlobal(){
    UI.$('#logoutBtn').onclick=()=>{Auth.logout(); UI.toast('Đã đăng xuất'); showAuth();};
    UI.$('#themeBtn').onclick=toggleTheme; UI.$('#menuBtn').onclick=()=>UI.$('#sidebar').classList.toggle('open');
    UI.$('#cmdBtn').onclick=openCmd; UI.$('#closeCmd').onclick=closeCmd; UI.$('#cmdPalette').addEventListener('click',e=>{ if(e.target.id==='cmdPalette') closeCmd(); });
    document.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openCmd(); } if(e.key==='Escape') closeCmd(); });
    UI.$('#cmdSearch').addEventListener('input',renderCmdList);
  }
  function visibleModules(){ const user=Store.currentUser(); return CONFIG.modules.filter(m => !m.adminOnly || user?.role === 'admin'); }
  function renderNav(){
    const nav=UI.$('#sideNav'), user=Store.currentUser(); if(!user) return;
    let currentGroup=''; nav.innerHTML = visibleModules().map(m => { let head=''; if(m.group!==currentGroup){ currentGroup=m.group; head=`<div class="nav-group-title">${m.group}</div>`; } return `${head}<button class="nav-item ${activeModule===m.id?'active':''}" data-module="${m.id}"><span class="ico">${m.icon}</span><span>${m.title}</span></button>`; }).join('');
    UI.$('#sideUsername').textContent=user.username; UI.$('#sideRole').textContent=CONFIG.roleLabels[user.role]; UI.$('#userAvatar').textContent=(user.username||'A').trim()[0].toUpperCase();
    UI.$$('[data-module]',nav).forEach(btn=>btn.onclick=()=>{ activeModule=btn.dataset.module; UI.$('#sidebar').classList.remove('open'); render(); });
    renderCmdList();
  }
  function render(){
    const user=Store.currentUser(); if(!user){ showAuth(); return; }
    const mod = CONFIG.modules.find(m=>m.id===activeModule) || CONFIG.modules.find(m=>m.id==='farm-dashboard');
    if(mod.adminOnly && user.role !== 'admin'){ activeModule='farm-dashboard'; return render(); }
    UI.$('#pageTitle').textContent=mod.title; UI.$('#topCrumb').textContent=mod.desc;
    UI.$('#permissionBanner').innerHTML = user.role === 'admin' ? '🛡️ Bạn đang ở quyền <strong>Admin</strong>: xem và quản lý toàn bộ dữ liệu, tài khoản người dùng.' : '🧑‍🌾 Bạn đang ở quyền <strong>Nông dân/User</strong>: chỉ thêm/sửa/xóa dữ liệu thuộc tài khoản của mình.';
    try { UI.$('#viewRoot').innerHTML = Modules.render(activeModule); Modules.bind(activeModule, UI.$('#viewRoot')); } catch(err){ console.error(err); UI.$('#viewRoot').innerHTML = `<div class="card"><h2>Module gặp lỗi</h2><p class="muted">${UI.esc(err.message)}</p></div>`; }
    renderNav();
  }
  function openCmd(){ UI.$('#cmdPalette').classList.remove('hidden'); UI.$('#cmdSearch').focus(); renderCmdList(); }
  function closeCmd(){ UI.$('#cmdPalette').classList.add('hidden'); }
  function renderCmdList(){ const q=(UI.$('#cmdSearch')?.value||'').toLowerCase(); const list=visibleModules().filter(m=>m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)); UI.$('#cmdList').innerHTML=list.map(m=>`<button class="cmd-item" data-cmd-module="${m.id}">${m.icon} ${m.title}<br><small class="muted">${m.desc}</small></button>`).join('') || '<p class="muted">Không tìm thấy chức năng.</p>'; UI.$$('[data-cmd-module]').forEach(b=>b.onclick=()=>{activeModule=b.dataset.cmdModule; closeCmd(); render();}); }
  function createSnow(){ const layer=UI.$('#snowLayer'); if(!layer) return; layer.innerHTML=''; for(let i=0;i<50;i++){ const s=document.createElement('span'); s.className='snow'; s.style.left=`${Math.random()*100}%`; s.style.top=`${-Math.random()*100}%`; s.style.animationDuration=`${7+Math.random()*9}s`; s.style.animationDelay=`${Math.random()*5}s`; s.style.opacity=.35+Math.random()*.55; s.style.width=s.style.height=`${2+Math.random()*4}px`; layer.appendChild(s); } }
  return { init, render };
})();
document.addEventListener('DOMContentLoaded', App.init);
