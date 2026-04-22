function openFirebaseSetup() {
  // Show current status
  const icon = document.getElementById('fb-status-icon');
  const text = document.getElementById('fb-status-text');
  const sub  = document.getElementById('fb-status-sub');
  const card = document.getElementById('fb-status-card');
  if (syncEnabled) {
    icon.textContent = '✅';
    text.textContent = 'متصل بالسحابة';
    sub.textContent  = 'بياناتك تُحفظ تلقائياً عند كل تغيير';
    card.style.background = 'rgba(0,212,170,.08)';
    card.style.borderColor = 'rgba(0,212,170,.3)';
  } else {
    icon.textContent = '⚠️';
    text.textContent = 'غير متصل';
    sub.textContent  = 'اضغط "إعادة الاتصال" للمحاولة';
    card.style.background = 'rgba(245,166,35,.08)';
    card.style.borderColor = 'rgba(245,166,35,.3)';
  }
  document.getElementById('firebase-status').innerHTML = '';
  openModal('modal-firebase');
}

async function reconnectFirebase() {
  const statusEl = document.getElementById('firebase-status');
  const icon = document.getElementById('fb-status-icon');
  const text = document.getElementById('fb-status-text');
  const sub  = document.getElementById('fb-status-sub');
  const card = document.getElementById('fb-status-card');
  icon.textContent = '⏳';
  text.textContent = 'جاري الاتصال...';
  sub.textContent  = '';
  card.style.background = 'rgba(79,172,254,.08)';
  card.style.borderColor = 'rgba(79,172,254,.2)';
  const ok = await checkFirebase();
  if (ok) {
    icon.textContent = '✅';
    text.textContent = 'تم الاتصال!';
    sub.textContent  = 'بياناتك تُحفظ تلقائياً الآن';
    card.style.background = 'rgba(0,212,170,.08)';
    card.style.borderColor = 'rgba(0,212,170,.3)';
    statusEl.innerHTML = '';
    setTimeout(() => closeModal('modal-firebase'), 1500);
  } else {
    icon.textContent = '❌';
    text.textContent = 'فشل الاتصال';
    sub.textContent  = 'تحقق من الإنترنت وحاول مجدداً';
    card.style.background = 'rgba(233,69,96,.08)';
    card.style.borderColor = 'rgba(233,69,96,.3)';
  }
}

// ══════════════════════════════════════════
// QUICK FORM HELPERS
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// ☁️ FIREBASE REST API SYNC (No SDK needed)
// ══════════════════════════════════════════

const FB_PROJECT  = "i-hope-1-2-3-4-5-6-7";
const FB_API_KEY  = "AIzaSyC7RmJuO7_sYa4wcErz4XNyguYIygY_ts8";
const FB_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;
const FB_DOC_PATH = "workshop/data";

let syncEnabled  = false;
let saveTimeout  = null;
let lastSaveHash = '';

try {
  document.getElementById('today-date').textContent=new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('exp-date').value=today();
  renderAll();
} catch(e) { console.warn('Init render error:', e); }

// ── Firestore value converters ──────────────────────────────────────────────
function toFirestore(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number')  return { doubleValue: val };
  if (typeof val === 'string')  return { stringValue: val };
  if (Array.isArray(val))       return { arrayValue: { values: val.map(toFirestore) } };
  if (typeof val === 'object')  return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k,v]) => [k, toFirestore(v)])) } };
  return { stringValue: String(val) };
}

function fromFirestore(val) {
  if (!val) return null;
  if ('nullValue'    in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue);
  if ('doubleValue'  in val) return parseFloat(val.doubleValue);
  if ('stringValue'  in val) return val.stringValue;
  if ('arrayValue'   in val) return (val.arrayValue.values || []).map(fromFirestore);
  if ('mapValue'     in val) return Object.fromEntries(Object.entries(val.mapValue.fields || {}).map(([k,v]) => [k, fromFirestore(v)]));
  return null;
}

function dataToDocument(data) {
  return { fields: Object.fromEntries(Object.entries(data).map(([k,v]) => [k, toFirestore(v)])) };
}

function documentToData(doc) {
  if (!doc || !doc.fields) return null;
  return Object.fromEntries(Object.entries(doc.fields).map(([k,v]) => [k, fromFirestore(v)]));
}

// ── Firestore fetch with timeout ─────────────────────────────────────────────
function fetchWithTimeout(url, options = {}, ms = 10000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal })
    .finally(() => clearTimeout(id));
}

// ── Check connection ─────────────────────────────────────────────────────────
async function checkFirebase() {
  try {
    showSyncStatus('saving');
    const url = FB_BASE_URL + '/' + FB_DOC_PATH + '?key=' + FB_API_KEY;
    const res = await fetchWithTimeout(url);

    if (res.status === 200 || res.status === 404) {
      syncEnabled = true;
      try { await loadFromCloud(); } catch(e) { console.warn('loadFromCloud error:', e); }
      showSyncStatus('online');
      showSyncBanner('ok', '☁️ السحابة متصلة — بياناتك محفوظة تلقائياً');
      return true;
    }
    if (res.status === 403) {
      showSyncBanner('error', '⚠️ خطأ في الصلاحيات — تحقق من Firestore Rules');
      return false;
    }
    if (res.status === 400) {
      showSyncBanner('error', '⚠️ قاعدة البيانات غير موجودة في Firebase Console');
      return false;
    }
    throw new Error('HTTP ' + res.status);
  } catch(e) {
    if (e.name === 'AbortError') {
      showSyncBanner('warn', '⚠️ انتهت مهلة الاتصال — سيُعاد المحاولة تلقائياً');
    } else if (e.name === 'TypeError') {
      showSyncBanner('warn', '⚠️ لا يوجد اتصال بالإنترنت — البيانات محفوظة محلياً');
    } else {
      showSyncBanner('error', '⚠️ ' + e.message);
    }
    syncEnabled = false;
    showSyncStatus('offline');
    return false;
  }
}

function showSyncBanner(type, msg) {
  // Remove old banner
  const old = document.getElementById('sync-banner');
  if (old) old.remove();

  const colors = {
    error: { bg:'rgba(233,69,96,.12)', border:'rgba(233,69,96,.3)', text:'#e94560' },
    warn:  { bg:'rgba(245,166,35,.1)', border:'rgba(245,166,35,.3)', text:'#f5a623' },
    ok:    { bg:'rgba(0,212,170,.08)', border:'rgba(0,212,170,.3)',  text:'#00d4aa' },
  };
  const c = colors[type] || colors.warn;
  const banner = document.createElement('div');
  banner.id = 'sync-banner';
  banner.style.cssText = `position:fixed;top:65px;left:50%;transform:translateX(-50%);z-index:999;background:${c.bg};border:1px solid ${c.border};color:${c.text};padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;font-family:var(--font-main);direction:rtl;max-width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.3);`;
  banner.innerHTML = msg + ' <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;margin-right:8px;font-size:16px;">✕</button>';
  document.body.appendChild(banner);
  if (type === 'ok') setTimeout(() => banner.remove(), 4000);
}

// ── Load from cloud ──────────────────────────────────────────────────────────
async function loadFromCloud() {
  try {
    const url = `${FB_BASE_URL}/${FB_DOC_PATH}?key=${FB_API_KEY}`;
    const res = await fetchWithTimeout(url);
    if (res.status === 404) {
      // No data yet — push local
      await saveToCloud(true);
      showSyncStatus('saved');
      return;
    }
    if (!res.ok) throw new Error('Load failed: ' + res.status);
    const doc  = await res.json();
    const data = documentToData(doc);
    if (!data) { showSyncStatus('online'); return; }

    const remoteTime = data.updatedAt ? new Date(data.updatedAt) : new Date(0);
    const localTime  = state.updatedAt ? new Date(state.updatedAt) : new Date(0);

    if (remoteTime > localTime) {
      // Remote is newer → use it
      Object.assign(state, {
        cars:           data.cars           || state.cars,
        orders:         data.orders         || state.orders,
        services:       data.services       || state.services,
        stages:         data.stages         || state.stages,
        stageTemplates: data.stageTemplates || state.stageTemplates,
        expenses:       data.expenses       || state.expenses,
        invoices:       data.invoices       || state.invoices,
        invoiceCounter: data.invoiceCounter || state.invoiceCounter,
        alertDays:      data.alertDays      || state.alertDays,
        updatedAt:      data.updatedAt,
      });
      syncStageArrays();
      _origSaveState(); // save locally only — don't re-upload to cloud
      renderAll();
      showSyncStatus('synced');
      showSyncBanner('ok', '🔄 تم استقبال تحديثات جديدة من السحابة');
    } else {
      // Local is newer → push to cloud
      await saveToCloud(true);
    }
  } catch(e) {
    console.warn('Load error:', e.message);
    showSyncStatus('offline');
  }
}

// ── Save to cloud ────────────────────────────────────────────────────────────
async function saveToCloud(immediate = false) {
  if (!syncEnabled) return;

  const dataToSave = {
    cars:           state.cars,
    orders:         state.orders,
    services:       state.services,
    expenses:       state.expenses,
    invoices:       state.invoices,
    invoiceCounter: state.invoiceCounter,
    alertDays:      state.alertDays,
    updatedAt:      new Date().toISOString(),
  };

  // Debounce saves (wait 1.5s after last change)
  if (!immediate) {
    clearTimeout(saveTimeout);
    showSyncStatus('saving');
    saveTimeout = setTimeout(() => saveToCloud(true), 1500);
    return;
  }

  try {
    const url = `${FB_BASE_URL}/${FB_DOC_PATH}?key=${FB_API_KEY}`;
    const body = JSON.stringify(dataToDocument(dataToSave));
    const res  = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!res.ok) throw new Error('Save failed: ' + res.status);
    state.updatedAt = dataToSave.updatedAt;
    showSyncStatus('saved');
    setTimeout(() => showSyncStatus('online'), 2000);
  } catch(e) {
    console.warn('Save error:', e.message);
    showSyncStatus('error');
  }
}

// ── Status indicator ─────────────────────────────────────────────────────────
function showSyncStatus(status) {
  const map = {
    offline: { icon:'💾', text:'محلي فقط',     color:'#8892a4' },
    online:  { icon:'☁️', text:'متصل بالسحابة', color:'#00d4aa' },
    saving:  { icon:'⏳', text:'جاري الحفظ...',  color:'#f5a623' },
    saved:   { icon:'✅', text:'تم الحفظ',       color:'#00d4aa' },
    synced:  { icon:'🔄', text:'تم التزامن',     color:'#4facfe' },
    error:   { icon:'⚠️', text:'خطأ الاتصال',   color:'#e94560' },
  };
  const s = map[status] || map.offline;
  const html = `<span style="color:${s.color};font-size:12px;font-weight:700;">${s.icon} ${s.text}</span>`;
  const el1 = document.getElementById('sync-indicator');
  const el2 = document.getElementById('sync-indicator-side');
  if (el1) el1.innerHTML = html;
  if (el2) el2.innerHTML = html;
  // Update cloud button color
  const btn = document.getElementById('cloud-btn');
  if (btn) {
    const connected = (status === 'online' || status === 'saved' || status === 'synced');
    btn.style.color       = connected ? '#00d4aa' : '#4facfe';
    btn.style.borderColor = connected ? 'rgba(0,212,170,.3)' : 'rgba(79,172,254,.2)';
    btn.style.background  = connected ? 'rgba(0,212,170,.08)' : 'rgba(79,172,254,.1)';
    btn.textContent = connected ? '✅ السحابة متصلة' : '☁️ حالة السحابة';
  }
}

// ── Override saveState ───────────────────────────────────────────────────────
const _origSaveState = saveState;
saveState = function() {
  _origSaveState();
  if (syncEnabled) saveToCloud(false);
};

// ── Poll cloud every 15s for changes from other browsers ─────────────────────
async function pollCloud() {
  if (!syncEnabled) return;
  try {
    const url = `${FB_BASE_URL}/${FB_DOC_PATH}?key=${FB_API_KEY}&mask.fieldPaths=updatedAt`;
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) return;
    const doc  = await res.json();
    const fld  = doc.fields && doc.fields.updatedAt;
    if (!fld) return;
    const remoteTime = new Date(fld.stringValue || 0);
    const localTime  = state.updatedAt ? new Date(state.updatedAt) : new Date(0);
    if (remoteTime > localTime) {
      await loadFromCloud();
    }
  } catch(e) { /* silent */ }
}

// ── Init — called directly (not waiting for 'load') so CDN delays don't block
(async function initFirebase() {
  try {
    const ok = await checkFirebase();
    // Poll every 15s for live updates from other browsers/devices
    setInterval(pollCloud, 15000);
    if (!ok) {
      // Retry every 30s until connected (max 10 min)
      let retryCount = 0;
      const retryInterval = setInterval(async () => {
        if (syncEnabled) { clearInterval(retryInterval); return; }
        retryCount++;
        await checkFirebase();
        if (retryCount >= 20) clearInterval(retryInterval);
      }, 30000);
    }
  } catch(e) {
    console.error('Firebase init error:', e);
    showSyncStatus('offline');
  }
})();


if (typeof syncEnabled !== 'undefined' && !syncEnabled) {
  (async function() {
    try { await checkFirebase(); setInterval(pollCloud, 15000); } catch(e) {}
  })();
}


<!-- ═══════════════════════════════════════════
     CUSTOMER TRACKING OVERLAY
═══════════════════════════════════════════ -->
<div id="customer-tracking-overlay" style="display:none;position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);overflow-y:auto;direction:rtl;font-family:'Cairo',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:30px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:30px;">
      <img id="trk-logo" src="" style="width:110px;height:110px;object-fit:contain;mix-blend-mode:screen;filter:brightness(1.1);margin-bottom:12px;">
      <div style="font-family:'Tajawal',sans-serif;font-size:22px;font-weight:900;color:#fff;">اللمسة الأخيرة</div>
      <div style="font-size:12px;color:#8892a4;letter-spacing:1px;">THE FINAL TOUCH</div>
    </div>

    <!-- Search box (shown when no car found yet) -->
    <div id="trk-search-box">
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:12px;">🔍</div>
        <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:6px;">تتبع سيارتك</div>
        <div style="font-size:13px;color:#8892a4;margin-bottom:20px;">أدخل رقم لوحة السيارة لمتابعة حالة الإصلاح</div>
        <div style="display:flex;gap:10px;max-width:360px;margin:0 auto;">
          <input type="text" id="trk-plate-input" placeholder="مثال: 12345 ع م" 
            style="flex:1;padding:12px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:#fff;font-family:'Cairo',sans-serif;font-size:14px;text-align:center;direction:rtl;"
            onkeypress="if(event.key==='Enter')searchCar()">
          <button onclick="searchCar()" style="padding:12px 20px;background:linear-gradient(135deg,#e94560,#ff6b35);border:none;border-radius:12px;color:white;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;">بحث 🔍</button>
        </div>
        <div id="trk-error" style="margin-top:14px;color:#e94560;font-size:13px;display:none;">⚠️ لم يتم العثور على سيارة بهذا الرقم</div>
      </div>
    </div>

    <!-- Car result card (hidden until search) -->
    <div id="trk-result" style="display:none;">

      <!-- Car info -->
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <div>
            <div style="font-size:22px;font-weight:900;color:#fff;" id="trk-car-plate">—</div>
            <div style="font-size:14px;color:#8892a4;margin-top:2px;" id="trk-car-model">—</div>
          </div>
          <div id="trk-status-badge"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <div style="color:#8892a4;margin-bottom:3px;">👤 المالك</div>
            <div style="color:#fff;font-weight:600;" id="trk-owner">—</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <div style="color:#8892a4;margin-bottom:3px;">🔧 نوع الخدمة</div>
            <div style="color:#fff;font-weight:600;" id="trk-service">—</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <div style="color:#8892a4;margin-bottom:3px;">📅 تاريخ الدخول</div>
            <div style="color:#fff;font-weight:600;" id="trk-date-in">—</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <div style="color:#8892a4;margin-bottom:3px;">⏱️ أيام في الورشة</div>
            <div style="font-weight:700;" id="trk-days">—</div>
          </div>
        </div>
        <!-- Expected delivery - full width -->
        <div id="trk-expected-box" style="background:rgba(0,212,170,0.06);border:1px solid rgba(0,212,170,0.2);border-radius:10px;padding:14px;margin-top:10px;display:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="color:#8892a4;font-size:12px;margin-bottom:3px;">🗓️ تاريخ التسليم المتوقع</div>
              <div style="color:#00d4aa;font-weight:800;font-size:16px;" id="trk-expected-date">—</div>
            </div>
            <div id="trk-days-left-badge"></div>
          </div>
        </div>
        
        </div>
      </div>

      <!-- Stages tracker -->
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;margin-bottom:16px;">
        <div style="font-size:14px;font-weight:700;color:#8892a4;margin-bottom:18px;text-align:center;">📋 مراحل الإصلاح</div>
        <div id="trk-stages-display" style="display:flex;flex-direction:column;gap:12px;"></div>
      </div>

      <!-- Payment info -->
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;margin-bottom:16px;" id="trk-payment-box">
        <div style="font-size:14px;font-weight:700;color:#8892a4;margin-bottom:14px;">💰 معلومات الدفع</div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;">
          <span style="color:#8892a4;">المبلغ الإجمالي</span>
          <span style="color:#fff;font-weight:700;" id="trk-amount">—</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;">
          <span style="color:#8892a4;">✅ المدفوع</span>
          <span style="color:#00d4aa;font-weight:700;" id="trk-paid">—</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:800;" id="trk-remaining-row">
          <span style="color:#8892a4;">⏳ المتبقي</span>
          <span id="trk-remaining">—</span>
        </div>
      </div>

      <!-- Notes -->
      <div id="trk-notes-box" style="background:rgba(79,172,254,0.06);border:1px solid rgba(79,172,254,0.2);border-radius:20px;padding:20px;margin-bottom:16px;display:none;">
        <div style="font-size:14px;font-weight:700;color:#4facfe;margin-bottom:10px;">📝 ملاحظات الورشة</div>
        <div id="trk-notes-text" style="font-size:13px;color:#eaeaea;line-height:1.7;"></div>
      </div>

      <!-- WhatsApp Notification Info (in print/share view) -->
      <div style="background:rgba(37,211,102,0.06);border:1px solid rgba(37,211,102,0.2);border-radius:16px;padding:14px;margin-bottom:12px;text-align:center;">
        <div style="font-size:13px;color:#25d366;font-weight:700;margin-bottom:6px;">📱 إشعارات WhatsApp</div>
        <div style="font-size:11px;color:#8892a4;">تواصل مع الورشة لتفعيل إشعارات WhatsApp لسيارتك</div>
      </div>

      <!-- Search again -->
      <button onclick="resetTracking()" style="width:100%;padding:13px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#eaeaea;font-family:'Cairo',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px;">🔍 البحث عن سيارة أخرى</button>
    </div>

    <div style="text-align:center;margin-top:20px;font-size:11px;color:#4a5568;">
      © اللمسة الأخيرة للصيانة والسمكرة والدهان
    </div>
  </div>
</div>
