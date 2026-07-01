/* ===== 雲端同步（Firebase，選用） ===== */
'use strict';

const Cloud = (() => {
  const SYNC_KEYS = ['days', 'logs', 'profile', 'proteinGoal', 'customFoods',
    'weekPlan', 'overrides', 'kcalIntakeGoal', 'combos', 'hiddenFoods', 'foodUsage', 'goalMode', 'carbCycle',
    'macroMode', 'customMacros', 'fatPerKg', 'fatGoal', 'carbGoal'];
  const get = k => { try { const v = localStorage.getItem('ft_' + k); return v === null ? null : JSON.parse(v); } catch { return null; } };
  const set = (k, v) => localStorage.setItem('ft_' + k, JSON.stringify(v));

  let app = null, auth = null, db = null, user = null;
  let saveTimer = null;
  let ready = false;
  let onChangeCb = null;

  function configured() {
    const c = window.FIREBASE_CONFIG;
    return c && c.apiKey && c.projectId;
  }

  async function init(onChange) {
    onChangeCb = onChange;
    if (!configured()) return false;
    // 動態載入 Firebase SDK（v10 模組版）
    const [{ initializeApp }, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
    ]);
    app = initializeApp(window.FIREBASE_CONFIG);
    auth = authMod;
    db = fsMod;
    Cloud._auth = authMod.getAuth(app);
    Cloud._db = fsMod.getFirestore(app);
    ready = true;

    authMod.onAuthStateChanged(Cloud._auth, async u => {
      user = u;
      if (onChangeCb) onChangeCb(state());
      if (u) await pullThenMerge();
    });
    return true;
  }

  function state() {
    return {
      configured: configured(),
      ready,
      signedIn: !!user,
      email: user ? user.email : null
    };
  }

  async function signIn() {
    if (!ready) return;
    const provider = new auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(Cloud._auth, provider);
    } catch (e) {
      // 行動裝置 popup 可能被擋，改用 redirect
      await auth.signInWithRedirect(Cloud._auth, provider);
    }
  }

  async function signOut() {
    if (ready) await auth.signOut(Cloud._auth);
  }

  function docRef() {
    return db.doc(Cloud._db, 'users', user.uid);
  }

  // 下載雲端資料；若雲端較新就覆蓋本機，否則上傳本機
  async function pullThenMerge() {
    if (!user) return;
    try {
      const snap = await db.getDoc(docRef());
      const localUpdated = +get('cloudUpdatedAt') || 0;
      if (snap.exists()) {
        const data = snap.data();
        const cloudUpdated = data.updatedAt || 0;
        if (cloudUpdated >= localUpdated) {
          // 雲端較新 → 覆蓋本機
          SYNC_KEYS.forEach(k => { if (data[k] !== undefined && data[k] !== null) set(k, data[k]); });
          set('cloudUpdatedAt', cloudUpdated);
          if (onChangeCb) onChangeCb(state(), true); // true = 資料已更新，需重繪
        } else {
          // 本機較新 → 上傳
          await push();
        }
      } else {
        await push(); // 雲端無資料，首次上傳
      }
    } catch (e) {
      console.warn('雲端同步讀取失敗', e);
    }
  }

  // 上傳本機資料到雲端
  async function push() {
    if (!user || !ready) return;
    const payload = { updatedAt: Date.now() };
    SYNC_KEYS.forEach(k => { const v = get(k); if (v !== null) payload[k] = v; });
    set('cloudUpdatedAt', payload.updatedAt);
    try {
      await db.setDoc(docRef(), payload);
    } catch (e) {
      console.warn('雲端上傳失敗', e);
    }
  }

  // 防抖：資料變動後 2 秒上傳一次
  function scheduleSync() {
    if (!user || !ready) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(push, 2000);
  }

  return { init, state, signIn, signOut, scheduleSync, push, pullThenMerge };
})();

window.Cloud = Cloud;
