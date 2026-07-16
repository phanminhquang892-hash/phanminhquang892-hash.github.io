const Store = (() => {
  const empty = () => ({
    version: 3,
    users: [],
    sessionUserId: null,
    logs: [],
    settings: { theme: localStorage.getItem(CONFIG.themeKey) || 'light' },
    diagnoses: [],
    irrigations: [],
    traceBatches: [],
    plants: [],
    yieldPredictions: [],
    riskAlerts: [],
    soilTests: [],
    assistantChats: [],
    diaries: [],
    finances: [],
    growths: [],
    pestAlerts: [],
    waterPoints: [],
    greenhouseDevices: [],
    zones: [],
    socialPosts: []
  });

  const safeParse = raw => {
    try { return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  };

  const nowISO = () => new Date().toISOString();
  const id = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  let state = safeParse(localStorage.getItem(CONFIG.appKey)) || empty();

  function normalize() {
    const base = empty();
    state = { ...base, ...state, settings: { ...base.settings, ...(state.settings || {}) }, version: 3 };
    if (!Array.isArray(state.users)) state.users = [];
    if (!Array.isArray(state.logs)) state.logs = [];
    CONFIG.collections.forEach(key => { if (!Array.isArray(state[key])) state[key] = []; });

    state.users = state.users.map(user => ({ locked: false, createdAt: nowISO(), ...user }));
    state.socialPosts = state.socialPosts.map(post => ({ ...post, likes: Array.isArray(post.likes) ? post.likes : [], comments: Array.isArray(post.comments) ? post.comments : [] }));
    if (!state.users.some(user => user.id === state.sessionUserId && !user.locked)) state.sessionUserId = null;
  }

  function save() {
    try {
      localStorage.setItem(CONFIG.appKey, JSON.stringify(state));
      return true;
    } catch (error) {
      window.dispatchEvent(new CustomEvent('agri-storage-error', { detail: error }));
      return false;
    }
  }

  function get() {
    normalize();
    return state;
  }

  function set(next) {
    state = next && typeof next === 'object' ? next : empty();
    normalize();
    save();
    return state;
  }

  function reset() {
    const theme = localStorage.getItem(CONFIG.themeKey) || 'light';
    state = empty();
    state.settings.theme = theme;
    save();
    return state;
  }

  function currentUser() {
    return get().users.find(user => user.id === state.sessionUserId) || null;
  }

  function log(action, detail) {
    state.logs.unshift({ id: id('log'), action, detail, userId: state.sessionUserId, createdAt: nowISO() });
    state.logs = state.logs.slice(0, 250);
    save();
  }

  function ownerFilter(items) {
    const user = currentUser();
    if (!user || !Array.isArray(items)) return [];
    if (user.role === 'admin') return items;
    return items.filter(item => item.ownerId === user.id || item.createdBy === user.id);
  }

  function canChange(record) {
    const user = currentUser();
    return Boolean(user && (user.role === 'admin' || record.ownerId === user.id || record.createdBy === user.id));
  }

  function upsert(collection, record) {
    normalize();
    if (!CONFIG.collections.includes(collection)) return false;
    const user = currentUser();
    if (!user) return false;
    const list = state[collection];
    const index = list.findIndex(item => item.id === record.id);

    if (index >= 0) {
      if (!canChange(list[index])) return false;
      list[index] = { ...list[index], ...record, updatedAt: nowISO() };
    } else {
      list.unshift({
        id: id(collection),
        createdBy: user.id,
        ownerId: record.ownerId || user.id,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        ...record
      });
    }
    save();
    return true;
  }

  function remove(collection, idValue) {
    normalize();
    if (!CONFIG.collections.includes(collection)) return false;
    const record = state[collection].find(item => item.id === idValue);
    if (!record || !canChange(record)) return false;
    state[collection] = state[collection].filter(item => item.id !== idValue);
    save();
    return true;
  }

  normalize();
  save();
  return { get, set, save, reset, id, nowISO, currentUser, log, ownerFilter, upsert, remove };
})();
