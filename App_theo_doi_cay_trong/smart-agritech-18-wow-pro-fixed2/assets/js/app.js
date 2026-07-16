const App = (() => {
  let activeModule = 'farm-dashboard';

  function init() {
    UI.bindEyes(document);
    initTheme();
    bindAuth();
    bindGlobal();
    window.addEventListener('agri-storage-error', () => {
      UI.toast('Bộ nhớ trình duyệt đã đầy', 'Hãy dùng ảnh dung lượng nhỏ hơn hoặc xóa bớt bản ghi cũ.', 'danger');
    });
    if (Store.currentUser()) showApp();
    else showAuth();
    UI.icons();
  }

  function setThemeIcon(theme) {
    const button = UI.$('#themeBtn');
    if (!button) return;
    button.innerHTML = UI.icon(theme === 'dark' ? 'sun' : 'moon');
    button.title = theme === 'dark' ? 'Dùng giao diện sáng' : 'Dùng giao diện tối';
    UI.icons(button);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121815' : '#f4f7f2');
  }

  function initTheme() {
    const theme = localStorage.getItem(CONFIG.themeKey) || Store.get().settings.theme || 'light';
    document.documentElement.dataset.theme = theme;
    setThemeIcon(theme);
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(CONFIG.themeKey, next);
    const state = Store.get();
    state.settings.theme = next;
    Store.set(state);
    setThemeIcon(next);
  }

  function showAuth() {
    UI.$('#authScreen').classList.remove('hidden');
    UI.$('#appShell').classList.add('hidden');
    closeMenu();
    updateFirstAdminHint();
    UI.icons(UI.$('#authScreen'));
  }

  function showApp() {
    UI.$('#authScreen').classList.add('hidden');
    UI.$('#appShell').classList.remove('hidden');
    renderNav();
    render();
  }

  function updateFirstAdminHint() {
    const hint = UI.$('#firstAdminHint');
    if (!hint) return;
    hint.textContent = Store.get().users.length === 0
      ? 'Tài khoản đầu tiên sẽ quản lý toàn bộ dữ liệu.'
      : 'Tài khoản mới sẽ được tạo với quyền nông hộ.';
  }

  function switchAuth(tab) {
    const loggingIn = tab === 'login';
    UI.$('#loginTab').classList.toggle('active', loggingIn);
    UI.$('#registerTab').classList.toggle('active', !loggingIn);
    UI.$('#loginTab').setAttribute('aria-selected', String(loggingIn));
    UI.$('#registerTab').setAttribute('aria-selected', String(!loggingIn));
    UI.$('#loginForm').classList.toggle('active', loggingIn);
    UI.$('#registerForm').classList.toggle('active', !loggingIn);
    UI.$('#authHeading').textContent = loggingIn ? 'Đăng nhập để bắt đầu' : 'Tạo tài khoản mới';
    UI.clearErrors(UI.$('#authScreen'));
    updateFirstAdminHint();
    window.setTimeout(() => UI.$(loggingIn ? '#loginIdentity' : '#regUsername')?.focus(), 0);
  }

  function bindAuth() {
    UI.$('#loginTab').onclick = () => switchAuth('login');
    UI.$('#registerTab').onclick = () => switchAuth('register');
    UI.$('#regPassword').addEventListener('input', event => {
      UI.$('#strengthBar').style.width = `${UI.passwordScore(event.target.value) * 20}%`;
    });

    UI.$('#registerForm').onsubmit = event => {
      event.preventDefault();
      UI.clearErrors(event.currentTarget);
      const form = new FormData(event.currentTarget);
      const result = Auth.register({
        username: form.get('regUsername'),
        email: form.get('regEmail'),
        password: form.get('regPassword'),
        confirm: form.get('regConfirm')
      });
      if (!result.ok) {
        Object.entries(result.errors).forEach(([field, message]) => UI.setFieldError(field, message, event.currentTarget));
        return;
      }
      UI.toast('Tài khoản đã sẵn sàng', 'Bạn đăng nhập để vào trang quản lý nhé.');
      const identity = String(form.get('regUsername') || form.get('regEmail') || '').trim();
      event.currentTarget.reset();
      UI.$('#strengthBar').style.width = '0%';
      switchAuth('login');
      UI.$('#loginIdentity').value = identity;
      UI.$('#loginPassword').focus();
    };

    UI.$('#loginForm').onsubmit = event => {
      event.preventDefault();
      UI.clearErrors(event.currentTarget);
      const form = new FormData(event.currentTarget);
      const result = Auth.login(form.get('loginIdentity'), form.get('loginPassword'));
      if (!result.ok) {
        Object.entries(result.errors).forEach(([field, message]) => UI.setFieldError(field, message, event.currentTarget));
        return;
      }
      UI.toast(`Chào ${result.user.username}`, 'Bạn đã đăng nhập thành công.');
      event.currentTarget.reset();
      activeModule = 'farm-dashboard';
      showApp();
    };

    UI.$('#wipeAuthBtn').onclick = () => UI.confirm(
      'Xóa toàn bộ tài khoản và dữ liệu đã lưu trên trình duyệt này?',
      () => {
        Store.reset();
        UI.$('#loginForm').reset();
        UI.$('#registerForm').reset();
        UI.toast('Đã dọn dữ liệu cũ');
        switchAuth('register');
      }
    );
  }

  function openMenu() {
    UI.$('#sidebar').classList.add('open');
    UI.$('#sideOverlay').classList.add('open');
  }

  function closeMenu() {
    UI.$('#sidebar')?.classList.remove('open');
    UI.$('#sideOverlay')?.classList.remove('open');
  }

  function bindGlobal() {
    UI.$('#logoutBtn').onclick = () => {
      Auth.logout();
      UI.toast('Đã đăng xuất', 'Hẹn gặp lại bạn.');
      activeModule = 'farm-dashboard';
      showAuth();
    };
    UI.$('#themeBtn').onclick = toggleTheme;
    UI.$('#menuBtn').onclick = openMenu;
    UI.$('#closeMenuBtn').onclick = closeMenu;
    UI.$('#sideOverlay').onclick = closeMenu;
    UI.$('#cmdBtn').onclick = openCmd;
    UI.$('#closeCmd').onclick = closeCmd;
    UI.$('#cmdPalette').addEventListener('click', event => { if (event.target.id === 'cmdPalette') closeCmd(); });
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openCmd();
      }
      if (event.key === 'Escape') closeCmd();
    });
    UI.$('#cmdSearch').addEventListener('input', renderCmdList);
  }

  function visibleModules() {
    const user = Store.currentUser();
    return CONFIG.modules.filter(module => !module.adminOnly || user?.role === 'admin');
  }

  function navigate(moduleId) {
    const module = visibleModules().find(item => item.id === moduleId);
    if (!module) return;
    activeModule = module.id;
    closeMenu();
    closeCmd();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderNav() {
    const nav = UI.$('#sideNav');
    const user = Store.currentUser();
    if (!user) return;
    let currentGroup = '';
    nav.innerHTML = visibleModules().map(module => {
      let heading = '';
      if (module.group !== currentGroup) {
        currentGroup = module.group;
        heading = `<div class="nav-group-title">${UI.esc(module.group)}</div>`;
      }
      return `${heading}<button class="nav-item ${activeModule === module.id ? 'active' : ''}" data-module="${module.id}" type="button"><span class="ico">${UI.icon(module.icon)}</span><span>${UI.esc(module.title)}</span></button>`;
    }).join('');
    UI.$('#sideUsername').textContent = user.username;
    UI.$('#sideRole').textContent = CONFIG.roleLabels[user.role];
    UI.$('#userAvatar').textContent = (user.username || 'A').trim()[0].toUpperCase();
    UI.$$('[data-module]', nav).forEach(button => { button.onclick = () => navigate(button.dataset.module); });
    renderCmdList();
    UI.icons(nav);
  }

  function render() {
    const user = Store.currentUser();
    if (!user) { showAuth(); return; }
    const module = CONFIG.modules.find(item => item.id === activeModule) || CONFIG.modules.find(item => item.id === 'farm-dashboard');
    if (module.adminOnly && user.role !== 'admin') {
      activeModule = 'farm-dashboard';
      render();
      return;
    }

    UI.$('#pageTitle').textContent = module.title;
    UI.$('#topCrumb').textContent = module.desc;
    UI.$('#permissionBanner').innerHTML = user.role === 'admin'
      ? `${UI.icon('shield-check')}<span>Bạn đang dùng quyền <strong>quản lý</strong> và có thể xem dữ liệu của mọi tài khoản.</span>`
      : `${UI.icon('user-round')}<span>Bạn chỉ thấy và chỉnh sửa thông tin thuộc tài khoản của mình.</span>`;

    const root = UI.$('#viewRoot');
    try {
      root.innerHTML = Modules.render(activeModule);
      UI.icons(root);
      UI.renderQRCodes(root);
      Modules.bind(activeModule, root);
    } catch (error) {
      console.error(error);
      root.innerHTML = `<div class="card"><h2>Mục này chưa mở được</h2><p class="muted">Dữ liệu của bạn vẫn được giữ nguyên. Hãy tải lại trang và thử lần nữa.</p><button class="secondary-btn" id="retryView" type="button">${UI.icon('refresh-cw')}Thử lại</button></div>`;
      UI.$('#retryView', root).onclick = render;
      UI.icons(root);
    }
    renderNav();
    UI.icons(UI.$('#appShell'));
  }

  function openCmd() {
    UI.$('#cmdPalette').classList.remove('hidden');
    UI.$('#cmdSearch').value = '';
    renderCmdList();
    window.setTimeout(() => UI.$('#cmdSearch').focus(), 0);
  }

  function closeCmd() {
    UI.$('#cmdPalette')?.classList.add('hidden');
  }

  function renderCmdList() {
    const search = (UI.$('#cmdSearch')?.value || '').trim().toLocaleLowerCase('vi');
    UI.$('#cmdTitle').textContent = Store.currentUser()?.role === 'admin' ? '18 chức năng & quản trị' : '18 chức năng';
    const modules = visibleModules().filter(module => `${module.title} ${module.desc}`.toLocaleLowerCase('vi').includes(search));
    UI.$('#cmdList').innerHTML = modules.length
      ? modules.map(module => `<button class="cmd-item" data-cmd-module="${module.id}" type="button">${UI.icon(module.icon)}<span><strong>${UI.esc(module.title)}</strong><small>${UI.esc(module.desc)}</small></span></button>`).join('')
      : `<div class="empty"><h3>Không thấy công việc phù hợp</h3><p class="muted">Bạn thử một từ ngắn hơn nhé.</p></div>`;
    UI.$$('[data-cmd-module]', UI.$('#cmdList')).forEach(button => { button.onclick = () => navigate(button.dataset.cmdModule); });
    UI.icons(UI.$('#cmdList'));
  }

  return { init, render, navigate };
})();

document.addEventListener('DOMContentLoaded', App.init);
