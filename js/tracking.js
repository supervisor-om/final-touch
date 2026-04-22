function getTrackingURL(car) {
  const base = window.location.origin + window.location.pathname;
  return base + '?track=' + encodeURIComponent(car.plate);
}

function renderTrackingPage() {
  // Populate WA car select
  const sel = document.getElementById('wa-car-select');
  if (!sel) return;
  const active = state.cars.filter(c => c.status !== 'delivered');
  sel.innerHTML = active.length
    ? active.map(c => `<option value="${c.id}">${c.plate} — ${c.owner}</option>`).join('')
    : '<option value="">لا توجد سيارات نشطة</option>';
  previewWA();

  // Tracking links table
  const tbody = document.getElementById('tracking-links-table');
  if (!tbody) return;
  tbody.innerHTML = active.length ? active.map(c => {
    const url = getTrackingURL(c);
    const stg = STAGE_ICONS[c.stage||0] + ' ' + STAGES[c.stage||0];
    return `<tr>
      <td><strong>${c.plate}</strong></td>
      <td>${c.owner}</td>
      <td><span class="badge badge-progress">${stg}</span></td>
      <td>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="btn btn-outline btn-sm" onclick="copyLink('${url}')" title="نسخ الرابط">📋 نسخ الرابط</button>
          <button class="btn btn-success btn-sm" onclick="sendWAById('${c.id}')">📱 واتساب</button>
        </div>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">🔍</div><p>لا توجد سيارات نشطة</p></div></td></tr>';

  // Stats
  document.getElementById('trk-total').textContent    = state.cars.filter(c=>c.status!=='delivered').length;
  document.getElementById('trk-waiting').textContent  = state.cars.filter(c=>c.status==='waiting').length;
  document.getElementById('trk-progress').textContent = state.cars.filter(c=>c.status==='progress').length;
  document.getElementById('trk-done').textContent     = state.cars.filter(c=>c.status==='done').length;
}

function previewWA() {
  const sel = document.getElementById('wa-car-select');
  if (!sel || !sel.value) return;
  const car = state.cars.find(c => c.id === sel.value);
  if (!car) return;
  const url = getTrackingURL(car);
  const stage = STAGE_LABELS[car.stage||0];
  const msgLines = [
    'مرحباً ' + car.owner + ' 👋',
    '',
    'سيارتك ' + car.plate + ' (' + (car.model||'') + ')',
    'الحالة الحالية: ' + stage,
    '',
    '📱 تابع سيارتك مباشرة:',
    url,
    '🔑 رقم لوحتك: ' + car.plate,
    '',
    'ورشة اللمسة الأخيرة 🔧'
  ];
  const msg = msgLines.join('\n');
  document.getElementById('wa-msg-preview').innerHTML = msg.replace(/\n/g,'<br>').replace(/\*(.*?)\*/g,'<strong>$1</strong>');
  document.getElementById('wa-preview').style.display = 'block';
}

function sendWhatsApp() {
  const sel = document.getElementById('wa-car-select');
  if (!sel || !sel.value) return;
  sendWAById(sel.value);
}

function sendWAById(carId) {
  const car = state.cars.find(c => c.id === carId);
  if (!car) return;
  const url = getTrackingURL(car);
  const stage = STAGE_LABELS[car.stage||0];
  const nl = '\n';
  const msg = 'مرحباً ' + car.owner + ' 👋' + nl + nl +
    'سيارتك ' + car.plate + ' (' + (car.model||'') + ')' + nl +
    'الحالة الحالية: ' + stage + nl + nl +
    'يمكنك متابعة سيارتك لحظة بلحظة عبر الرابط:' + nl +
    url + nl + nl +
    'ورشة اللمسة الأخيرة 🔧';
  const phone = car.phone ? car.phone.replace(/[^0-9]/g, '') : '';
  const waURL = phone
    ? 'whatsapp://send?phone=' + phone + '&text=' + encodeURIComponent(msg)
    : 'whatsapp://send?text=' + encodeURIComponent(msg);
  window.open(waURL, '_blank');
}

function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('✅ تم نسخ الرابط!');
  }).catch(() => {
    prompt('انسخ الرابط:', url);
  });
}

// ── CUSTOMER TRACKING PAGE (standalone) ─────────────────────────────────────
function initCustomerTracking() {
  const params = new URLSearchParams(window.location.search);
  const plate  = params.get('track');
  if (!plate) return;

  // Show the overlay
  document.getElementById('customer-tracking-overlay').style.display = 'block';
  document.getElementById('trk-logo').src = 'data:image/png;base64,' + LOGO_B64;

  // Pre-fill and search
  document.getElementById('trk-plate-input').value = decodeURIComponent(plate);
  searchCar();
}

function searchCar() {
  const input = document.getElementById('trk-plate-input').value.trim().toLowerCase();
  if (!input) return;

  const car = state.cars.find(c => c.plate.trim().toLowerCase() === input);
  document.getElementById('trk-error').style.display = 'none';
  document.getElementById('trk-result').style.display = 'none';

  if (!car) {
    document.getElementById('trk-error').style.display = 'block';
    return;
  }

  showCarTracking(car);
}

function showCarTracking(car) {
  const stage   = car.stage || 0;
  const days    = Math.floor((Date.now() - new Date(car.dateIn)) / (1000*60*60*24));
  const amount  = car.estimate || 0;
  const paid    = car.paidTotal || 0;
  const remaining = Math.max(0, amount - paid);

  // Status badge
  const statusMap = {
    waiting:   '<span style="background:rgba(245,166,35,.2);color:#f5a623;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">⏳ في الانتظار</span>',
    progress:  '<span style="background:rgba(79,172,254,.2);color:#4facfe;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">🔧 تحت الإصلاح</span>',
    done:      '<span style="background:rgba(0,212,170,.2);color:#00d4aa;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">✅ جاهزة للتسليم</span>',
    delivered: '<span style="background:rgba(150,150,150,.2);color:#aaa;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">📦 تم التسليم</span>',
  };

  document.getElementById('trk-car-plate').textContent = car.plate;
  document.getElementById('trk-car-model').textContent = car.model || '';
  document.getElementById('trk-owner').textContent     = car.owner;
  document.getElementById('trk-service').textContent   = car.service;
  document.getElementById('trk-date-in').textContent   = formatDate(car.dateIn);
  document.getElementById('trk-days').innerHTML        = `<span style="color:${days > 3 ? '#e94560':'#00d4aa'}">${days} يوم${days > 3?' ⚠️':''}</span>`;
  document.getElementById('trk-status-badge').innerHTML = statusMap[car.status] || '';

  // Stages
  const stagesEl = document.getElementById('trk-stages-display');
  stagesEl.innerHTML = STAGE_LABELS.map((lbl, i) => {
    const isDone   = i < stage;
    const isActive = i === stage;
    const isPending = i > stage;
    const color = isActive ? STAGE_COLORS[i] : isDone ? '#00d4aa' : 'rgba(255,255,255,0.15)';
    const textColor = isPending ? '#4a5568' : '#eaeaea';
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 14px;background:${isActive?'rgba(233,69,96,0.08)':isDone?'rgba(0,212,170,0.05)':'rgba(255,255,255,0.02)'};border:1px solid ${color};border-radius:12px;transition:all .3s;">
        <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;${isActive?'box-shadow:0 0 12px '+color+';animation:pulse 2s infinite;':''}">
          ${isDone ? '✓' : STAGE_ICONS[i]}
        </div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:${textColor};">${lbl}</div>
          <div style="font-size:11px;color:#4a5568;margin-top:2px;">${isActive||isDone ? STAGE_DESCS[i] : '...'}</div>
        </div>
        ${isActive ? '<div style="font-size:11px;color:'+STAGE_COLORS[i]+';font-weight:700;">← الحالة الآن</div>' : ''}
        ${isDone   ? '<div style="font-size:14px;color:#00d4aa;">✓</div>' : ''}
      </div>`;
  }).join('');

  // Payment
  document.getElementById('trk-amount').textContent  = amount.toFixed(3) + ' ر.ع';
  document.getElementById('trk-paid').textContent    = paid.toFixed(3) + ' ر.ع';
  const remEl = document.getElementById('trk-remaining');
  remEl.textContent = remaining.toFixed(3) + ' ر.ع';
  remEl.style.color = remaining > 0 ? '#e94560' : '#00d4aa';
  if (remaining <= 0) {
    document.getElementById('trk-remaining-row').innerHTML = '<span style="color:#00d4aa;font-size:15px;font-weight:800;">✅ تم الدفع بالكامل</span><span style="color:#00d4aa;">✓</span>';
  }

  // Notes
  if (car.notes) {
    document.getElementById('trk-notes-text').textContent = car.notes;
    document.getElementById('trk-notes-box').style.display = 'block';
  }

  // WhatsApp notification state
  window._trkCarId = car.id;
  const notifyStatus = document.getElementById('trk-notify-status');
  const keyInput = document.getElementById('trk-wabot-key');
  if (car.waBotKey && keyInput) {
    keyInput.value = car.waBotKey;
    if (notifyStatus) {
      notifyStatus.textContent = '✅ مفتاح WhatsApp مفعّل';
      notifyStatus.style.color = '#25d366';
    }
  }

  document.getElementById('trk-result').style.display = 'block';
}

function resetTracking() {
  document.getElementById('trk-result').style.display = 'none';
  document.getElementById('trk-plate-input').value = '';
  document.getElementById('trk-error').style.display = 'none';
}

// Override showPage to also render tracking
const _origShowPage = showPage;
showPage = function(id) {
  _origShowPage(id);
  if (id === 'tracking') renderTrackingPage();
};

// Check URL on load
window.addEventListener('load', initCustomerTracking);

