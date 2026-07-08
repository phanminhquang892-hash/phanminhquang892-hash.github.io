const Store = (() => {
  const empty = () => ({
    users: [], sessionUserId: null, logs: [], settings: { theme: localStorage.getItem(CONFIG.themeKey) || 'light' },
    diagnoses: [], irrigations: [], traceBatches: [], plants: [], yieldPredictions: [], riskAlerts: [], soilTests: [], assistantChats: [], diaries: [], finances: [], growths: [], pestAlerts: [], waterPoints: [], greenhouseDevices: [], zones: [], socialPosts: []
  });
  const safeParse = (raw) => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
  let state = safeParse(localStorage.getItem(CONFIG.appKey)) || empty();
  function normalize(){
    const base = empty();
    state = { ...base, ...state, settings:{...base.settings, ...(state.settings||{})} };
    if(!Array.isArray(state.users)) state.users = [];
    CONFIG.collections.forEach(k => { if(!Array.isArray(state[k])) state[k] = []; });
    if(!Array.isArray(state.logs)) state.logs = [];
    state.users = state.users.map(u => ({ locked:false, createdAt:nowISO(), ...u }));
  }
  function save(){ localStorage.setItem(CONFIG.appKey, JSON.stringify(state)); }
  function nowISO(){ return new Date().toISOString(); }
  function id(prefix='id'){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
  function get(){ normalize(); return state; }
  function set(next){ state = next; normalize(); save(); return state; }
  function reset(){ state = empty(); save(); return state; }
  function currentUser(){ return get().users.find(u => u.id === get().sessionUserId) || null; }
  function log(action, detail){ state.logs.unshift({ id:id('log'), action, detail, userId: state.sessionUserId, createdAt: nowISO() }); state.logs = state.logs.slice(0,250); save(); }
  function ownerFilter(items){ const user = currentUser(); if(!user) return []; if(user.role === 'admin') return items; return items.filter(x => x.ownerId === user.id || x.createdBy === user.id); }
  function upsert(collection, record){ normalize(); const user = currentUser(); const list = state[collection]; const index = list.findIndex(x => x.id === record.id); if(index >= 0){ list[index] = { ...list[index], ...record, updatedAt: nowISO() }; } else { list.unshift({ id:id(collection), createdBy: user?.id, createdAt: nowISO(), updatedAt: nowISO(), ...record, ownerId: record.ownerId || user?.id }); } save(); }
  function remove(collection, idValue){ normalize(); state[collection] = state[collection].filter(x => x.id !== idValue); save(); }
  normalize(); save();
  return { get, set, save, reset, id, nowISO, currentUser, log, ownerFilter, upsert, remove };
})();
