/* ===== 減脂計畫追蹤 App ===== */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// 用「本地時間」產生 YYYY-MM-DD，避免 UTC 時區造成跨日誤差
const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
// 任意 Date 物件 → 本地 YYYY-MM-DD
const dateToKey = (dt) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* ---------- 設定 ---------- */
const DEFAULTS = { height: 177.5, weight: 74.3, bf: 23.3, bmr: 1667, act: 1.45, target: 20 };
const DAY_IDX = () => (new Date().getDay() + 6) % 7; // 週一=0 ... 週日=6
const DAY_NAMES = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

/* 預設一週課表（可被使用者覆寫，存在 localStorage） */
const DEFAULT_PLAN = [
  { workout: '超慢跑 + 核心', carb: '低碳' },
  { workout: '上肢推（胸肩三頭）', carb: '低碳' },
  { workout: '超慢跑 + 核心', carb: '低碳' },
  { workout: '下肢重訓（腿臀）', carb: '中碳' },
  { workout: '上肢拉 + 肩膀', carb: '中碳' },
  { workout: '輕量籃球', carb: '中高碳' },
  { workout: '激烈籃球', carb: '高碳' }
];
const carbColor = { '低碳': '#30d158', '中碳': '#ff9f0a', '中高碳': '#ff7a00', '高碳': '#ff453a' };

/* 內建食物庫：台灣日常常見食物（每份概估）。p=蛋白 c=碳水 f=脂肪(g) kcal=熱量 */
const FOOD_DB = [
  // 主食/澱粉
  { n: '白飯 1口', p: 1, c: 4, f: 0, kcal: 18, tag: '主食' },
  { n: '白飯 半碗', p: 3, c: 30, f: 0, kcal: 140, tag: '主食' },
  { n: '白飯 1碗', p: 6, c: 60, f: 0, kcal: 280, tag: '主食' },
  { n: '糙米飯 1碗', p: 6, c: 55, f: 2, kcal: 270, tag: '主食' },
  { n: '地瓜 1條', p: 2, c: 28, f: 0, kcal: 130, tag: '主食' },
  { n: '燕麥 1碗', p: 6, c: 30, f: 3, kcal: 170, tag: '主食' },
  { n: '吐司 1片', p: 4, c: 25, f: 2, kcal: 130, tag: '主食' },
  { n: '蔥抓餅 1份', p: 7, c: 40, f: 18, kcal: 360, tag: '早餐' },
  { n: '飯糰 1個', p: 6, c: 50, f: 6, kcal: 280, tag: '早餐' },
  { n: '御飯糰 1個', p: 5, c: 38, f: 4, kcal: 200, tag: '早餐' },
  { n: '水餃 1顆', p: 3, c: 6, f: 2, kcal: 55, tag: '主食' },
  { n: '陽春麵 1碗', p: 10, c: 60, f: 8, kcal: 360, tag: '主食' },
  // 蛋白質
  { n: '雞胸肉 100g', p: 23, c: 0, f: 1, kcal: 110, tag: '蛋白' },
  { n: '超商雞胸 1包', p: 22, c: 2, f: 2, kcal: 120, tag: '蛋白' },
  { n: '雞腿(去皮)100g', p: 19, c: 0, f: 8, kcal: 150, tag: '蛋白' },
  { n: '滷雞腿 1隻', p: 26, c: 2, f: 14, kcal: 240, tag: '蛋白' },
  { n: '魚(白肉)100g', p: 20, c: 0, f: 4, kcal: 120, tag: '蛋白' },
  { n: '鮭魚 100g', p: 20, c: 0, f: 13, kcal: 200, tag: '蛋白' },
  { n: '鮪魚(水煮)1份', p: 10, c: 0, f: 1, kcal: 50, tag: '蛋白' },
  { n: '蛋 1顆', p: 7, c: 1, f: 5, kcal: 75, tag: '蛋白' },
  { n: '茶葉蛋 1顆', p: 7, c: 1, f: 5, kcal: 75, tag: '蛋白' },
  { n: '板豆腐 半盒', p: 12, c: 4, f: 7, kcal: 130, tag: '蛋白' },
  { n: '嫩豆腐 1盒', p: 9, c: 4, f: 5, kcal: 100, tag: '蛋白' },
  { n: '豆干 1片', p: 5, c: 1, f: 3, kcal: 50, tag: '蛋白' },
  { n: '無糖豆漿 400ml', p: 14, c: 6, f: 6, kcal: 130, tag: '蛋白' },
  { n: '無糖優格 1杯', p: 9, c: 12, f: 4, kcal: 120, tag: '蛋白' },
  { n: '高蛋白粉 1匙', p: 24, c: 3, f: 2, kcal: 120, tag: '蛋白' },
  { n: '雞胸肉絲 1把', p: 15, c: 0, f: 1, kcal: 75, tag: '蛋白' },
  // 蔬菜
  { n: '花椰菜米 1碗', p: 3, c: 6, f: 0, kcal: 40, tag: '蔬菜' },
  { n: '燙青菜 1份', p: 2, c: 5, f: 1, kcal: 30, tag: '蔬菜' },
  { n: '生菜沙拉(無醬)', p: 2, c: 6, f: 0, kcal: 35, tag: '蔬菜' },
  { n: '菇類 1份', p: 3, c: 4, f: 0, kcal: 30, tag: '蔬菜' },
  // 外食/便當（數值刻意偏高，抵銷隱形油低估風險）
  { n: '便當(一般)', p: 22, c: 80, f: 30, kcal: 750, tag: '外食' },
  { n: '雞腿便當', p: 30, c: 85, f: 40, kcal: 860, tag: '外食' },
  { n: '排骨便當(炸)', p: 26, c: 85, f: 45, kcal: 950, tag: '外食' },
  { n: '滷肉飯 1碗', p: 10, c: 55, f: 20, kcal: 460, tag: '外食' },
  { n: '義大利麵(紅醬)', p: 18, c: 80, f: 26, kcal: 670, tag: '外食' },
  { n: '義大利麵(白醬)', p: 20, c: 78, f: 42, kcal: 890, tag: '外食' },
  { n: '關東煮(3樣)', p: 12, c: 16, f: 9, kcal: 200, tag: '外食' },
  { n: '滷味(瘦肉菜)', p: 18, c: 16, f: 14, kcal: 290, tag: '外食' },
  { n: '自助餐(3菜1肉)', p: 25, c: 70, f: 35, kcal: 750, tag: '外食' },
  // 油脂/調味
  { n: '油 1湯匙', p: 0, c: 0, f: 14, kcal: 120, tag: '油脂' },
  { n: '油 1茶匙', p: 0, c: 0, f: 5, kcal: 40, tag: '油脂' },
  { n: '堅果 1把', p: 5, c: 6, f: 14, kcal: 170, tag: '油脂' },
  // 水果
  { n: '香蕉 1根', p: 1, c: 27, f: 0, kcal: 105, tag: '水果' },
  { n: '蘋果 1顆', p: 0, c: 25, f: 0, kcal: 95, tag: '水果' },
  { n: '芭樂 半顆', p: 1, c: 12, f: 0, kcal: 50, tag: '水果' }
];

/* 各碳水日的目標 (碳水克數) */
const CARB_TARGET = { '低碳': 90, '中碳': 150, '中高碳': 200, '高碳': 250 };

/* ---------- 儲存 ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('ft_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) {
    localStorage.setItem('ft_' + k, JSON.stringify(v));
    if (window.Cloud && k !== 'cloudUpdatedAt') Cloud.scheduleSync();
  }
};
const MEALS = ['早餐', '中餐', '晚餐', '點心'];
let viewDate = todayKey();           // 目前首頁檢視的日期
function isViewingToday() { return viewDate === todayKey(); }

function dayData() {
  const all = store.get('days', {});
  if (!all[viewDate]) all[viewDate] = { meals: { 早餐: [], 中餐: [], 晚餐: [], 點心: [] }, note: '', workoutPct: null };
  const d = all[viewDate];
  // 相容舊資料：把舊的 foods 陣列搬到「早餐」
  if (!d.meals) d.meals = { 早餐: [], 中餐: [], 晚餐: [], 點心: [] };
  MEALS.forEach(m => { if (!Array.isArray(d.meals[m])) d.meals[m] = []; });
  if (d.foods && d.foods.length) { d.meals['早餐'] = d.meals['早餐'].concat(d.foods); delete d.foods; }
  if (d.workoutPct === undefined) d.workoutPct = null;
  return { all, d };
}
// 全天合計（從四餐加總）
function dayTotals(d) {
  const t = { protein: 0, carb: 0, fat: 0, kcal: 0 };
  MEALS.forEach(m => (d.meals[m] || []).forEach(f => {
    t.protein += (f.p || 0); t.carb += (f.c || 0); t.fat += (f.f || 0); t.kcal += f.kcal;
  }));
  t.protein = Math.round(t.protein); t.carb = Math.round(t.carb);
  t.fat = Math.round(t.fat); t.kcal = Math.round(t.kcal);
  return t;
}
function saveDay(all) { store.set('days', all); }
function customFoods() { return store.get('customFoods', []); }
function hiddenFoods() { return store.get('hiddenFoods', []); }
function foodKey(f) { return (f.n || '') + '|' + (f.q || '') + '|' + f.kcal; }
function foodUsage() { return store.get('foodUsage', {}); }
function bumpUsage(name) {
  const u = foodUsage(); u[name] = (u[name] || 0) + 1; store.set('foodUsage', u);
}
function weekPlan() {
  const p = store.get('weekPlan', null);
  if (!p || !Array.isArray(p) || p.length !== 7) return DEFAULT_PLAN.map(x => ({ ...x }));
  return p;
}
function todayCarbType() { return weekPlan()[DAY_IDX()].carb; }

/* ---------- 導航 ---------- */
const TITLES = { today: '今日', foods: '食物', calc: '飲食計算', plan: '課表', log: '進度' };
$$('.tab').forEach(t => t.addEventListener('click', () => switchView(t.dataset.view)));
function switchView(v) {
  $$('.tab').forEach(x => x.classList.toggle('active', x.dataset.view === v));
  $$('.view').forEach(x => x.classList.add('hidden'));
  $('#view-' + v).classList.remove('hidden');
  $('#page-title').textContent = TITLES[v];
  if (v === 'log') renderLog();
  if (v === 'foods') renderFoodsPage();
  window.scrollTo(0, 0);
}

/* ---------- 今日 ---------- */
function dateKeyDayIdx(key) { return (new Date(key + 'T00:00:00').getDay() + 6) % 7; }

function renderToday() {
  const { all, d } = dayData();
  const ti = dateKeyDayIdx(viewDate);
  const plan = weekPlan()[ti];
  const t = dayTotals(d);
  const g = budgetGoals(plan.carb);
  const profile = store.get('profile', DEFAULTS);
  const tdee = Math.round(profile.bmr * profile.act);

  // 檢視日期顯示 + 回今天按鈕
  const dObj = new Date(viewDate + 'T00:00:00');
  const wd = ['日', '一', '二', '三', '四', '五', '六'][dObj.getDay()];
  $('#date-pill').textContent = `${dObj.getMonth() + 1}/${dObj.getDate()} 週${wd}` + (isViewingToday() ? '' : ' (檢視)');
  $('#back-today').classList.toggle('hidden', isViewingToday());

  // 今日運動拉桿
  const slider = $('#workout-slider');
  const pct = d.workoutPct == null ? 0 : d.workoutPct;
  slider.value = pct;
  $('#workout-pct-label').textContent = (d.workoutPct == null ? '—' : pct + '%');

  // ===== 主圈圖：熱量 =====
  const kcalGoal = g.kcalGoal;
  $('#eaten-kcal').textContent = t.kcal;
  $('#eaten-goal-label').textContent = '/ ' + kcalGoal;
  const kpct = Math.min(1, t.kcal / kcalGoal);
  const C = 2 * Math.PI * 86;
  const fg = $('#mr-fg');
  fg.style.strokeDasharray = C;
  fg.style.strokeDashoffset = C * (1 - kpct);
  fg.style.stroke = t.kcal > kcalGoal ? 'var(--danger)' : '#5ac8d8';

  // ===== 三條 macro bar =====
  function setBar(id, valId, used, goal, unit) {
    $(id).style.width = Math.min(100, used / goal * 100) + '%';
    $(valId).textContent = `${Math.round(used)}/${goal}${unit}`;
    if (used > goal) $(id).classList.add('over'); else $(id).classList.remove('over');
  }
  setBar('#mb-p', '#mb-p-val', t.protein, g.proteinGoal, 'g');
  setBar('#mb-f', '#mb-f-val', t.fat, g.fatGoal, 'g');
  setBar('#mb-c', '#mb-c-val', t.carb, g.carbGoal, 'g');
  $('#mb-p-warn').textContent = t.protein < g.proteinGoal ? `差${g.proteinGoal - t.protein}` : '✓足夠';
  $('#mb-p-warn').className = 'mb-warn' + (t.protein >= g.proteinGoal ? ' ok' : '');

  // ===== 維持 / 目標 =====
  $('#ms-maintain').textContent = tdee;
  $('#ms-target').textContent = kcalGoal;

  // ===== 一週計畫條 =====
  renderWeekStrip();

  // 相容隱藏欄位
  $('#hero-kcal').textContent = t.kcal;
  $('#protein-val').textContent = t.protein;

  renderMeals(all, d);
  renderSuggest(d);
  renderWeekCalories();
  $('#meal-note').value = d.note || '';
}

/* 本週熱量缺口觀察（Mon–Sun，含 viewDate 的那一週） */
function renderWeekCalories() {
  const profile = store.get('profile', DEFAULTS);
  const tdee = profile.bmr * profile.act;
  const kcalGoal = +store.get('kcalIntakeGoal', Math.round(tdee - 770));
  const dailyDeficit = tdee - kcalGoal;
  const allDays = store.get('days', {});

  // viewDate 所在週的週一
  const base = new Date(viewDate + 'T00:00:00');
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));

  // 只計算「到今天為止已經過去+今天」的天數（未來還沒到的天不算入預算，避免誤導）
  const tk = todayKey();
  let eatenTotal = 0, elapsedDays = 0, recordedDays = 0;
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday); dt.setDate(monday.getDate() + i);
    const key = dateToKey(dt);
    if (key > tk) continue;              // 未來的天先不計
    elapsedDays++;
    const day = allDays[key];
    let eaten = 0;
    if (day) {
      if (day.meals) MEALS.forEach(m => (day.meals[m] || []).forEach(f => eaten += f.kcal));
      else if (day.foods) day.foods.forEach(f => eaten += f.kcal);
    }
    if (eaten > 0) recordedDays++;
    eatenTotal += eaten;
  }

  // 到目前為止的「可消耗總量」= TDEE × 已過天數
  const budgetSoFar = Math.round(tdee * elapsedDays);
  const deficit = Math.round(budgetSoFar - eatenTotal);
  const weekTarget = Math.round(dailyDeficit * 7);

  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  $('#wc-range').textContent = `${dateToKey(monday).slice(5)} ~ ${dateToKey(sunday).slice(5)}`;

  $('#wc-budget').textContent = budgetSoFar.toLocaleString();
  $('#wc-eaten').textContent = Math.round(eatenTotal).toLocaleString();
  $('#wc-deficit').textContent = deficit.toLocaleString();
  $('#wc-target').textContent = weekTarget.toLocaleString();

  // 已吃條：相對於可消耗總量的比例（吃越少條越短，缺口越大）
  const eatenPct = budgetSoFar > 0 ? Math.min(100, eatenTotal / budgetSoFar * 100) : 0;
  const ef = $('#wc-eaten-fill');
  ef.style.width = eatenPct + '%';
  ef.classList.toggle('over', eatenTotal > budgetSoFar); // 吃超過消耗=沒缺口

  // 提示
  const remainDays = 7 - elapsedDays;
  const remainTarget = weekTarget - deficit;
  if (weekTarget <= 0) {
    $('#wc-hint').textContent = '維持/增肌模式，本週不設缺口目標。';
  } else if (deficit >= weekTarget) {
    $('#wc-hint').textContent = `✓ 本週缺口已達標！目前 ${deficit.toLocaleString()} / 目標 ${weekTarget.toLocaleString()} kcal。`;
  } else if (elapsedDays === 0) {
    $('#wc-hint').textContent = `本週目標創造 ${weekTarget.toLocaleString()} kcal 缺口。`;
  } else {
    const perDay = remainDays > 0 ? Math.round(remainTarget / remainDays) : 0;
    $('#wc-hint').textContent = remainDays > 0
      ? `還差 ${remainTarget.toLocaleString()} kcal。剩 ${remainDays} 天，平均每天再省 ${perDay} kcal 即達標。`
      : `本週最後一天，目前缺口 ${deficit.toLocaleString()} / ${weekTarget.toLocaleString()}。`;
  }
}

function renderWeekStrip() {
  const strip = $('#week-strip'); strip.innerHTML = '';
  const plan = weekPlan();
  const viewIdx = dateKeyDayIdx(viewDate);
  const short = ['一', '二', '三', '四', '五', '六', '日'];
  plan.forEach((day, i) => {
    const cell = document.createElement('button');
    cell.className = 'ws-cell' + (i === viewIdx ? ' active' : '');
    cell.innerHTML = `<span class="ws-d">${short[i]}</span><span class="ws-dot" style="background:${carbColor[day.carb] || '#888'}"></span>`;
    cell.addEventListener('click', () => switchToWeekDay(i));
    strip.appendChild(cell);
  });
  const cur = plan[viewIdx];
  if (carbCycleOn()) {
    $('#wt-carb').textContent = cur.carb + '日';
    $('#wt-carb').style.color = carbColor[cur.carb] || 'var(--ink)';
  } else {
    $('#wt-carb').textContent = '固定目標';
    $('#wt-carb').style.color = 'var(--ink2)';
  }
  $('#wt-workout').textContent = cur.workout || '尚未安排';
}

/* 點一週某天 → 首頁切換到「本週」對應的那天 */
function switchToWeekDay(dayIdx) {
  const today = new Date();
  const diff = dayIdx - DAY_IDX();
  const target = new Date(today); target.setDate(today.getDate() + diff);
  viewDate = dateToKey(target);
  renderToday();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function budgetGoals(carbType) {
  const cycleOn = carbCycleOn();
  const type = cycleOn ? (carbType || todayCarbType()) : '固定';
  const profile = store.get('profile', DEFAULTS);
  const tdee = profile.bmr * profile.act;
  const kcalGoal = +store.get('kcalIntakeGoal', Math.round((Math.max(profile.bmr * 1.1, tdee - 770)) / 10) * 10);
  let carbGoal, fatGoal;
  if (cycleOn) {
    // 碳循環：碳水依星期，脂肪用計算頁的目標
    carbGoal = CARB_TARGET[type] || 120;
    fatGoal = +store.get('fatGoal', Math.round(kcalGoal * 0.25 / 9));
  } else {
    // 固定：直接用計算頁算好的目標
    carbGoal = +store.get('carbGoal', Math.max(100, Math.round(kcalGoal * 0.35 / 4)));
    fatGoal = +store.get('fatGoal', Math.round(kcalGoal * 0.25 / 9));
  }
  const proteinGoal = +store.get('proteinGoal', 135);
  return { type, kcalGoal, carbGoal, fatGoal, proteinGoal };
}

function renderBudget(d) {
  const { type, kcalGoal, carbGoal, fatGoal } = budgetGoals();
  $('#budget-type-label').textContent = `${type}日`;
  const items = [
    { label: '熱量', used: d.kcal, goal: kcalGoal, unit: 'kcal', note: '上限' },
    { label: '碳水', used: d.carb, goal: carbGoal, unit: 'g', note: '上限·不必吃滿' },
    { label: '脂肪', used: d.fat, goal: fatGoal, unit: 'g', note: '上限·不必吃滿' }
  ];
  const wrap = $('#budget-list'); wrap.innerHTML = '';
  items.forEach(it => {
    const left = it.goal - it.used;
    const pct = Math.min(1, it.used / it.goal);
    const over = it.used > it.goal;
    const row = document.createElement('div');
    row.className = 'budget-row';
    row.innerHTML = `
      <div class="b-top"><span class="b-label">${it.label} <span class="b-note">${it.note}</span></span>
        <span class="b-left ${over ? 'over' : ''}">${over ? '超標 ' + (it.used - it.goal) : '距上限 ' + left} ${it.unit}</span></div>
      <div class="b-bar"><div class="b-fill ${over ? 'over' : ''}" style="width:${pct * 100}%"></div></div>
      <div class="b-sub">${it.used} / ${it.goal} ${it.unit}</div>`;
    wrap.appendChild(row);
  });

  const overItems = items.filter(it => it.used > it.goal).map(it => it.label);
  $('#budget-hint').textContent = overItems.length
    ? `⚠️ ${overItems.join('、')}已超標，接下來請收斂。`
    : '碳水/脂肪是「上限」，沒吃到不用補（熱量更低、減更快）。只有蛋白質要吃滿下限。';
}

/* ---------- 剩餘餐建議（定位：補蛋白，不是補熱量） ---------- */
let suggestSel = new Set();
function renderSuggest(d) {
  const g = budgetGoals();
  const t = dayTotals(d);
  const leftKcal = g.kcalGoal - t.kcal;
  const needProtein = Math.max(0, g.proteinGoal - t.protein);
  const grid = $('#suggest-grid');
  const intro = $('#suggest-intro');
  const prev = $('#suggest-preview');
  const addBtn = $('#suggest-add');

  function showNothing(msg) {
    suggestSel.clear();
    intro.textContent = msg;
    grid.innerHTML = '';
    prev.classList.add('hidden');
    addBtn.classList.add('hidden');
  }

  // 熱量已超標 → 不給任何選項
  if (leftKcal <= 0) {
    showNothing(`⚠️ 今日熱量已超過上限 ${-leftKcal} kcal，今天別再吃了。${needProtein > 0 ? `（蛋白還差 ${needProtein}g，明天再補。）` : ''}`);
    return;
  }
  // 蛋白已達標 → 不需再吃，鼓勵收尾拉大缺口
  if (needProtein <= 0) {
    showNothing(`✓ 蛋白已達標！距熱量上限還有 ${leftKcal} kcal，但你的目標是減脂——${leftKcal > 150 ? '就此收尾缺口更大、減更快' : '差不多可以收工了'}。餓了再補高蛋白低卡的就好。`);
    return;
  }

  // 蛋白還沒夠 → 推「高蛋白、不爆熱量」的補充
  intro.textContent = `蛋白距目標還差 ${needProtein}g（達到即足夠，不用超標）。距熱量上限還有 ${leftKcal} kcal，以下是不會爆熱量的高蛋白選項：`;

  const all = [...FOOD_DB, ...customFoods()];
  const scored = all
    .filter(f => f.kcal <= leftKcal + 20 && (f.p || 0) >= 5) // 只留不爆熱量、且有蛋白的
    .map(f => {
      const p = f.p || 0;
      // 蛋白效率：每卡路里給多少蛋白，越高越好
      const eff = p / Math.max(1, f.kcal);
      let score = eff * 100 + p;
      return { f, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  grid.innerHTML = '';
  if (!scored.length) {
    showNothing(`蛋白還差 ${needProtein}g，但剩餘熱量不多。建議用高蛋白粉(配水)補，熱量最低。`);
    return;
  }
  scored.forEach(({ f }) => {
    const key = f.n + '|' + f.kcal;
    const chip = document.createElement('button');
    chip.className = 'sg-chip' + (suggestSel.has(key) ? ' sel' : '');
    chip.innerHTML = `<span class="fn">${f.n}</span><span class="fm">蛋${f.p}·${f.kcal}k</span>`;
    chip.addEventListener('click', () => {
      if (suggestSel.has(key)) suggestSel.delete(key); else suggestSel.add(key);
      renderSuggest(d);
    });
    grid.appendChild(chip);
  });

  const chosen = all.filter(f => suggestSel.has(f.n + '|' + f.kcal));
  if (!chosen.length) {
    prev.classList.add('hidden'); addBtn.classList.add('hidden'); return;
  }
  const sum = chosen.reduce((a, f) => ({
    p: a.p + (f.p || 0), c: a.c + (f.c || 0), fat: a.fat + (f.f || 0), kcal: a.kcal + f.kcal
  }), { p: 0, c: 0, fat: 0, kcal: 0 });
  const afterKcal = leftKcal - sum.kcal;
  const afterProt = needProtein - sum.p;
  prev.classList.remove('hidden'); addBtn.classList.remove('hidden');
  prev.innerHTML = `
    <div>選取加總：蛋白 <b>+${sum.p}</b>g · <b>${sum.kcal}</b>kcal</div>
    <div class="sg-after ${afterKcal < 0 ? 'over' : ''}">加入後：蛋白${afterProt > 0 ? '還差 ' + afterProt + 'g' : '✓已達標'} · 熱量${afterKcal < 0 ? '會超標 ' + (-afterKcal) : '距上限剩 ' + afterKcal} kcal</div>`;
}

$('#suggest-add').addEventListener('click', () => {
  const all = [...FOOD_DB, ...customFoods()];
  const chosen = all.filter(f => suggestSel.has(f.n + '|' + f.kcal));
  if (!chosen.length) return;
  const { all: days, d } = dayData();
  chosen.forEach(f => {
    d.meals['點心'].push({ n: f.n, q: f.q || '', p: f.p || 0, c: f.c || 0, f: f.f || 0, kcal: f.kcal });
  });
  suggestSel.clear();
  saveDay(days); renderToday();
});

function renderFoodGrid() {
  const grid = $('#food-grid'); grid.innerHTML = '';
  const q = ($('#food-search').value || '').trim();
  const hidden = hiddenFoods();
  const customs = customFoods();
  const usage = foodUsage();

  // 組合快捷列：一鍵把整個組合帶入目前餐別
  const cq = $('#combo-quick');
  if (cq) {
    cq.innerHTML = '';
    const cs = combos();
    if (!q && cs.length) {
      cs.forEach((combo, ci) => {
        const tk = combo.items.reduce((a, x) => a + x.kcal, 0);
        const chip = document.createElement('button');
        chip.className = 'cq-chip';
        chip.innerHTML = `⭳ ${combo.name} <span>${tk}k</span>`;
        chip.addEventListener('click', () => {
          const { all, d } = dayData();
          combo.items.forEach(f => d.meals[currentMeal].push({ ...f }));
          saveDay(all); renderToday();
          alert(`已把組合「${combo.name}」加入${currentMeal}`);
        });
        cq.appendChild(chip);
      });
    }
  }

  let list = [...FOOD_DB, ...customs]
    .filter(f => f.tag === '自訂' || !hidden.includes(f.n))
    .filter(f => !q || f.n.includes(q));
  // 沒搜尋時：依使用次數排序（常用排前面），其次自訂優先
  if (!q) {
    list = list.slice().sort((a, b) => {
      const ua = usage[a.n] || 0, ub = usage[b.n] || 0;
      if (ub !== ua) return ub - ua;
      return (b.tag === '自訂' ? 1 : 0) - (a.tag === '自訂' ? 1 : 0);
    });
  }
  list.forEach(f => {
    const isCustom = f.tag === '自訂';
    const b = document.createElement('button');
    b.className = 'food-chip' + (isCustom ? ' custom' : '');
    const qty = f.q ? ` <span class="fq">${f.q}</span>` : '';
    const star = (usage[f.n] || 0) >= 3 ? '<span class="fav">★</span>' : '';
    b.innerHTML = `<span class="fn">${star}${f.n}${qty}</span><span class="fm">蛋${f.p}·碳${f.c || 0}·脂${f.f || 0}·${f.kcal}kcal</span>`;

    let pressTimer = null, longPressed = false;
    const startPress = () => {
      longPressed = false;
      pressTimer = setTimeout(() => {
        longPressed = true;
        if (isCustom) editCustomFood(f); else hideBuiltinFood(f);
      }, 550);
    };
    const cancelPress = () => { if (pressTimer) clearTimeout(pressTimer); };
    b.addEventListener('touchstart', startPress, { passive: true });
    b.addEventListener('touchend', cancelPress);
    b.addEventListener('touchmove', cancelPress);
    b.addEventListener('mousedown', startPress);
    b.addEventListener('mouseup', cancelPress);
    b.addEventListener('mouseleave', cancelPress);

    b.addEventListener('click', () => {
      if (longPressed) { longPressed = false; return; }
      const { all, d } = dayData();
      d.meals[currentMeal].push({ n: f.n, q: f.q || '', p: f.p, c: f.c || 0, f: f.f || 0, kcal: f.kcal });
      bumpUsage(f.n);
      saveDay(all); renderToday(); renderFoodGrid();
    });
    grid.appendChild(b);
  });
  if (!list.length) grid.innerHTML = '<div class="empty">找不到，試試「＋ 自訂」</div>';
}

/* 長按內建食物 → 隱藏（不吃的就不再出現） */
function hideBuiltinFood(f) {
  if (!confirm(`把「${f.n}」從清單隱藏？（之後可在「食物」分頁還原）`)) return;
  const h = hiddenFoods();
  if (!h.includes(f.n)) h.push(f.n);
  store.set('hiddenFoods', h);
  renderFoodGrid();
}

/* 長按自訂食物 → 修改或刪除 */
function editCustomFood(f) {
  const action = prompt(`「${f.n}」要做什麼？\n輸入 1 = 修改\n輸入 2 = 刪除`, '1');
  if (action === null) return;
  const matches = c => c.n === f.n && c.p === f.p && c.kcal === f.kcal;
  if (action.trim() === '2') {
    if (!confirm(`刪除「${f.n}」？`)) return;
    store.set('customFoods', customFoods().filter(c => !matches(c)));
    renderFoodGrid();
    return;
  }
  const name = prompt('名稱', f.n); if (name === null) return;
  const qy = prompt('份量（例如 1碗、100g，可留空）', f.q || '') || '';
  const p = parseFloat(prompt('蛋白質 (g)', f.p)) || 0;
  const c = parseFloat(prompt('碳水 (g)', f.c || 0)) || 0;
  const fat = parseFloat(prompt('脂肪 (g)', f.f || 0)) || 0;
  const kcal = Math.round(p * 4 + c * 4 + fat * 9);
  const cf = customFoods().map(x => matches(x) ? { n: name.trim(), q: qy.trim(), p, c, f: fat, kcal, tag: '自訂' } : x);
  store.set('customFoods', cf);
  renderFoodGrid();
}

/* ---------- 食物管理頁 ---------- */
function combos() { return store.get('combos', []); }

function renderFoodsPage() {
  // 餐點組合
  const cl = $('#combo-list'); cl.innerHTML = '';
  const cs = combos();
  if (!cs.length) cl.innerHTML = '<div class="empty">還沒有組合。先在今日加好一餐，再按下方按鈕存起來。</div>';
  cs.forEach((combo, ci) => {
    const totalK = combo.items.reduce((a, x) => a + x.kcal, 0);
    const totalP = combo.items.reduce((a, x) => a + (x.p || 0), 0);
    const row = document.createElement('div');
    row.className = 'combo-row';
    row.innerHTML = `
      <button class="combo-main">
        <span class="combo-name">${combo.name}</span>
        <span class="combo-sub">${combo.meal ? combo.meal + ' · ' : ''}${combo.items.length}項 · 蛋${totalP}g · ${totalK}kcal</span>
      </button>
      <button class="combo-del">✕</button>`;
    row.querySelector('.combo-main').addEventListener('click', () => {
      const { all, d } = dayData();
      const target = combo.meal && MEALS.includes(combo.meal) ? combo.meal : '早餐';
      combo.items.forEach(f => {
        d.meals[target].push({ ...f });
      });
      saveDay(all); renderToday();
      alert(`已加入「${combo.name}」到今日`);
    });
    row.querySelector('.combo-del').addEventListener('click', () => {
      if (!confirm(`刪除組合「${combo.name}」？`)) return;
      store.set('combos', combos().filter((_, i) => i !== ci));
      renderFoodsPage();
    });
    cl.appendChild(row);
  });

  renderFoodTable();
  renderHiddenList();
}

$('#add-combo').addEventListener('click', () => {
  const { d } = dayData();
  // 找出有食物的餐別
  const filled = MEALS.filter(m => (d.meals[m] || []).length);
  if (!filled.length) { alert('目前檢視的日期沒有任何食物，無法存成組合'); return; }
  const pick = prompt(`要把哪一餐存成組合？\n${filled.map((m, i) => `${i + 1}=${m}`).join('  ')}`, '1');
  if (pick === null) return;
  const meal = filled[(+pick || 1) - 1] || filled[0];
  const name = prompt('組合名稱？（例如：固定早餐）', meal);
  if (!name) return;
  const cs = combos();
  cs.push({ name: name.trim(), meal, items: d.meals[meal].map(f => ({ ...f })) });
  store.set('combos', cs);
  renderFoodsPage();
  alert(`已把「${meal}」存成組合「${name}」`);
});

// 食物表格編輯（只編輯自訂食物）
let foodRows = [];
function renderFoodTable() {
  foodRows = customFoods().map(f => ({ ...f }));
  drawFoodTable();
}
function drawFoodTable() {
  const t = $('#food-table'); t.innerHTML = '';
  $('#foods-count').textContent = `${foodRows.length} 項`;
  if (!foodRows.length) { t.innerHTML = '<div class="empty">還沒有食物，按「新增一列」開始。</div>'; return; }
  foodRows.forEach((f, i) => {
    const row = document.createElement('div');
    row.className = 'food-trow';
    const autoK = Math.round((f.p || 0) * 4 + (f.c || 0) * 4 + (f.f || 0) * 9);
    row.innerHTML = `
      <input class="ft-name" value="${(f.n || '').replace(/"/g, '&quot;')}" placeholder="名稱">
      <input class="ft-q" value="${(f.q || '').replace(/"/g, '&quot;')}" placeholder="份量">
      <input class="ft-num" type="number" inputmode="decimal" placeholder="0" value="${f.p || ''}">
      <input class="ft-num" type="number" inputmode="decimal" placeholder="0" value="${f.c || ''}">
      <input class="ft-num" type="number" inputmode="decimal" placeholder="0" value="${f.f || ''}">
      <span class="ft-kcal" data-k="${i}">${autoK}</span>
      <button class="ft-del">✕</button>`;
    const inputs = row.querySelectorAll('input');
    const [nameI, qI, pI, cI, fI] = inputs;
    const kSpan = row.querySelector('.ft-kcal');
    const recalc = () => { kSpan.textContent = Math.round((foodRows[i].p || 0) * 4 + (foodRows[i].c || 0) * 4 + (foodRows[i].f || 0) * 9); };
    nameI.addEventListener('input', e => foodRows[i].n = e.target.value);
    qI.addEventListener('input', e => foodRows[i].q = e.target.value);
    pI.addEventListener('input', e => { foodRows[i].p = +e.target.value || 0; recalc(); });
    cI.addEventListener('input', e => { foodRows[i].c = +e.target.value || 0; recalc(); });
    fI.addEventListener('input', e => { foodRows[i].f = +e.target.value || 0; recalc(); });
    row.querySelector('.ft-del').addEventListener('click', () => {
      foodRows.splice(i, 1); drawFoodTable();
    });
    t.appendChild(row);
  });
}
$('#foods-add-row').addEventListener('click', () => {
  foodRows.push({ n: '', q: '', p: 0, c: 0, f: 0, kcal: 0, tag: '自訂' });
  drawFoodTable();
});
$('#foods-save').addEventListener('click', () => {
  const cleaned = foodRows
    .filter(f => (f.n || '').trim())
    .map(f => ({
      n: f.n.trim(), q: (f.q || '').trim(), p: +f.p || 0, c: +f.c || 0, f: +f.f || 0,
      kcal: Math.round((+f.p || 0) * 4 + (+f.c || 0) * 4 + (+f.f || 0) * 9),
      tag: '自訂'
    }));
  store.set('customFoods', cleaned);
  renderFoodTable();
  renderHiddenList();
  alert('已儲存');
});

/* 已隱藏內建食物 → 還原 */
function renderHiddenList() {
  const wrap = $('#hidden-list'); if (!wrap) return;
  const h = hiddenFoods();
  $('#hidden-count').textContent = h.length ? `${h.length} 項` : '';
  if (!h.length) { wrap.innerHTML = '<div class="empty">沒有隱藏的食物</div>'; return; }
  wrap.innerHTML = '';
  h.forEach(name => {
    const chip = document.createElement('button');
    chip.className = 'hidden-chip';
    chip.innerHTML = `${name} <span>↩ 還原</span>`;
    chip.addEventListener('click', () => {
      store.set('hiddenFoods', hiddenFoods().filter(n => n !== name));
      renderHiddenList();
    });
    wrap.appendChild(chip);
  });
}

let currentMeal = '早餐';   // 食物彈窗目前要加入的餐別
const MEAL_ICON = { '早餐': '🌅', '中餐': '🍱', '晚餐': '🍲', '點心': '🍎' };

function renderMeals(all, d) {
  const wrap = $('#meals-wrap'); wrap.innerHTML = '';
  MEALS.forEach(meal => {
    const items = d.meals[meal] || [];
    const mk = items.reduce((a, f) => a + f.kcal, 0);
    const mp = Math.round(items.reduce((a, f) => a + (f.p || 0), 0));
    const card = document.createElement('div');
    card.className = 'card meal-card';
    card.innerHTML = `
      <div class="meal-head">
        <h2>${MEAL_ICON[meal]} ${meal}</h2>
        <span class="meal-sum">${items.length ? `蛋${mp}g · ${mk}kcal` : ''}</span>
        <button class="meal-copy" title="把這餐存成常吃組合">⭳</button>
        <button class="meal-add" title="加入食物">＋</button>
      </div>
      <ul class="eaten-list"></ul>`;
    const ul = card.querySelector('.eaten-list');
    if (!items.length) {
      ul.innerHTML = '<div class="empty">尚無，按 ＋ 加入</div>';
    } else {
      items.forEach((f, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${f.n}${f.q ? ' ' + f.q : ''}</span><span class="muted">蛋${f.p}·碳${f.c || 0}·脂${f.f || 0}·${f.kcal}k</span><span class="h-del">✕</span>`;
        li.querySelector('.h-del').addEventListener('click', () => {
          d.meals[meal].splice(i, 1); saveDay(all); renderToday();
        });
        ul.appendChild(li);
      });
    }
    card.querySelector('.meal-add').addEventListener('click', () => openFoodModal(meal));
    card.querySelector('.meal-copy').addEventListener('click', () => saveMealAsCombo(meal, items));
    wrap.appendChild(card);
  });
}

function openFoodModal(meal) {
  currentMeal = meal;
  $('#food-modal-title').textContent = `加入${meal}`;
  $('#food-search').value = '';
  renderFoodGrid();
  $('#food-modal').classList.remove('hidden');
}

// 今日運動完成度拉桿
(function initWorkoutSlider() {
  const slider = $('#workout-slider');
  if (!slider) return;
  const onMove = () => { $('#workout-pct-label').textContent = slider.value + '%'; };
  const onSet = () => {
    const { all, d } = dayData();
    d.workoutPct = +slider.value;
    saveDay(all);
    $('#workout-pct-label').textContent = slider.value + '%';
  };
  slider.addEventListener('input', onMove);
  slider.addEventListener('change', onSet);
})();

$('#food-search').addEventListener('input', renderFoodGrid);

/* 加入食物彈窗 */
$('#food-modal-close').addEventListener('click', () => $('#food-modal').classList.add('hidden'));
$('#food-modal').addEventListener('click', e => { if (e.target.id === 'food-modal') $('#food-modal').classList.add('hidden'); });
$('#back-today').addEventListener('click', () => { viewDate = todayKey(); renderToday(); });

/* 複製某一餐：列出歷史上有該餐紀錄的日期，挑一個複製到目前檢視日的同一餐 */
/* 把某一餐的食物存成「常吃組合」 */
function saveMealAsCombo(meal, items) {
  if (!items || !items.length) { alert(`「${meal}」目前沒有食物可存`); return; }
  const name = prompt(`把這份「${meal}」存成常吃組合，命名：`, meal + '組合');
  if (!name) return;
  const cs = combos();
  cs.push({ name: name.trim(), meal, items: items.map(f => ({ ...f })) });
  store.set('combos', cs);
  alert(`已存成組合「${name}」。下次在任一餐的＋裡可一鍵帶入。`);
}

/* 語音搜尋（Web Speech API，免後端） */
(function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = $('#food-mic');
  if (!SR) { micBtn.style.display = 'none'; return; } // 不支援就隱藏
  const rec = new SR();
  rec.lang = 'zh-TW';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  let listening = false;
  micBtn.addEventListener('click', () => {
    if (listening) { rec.stop(); return; }
    try { rec.start(); } catch (e) { /* 已在執行 */ }
  });
  rec.onstart = () => { listening = true; micBtn.classList.add('listening'); micBtn.textContent = '●'; };
  rec.onend = () => { listening = false; micBtn.classList.remove('listening'); micBtn.textContent = '🎤'; };
  rec.onerror = () => { listening = false; micBtn.classList.remove('listening'); micBtn.textContent = '🎤'; };
  rec.onresult = e => {
    const text = (e.results[0][0].transcript || '').replace(/[。，、\s]/g, '');
    $('#food-search').value = text;
    renderFoodGrid();
  };
})();

/* ---------- 新增自訂食物（含查詢） ---------- */
function cfKcal() {
  const p = parseFloat($('#cf-p').value) || 0, c = parseFloat($('#cf-c').value) || 0, f = parseFloat($('#cf-f').value) || 0;
  return Math.round(p * 4 + c * 4 + f * 9);
}
function updateCfKcal() { $('#cf-kcal').textContent = cfKcal(); }

let cfPer100 = null; // 掃描/查詢帶入的每100g/ml營養
$('#add-custom').addEventListener('click', () => {
  $('#cf-name').value = ($('#food-search').value || '').trim();
  $('#cf-q').value = ''; $('#cf-p').value = ''; $('#cf-c').value = ''; $('#cf-f').value = '';
  $('#cf-off-q').value = ''; $('#cf-off-result').innerHTML = '';
  $('#cf-per100').classList.add('hidden'); cfPer100 = null;
  updateCfKcal();
  $('#custom-modal').classList.remove('hidden');
});
['cf-p', 'cf-c', 'cf-f'].forEach(id => $('#' + id).addEventListener('input', updateCfKcal));
$('#cf-cancel').addEventListener('click', () => $('#custom-modal').classList.add('hidden'));
$('#custom-modal').addEventListener('click', e => { if (e.target.id === 'custom-modal') { stopScan(); $('#custom-modal').classList.add('hidden'); } });

// Google 查熱量（開新分頁）
$('#cf-google').addEventListener('click', () => {
  const name = ($('#cf-name').value || '').trim();
  if (!name) { alert('請先輸入食物名稱'); return; }
  const q = encodeURIComponent(name + ' 熱量 蛋白質 碳水 脂肪');
  window.open('https://www.google.com/search?q=' + q, '_blank');
});

// Open Food Facts 查詢（條碼或名稱）
async function offQuery(q) {
  const box = $('#cf-off-result');
  if (!q) { box.innerHTML = '<span class="off-hint">請輸入條碼或名稱</span>'; return; }
  box.innerHTML = '<span class="off-hint">查詢中…</span>';
  try {
    let products = [];
    if (/^\d{6,}$/.test(q)) {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${q}.json`);
      const j = await r.json();
      if (j.status === 1 && j.product) products = [j.product];
    } else {
      const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8`);
      const j = await r.json();
      products = j.products || [];
    }
    if (!products.length) { box.innerHTML = '<span class="off-hint">查無結果，改用 🔍 Google 或手動填</span>'; return; }
    box.innerHTML = '';
    products.slice(0, 8).forEach(prod => {
      const nu = prod.nutriments || {};
      const per100 = { p: +nu.proteins_100g || 0, c: +nu.carbohydrates_100g || 0, f: +nu.fat_100g || 0 };
      const name = prod.product_name || prod.product_name_zh || prod.generic_name || '(無名稱)';
      if (!per100.p && !per100.c && !per100.f) return;
      // 判斷單位：液體用 ml
      const isLiquid = /ml|liter|litre|juice|drink|milk|soda|beverage|水|乳|飲|汁|奶|茶/i.test(name + ' ' + (prod.quantity || ''));
      const unit = isLiquid ? 'ml' : 'g';
      const row = document.createElement('button');
      row.className = 'off-item';
      row.innerHTML = `<span class="oi-name">${name}</span><span class="oi-macro">每100${unit}：蛋${per100.p.toFixed(1)}·碳${per100.c.toFixed(1)}·脂${per100.f.toFixed(1)}</span>`;
      row.addEventListener('click', () => {
        // 帶入名稱與每100參考，顯示換算框（不再用 prompt）
        $('#cf-name').value = name;
        cfPer100 = { p: per100.p, c: per100.c, f: per100.f, unit };
        $('#cf-unit').textContent = unit;
        $('#cf-amount-unit').textContent = unit;
        $('#cf-per100-macro').textContent = `蛋${per100.p.toFixed(1)}·碳${per100.c.toFixed(1)}·脂${per100.f.toFixed(1)}`;
        $('#cf-amount').value = '';
        $('#cf-per100').classList.remove('hidden');
        box.innerHTML = '<span class="off-hint">✓ 已選取，下方輸入你吃/喝的量再換算</span>';
      });
      box.appendChild(row);
    });
    if (!box.children.length) box.innerHTML = '<span class="off-hint">查無有效營養資料</span>';
  } catch (e) {
    box.innerHTML = '<span class="off-hint">查詢失敗（網路或資料來源問題），請手動填</span>';
  }
}

// Open Food Facts 查詢（條碼或名稱）
$('#cf-off-btn').addEventListener('click', () => offQuery(($('#cf-off-q').value || '').trim()));

// 依實際攝取量換算並填入三大營養素
function applyAmount() {
  if (!cfPer100) return;
  const amt = parseFloat($('#cf-amount').value);
  if (!amt || amt <= 0) { alert('請先輸入你吃/喝的數量'); return; }
  const r = amt / 100;
  $('#cf-p').value = +(cfPer100.p * r).toFixed(1);
  $('#cf-c').value = +(cfPer100.c * r).toFixed(1);
  $('#cf-f').value = +(cfPer100.f * r).toFixed(1);
  $('#cf-q').value = amt + cfPer100.unit;
  updateCfKcal();
}
$('#cf-amount-apply').addEventListener('click', applyAmount);
$('#cf-amount').addEventListener('input', () => { if (cfPer100 && parseFloat($('#cf-amount').value) > 0) applyAmount(); });

/* ---------- 條碼掃描 ---------- */
let scanStream = null, scanRAF = null, scanDetector = null, zxingReader = null;
function stopScan() {
  const sc = $('#cf-scanner');
  if (scanRAF) cancelAnimationFrame(scanRAF), scanRAF = null;
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
  if (zxingReader && zxingReader.reset) { try { zxingReader.reset(); } catch (e) {} zxingReader = null; }
  sc.classList.add('hidden');
}
function onBarcode(code) {
  stopScan();
  $('#cf-off-q').value = code;
  offQuery(code);
}
async function startScan() {
  const sc = $('#cf-scanner');
  const video = $('#cf-video');
  sc.classList.remove('hidden');
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = scanStream;
    await video.play();
  } catch (e) {
    $('#cf-off-result').innerHTML = '<span class="off-hint">無法開啟相機（需授權/HTTPS）。可手動輸入條碼。</span>';
    sc.classList.add('hidden');
    return;
  }
  // 優先：原生 BarcodeDetector
  if ('BarcodeDetector' in window) {
    try {
      scanDetector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
      const tick = async () => {
        if (!scanStream) return;
        try {
          const codes = await scanDetector.detect(video);
          if (codes && codes.length) { onBarcode(codes[0].rawValue); return; }
        } catch (e) {}
        scanRAF = requestAnimationFrame(tick);
      };
      scanRAF = requestAnimationFrame(tick);
      return;
    } catch (e) { /* 落到 ZXing */ }
  }
  // 墊底：載入 ZXing
  try {
    if (!window.ZXing) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    zxingReader = new window.ZXing.BrowserMultiFormatReader();
    zxingReader.decodeFromVideoDevice(null, video, (result) => {
      if (result) onBarcode(result.getText());
    });
  } catch (e) {
    $('#cf-off-result').innerHTML = '<span class="off-hint">此裝置不支援掃描，請手動輸入條碼。</span>';
    stopScan();
  }
}
$('#cf-scan-btn').addEventListener('click', () => {
  const sc = $('#cf-scanner');
  const box = $('#cf-off-result');
  if (sc.classList.contains('hidden')) {
    box.innerHTML = '<span class="off-hint">正在開啟相機…（請允許相機權限）</span>';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      box.innerHTML = '<span class="off-hint">此瀏覽器不支援相機，請手動輸入條碼。</span>';
      return;
    }
    startScan();
  } else {
    stopScan();
  }
});
$('#cf-scan-close').addEventListener('click', stopScan);
// 關閉自訂視窗時也停掉相機
$('#cf-cancel').addEventListener('click', stopScan);

// 儲存自訂食物並加入目前餐別
$('#cf-save').addEventListener('click', () => {
  const n = ($('#cf-name').value || '').trim();
  if (!n) { alert('請輸入名稱'); return; }
  const item = {
    n, q: ($('#cf-q').value || '').trim(),
    p: +$('#cf-p').value || 0, c: +$('#cf-c').value || 0, f: +$('#cf-f').value || 0,
    kcal: cfKcal(), tag: '自訂'
  };
  const cf = customFoods(); cf.push(item); store.set('customFoods', cf);
  // 直接加入目前餐別
  const { all, d } = dayData();
  d.meals[currentMeal].push({ n: item.n, q: item.q, p: item.p, c: item.c, f: item.f, kcal: item.kcal });
  bumpUsage(item.n);
  saveDay(all);
  $('#custom-modal').classList.add('hidden');
  renderFoodGrid(); renderToday();
  alert(`已新增並加入${currentMeal}：${item.n}`);
});

$('#meal-note').addEventListener('input', e => {
  const { all, d } = dayData(); d.note = e.target.value; saveDay(all);
});

/* ---------- 計算 ---------- */
const MODE_INFO = {
  cut: { label: '減脂', proteinPerKg: 1.7, hint: '製造熱量赤字。蛋白質 1.7g/kg 體重「足夠保肌肉」即可，不用硬追更高（追高易爆熱量、增尿酸負擔）。' },
  maintain: { label: '維持', proteinPerKg: 1.6, hint: '吃到 TDEE 附近維持體重。蛋白質 1.6g/kg。' },
  bulk: { label: '增肌', proteinPerKg: 1.8, hint: '熱量盈餘約 +12%，配合重訓長肌肉。蛋白質 1.8g/kg 即可，重點在盈餘與訓練。' }
};
function getMode() { return store.get('goalMode', 'cut'); }
function carbCycleOn() { return store.get('carbCycle', false); }

function loadCalcInputs() {
  const s = store.get('profile', DEFAULTS);
  $('#in-height').value = s.height; $('#in-weight').value = s.weight;
  $('#in-bf').value = s.bf; $('#in-bmr').value = s.bmr;
  $('#in-act').value = s.act; $('#in-target').value = s.target;
  const ov = store.get('overrides', {});
  $('#in-deficit').value = ov.deficit || '';
  $('#in-protein-goal').value = ov.proteinGoal || '';
  $('#in-days').value = ov.days || '';
  const mode = getMode();
  $$('#mode-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  $('#mode-hint').textContent = MODE_INFO[mode].hint;
  $('#carb-cycle-toggle').checked = carbCycleOn();
  // 營養素策略
  const macroMode = store.get('macroMode', 'auto');
  $$('#macro-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.macro === macroMode));
  $('#macro-auto').classList.toggle('hidden', macroMode !== 'auto');
  $('#macro-custom').classList.toggle('hidden', macroMode !== 'custom');
  $('#in-fatperkg').value = store.get('fatPerKg', 0.7);
  $('#in-carbtarget').value = store.get('carbTarget', 110);
  const cm = store.get('customMacros', {});
  $('#cm2-p').value = cm.p || '';
  $('#cm2-c').value = cm.c || '';
  $('#cm2-f').value = cm.f || '';
}
function calc() {
  const p = {
    height: +$('#in-height').value, weight: +$('#in-weight').value, bf: +$('#in-bf').value,
    bmr: +$('#in-bmr').value, act: +$('#in-act').value, target: +$('#in-target').value
  };
  store.set('profile', p);
  const ov = {
    deficit: +$('#in-deficit').value || 0,
    proteinGoal: +$('#in-protein-goal').value || 0,
    days: +$('#in-days').value || 0
  };
  store.set('overrides', ov);

  const mode = getMode();
  const fat = p.weight * p.bf / 100;
  const lbm = p.weight - fat;
  const targetW = lbm / (1 - p.target / 100);
  const fatToLose = p.weight - targetW;
  const tdee = p.bmr * p.act;
  const days = ov.days || 30;

  // 依模式決定熱量目標
  let intake, deficitLabel;
  if (mode === 'bulk') {
    intake = tdee * 1.12;
    deficitLabel = '盈餘 約 +' + Math.round(intake - tdee) + ' kcal';
  } else if (mode === 'maintain') {
    intake = tdee;
    deficitLabel = '維持（無缺口）';
  } else {
    const autoDeficit = fatToLose * 7700 / days;
    const deficit = ov.deficit || autoDeficit;
    intake = Math.max(p.bmr * 1.1, tdee - deficit);
    deficitLabel = '約 ' + Math.round(deficit) + ' kcal' + (ov.deficit ? '（自訂）' : '');
  }

  // 蛋白質：依模式係數 × 體重（可被自訂覆寫）
  const macroMode = store.get('macroMode', 'auto');
  const cmForP = store.get('customMacros', {});
  const protein = macroMode === 'custom' && +cmForP.p
    ? +cmForP.p
    : (ov.proteinGoal || Math.round(p.weight * MODE_INFO[mode].proteinPerKg));
  store.set('proteinGoal', protein);

  // ===== 三大營養素目標 =====
  let fatGoal, carbGoal, kcalGoalRounded;
  if (macroMode === 'custom') {
    const cm = store.get('customMacros', {});
    fatGoal = +cm.f || Math.round(p.weight * 0.7);
    carbGoal = +cm.c || Math.max(80, Math.round((Math.round(intake / 10) * 10 - protein * 4 - fatGoal * 9) / 4));
    kcalGoalRounded = Math.round(intake / 10) * 10;
  } else {
    // 自動最佳化：先訂「低脂 + 目標碳水」，熱量由三大營養素加總決定（避免碳水被剩餘熱量灌爆）
    const fatPerKg = +store.get('fatPerKg', 0.7);
    fatGoal = Math.round(p.weight * fatPerKg);
    if (mode === 'cut') {
      // 減脂：碳水用「目標值」（預設低碳，可調），不吃掉全部剩餘熱量
      carbGoal = +store.get('carbTarget', 110);
      // 熱量 = 三大營養素加總（自然形成赤字），但不低於 BMR×1.1 安全下限
      const macroKcal = protein * 4 + carbGoal * 4 + fatGoal * 9;
      kcalGoalRounded = Math.max(Math.round(p.bmr * 1.1 / 10) * 10, Math.round(macroKcal / 10) * 10);
      // 若因安全下限抬高了熱量，多出來的補回碳水
      if (kcalGoalRounded > macroKcal) {
        carbGoal += Math.round((kcalGoalRounded - macroKcal) / 4);
      }
    } else {
      // 維持/增肌：熱量固定，碳水吃剩餘
      kcalGoalRounded = Math.round(intake / 10) * 10;
      carbGoal = Math.max(80, Math.round((kcalGoalRounded - protein * 4 - fatGoal * 9) / 4));
    }
  }
  store.set('kcalIntakeGoal', kcalGoalRounded);
  store.set('fatGoal', fatGoal);
  store.set('carbGoal', carbGoal);
  // 實際缺口重算（減脂模式）
  if (mode === 'cut') deficitLabel = '約 ' + Math.round(tdee - kcalGoalRounded) + ' kcal';

  const rows = [
    ['目標模式', MODE_INFO[mode].label, true],
    ['脂肪量', fat.toFixed(1) + ' kg'],
    ['去脂體重 (肌肉等)', lbm.toFixed(1) + ' kg'],
    ['估計 TDEE', Math.round(tdee) + ' kcal'],
    ['建議每日攝取', kcalGoalRounded + ' kcal', true],
    [mode === 'bulk' ? '每日熱量盈餘' : '每日熱量缺口', deficitLabel],
    ['蛋白質目標', protein + ' g　(' + Math.round(protein * 4) + ' kcal)', true],
    ['脂肪目標', fatGoal + ' g　(' + Math.round(fatGoal * 9) + ' kcal)', true],
    ['碳水目標', carbGoal + ' g　(' + Math.round(carbGoal * 4) + ' kcal)', true]
  ];
  if (mode === 'cut') {
    rows.splice(3, 0, ['目標體重', targetW.toFixed(1) + ' kg', true], ['需減脂肪', fatToLose.toFixed(1) + ' kg', true]);
  }
  const ul = $('#calc-result'); ul.innerHTML = '';
  rows.forEach(([k, v, hl]) => {
    const li = document.createElement('li');
    if (hl) li.className = 'highlight';
    li.innerHTML = `<span>${k}</span><b>${v}</b>`;
    ul.appendChild(li);
  });
}
['in-height', 'in-weight', 'in-bf', 'in-bmr', 'in-act', 'in-target', 'in-deficit', 'in-protein-goal', 'in-days'].forEach(id =>
  $('#' + id).addEventListener('input', () => { calc(); renderToday(); }));

// 目標模式切換
$$('#mode-seg .seg-btn').forEach(b => b.addEventListener('click', () => {
  store.set('goalMode', b.dataset.mode);
  $$('#mode-seg .seg-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  $('#mode-hint').textContent = MODE_INFO[b.dataset.mode].hint;
  calc(); renderToday();
}));
// 碳水循環開關
$('#carb-cycle-toggle').addEventListener('change', e => {
  store.set('carbCycle', e.target.checked);
  renderToday();
});
// 營養素策略切換
$$('#macro-seg .seg-btn').forEach(b => b.addEventListener('click', () => {
  store.set('macroMode', b.dataset.macro);
  $$('#macro-seg .seg-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  $('#macro-auto').classList.toggle('hidden', b.dataset.macro !== 'auto');
  $('#macro-custom').classList.toggle('hidden', b.dataset.macro !== 'custom');
  calc(); renderToday();
}));
$('#in-fatperkg').addEventListener('change', e => {
  store.set('fatPerKg', +e.target.value || 0.7);
  calc(); renderToday();
});
$('#in-carbtarget').addEventListener('change', e => {
  store.set('carbTarget', +e.target.value || 110);
  calc(); renderToday();
});
['cm2-p', 'cm2-c', 'cm2-f'].forEach(id => $('#' + id).addEventListener('input', () => {
  store.set('customMacros', { p: +$('#cm2-p').value || 0, c: +$('#cm2-c').value || 0, f: +$('#cm2-f').value || 0 });
  calc(); renderToday();
}));

/* ---------- 卡路里計算機 ---------- */
// 每 100g 概估 {p,c,f}
const PER100 = {
  '雞胸肉': { p: 23, c: 0, f: 1 }, '雞腿(去皮)': { p: 19, c: 0, f: 8 },
  '魚(白肉)': { p: 20, c: 0, f: 4 }, '鮭魚': { p: 20, c: 0, f: 13 },
  '牛肉(瘦)': { p: 21, c: 0, f: 10 }, '豬肉(瘦)': { p: 20, c: 0, f: 7 },
  '蛋': { p: 13, c: 1, f: 10 }, '板豆腐': { p: 8, c: 2, f: 4 },
  '白飯(熟)': { p: 3, c: 28, f: 0 }, '麵條(熟)': { p: 5, c: 25, f: 1 },
  '地瓜': { p: 2, c: 24, f: 0 }, '燕麥': { p: 13, c: 60, f: 7 },
  '青菜': { p: 2, c: 4, f: 0 }, '義大利麵(熟含醬)': { p: 6, c: 25, f: 8 },
  '烤鴨(含皮)': { p: 19, c: 0, f: 28 }
};
let calcMode = 'macro';

function calcKcalFromMacro(p, c, f) { return Math.round(p * 4 + c * 4 + f * 9); }

function getCalcResult() {
  if (calcMode === 'macro') {
    const p = +$('#cm-p').value || 0, c = +$('#cm-c').value || 0, f = +$('#cm-f').value || 0;
    return { p: +p.toFixed(1), c: +c.toFixed(1), f: +f.toFixed(1), kcal: calcKcalFromMacro(p, c, f) };
  } else {
    const type = $('#cw-type').value, g = +$('#cw-grams').value || 0;
    const m = PER100[type] || { p: 0, c: 0, f: 0 };
    const p = m.p * g / 100, c = m.c * g / 100, f = m.f * g / 100;
    return { p: +p.toFixed(1), c: +c.toFixed(1), f: +f.toFixed(1), kcal: calcKcalFromMacro(p, c, f) };
  }
}

function renderCalcOut() {
  const r = getCalcResult();
  $('#calc-kcal-val').textContent = r.kcal;
  $('#calc-macros').innerHTML =
    `<span>蛋白 <b>${r.p}</b>g</span><span>碳水 <b>${r.c}</b>g</span><span>脂肪 <b>${r.f}</b>g</span>`;
}

// 填入重量模式的食物選單
(function initCalcWeight() {
  const sel = $('#cw-type');
  Object.keys(PER100).forEach(k => {
    const o = document.createElement('option'); o.value = k; o.textContent = k; sel.appendChild(o);
  });
})();

$$('#calc-mode-seg .seg-btn').forEach(b => b.addEventListener('click', () => {
  $$('#calc-mode-seg .seg-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active'); calcMode = b.dataset.mode;
  $('#calc-mode-macro').classList.toggle('hidden', calcMode !== 'macro');
  $('#calc-mode-weight').classList.toggle('hidden', calcMode !== 'weight');
  renderCalcOut();
}));
['cm-p', 'cm-c', 'cm-f', 'cw-grams'].forEach(id => $('#' + id).addEventListener('input', renderCalcOut));
$('#cw-type').addEventListener('change', renderCalcOut);

$('#calc-add-today').addEventListener('click', () => {
  const r = getCalcResult();
  if (!r.kcal) { alert('請先輸入數值'); return; }
  const name = $('#calc-name').value.trim() || (calcMode === 'weight' ? $('#cw-type').value : '計算項目');
  const { all, d } = dayData();
  d.meals['點心'].push({ n: name, q: '', p: r.p, c: r.c, f: r.f, kcal: r.kcal });
  saveDay(all); renderToday();
  alert(`已加入「點心」：${name}（${r.kcal} kcal）`);
});
$('#calc-save-food').addEventListener('click', () => {
  const r = getCalcResult();
  if (!r.kcal) { alert('請先輸入數值'); return; }
  const name = $('#calc-name').value.trim();
  if (!name) { alert('請先填名稱'); return; }
  const cf = customFoods(); cf.push({ n: name, p: r.p, c: r.c, f: r.f, kcal: r.kcal, tag: '自訂' });
  store.set('customFoods', cf);
  alert(`已存成自訂食物：${name}，可在「今日 → 加入食物」找到`);
});

/* ---------- 課表（可自訂） ---------- */
let editingDay = null;
function renderPlan() {
  const wrap = $('#week-edit'); wrap.innerHTML = '';
  const plan = weekPlan();
  const today = DAY_IDX();
  plan.forEach((day, i) => {
    const row = document.createElement('button');
    row.className = 'week-row' + (i === today ? ' today' : '');
    row.innerHTML = `
      <span class="wr-day">${DAY_NAMES[i]}${i === today ? ' ⭐' : ''}</span>
      <span class="wr-workout">${day.workout || '未排'}</span>
      <span class="wr-carb" style="background:${carbColor[day.carb] || '#888'}">${day.carb}</span>`;
    row.addEventListener('click', () => openDayModal(i));
    wrap.appendChild(row);
  });

  $('#plan-diet').innerHTML = `
    <div class="card concept">
      <h3>❶ 為何低碳低油吃肉，肌肉反而變少？</h3>
      <p>那是掉肌肉的配方：<b>碳水太低</b>身體會分解肌肉當燃料；<b>只吃肉不重訓</b>等於有材料沒訊號，肌肉不會長；<b>總熱量長期太低</b>身體進節能模式、優先犧牲耗能的肌肉。救回肌肉要：足夠碳水＋阻力訓練＋足夠蛋白，三者缺一不可。</p>
      <h3>❷ 蛋白顧下限，油脂顧上限（兩個都要）</h3>
      <p>蛋白質是「一定要達到的下限」（保肌肉）；油脂/總熱量是「絕對不能爆的上限」（維持赤字）。台灣外食隱形油一份可多 300–500 kcal，直接吃掉一天赤字，所以去油、控總熱量同樣重要。</p>
      <h3>❸ 外食聚餐難避開怎麼辦</h3>
      <p>不用每餐完美：<b>可控的餐（自備/超商/自助餐）嚴格</b>去油選原型，赤字靠這些撐；<b>聚餐放寬</b>——當天其他餐吃清淡高蛋白留額度，聚餐優先夾蛋白＋蔬菜、少油炸濃醬。<b>一週看平均</b>，破防一兩餐用其他天攤平。能持續的 80 分勝過痛苦的 100 分。</p>
      <h3>❹ 低碳不會減脂更快（迷思）</h3>
      <p>低碳初期體重掉快是<b>脫水</b>（肝醣帶水一起掉），不是脂肪，補碳就回來。真正減脂只看<b>熱量赤字</b>，與碳水高低無關。對你尿酸，極低碳的酮體還會競爭排泄、誘發痛風。碳水給到支撐訓練即可（顧尿酸別低於約 100g），<b>該壓的是油脂</b>（熱量密度最高）。</p>
      <h3>核心餐盤公式</h3>
      <p>每餐 = <b>1–2 手掌蛋白質</b> + <b>半盤蔬菜</b> + <b>一拳頭內碳水</b> + 少量好油。</p>
      <h3>紅黃綠燈</h3>
      <p>🟢 原型蛋白、蔬菜（隨意）　🟡 飯麵地瓜水果（看份量）　🔴 炸物、含糖飲料、甜點、濃醬（避開，顧尿酸與隱形油）</p>
      <h3>便當怎麼吃</h3>
      <p>飯 1–2 口、油刮掉或涮水、主菜選滷蛋/豆腐/去皮雞腿/清蒸魚，蛋白不夠回家用豆漿或蛋補。</p>
    </div>`;
}

function openDayModal(i) {
  editingDay = i;
  const plan = weekPlan();
  $('#modal-title').textContent = `編輯 ${DAY_NAMES[i]}`;
  $('#modal-workout').value = plan[i].workout || '';
  $('#modal-carb').value = plan[i].carb || '低碳';
  $('#day-modal').classList.remove('hidden');
}
function closeDayModal() { $('#day-modal').classList.add('hidden'); editingDay = null; }

$('#modal-save').addEventListener('click', () => {
  if (editingDay === null) return;
  const plan = weekPlan();
  plan[editingDay] = { workout: $('#modal-workout').value.trim(), carb: $('#modal-carb').value };
  store.set('weekPlan', plan);
  closeDayModal();
  renderPlan(); renderToday();
});
$('#modal-cancel').addEventListener('click', closeDayModal);
$('#day-modal').addEventListener('click', e => { if (e.target.id === 'day-modal') closeDayModal(); });
$('#plan-reset').addEventListener('click', () => {
  if (!confirm('回復成預設課表？')) return;
  store.set('weekPlan', DEFAULT_PLAN.map(x => ({ ...x })));
  renderPlan(); renderToday();
});

$$('#plan-seg .seg-btn').forEach(b => b.addEventListener('click', () => {
  $$('#plan-seg .seg-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  $('#plan-workout').classList.toggle('hidden', b.dataset.seg !== 'workout');
  $('#plan-diet').classList.toggle('hidden', b.dataset.seg !== 'diet');
}));

/* ---------- 進度 ---------- */
$('#log-date').value = todayKey();
$('#log-save').addEventListener('click', () => {
  const date = $('#log-date').value || todayKey();
  const w = +$('#log-weight').value, bf = +$('#log-bf').value;
  if (!w && !bf) return;
  const logs = store.get('logs', []);
  const i = logs.findIndex(l => l.date === date);
  const entry = { date, w: w || null, bf: bf || null };
  if (i >= 0) logs[i] = { ...logs[i], ...entry }; else logs.push(entry);
  logs.sort((a, b) => a.date.localeCompare(b.date));
  store.set('logs', logs);
  $('#log-weight').value = ''; $('#log-bf').value = '';
  renderLog();
});

let curRange = 7;
$$('#range-seg .seg-btn').forEach(b => b.addEventListener('click', () => {
  $$('#range-seg .seg-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active'); curRange = +b.dataset.range; renderLog();
}));

function withinRange(dateStr, days) {
  if (!days) return true;
  const diff = (Date.now() - new Date(dateStr).getTime()) / 86400000;
  return diff <= days;
}

function renderLog() {
  const allLogs = store.get('logs', []);
  const logs = allLogs.filter(l => withinRange(l.date, curRange));

  // 歷史清單
  const ul = $('#history-list'); ul.innerHTML = '';
  if (!allLogs.length) ul.innerHTML = '<div class="empty">還沒有紀錄，記下今天的數字開始吧</div>';
  [...allLogs].reverse().forEach(l => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="h-date">${l.date.slice(5)}</span>
      <span>${l.w ? l.w + ' kg' : '—'} · ${l.bf ? l.bf + '%' : '—'}</span>
      <span class="h-del" data-date="${l.date}">刪除</span>`;
    li.querySelector('.h-del').addEventListener('click', () => {
      store.set('logs', store.get('logs', []).filter(x => x.date !== l.date)); renderLog();
    });
    ul.appendChild(li);
  });

  // 摘要（體重 + 體脂變化）
  const wPts = logs.filter(l => l.w);
  const bfPts = logs.filter(l => l.bf);
  let html = '';
  if (wPts.length >= 2) {
    const dw = (wPts[wPts.length - 1].w - wPts[0].w).toFixed(1);
    html += `<div><span>體重</span><b class="${dw <= 0 ? 'down' : 'up'}">${dw > 0 ? '+' : ''}${dw} kg</b></div>`;
  }
  if (bfPts.length >= 2) {
    const db = (bfPts[bfPts.length - 1].bf - bfPts[0].bf).toFixed(1);
    html += `<div><span>體脂</span><b class="${db <= 0 ? 'down' : 'up'}">${db > 0 ? '+' : ''}${db} %</b></div>`;
  }
  $('#log-summary').innerHTML = html || '<div class="empty">此區間資料不足，無法計算變化</div>';

  drawChart(logs);
  renderWorkoutSummary();
  renderDynamicTarget();
  updateBackupStatus();
}

/* 動態目標：依體重趨勢建議調整 */
function renderDynamicTarget() {
  const box = $('#dynamic-target'); if (!box) return;
  const logs = store.get('logs', []).filter(l => l.w);
  if (logs.length < 3) {
    box.innerHTML = '<div class="empty">記錄 3 次以上體重（建議橫跨 1-2 週）後，這裡會分析趨勢並建議是否調整熱量。</div>';
    return;
  }
  // 取最近 14 天的資料算每週變化
  const now = Date.now();
  const recent = logs.filter(l => (now - new Date(l.date).getTime()) / 86400000 <= 16);
  const pts = recent.length >= 3 ? recent : logs.slice(-4);
  const first = pts[0], last = pts[pts.length - 1];
  const days = Math.max(1, (new Date(last.date) - new Date(first.date)) / 86400000);
  const totalChange = last.w - first.w;
  const perWeek = totalChange / days * 7;

  const g = budgetGoals();
  // 減脂理想：每週 -0.4 ~ -0.8 kg
  let status, advice, cls;
  if (perWeek <= -0.9) {
    status = '掉太快'; cls = 'warn';
    advice = `每週 ${perWeek.toFixed(1)}kg 偏快，可能掉肌肉。建議熱量目標往上加約 100 kcal（目前 ${g.kcalGoal}）。`;
  } else if (perWeek <= -0.3) {
    status = '理想範圍'; cls = 'ok';
    advice = `每週 ${perWeek.toFixed(1)}kg，速度剛好，維持目前 ${g.kcalGoal} kcal 即可。`;
  } else if (perWeek < 0) {
    status = '偏慢'; cls = 'warn';
    advice = `每週 ${perWeek.toFixed(1)}kg 有點慢。可把熱量目標下修約 100 kcal，或增加 NEAT（多走 2000 步）。`;
  } else {
    status = '停滯/上升'; cls = 'bad';
    advice = `近期體重 ${perWeek >= 0 ? '沒降' : ''}（每週 ${perWeek.toFixed(1)}kg）。可能遇到停滯期，建議熱量目標下修 150 kcal 或增加活動量。目前 ${g.kcalGoal} kcal。`;
  }
  box.innerHTML = `
    <div class="dt-row"><span>分析區間</span><b>${first.date.slice(5)} → ${last.date.slice(5)}（${Math.round(days)}天）</b></div>
    <div class="dt-row"><span>每週變化</span><b class="${perWeek <= 0 ? 'down' : 'up'}">${perWeek > 0 ? '+' : ''}${perWeek.toFixed(2)} kg</b></div>
    <div class="dt-status ${cls}">${status}</div>
    <p class="dt-advice">${advice}</p>
    <button class="ghost-btn" id="dt-apply">套用建議到計算頁</button>`;

  const applyBtn = $('#dt-apply');
  if (applyBtn) applyBtn.addEventListener('click', () => {
    let delta = 0;
    if (perWeek <= -0.9) delta = 100;
    else if (perWeek > 0) delta = -150;
    else if (perWeek > -0.3) delta = -100;
    if (delta === 0) { alert('目前速度理想，不需調整'); return; }
    const newGoal = g.kcalGoal + delta;
    store.set('kcalIntakeGoal', newGoal);
    // 同步反推缺口顯示
    const profile = store.get('profile', DEFAULTS);
    const tdee = profile.bmr * profile.act;
    const ov = store.get('overrides', {});
    ov.deficit = Math.round(tdee - newGoal);
    store.set('overrides', ov);
    loadCalcInputs(); calc(); renderToday();
    alert(`已將每日熱量目標調整為 ${newGoal} kcal`);
  });
}

function drawChart(logs) {
  const cv = $('#chart');
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth || 320, h = 200;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const wPts = logs.filter(l => l.w);
  const bfPts = logs.filter(l => l.bf);
  if (wPts.length < 2 && bfPts.length < 2) {
    ctx.fillStyle = '#98989d'; ctx.font = '14px -apple-system,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('累積 2 筆以上資料即顯示曲線', w / 2, h / 2);
    return;
  }
  const padL = 34, padR = 38, padT = 16, padB = 22;
  const times = logs.map(l => new Date(l.date).getTime());
  const tMin = Math.min(...times), tMax = Math.max(...times);
  const xt = t => tMax === tMin ? (padL + (w - padL - padR) / 2) : padL + (w - padL - padR) * (t - tMin) / (tMax - tMin);

  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const txtColor = isDark ? '#98989d' : '#8e8e93';

  // 計算各自範圍（加 padding）
  function range(pts, key) {
    const v = pts.map(p => p[key]);
    let mn = Math.min(...v), mx = Math.max(...v);
    if (mn === mx) { mn -= 1; mx += 1; }
    const pad = (mx - mn) * 0.15;
    return { mn: mn - pad, mx: mx + pad };
  }
  const wR = wPts.length ? range(wPts, 'w') : null;
  const bR = bfPts.length ? range(bfPts, 'bf') : null;

  // 水平格線 + 左右刻度
  ctx.font = '10px -apple-system,sans-serif';
  const rows = 4;
  for (let i = 0; i <= rows; i++) {
    const y = padT + (h - padT - padB) * i / rows;
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    if (wR) {
      const val = wR.mx - (wR.mx - wR.mn) * i / rows;
      ctx.fillStyle = '#0a84ff'; ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1), padL - 4, y + 3);
    }
    if (bR) {
      const val = bR.mx - (bR.mx - bR.mn) * i / rows;
      ctx.fillStyle = '#ff9f0a'; ctx.textAlign = 'left';
      ctx.fillText(val.toFixed(1), w - padR + 4, y + 3);
    }
  }

  function line(pts, key, color, R, fill) {
    if (pts.length < 2) return;
    const y = v => padT + (h - padT - padB) * (1 - (v - R.mn) / (R.mx - R.mn));
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
    pts.forEach((p, i) => { const x = xt(new Date(p.date).getTime()); i ? ctx.lineTo(x, y(p[key])) : ctx.moveTo(x, y(p[key])); });
    ctx.stroke();
    if (fill) {
      const rgba = color.replace('rgb(', 'rgba(').replace(')', ',0.15)');
      const g = ctx.createLinearGradient(0, padT, 0, h - padB);
      g.addColorStop(0, rgba); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.lineTo(xt(new Date(pts[pts.length - 1].date).getTime()), h - padB);
      ctx.lineTo(xt(new Date(pts[0].date).getTime()), h - padB); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.fillStyle = color;
    pts.forEach(p => { ctx.beginPath(); ctx.arc(xt(new Date(p.date).getTime()), y(p[key]), 3, 0, 7); ctx.fill(); });
  }
  if (wR) line(wPts, 'w', 'rgb(10,132,255)', wR, true);
  if (bR) line(bfPts, 'bf', 'rgb(255,159,10)', bR, false);
}

function renderWorkoutSummary() {
  const days = curRange || 30;
  $('#workout-range-label').textContent = curRange ? `近 ${curRange} 天` : '全部(近30天)';
  const all = store.get('days', {});
  const pcts = [];
  let recorded = 0;
  Object.entries(all).forEach(([date, d]) => {
    if (!withinRange(date, days)) return;
    if (d.workoutPct != null) { pcts.push(d.workoutPct); recorded++; }
  });
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  const fullDays = pcts.filter(p => p >= 100).length;
  $('#workout-summary').innerHTML = `
    <div class="wk-rate"><b>${avg}%</b><span>平均完成度</span></div>
    <div class="wk-cells">
      <div class="wk-cell ok"><b>${recorded}</b><span>有記錄天數</span></div>
      <div class="wk-cell"><b>${fullDays}</b><span>100%達成</span></div>
    </div>`;
}

/* ---------- 資料備份 ---------- */
const BACKUP_KEYS = ['days', 'logs', 'profile', 'proteinGoal', 'customFoods', 'weekPlan', 'overrides', 'kcalIntakeGoal', 'combos', 'hiddenFoods', 'foodUsage', 'goalMode', 'carbCycle', 'macroMode', 'customMacros', 'fatPerKg', 'carbTarget', 'fatGoal', 'carbGoal'];

function buildBackup() {
  const data = { _app: 'fat-tracker', _ver: 1, _exportedAt: new Date().toISOString() };
  BACKUP_KEYS.forEach(k => { data[k] = store.get(k, null); });
  return data;
}
function markBackedUp() {
  store.set('lastBackup', Date.now());
  updateBackupStatus();
}
function updateBackupStatus() {
  const el = $('#backup-status'); if (!el) return;
  const last = +store.get('lastBackup', 0);
  if (!last) { el.textContent = '尚未備份'; el.style.color = 'var(--danger)'; return; }
  const days = Math.floor((Date.now() - last) / 86400000);
  el.textContent = days === 0 ? '今天已備份' : `上次備份 ${days} 天前`;
  el.style.color = days >= 7 ? 'var(--danger)' : 'var(--ink2)';
}

// 下載檔案
$('#export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `減脂備份_${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  markBackedUp();
});

// 分享到雲端硬碟（Web Share API）
$('#share-btn').addEventListener('click', async () => {
  const json = JSON.stringify(buildBackup(), null, 2);
  const fileName = `減脂備份_${todayKey()}.json`;
  const file = new File([json], fileName, { type: 'application/json' });
  // 優先用可分享檔案的 Web Share API（手機可選「儲存到雲端硬碟」）
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: '減脂備份', text: '減脂計畫資料備份' });
      markBackedUp();
      return;
    } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  // 不支援檔案分享 → 退回下載
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
  markBackedUp();
  alert('此瀏覽器不支援直接分享，已改為下載檔案。可手動上傳到雲端硬碟。');
});
$('#import-btn').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data._app !== 'fat-tracker') throw new Error('格式不符');
      if (!confirm('匯入會覆蓋目前所有資料，確定？')) { e.target.value = ''; return; }
      BACKUP_KEYS.forEach(k => { if (data[k] !== null && data[k] !== undefined) store.set(k, data[k]); });
      loadCalcInputs(); calc(); renderToday(); renderLog();
      if (window.Cloud && Cloud.state().signedIn) Cloud.push();
      markBackedUp();
      alert('已還原備份');
    } catch (err) {
      alert('匯入失敗：檔案格式錯誤');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

/* ---------- 雲端同步 UI ---------- */
function updateCloudUI(st, dataChanged) {
  const statusEl = $('#cloud-status');
  const hintEl = $('#cloud-hint');
  const signinBtn = $('#cloud-signin');
  const signoutBtn = $('#cloud-signout');
  if (!statusEl) return;
  if (!st.configured) {
    // 未設定 Firebase → 隱藏整張雲端卡，只用檔案備份
    const card = $('#cloud-card'); if (card) card.classList.add('hidden');
    return;
  }
  const card = $('#cloud-card'); if (card) card.classList.remove('hidden');
  signinBtn.disabled = false;
  if (st.signedIn) {
    statusEl.textContent = '已同步：' + (st.email || '');
    hintEl.textContent = '資料會在每次變動後自動上傳到雲端。換手機登入同個帳號即可還原。';
    signinBtn.classList.add('hidden');
    signoutBtn.classList.remove('hidden');
  } else {
    statusEl.textContent = '未登入';
    hintEl.textContent = '登入 Google 後，資料會自動同步到你的雲端，換手機或清快取都能還原。';
    signinBtn.classList.remove('hidden');
    signoutBtn.classList.add('hidden');
  }
  if (dataChanged) {
    loadCalcInputs(); calc(); renderToday(); renderLog();
  }
}

if (window.Cloud) {
  Cloud.init(updateCloudUI).then(ok => updateCloudUI(Cloud.state()));
  const si = $('#cloud-signin'), so = $('#cloud-signout');
  if (si) si.addEventListener('click', () => {
    if (!Cloud.state().configured) { alert('尚未設定 Firebase，請先填 firebase-config.js'); return; }
    Cloud.signIn();
  });
  if (so) so.addEventListener('click', () => Cloud.signOut());
}

/* ---------- 啟動 ---------- */
loadCalcInputs();
calc();
renderCalcOut();
renderToday();
renderPlan();
renderLog();
switchView('today');

let curDay = todayKey();
setInterval(() => {
  if (todayKey() !== curDay) {
    curDay = todayKey();
    if (viewDate < curDay) viewDate = curDay;
    renderToday();
  }
}, 30000);
// PWA 從背景喚醒時也重新檢查日期
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayKey() !== curDay) {
    curDay = todayKey();
    if (viewDate < curDay) viewDate = curDay;
    renderToday();
  }
});

// 備份提醒：超過 7 天沒備份就提示（雲端已登入則不提醒）
setTimeout(() => {
  const cloudOn = window.Cloud && Cloud.state().signedIn;
  if (cloudOn) return;
  const last = +store.get('lastBackup', 0);
  const days = last ? Math.floor((Date.now() - last) / 86400000) : 999;
  if (days >= 7) {
    const msg = last
      ? `你已經 ${days} 天沒備份了，建議到「進度」分頁備份一次，以免資料遺失。`
      : '提醒：記得到「進度」分頁備份資料，以免清快取或換手機時遺失。';
    setTimeout(() => alert(msg), 800);
  }
}, 1500);
