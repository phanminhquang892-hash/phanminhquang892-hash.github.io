const Auth = (() => {
  const normalize = value => String(value || '').trim().toLowerCase();

  function hash(password, salt) {
    const input = `${salt}::${password}`;
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let index = 0; index < input.length; index += 1) {
      const char = input.charCodeAt(index);
      h1 = Math.imul(h1 ^ char, 2654435761);
      h2 = Math.imul(h2 ^ char, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  function makeUser({ username, email, password, role = 'user', locked = false }) {
    const salt = Store.id('salt');
    return {
      id: Store.id('user'),
      username: String(username).trim(),
      email: normalize(email),
      role: role === 'admin' ? 'admin' : 'user',
      locked: Boolean(locked),
      salt,
      passHash: hash(password, salt),
      createdAt: Store.nowISO()
    };
  }

  function accountErrors(payload, currentId = '') {
    const state = Store.get();
    const username = String(payload.username || '').trim();
    const email = normalize(payload.email);
    const errors = {};
    if (!username) errors.username = 'Bạn chưa nhập tên tài khoản.';
    else if (username.length < 2) errors.username = 'Tên tài khoản cần ít nhất 2 ký tự.';
    if (!email) errors.email = 'Bạn chưa nhập email.';
    else if (!UI.emailOk(email)) errors.email = 'Email này chưa đúng định dạng.';
    if (state.users.some(user => user.id !== currentId && normalize(user.username) === normalize(username))) errors.username = 'Tên tài khoản này đã được dùng.';
    if (state.users.some(user => user.id !== currentId && normalize(user.email) === email)) errors.email = 'Email này đã được dùng.';
    return errors;
  }

  function register(data) {
    const state = Store.get();
    const username = String(data.username || '').trim();
    const email = normalize(data.email);
    const password = data.password || '';
    const confirm = data.confirm || '';
    const baseErrors = accountErrors({ username, email });
    const errors = {
      ...(baseErrors.username ? { regUsername: baseErrors.username } : {}),
      ...(baseErrors.email ? { regEmail: baseErrors.email } : {})
    };

    if (!password) errors.regPassword = 'Bạn chưa nhập mật khẩu.';
    else if (!UI.strongPassword(password)) errors.regPassword = 'Mật khẩu cần từ 8 ký tự và có đủ chữ hoa, chữ thường, số hoặc ký tự đặc biệt.';
    if (!confirm) errors.regConfirm = 'Bạn nhập lại mật khẩu để kiểm tra nhé.';
    else if (password !== confirm) errors.regConfirm = 'Hai mật khẩu chưa giống nhau.';
    if (Object.keys(errors).length) return { ok: false, errors };

    const role = state.users.length === 0 ? 'admin' : 'user';
    const user = makeUser({ username, email, password, role });
    state.users.push(user);
    state.sessionUserId = null;
    Store.set(state);
    Store.log('Tạo tài khoản', `${username} đã tạo tài khoản ${CONFIG.roleLabels[role].toLowerCase()}.`);
    return { ok: true, user };
  }

  function login(identity, password) {
    const state = Store.get();
    const key = normalize(identity);
    const user = state.users.find(item => normalize(item.username) === key || normalize(item.email) === key);
    const errors = {};
    if (!key) errors.loginIdentity = 'Bạn nhập tên tài khoản hoặc email nhé.';
    if (!password) errors.loginPassword = 'Bạn chưa nhập mật khẩu.';
    if (Object.keys(errors).length) return { ok: false, errors };
    if (!user) return { ok: false, errors: { loginIdentity: 'Không tìm thấy tài khoản này.' } };
    if (user.locked) return { ok: false, errors: { loginIdentity: 'Tài khoản đang tạm khóa. Hãy liên hệ người quản lý.' } };
    if (user.passHash !== hash(password, user.salt)) return { ok: false, errors: { loginPassword: 'Mật khẩu chưa đúng.' } };

    state.sessionUserId = user.id;
    Store.set(state);
    Store.log('Đăng nhập', `${user.username} đã đăng nhập.`);
    return { ok: true, user };
  }

  function logout() {
    const state = Store.get();
    Store.log('Đăng xuất', 'Tài khoản đã rời trang quản lý.');
    state.sessionUserId = null;
    Store.set(state);
  }

  function changePassword(userId, newPassword) {
    if (!UI.strongPassword(newPassword)) return { ok: false, message: 'Mật khẩu mới chưa đủ mạnh.' };
    const state = Store.get();
    const user = state.users.find(item => item.id === userId);
    if (!user) return { ok: false, message: 'Không tìm thấy tài khoản.' };
    user.salt = Store.id('salt');
    user.passHash = hash(newPassword, user.salt);
    Store.set(state);
    Store.log('Đổi mật khẩu', `Đã đổi mật khẩu cho ${user.username}.`);
    return { ok: true };
  }

  function createByAdmin(payload) {
    const state = Store.get();
    const errors = accountErrors(payload);
    if (!payload.password) errors.password = 'Bạn chưa nhập mật khẩu.';
    else if (!UI.strongPassword(payload.password)) errors.password = 'Mật khẩu cần từ 8 ký tự và khó đoán hơn.';
    if (Object.keys(errors).length) return { ok: false, errors };

    state.users.push(makeUser(payload));
    Store.set(state);
    Store.log('Thêm tài khoản', `Đã thêm tài khoản ${String(payload.username).trim()}.`);
    return { ok: true };
  }

  function updateUser(id, patch) {
    const state = Store.get();
    const user = state.users.find(item => item.id === id);
    if (!user) return { ok: false, errors: { username: 'Không tìm thấy tài khoản.' } };
    const errors = accountErrors(patch, id);
    const activeAdmins = state.users.filter(item => item.role === 'admin' && !item.locked);
    const removingLastAdmin = user.role === 'admin' && activeAdmins.length === 1 && (patch.role !== 'admin' || patch.locked);
    if (removingLastAdmin) errors.role = 'Cần giữ lại ít nhất một tài khoản quản lý đang hoạt động.';
    if (state.sessionUserId === id && patch.locked) errors.locked = 'Bạn không thể tự khóa tài khoản đang dùng.';
    if (Object.keys(errors).length) return { ok: false, errors };

    user.username = String(patch.username).trim();
    user.email = normalize(patch.email);
    user.role = patch.role === 'admin' ? 'admin' : 'user';
    user.locked = Boolean(patch.locked);
    Store.set(state);
    Store.log('Cập nhật tài khoản', `Đã cập nhật ${user.username}.`);
    return { ok: true };
  }

  function deleteUser(id) {
    const state = Store.get();
    if (state.sessionUserId === id) return { ok: false, message: 'Bạn không thể xóa tài khoản đang dùng.' };
    const user = state.users.find(item => item.id === id);
    if (!user) return { ok: false, message: 'Không tìm thấy tài khoản.' };
    if (user.role === 'admin' && state.users.filter(item => item.role === 'admin').length === 1) return { ok: false, message: 'Cần giữ lại ít nhất một tài khoản quản lý.' };

    state.users = state.users.filter(item => item.id !== id);
    CONFIG.collections.forEach(collection => {
      state[collection] = state[collection].filter(item => item.ownerId !== id && item.createdBy !== id);
    });
    state.socialPosts = state.socialPosts.map(post => ({
      ...post,
      likes: (post.likes || []).filter(userId => userId !== id),
      comments: (post.comments || []).filter(comment => comment.userId !== id)
    }));
    Store.set(state);
    Store.log('Xóa tài khoản', `Đã xóa ${user.username} và dữ liệu thuộc tài khoản này.`);
    return { ok: true };
  }

  return { hash, register, login, logout, changePassword, createByAdmin, updateUser, deleteUser };
})();
