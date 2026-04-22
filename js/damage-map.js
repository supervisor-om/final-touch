// ══════════════════════════════════════════════════════════════════
//  damage-map.js — Interactive car damage map (SVG top-view)
//  Mission 3: Click parts to register damages with severity + desc
// ══════════════════════════════════════════════════════════════════

/* Arabic part names */
const PART_NAMES_AR = {
  'front-bumper':     'الصدام الأمامي',
  'rear-bumper':      'الصدام الخلفي',
  'hood':             'الكبوت',
  'trunk':            'صندوق الخلف',
  'roof':             'السقف',
  'windshield':       'الزجاج الأمامي',
  'rear-window':      'الزجاج الخلفي',
  'left-front-door':  'الباب الأمامي الأيسر',
  'right-front-door': 'الباب الأمامي الأيمن',
  'left-rear-door':   'الباب الخلفي الأيسر',
  'right-rear-door':  'الباب الخلفي الأيمن',
  'left-fender':      'الرفرف الأيسر',
  'right-fender':     'الرفرف الأيمن',
  'left-quarter':     'الجنب الخلفي الأيسر',
  'right-quarter':    'الجنب الخلفي الأيمن',
  'left-headlight':   'المصباح الأمامي الأيسر',
  'right-headlight':  'المصباح الأمامي الأيمن',
  'left-taillight':   'المصباح الخلفي الأيسر',
  'right-taillight':  'المصباح الخلفي الأيمن',
  'left-mirror':      'المرآة الجانبية اليسرى',
  'right-mirror':     'المرآة الجانبية اليمنى',
  'wheel-fl':         'الإطار الأمامي الأيسر',
  'wheel-fr':         'الإطار الأمامي الأيمن',
  'wheel-rl':         'الإطار الخلفي الأيسر',
  'wheel-rr':         'الإطار الخلفي الأيمن',
};

const SEV_AR = { light: 'خفيف', medium: 'متوسط', heavy: 'شديد' };

/* Builds the SVG top-view HTML string */
function buildCarSVG(damageMap, idPrefix) {
  const prefix = idPrefix || 'dmap';
  const d = damageMap || [];

  function partFill(part) {
    const hit = d.find(x => x.part === part);
    if (!hit) return 'rgba(79,172,254,.18)';
    if (hit.severity === 'light')  return 'rgba(245,166,35,.45)';
    if (hit.severity === 'heavy')  return 'rgba(155,89,182,.65)';
    return 'rgba(233,69,96,.55)';
  }
  function partStroke(part) {
    const hit = d.find(x => x.part === part);
    if (!hit) return 'rgba(79,172,254,.5)';
    if (hit.severity === 'light')  return '#f5a623';
    if (hit.severity === 'heavy')  return '#9b59b6';
    return '#e94560';
  }
  function cls(part) {
    const hit = d.find(x => x.part === part);
    if (!hit) return 'car-part';
    return 'car-part damaged damaged-' + hit.severity;
  }

  function part(id, shape, extraAttrs) {
    const f = partFill(id);
    const s = partStroke(id);
    const c = cls(id);
    const click = `onclick="dmapClick('${id}','${prefix}')"`;
    const title = `<title>${PART_NAMES_AR[id]||id}</title>`;
    return `<${shape} id="${prefix}-${id}" class="${c}" fill="${f}" stroke="${s}" stroke-width="1.5" ${extraAttrs} ${click}>${title}</${shape}>`;
  }

  return `
  <div class="car-svg-wrap" id="${prefix}-wrap">
    <svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <!-- ── Body outline ── -->
      <rect x="40" y="60" width="120" height="300" rx="18" ry="18"
        fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.15)" stroke-width="1"/>

      <!-- Front bumper -->
      ${part('front-bumper','rect','x="45" y="30" width="110" height="26" rx="8"')}
      <!-- Hood -->
      ${part('hood','rect','x="50" y="58" width="100" height="68" rx="6"')}
      <!-- Windshield -->
      ${part('windshield','rect','x="60" y="128" width="80" height="38" rx="4"')}
      <!-- Left headlight -->
      ${part('left-headlight','ellipse','cx="52" cy="44" rx="16" ry="8"')}
      <!-- Right headlight -->
      ${part('right-headlight','ellipse','cx="148" cy="44" rx="16" ry="8"')}
      <!-- Left mirror -->
      ${part('left-mirror','rect','x="24" y="148" width="18" height="10" rx="4"')}
      <!-- Right mirror -->
      ${part('right-mirror','rect','x="158" y="148" width="18" height="10" rx="4"')}

      <!-- Left fender -->
      ${part('left-fender','rect','x="40" y="60" width="14" height="68" rx="4"')}
      <!-- Right fender -->
      ${part('right-fender','rect','x="146" y="60" width="14" height="68" rx="4"')}

      <!-- Left front door -->
      ${part('left-front-door','rect','x="40" y="170" width="14" height="72" rx="3"')}
      <!-- Right front door -->
      ${part('right-front-door','rect','x="146" y="170" width="14" height="72" rx="3"')}

      <!-- Roof -->
      ${part('roof','rect','x="54" y="168" width="92" height="84" rx="4"')}

      <!-- Left rear door -->
      ${part('left-rear-door','rect','x="40" y="244" width="14" height="68" rx="3"')}
      <!-- Right rear door -->
      ${part('right-rear-door','rect','x="146" y="244" width="14" height="68" rx="3"')}

      <!-- Rear window -->
      ${part('rear-window','rect','x="60" y="254" width="80" height="38" rx="4"')}

      <!-- Left quarter -->
      ${part('left-quarter','rect','x="40" y="293" width="14" height="66" rx="4"')}
      <!-- Right quarter -->
      ${part('right-quarter','rect','x="146" y="293" width="14" height="66" rx="4"')}

      <!-- Trunk -->
      ${part('trunk','rect','x="50" y="294" width="100" height="66" rx="6"')}

      <!-- Rear bumper -->
      ${part('rear-bumper','rect','x="45" y="362" width="110" height="26" rx="8"')}

      <!-- Left taillight -->
      ${part('left-taillight','ellipse','cx="52" cy="375" rx="16" ry="8"')}
      <!-- Right taillight -->
      ${part('right-taillight','ellipse','cx="148" cy="375" rx="16" ry="8"')}

      <!-- Wheels -->
      ${part('wheel-fl','ellipse','cx="32" cy="100" rx="10" ry="16"')}
      ${part('wheel-fr','ellipse','cx="168" cy="100" rx="10" ry="16"')}
      ${part('wheel-rl','ellipse','cx="32" cy="310" rx="10" ry="16"')}
      ${part('wheel-rr','ellipse','cx="168" cy="310" rx="10" ry="16"')}

      <!-- Direction label -->
      <text x="100" y="18" text-anchor="middle" font-size="9" fill="rgba(255,255,255,.35)" font-family="Cairo,sans-serif">أمام</text>
      <text x="100" y="408" text-anchor="middle" font-size="9" fill="rgba(255,255,255,.35)" font-family="Cairo,sans-serif">خلف</text>
    </svg>
  </div>`;
}

/* Renders the damage list items below the SVG */
function buildDamageList(damageMap, idPrefix, readonly) {
  const d = damageMap || [];
  if (d.length === 0) return '';
  const items = d.map((dmg, i) => {
    const sev = SEV_AR[dmg.severity] || dmg.severity;
    const delBtn = readonly ? '' :
      `<button class="damage-item-del" onclick="removeDamageEntry('${idPrefix}',${i})" title="حذف">✕</button>`;
    return `<div class="damage-item">
      <span class="damage-item-icon">⚠️</span>
      <div class="damage-item-body">
        <div class="damage-item-part">${PART_NAMES_AR[dmg.part]||dmg.part}</div>
        <div class="damage-item-desc">${dmg.desc||'—'}</div>
      </div>
      <span class="damage-item-sev sev-${dmg.severity}">${sev}</span>
      ${delBtn}
    </div>`;
  }).join('');
  return `<div class="damage-list" id="${idPrefix}-dmg-list">${items}</div>`;
}

/* Inject damage map into add/edit car modals */
function injectDamageMap(containerId, damageMap, idPrefix) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="damage-map-container">
      <div class="damage-map-title">🗺️ خريطة الأضرار — انقر على الجزء لتسجيل ضرر</div>
      ${buildCarSVG(damageMap, idPrefix)}
      ${buildDamageList(damageMap, idPrefix, false)}
    </div>`;
}

/* Re-render SVG parts and list after damage change */
function refreshDamageMap(idPrefix, damageMap) {
  const wrap = document.getElementById(idPrefix + '-wrap');
  if (wrap) {
    const parent = wrap.parentElement;
    const newSvg = document.createElement('div');
    newSvg.innerHTML = buildCarSVG(damageMap, idPrefix);
    wrap.replaceWith(newSvg.firstElementChild);
  }
  const listEl = document.getElementById(idPrefix + '-dmg-list');
  if (listEl) {
    listEl.outerHTML = buildDamageList(damageMap, idPrefix, false);
  } else {
    // Append list after SVG wrap
    const container = document.querySelector(`#${idPrefix}-wrap`)?.closest('.damage-map-container');
    if (container) {
      const old = container.querySelector('.damage-list');
      if (old) old.remove();
      container.insertAdjacentHTML('beforeend', buildDamageList(damageMap, idPrefix, false));
    }
  }
}

/* Called when user clicks a car part in the SVG */
let _dmapActivePart   = null;
let _dmapActivePrefix = null;

function dmapClick(partId, prefix) {
  _dmapActivePart   = partId;
  _dmapActivePrefix = prefix;

  const nameAr = PART_NAMES_AR[partId] || partId;
  document.getElementById('dmap-modal-part-label').textContent = nameAr;
  document.getElementById('dmap-modal-desc').value = '';

  // Reset severity buttons
  document.querySelectorAll('#modal-damage-part .sev-btn').forEach(b => {
    b.className = 'sev-btn';
  });
  document.querySelector('#modal-damage-part .sev-btn[data-sev="medium"]').classList.add('sel-medium');

  openModal('modal-damage-part');
}

/* Severity button selection */
function dmapSelectSev(btn, sev) {
  document.querySelectorAll('#modal-damage-part .sev-btn').forEach(b => {
    b.className = 'sev-btn';
  });
  btn.classList.add('sel-' + sev);
}

/* Save damage from modal */
function dmapSaveDamage() {
  const prefix = _dmapActivePrefix;
  const partId = _dmapActivePart;
  if (!partId) return;

  const desc = document.getElementById('dmap-modal-desc').value.trim();
  const sevBtn = document.querySelector('#modal-damage-part .sev-btn[class*="sel-"]');
  const sev = sevBtn ? sevBtn.dataset.sev : 'medium';

  // Get the correct damageMap reference
  let damageMap;
  if (prefix === 'add-dmap') {
    if (!window._addCarDamageMap) window._addCarDamageMap = [];
    damageMap = window._addCarDamageMap;
  } else if (prefix === 'edit-dmap') {
    const carId = state.currentEditCar;
    const car   = state.cars.find(c => c.id === carId);
    if (!car) return;
    if (!car.damageMap) car.damageMap = [];
    damageMap = car.damageMap;
  }

  // Remove existing entry for this part (one per part max)
  const idx = damageMap.findIndex(x => x.part === partId);
  if (idx !== -1) damageMap.splice(idx, 1);

  damageMap.push({
    part: partId,
    desc: desc,
    severity: sev,
    date: new Date().toISOString().split('T')[0]
  });

  closeModal('modal-damage-part');
  refreshDamageMap(prefix, damageMap);

  if (prefix === 'edit-dmap') {
    saveState();
  }
}

/* Remove a damage entry by index */
function removeDamageEntry(prefix, idx) {
  let damageMap;
  if (prefix === 'add-dmap') {
    if (!window._addCarDamageMap) return;
    damageMap = window._addCarDamageMap;
  } else if (prefix === 'edit-dmap') {
    const carId = state.currentEditCar;
    const car   = state.cars.find(c => c.id === carId);
    if (!car || !car.damageMap) return;
    damageMap = car.damageMap;
  }
  damageMap.splice(idx, 1);
  refreshDamageMap(prefix, damageMap);
  if (prefix === 'edit-dmap') saveState();
}

/* Returns the damage map HTML block for the Job Card */
function buildJobCardDamageSection(damageMap) {
  if (!damageMap || damageMap.length === 0) return '';
  const rows = damageMap.map(d => `
    <div class="jc-damage-row">
      <span class="jc-damage-part">${PART_NAMES_AR[d.part]||d.part}</span>
      <span class="jc-damage-sev">${SEV_AR[d.severity]||d.severity}</span>
      <span class="jc-damage-desc">${d.desc||'—'}</span>
    </div>`).join('');

  return `<div class="jc-damage-section">
    <div class="jc-damage-title">⚠️ الأضرار المسجلة</div>
    ${rows}
    <div style="margin-top:10px;">${buildCarSVGJobCard(damageMap)}</div>
  </div>`;
}

/* Simplified SVG for job card (no click handlers, white background) */
function buildCarSVGJobCard(damageMap) {
  const d = damageMap || [];
  function f(part) {
    const hit = d.find(x => x.part === part);
    if (!hit) return '#e8e8e8';
    if (hit.severity === 'light')  return '#ffd580';
    if (hit.severity === 'heavy')  return '#c39bd3';
    return '#f1948a';
  }
  function s(part) {
    const hit = d.find(x => x.part === part);
    if (!hit) return '#ccc';
    if (hit.severity === 'light')  return '#d4a017';
    if (hit.severity === 'heavy')  return '#7d3c98';
    return '#c0392b';
  }
  const p = (id, shape, attrs) =>
    `<${shape} fill="${f(id)}" stroke="${s(id)}" stroke-width="1" ${attrs}/>`;

  return `<svg viewBox="0 0 200 420" width="120" height="252" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #ddd;border-radius:8px;background:#fff;">
    <rect x="40" y="60" width="120" height="300" rx="18" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
    ${p('front-bumper','rect','x="45" y="30" width="110" height="26" rx="8"')}
    ${p('hood','rect','x="50" y="58" width="100" height="68" rx="6"')}
    ${p('windshield','rect','x="60" y="128" width="80" height="38" rx="4"')}
    ${p('left-headlight','ellipse','cx="52" cy="44" rx="16" ry="8"')}
    ${p('right-headlight','ellipse','cx="148" cy="44" rx="16" ry="8"')}
    ${p('left-fender','rect','x="40" y="60" width="14" height="68" rx="4"')}
    ${p('right-fender','rect','x="146" y="60" width="14" height="68" rx="4"')}
    ${p('left-front-door','rect','x="40" y="170" width="14" height="72" rx="3"')}
    ${p('right-front-door','rect','x="146" y="170" width="14" height="72" rx="3"')}
    ${p('roof','rect','x="54" y="168" width="92" height="84" rx="4"')}
    ${p('left-rear-door','rect','x="40" y="244" width="14" height="68" rx="3"')}
    ${p('right-rear-door','rect','x="146" y="244" width="14" height="68" rx="3"')}
    ${p('rear-window','rect','x="60" y="254" width="80" height="38" rx="4"')}
    ${p('left-quarter','rect','x="40" y="293" width="14" height="66" rx="4"')}
    ${p('right-quarter','rect','x="146" y="293" width="14" height="66" rx="4"')}
    ${p('trunk','rect','x="50" y="294" width="100" height="66" rx="6"')}
    ${p('rear-bumper','rect','x="45" y="362" width="110" height="26" rx="8"')}
    ${p('left-taillight','ellipse','cx="52" cy="375" rx="16" ry="8"')}
    ${p('right-taillight','ellipse','cx="148" cy="375" rx="16" ry="8"')}
    ${p('wheel-fl','ellipse','cx="32" cy="100" rx="10" ry="16"')}
    ${p('wheel-fr','ellipse','cx="168" cy="100" rx="10" ry="16"')}
    ${p('wheel-rl','ellipse','cx="32" cy="310" rx="10" ry="16"')}
    ${p('wheel-rr','ellipse','cx="168" cy="310" rx="10" ry="16"')}
  </svg>`;
}
