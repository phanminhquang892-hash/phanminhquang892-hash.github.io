const Auth = (() => {
  const normalize = s => String(s || '').trim().toLowerCase();
  function hash(pw, salt){
    const str = `${salt}::${pw}`; let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for(let i=0;i<str.length;i++){ const ch=str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8,'0') + (h1 >>> 0).toString(16).padStart(8,'0');
  }
  function makeUser({username,email,password,role='user',locked=false}){
    const salt = Store.id('salt');
    return { id: Store.id('user'), username: String(username).trim(), email: String(email).trim(), role, locked, salt, passHash: hash(password,salt), createdAt: Store.nowISO() };
  }
  function register(data){
    const state = Store.get(); const username = String(data.username||'').trim(); const email = String(data.email||'').trim(); const password = data.password || ''; const confirm = data.confirm || '';
    const errors = {};
    if(!username) errors.regUsername = 'Vui lòng nhập tên tài khoản';
    if(username && username.length < 2) errors.regUsername = 'Tên tài khoản tối thiểu 2 ký tự';
    if(!email) errors.regEmail = 'Vui lòng nhập email'; else if(!UI.emailOk(email)) errors.regEmail = 'Email chưa đúng định dạng';
    if(!password) errors.regPassword = 'Vui lòng nhập mật khẩu'; else if(!UI.strongPassword(password)) errors.regPassword = 'Mật khẩu cần tối thiểu 8 ký tự, có chữ hoa, chữ thường, số hoặc ký tự đặc biệt';
    if(!confirm) errors.regConfirm = 'Vui lòng xác nhận mật khẩu'; else if(password !== confirm) errors.regConfirm = 'Mật khẩu xác nhận chưa khớp';
    if(state.users.some(u => normalize(u.username) === normalize(username))) errors.regUsername = 'Tên tài khoản đã tồn tại';
    if(state.users.some(u => normalize(u.email) === normalize(email))) errors.regEmail = 'Email đã tồn tại';
    if(Object.keys(errors).length) return { ok:false, errors };
    const role = state.users.length === 0 ? 'admin' : 'user';
    const user = makeUser({ username, email, password, role });
    state.users.push(user); state.sessionUserId = null; Store.set(state); Store.log('REGISTER', `${username} tạo tài khoản ${role}`);
    return { ok:true, user };
  }
  function login(identity, password){
    const state = Store.get(); const key = normalize(identity); const user = state.users.find(u => normalize(u.username) === key || normalize(u.email) === key);
    const errors = {};
    if(!String(identity||'').trim()) errors.loginIdentity = 'Vui lòng nhập tên tài khoản hoặc email';
    if(!password) errors.loginPassword = 'Vui lòng nhập mật khẩu';
    if(Object.keys(errors).length) return { ok:false, errors };
    if(!user) return { ok:false, errors:{ loginIdentity:'Tài khoản hoặc email không tồn tại' } };
    if(user.locked) return { ok:false, errors:{ loginIdentity:'Tài khoản đang bị khóa. Vui lòng liên hệ Admin.' } };
    if(user.passHash !== hash(password, user.salt)) return { ok:false, errors:{ loginPassword:'Mật khẩu không đúng' } };
    state.sessionUserId = user.id; Store.set(state); Store.log('LOGIN', `${user.username} đăng nhập`); return { ok:true, user };
  }
  function logout(){ const state=Store.get(); Store.log('LOGOUT','Đăng xuất'); state.sessionUserId=null; Store.set(state); }
  function changePassword(userId, newPassword){ const state=Store.get(); const user=state.users.find(u=>u.id===userId); if(!user) return false; user.salt=Store.id('salt'); user.passHash=hash(newPassword,user.salt); Store.set(state); Store.log('PASSWORD', `Đổi mật khẩu cho ${user.username}`); return true; }
  function createByAdmin(payload){ const state=Store.get(); const errors={};
    if(!payload.username?.trim()) errors.username='Vui lòng nhập tên tài khoản';
    if(!payload.email?.trim()) errors.email='Vui lòng nhập email'; else if(!UI.emailOk(payload.email)) errors.email='Email chưa đúng định dạng';
    if(!payload.password) errors.password='Vui lòng nhập mật khẩu'; else if(!UI.strongPassword(payload.password)) errors.password='Mật khẩu chưa đủ mạnh';
    if(state.users.some(u=>normalize(u.username)===normalize(payload.username))) errors.username='Tên tài khoản đã tồn tại';
    if(state.users.some(u=>normalize(u.email)===normalize(payload.email))) errors.email='Email đã tồn tại';
    if(Object.keys(errors).length) return {ok:false,errors};
    state.users.push(makeUser(payload)); Store.set(state); Store.log('ADMIN_CREATE_USER', `Tạo user ${payload.username}`); return {ok:true};
  }
  function updateUser(id, patch){ const state=Store.get(); const user=state.users.find(u=>u.id===id); if(!user) return {ok:false,errors:{username:'Không tìm thấy user'}}; const errors={};
    if(!patch.username?.trim()) errors.username='Vui lòng nhập tên tài khoản';
    if(!patch.email?.trim()) errors.email='Vui lòng nhập email'; else if(!UI.emailOk(patch.email)) errors.email='Email chưa đúng định dạng';
    if(state.users.some(u=>u.id!==id && normalize(u.username)===normalize(patch.username))) errors.username='Tên tài khoản đã tồn tại';
    if(state.users.some(u=>u.id!==id && normalize(u.email)===normalize(patch.email))) errors.email='Email đã tồn tại';
    if(Object.keys(errors).length) return {ok:false,errors};
    user.username=patch.username.trim(); user.email=patch.email.trim(); user.role=patch.role; user.locked=!!patch.locked; Store.set(state); Store.log('ADMIN_UPDATE_USER', `Sửa user ${user.username}`); return {ok:true};
  }
  function deleteUser(id){ const state=Store.get(); if(state.sessionUserId===id) return false; const u=state.users.find(x=>x.id===id); state.users=state.users.filter(x=>x.id!==id); CONFIG.collections.forEach(c=>{ state[c]=state[c].filter(x=>x.ownerId!==id && x.createdBy!==id); }); Store.set(state); Store.log('ADMIN_DELETE_USER', `Xóa user ${u?.username||id}`); return true; }
  return { hash, register, login, logout, changePassword, createByAdmin, updateUser, deleteUser };
})();
