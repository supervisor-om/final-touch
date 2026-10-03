// ══════════════════════════════════════════════════════════════════
//  ربحية كل سيارة وكل خدمة.
//  التكلفة المباشرة = المصروفات المربوطة بالسيارة (expense.carId).
//  المصروفات غير المربوطة (إيجار، رواتب، مرافق…) = مصروفات عامة.
//  المصروفات أصلاً ضمن الإغلاق الشهري، فالربط لا يكرّر أي مبلغ؛ وتكلفة
//  «أوامر الصيانة» لا تدخل الحساب لأن معناها (تكلفة أم سعر) غير محدّد.
//  الربحية حسب تاريخ التسليم (الفاتورة)، بخلاف الإغلاق الشهري النقدي.
// ══════════════════════════════════════════════════════════════════

function carDirectCosts(carId) {
  return (state.expenses || []).filter(function (e) { return e.carId && e.carId === carId; });
}
function carProfit(car) {
  var costs = carDirectCosts(car.id);
  var cost = _r3(costs.reduce(function (s, e) { return s + (e.amount || 0); }, 0));
  var revenue = _r3(car.estimate || 0);
  var profit = _r3(revenue - cost);
  return { revenue: revenue, cost: cost, paint: _paintCost(costs), profit: profit, margin: revenue > 0 ? profit / revenue * 100 : 0, costs: costs };
}
var PAINT_TYPE = 'أصباغ';
function _paintCost(costs) {
  return _r3(costs.filter(function (e) { return e.type === PAINT_TYPE; }).reduce(function (s, e) { return s + (e.amount || 0); }, 0));
}

// تسجيل سريع لتكلفة أصباغ السيارة من نافذتها: يُنشئ مصروفاً مربوطاً بها.
function savePaintCost(carId) {
  var car = (state.cars || []).find(function (c) { return c.id === carId; });
  var amtEl = document.getElementById('paint-cost-amount');
  var descEl = document.getElementById('paint-cost-desc');
  var amount = _r3(parseFloat(amtEl && amtEl.value));
  if (!car) return;
  if (!(amount > 0)) { alert('يرجى إدخال مبلغ الأصباغ'); return; }
  var date = today();
  if (!assertDatesOpen([date], 'تسجيل تكلفة الأصباغ')) return;
  var desc = (descEl && descEl.value.trim()) || ('أصباغ — ' + car.plate);
  state.expenses.push({ id: genId(), desc: desc, type: PAINT_TYPE, amount: amount, date: date, notes: '', carId: car.id });
  saveState();
  renderCarProfit(car);
  if (typeof renderExpensesTable === 'function') renderExpensesTable();
}

// ══════════════════════════════════════════════════════════════════
//  توزيع فاتورة الأصباغ الشهرية: فاتورة المورّد تصل نهاية الشهر، فتُدخل
//  مرة واحدة وتُوزَّع على سيارات الشهر (مبلغ لكل سيارة من تفصيل الفاتورة،
//  أو بالتساوي، أو بنسبة قيمة فاتورة السيارة). ما لا يُوزَّع يبقى مصروف
//  أصباغ عاماً. كل جزء مصروف مستقل بتاريخ فاتورة المورّد ورقمها.
// ══════════════════════════════════════════════════════════════════
function _isPaintService(s) { return /دهان|صبغ|رش/.test(s || ''); }

function _ensurePaintModal() {
  var m = document.getElementById('modal-paint-invoice');
  if (m) return m;
  m = document.createElement('div');
  m.className = 'modal-overlay';
  m.id = 'modal-paint-invoice';
  m.style.zIndex = 300;
  var inp = 'padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;width:100%;';
  m.innerHTML = '<div class="modal" style="max-width:640px;">' +
    '<div class="modal-header"><div class="modal-title">🧾 توزيع فاتورة الأصباغ</div>' +
      '<button class="modal-close" onclick="closeModal(\'modal-paint-invoice\')">✕</button></div>' +
    '<div class="modal-body">' +
      '<div class="form-grid">' +
        '<div class="form-group"><label>تاريخ فاتورة المورّد</label><input type="date" id="pi-date" style="' + inp + '"></div>' +
        '<div class="form-group"><label>إجمالي الفاتورة (ر.ع) *</label><input type="number" id="pi-total" step="0.001" min="0" placeholder="0.000" style="' + inp + '" oninput="paintInvoiceRecalc()"></div>' +
        '<div class="form-group"><label>المورّد / رقم الفاتورة</label><input type="text" id="pi-ref" placeholder="مثال: محل الألوان — 1234" style="' + inp + '"></div>' +
        '<div class="form-group"><label>سيارات شهر</label><input type="month" id="pi-month" style="' + inp + '" onchange="paintInvoiceRows()"></div>' +
      '</div>' +
      '<label style="font-size:12px;display:flex;gap:6px;align-items:center;margin:4px 0 8px;"><input type="checkbox" id="pi-all" onchange="paintInvoiceRows()"> إظهار كل السيارات (لا سيارات الدهان فقط)</label>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">' +
        '<button type="button" class="btn btn-outline btn-sm" onclick="paintInvoiceSplit(\'equal\')">⚖️ وزّع بالتساوي</button>' +
        '<button type="button" class="btn btn-outline btn-sm" onclick="paintInvoiceSplit(\'value\')">📐 وزّع حسب قيمة الفاتورة</button>' +
        '<span style="font-size:11px;color:var(--muted);align-self:center;">على السيارات المؤشَّرة — أو اكتب مبلغ كل سيارة من تفصيل الفاتورة</span>' +
      '</div>' +
      '<div id="pi-rows"></div>' +
      '<div id="pi-summary" style="margin-top:10px;font-size:13px;"></div>' +
    '</div>' +
    '<div class="modal-footer" style="display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;">' +
      '<button class="btn btn-outline" onclick="closeModal(\'modal-paint-invoice\')">إلغاء</button>' +
      '<button class="btn btn-primary" onclick="savePaintInvoice()">💾 حفظ التوزيع</button></div></div>';
  document.body.appendChild(m);
  return m;
}

function openPaintInvoiceModal() {
  _ensurePaintModal();
  var d = new Date();
  var prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  // الفاتورة تصل غالباً أول الشهر التالي ⇒ الافتراضي سيارات الشهر الماضي في الأيام العشرة الأولى
  var month = d.getDate() <= 10 ? localISODate(prev).slice(0, 7) : today().slice(0, 7);
  document.getElementById('pi-date').value = today();
  document.getElementById('pi-total').value = '';
  document.getElementById('pi-ref').value = '';
  document.getElementById('pi-month').value = month;
  document.getElementById('pi-all').checked = false;
  paintInvoiceRows();
  openModal('modal-paint-invoice');
}

function _piCars() {
  var month = document.getElementById('pi-month').value;
  var all = document.getElementById('pi-all').checked;
  return (state.cars || []).filter(function (c) {
    var active = (c.dateIn || '').indexOf(month) === 0 || (c.dateOut || '').indexOf(month) === 0 ||
      (c.status !== 'delivered' && (c.dateIn || '') <= month + '-31');
    return active && (all || _isPaintService(c.service));
  }).sort(function (a, b) { return (a.dateIn || '').localeCompare(b.dateIn || ''); });
}

function paintInvoiceRows() {
  var cars = _piCars();
  var box = document.getElementById('pi-rows');
  if (!cars.length) { box.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:10px;">لا سيارات في هذا الشهر</div>'; paintInvoiceRecalc(); return; }
  box.innerHTML = '<div class="table-wrap"><table><thead><tr><th></th><th>السيارة</th><th>الخدمة</th><th>الفاتورة</th><th>أصباغ سابقة</th><th>المبلغ</th></tr></thead><tbody>' +
    cars.map(function (c) {
      var had = carProfit(c).paint;
      return '<tr><td><input type="checkbox" class="pi-chk" data-id="' + _payEsc(c.id) + '"' + (had ? '' : ' checked') + '></td>' +
        '<td>' + _payEsc(c.plate) + '<div style="font-size:11px;color:var(--muted);">' + _payEsc(c.owner) + (c.status === 'delivered' ? ' · مُسلَّمة' : ' · في الورشة') + '</div></td>' +
        '<td style="font-size:12px;">' + _payEsc(c.service || '—') + '</td><td>' + fmt(c.estimate) + '</td>' +
        '<td>' + (had ? fmt(had) : '—') + '</td>' +
        '<td><input type="number" class="pi-amt" data-id="' + _payEsc(c.id) + '" data-est="' + (c.estimate || 0) + '" step="0.001" min="0" placeholder="0.000" style="width:90px;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);" oninput="paintInvoiceRecalc()"></td></tr>';
    }).join('') + '</tbody></table></div>';
  paintInvoiceRecalc();
}

function paintInvoiceSplit(mode) {
  var total = _r3(parseFloat(document.getElementById('pi-total').value));
  if (!(total > 0)) { alert('أدخل إجمالي الفاتورة أولاً'); return; }
  var chosen = [].slice.call(document.querySelectorAll('.pi-chk')).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-id'); });
  if (!chosen.length) { alert('أشِّر على السيارات التي تُوزَّع عليها الفاتورة'); return; }
  var amts = [].slice.call(document.querySelectorAll('.pi-amt'));
  var picked = amts.filter(function (a) { return chosen.indexOf(a.getAttribute('data-id')) !== -1; });
  var weights = picked.map(function (a) { return mode === 'value' ? (parseFloat(a.getAttribute('data-est')) || 0) : 1; });
  var wsum = weights.reduce(function (s, w) { return s + w; }, 0);
  if (!(wsum > 0)) { alert('السيارات المؤشَّرة بلا قيمة فاتورة — استخدم التوزيع بالتساوي'); return; }
  amts.forEach(function (a) { if (chosen.indexOf(a.getAttribute('data-id')) === -1) a.value = ''; });
  var used = 0;
  picked.forEach(function (a, i) {
    // آخر سيارة تأخذ الباقي كي يطابق المجموع الفاتورة بالفلس
    var v = i === picked.length - 1 ? _r3(total - used) : _r3(total * weights[i] / wsum);
    used = _r3(used + v);
    a.value = v.toFixed(3);
  });
  paintInvoiceRecalc();
}

function _piAllocations() {
  return [].slice.call(document.querySelectorAll('.pi-amt')).map(function (a) {
    return { carId: a.getAttribute('data-id'), amount: _r3(parseFloat(a.value)) };
  }).filter(function (x) { return x.amount > 0; });
}

function paintInvoiceRecalc() {
  var el = document.getElementById('pi-summary');
  if (!el) return;
  var total = _r3(parseFloat(document.getElementById('pi-total').value));
  var alloc = _r3(_piAllocations().reduce(function (s, x) { return s + x.amount; }, 0));
  var rest = _r3(total - alloc);
  el.innerHTML = 'الموزَّع على السيارات: <strong>' + fmt(alloc) + '</strong> من ' + fmt(total) + ' · ' +
    (rest < -0.0005 ? '<strong style="color:var(--danger);">⛔ الموزَّع أكبر من الفاتورة بـ ' + fmt(-rest) + '</strong>'
      : rest > 0.0005 ? '<span style="color:#ff6432;">المتبقي ' + fmt(rest) + ' يُسجَّل مصروف أصباغ عاماً (غير مرتبط بسيارة)</span>'
      : '<span style="color:var(--success);">✅ مطابق للفاتورة</span>');
}

function savePaintInvoice() {
  var date = document.getElementById('pi-date').value || today();
  var total = _r3(parseFloat(document.getElementById('pi-total').value));
  var ref = document.getElementById('pi-ref').value.trim();
  if (!(total > 0)) { alert('أدخل إجمالي الفاتورة'); return; }
  var allocs = _piAllocations();
  var alloc = _r3(allocs.reduce(function (s, x) { return s + x.amount; }, 0));
  if (alloc - total > 0.0005) { alert('⛔ المبلغ الموزَّع أكبر من إجمالي الفاتورة'); return; }
  if (!assertDatesOpen([date], 'تسجيل فاتورة الأصباغ')) return;
  var rest = _r3(total - alloc);
  if (!allocs.length && !confirm('لم يُوزَّع شيء على السيارات. تسجيل الفاتورة كلها مصروف أصباغ عاماً؟')) return;
  var batch = genId();
  var label = 'فاتورة أصباغ' + (ref ? ' — ' + ref : '');
  allocs.forEach(function (x) {
    var c = (state.cars || []).find(function (k) { return k.id === x.carId; });
    state.expenses.push({ id: genId(), desc: label + (c ? ' — ' + c.plate : ''), type: PAINT_TYPE, amount: x.amount, date: date,
      notes: 'جزء من فاتورة بإجمالي ' + total.toFixed(3) + ' ر.ع', carId: x.carId, paintInvoice: batch });
  });
  if (rest > 0.0005) {
    state.expenses.push({ id: genId(), desc: label + ' — غير موزَّع', type: PAINT_TYPE, amount: rest, date: date,
      notes: 'الجزء غير الموزَّع على السيارات من فاتورة بإجمالي ' + total.toFixed(3) + ' ر.ع', carId: '', paintInvoice: batch });
  }
  saveState();
  closeModal('modal-paint-invoice');
  renderAll();
  alert('✅ سُجِّلت فاتورة الأصباغ: ' + allocs.length + ' سيارة' + (rest > 0.0005 ? ' + ' + fmt(rest) + ' عام' : ''));
}

// زر الفتح في صفحة المصروفات بجانب «إضافة مصروف»
function _ensurePaintInvoiceButton() {
  if (document.getElementById('btn-paint-invoice')) return;
  var page = document.getElementById('page-expenses');
  var addBtn = page && page.querySelector('button[onclick="openAddExpenseModal()"]');
  if (!addBtn) return;
  var b = document.createElement('button');
  b.id = 'btn-paint-invoice';
  b.className = 'btn btn-outline';
  b.style.marginInlineStart = '6px';
  b.textContent = '🧾 توزيع فاتورة أصباغ';
  b.onclick = openPaintInvoiceModal;
  addBtn.parentNode.insertBefore(b, addBtn.nextSibling);
}

function carLabelById(id) {
  var c = (state.cars || []).find(function (x) { return x.id === id; });
  return c ? c.plate + ' - ' + c.owner : 'سيارة محذوفة';
}

// ── ربط المصروف بسيارة: قائمة تُحقن في نافذة المصروف ────────────────
function setupExpenseCarSelect(selectedId) {
  var modal = document.getElementById('modal-add-expense');
  if (modal) modal.style.zIndex = 300; // فوق نافذة السيارة حين تُفتح منها
  var sel = document.getElementById('exp-car');
  if (!sel) {
    var typeEl = document.getElementById('exp-type');
    if (!typeEl) return;
    var group = typeEl.closest('.form-group') || typeEl.parentNode;
    var g = document.createElement('div');
    g.className = 'form-group';
    g.innerHTML = '<label>🚗 السيارة (للتكلفة المباشرة — اختياري)</label>' +
      '<select id="exp-car" style="padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;width:100%;"></select>';
    group.parentNode.insertBefore(g, group.nextSibling);
    sel = document.getElementById('exp-car');
  }
  // السيارات في الورشة + المُسلَّمة خلال ٦٠ يوماً + المربوطة حالياً
  var cars = (state.cars || []).filter(function (c) {
    return c.status !== 'delivered' || daysSince(c.dateOut || c.dateIn) <= 60 || c.id === selectedId;
  }).sort(function (a, b) { return (b.dateIn || '').localeCompare(a.dateIn || ''); });
  sel.innerHTML = '<option value="">— مصروف عام (غير مرتبط بسيارة) —</option>' + cars.map(function (c) {
    return '<option value="' + _payEsc(c.id) + '">' + _payEsc(c.plate + ' - ' + c.owner + (c.status === 'delivered' ? ' (مُسلَّمة)' : '')) + '</option>';
  }).join('');
  if (selectedId && !cars.some(function (c) { return c.id === selectedId; })) {
    sel.innerHTML += '<option value="' + _payEsc(selectedId) + '">' + _payEsc(carLabelById(selectedId)) + '</option>';
  }
  sel.value = selectedId || '';
}

function addCostForCar(carId) {
  window._expPresetCar = carId;
  openAddExpenseModal();
}

// ── ربحية السيارة داخل نافذة تعديلها ───────────────────────────────
function renderCarProfit(car) {
  if (!car) return;
  var log = document.getElementById('update-payments-log');
  if (!log) return;
  var box = document.getElementById('update-car-profit');
  if (!box) {
    box = document.createElement('div');
    box.id = 'update-car-profit';
    box.style.cssText = 'margin:4px 0 12px;font-size:12px;';
    log.parentNode.insertBefore(box, log.nextSibling);
  }
  var p = carProfit(car);
  var color = p.profit >= 0 ? 'var(--success)' : 'var(--danger)';
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
      '<strong>📊 ربحية السيارة</strong>' +
      '<button type="button" class="btn btn-outline btn-sm" onclick="addCostForCar(\'' + _payEsc(car.id) + '\')">➕ إضافة تكلفة</button></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
      '<span class="badge badge-maint">الفاتورة: ' + fmt(p.revenue) + '</span>' +
      '<span class="badge badge-maint" style="color:var(--danger);">التكاليف: ' + fmt(p.cost) + (p.paint ? ' (🎨 ' + fmt(p.paint) + ')' : '') + '</span>' +
      '<span class="badge badge-maint" style="color:' + color + ';">الربح: ' + fmt(p.profit) + ' (' + p.margin.toFixed(1) + '%)</span></div>' +
    (p.costs.length
      ? '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">' + p.costs.map(function (e) {
          return '<div style="display:flex;gap:8px;justify-content:space-between;padding:5px 10px;border-bottom:1px solid var(--border);">' +
            '<span><bdi>' + _payEsc(e.date) + '</bdi></span><span style="flex:1;color:var(--muted);">' + _payEsc(e.type) + ' · ' + _payEsc(e.desc) + '</span>' +
            '<strong style="color:var(--danger);">' + fmt(e.amount) + '</strong></div>';
        }).join('') + '</div>'
      : '<div style="color:#ff6432;">⚠️ لا تكاليف مسجّلة لهذه السيارة — الربح الظاهر هو كامل الفاتورة.</div>') +
    '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px;padding:8px;border:1px dashed var(--border);border-radius:10px;">' +
      '<span style="font-weight:700;">🎨 تكلفة الأصباغ</span>' +
      '<input type="number" id="paint-cost-amount" placeholder="0.000" step="0.001" min="0" style="width:100px;padding:6px 8px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;">' +
      '<input type="text" id="paint-cost-desc" placeholder="البيان (اختياري): لون، كمية، المحل…" style="flex:1;min-width:120px;padding:6px 8px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;">' +
      '<button type="button" class="btn btn-primary btn-sm" onclick="savePaintCost(\'' + _payEsc(car.id) + '\')">حفظ</button>' +
    '</div>';
}

// ── تبويب «الربحية» في صفحة التقارير ───────────────────────────────
var _profitMonth = null; // 'YYYY-MM' أو 'all'
function _ensureProfitTab() {
  var page = document.getElementById('page-reports');
  if (!page) return null;
  var el = document.getElementById('report-profit');
  if (!el) {
    var tabs = page.querySelector('.tabs');
    if (tabs) {
      var btn = document.createElement('button');
      btn.className = 'tab';
      btn.textContent = '💹 الربحية';
      btn.onclick = function () { switchTab(btn, 'report-profit'); };
      tabs.appendChild(btn);
    }
    el = document.createElement('div');
    el.id = 'report-profit';
    el.style.display = 'none';
    page.appendChild(el);
  }
  return el;
}

function profitData(period) {
  var inPeriod = function (d) { return period === 'all' || (d || '').indexOf(period) === 0; };
  var cars = (state.cars || []).filter(function (c) { return c.status === 'delivered' && inPeriod(c.dateOut); });
  var rows = cars.map(function (c) { var p = carProfit(c); p.car = c; return p; });
  var byService = {};
  rows.forEach(function (r) {
    var s = r.car.service || 'أخرى';
    if (!byService[s]) byService[s] = { count: 0, revenue: 0, cost: 0, paint: 0, profit: 0 };
    var b = byService[s];
    b.count++; b.revenue += r.revenue; b.cost += r.cost; b.paint += r.paint; b.profit += r.profit;
  });
  var overhead = _r3((state.expenses || []).filter(function (e) { return !e.carId && inPeriod(e.date); })
    .reduce(function (s, e) { return s + (e.amount || 0); }, 0));
  var wip = _r3((state.cars || []).filter(function (c) { return c.status !== 'delivered'; })
    .reduce(function (s, c) { return s + carProfit(c).cost; }, 0));
  var sum = function (k) { return _r3(rows.reduce(function (s, r) { return s + r[k]; }, 0)); };
  var revenue = sum('revenue'), cost = sum('cost'), gross = sum('profit');
  return { rows: rows, byService: byService, revenue: revenue, cost: cost, paint: sum('paint'), gross: gross, overhead: overhead,
    net: _r3(gross - overhead), wip: wip, paintPending: rows.filter(function (r) { return !r.paint && _isPaintService(r.car.service); }).length, noCost: rows.filter(function (r) { return !r.costs.length; }).length };
}

function renderProfitReport() {
  _ensurePaintInvoiceButton();
  if (typeof _ensurePartnersButtons === 'function') _ensurePartnersButtons();
  var el = _ensureProfitTab();
  if (!el) return;
  var period = _profitMonth || today().slice(0, 7);
  var d = profitData(period);
  var pct = function (p, r) { return r > 0 ? (p / r * 100).toFixed(1) + '%' : '—'; };
  var tile = function (label, val, color) {
    return '<div style="flex:1;min-width:120px;background:rgba(0,0,0,.15);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">' +
      '<div style="font-size:11px;color:var(--muted);">' + label + '</div><div style="font-size:16px;font-weight:900;color:' + color + ';">' + fmt(val) + '</div></div>';
  };
  var html = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
    '<div class="card-title">💹 ربحية الأعمال (حسب تاريخ التسليم)</div><div style="display:flex;gap:6px;align-items:center;">' +
    '<input type="month" id="profit-month" value="' + (period === 'all' ? '' : period) + '" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;" onchange="_profitMonth=this.value||\'all\';renderProfitReport()">' +
    '<button class="btn btn-outline btn-sm" onclick="_profitMonth=\'all\';renderProfitReport()">كل الفترات</button>' +
    '<button class="btn btn-outline btn-sm" onclick="openPaintInvoiceModal()">🧾 توزيع فاتورة أصباغ</button>' +
    '<button class="btn btn-outline btn-sm" onclick="openPartnersReport()">📄 تقرير الشركاء</button></div></div><div class="card-body">' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
      tile('فواتير السيارات المُسلَّمة', d.revenue, 'var(--info)') + tile('التكاليف المباشرة', d.cost, 'var(--danger)') + tile('🎨 منها أصباغ ' + pct(d.paint, d.revenue), d.paint, '#c77dff') +
      tile('مجمل الربح ' + pct(d.gross, d.revenue), d.gross, d.gross >= 0 ? 'var(--success)' : 'var(--danger)') +
      tile('مصروفات عامة', d.overhead, 'var(--danger)') +
      tile('صافي الربح التشغيلي', d.net, d.net >= 0 ? 'var(--success)' : 'var(--danger)') + '</div>' +
    '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">' + (period === 'all' ? 'كل الفترات' : 'الفترة: ' + _payEsc(getMonthLabel(period))) +
      ' · تكاليف على سيارات لم تُسلَّم بعد: ' + fmt(d.wip) + ' (تُحسب عند التسليم)' +
      (d.noCost ? ' · <span style="color:#ff6432;">⚠️ ' + d.noCost + ' سيارة بلا تكاليف مسجّلة — ربحها مبالغ فيه</span>' : '') +
      (d.paintPending ? ' · <span style="color:#ff6432;">⏳ ' + d.paintPending + ' سيارة دهان بانتظار فاتورة الأصباغ — الربح مؤقّت حتى توزيعها</span>' : '') + '</div>';
  var svcs = Object.keys(d.byService).sort(function (a, b) { return d.byService[b].profit - d.byService[a].profit; });
  html += '<div style="font-weight:700;margin:6px 0;">حسب الخدمة</div>';
  html += svcs.length ? '<div class="table-wrap"><table><thead><tr><th>الخدمة</th><th>عدد</th><th>الفواتير</th><th>التكاليف</th><th>🎨 الأصباغ</th><th>الربح</th><th>الهامش</th><th>ربح/سيارة</th></tr></thead><tbody>' +
    svcs.map(function (s) {
      var b = d.byService[s];
      return '<tr><td>' + serviceBadge(s) + '</td><td>' + b.count + '</td><td>' + fmt(b.revenue) + '</td><td style="color:var(--danger);">' + fmt(b.cost) +
        '</td><td>' + fmt(b.paint) + ' <span style="color:var(--muted);font-size:11px;">' + pct(b.paint, b.revenue) + '</span>' +
        '</td><td><strong style="color:' + (b.profit >= 0 ? 'var(--success)' : 'var(--danger)') + ';">' + fmt(b.profit) + '</strong></td><td>' + pct(b.profit, b.revenue) +
        '</td><td>' + fmt(b.profit / b.count) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '<div style="color:var(--muted);font-size:13px;">لا سيارات مُسلَّمة في هذه الفترة</div>';
  if (d.rows.length) {
    var rows = d.rows.slice().sort(function (a, b) { return a.profit - b.profit; });
    html += '<div style="font-weight:700;margin:14px 0 6px;">حسب السيارة (الأقل ربحاً أولاً)</div><div class="table-wrap"><table><thead><tr><th>السيارة</th><th>العميل</th><th>الخدمة</th><th>الفاتورة</th><th>التكاليف</th><th>🎨 الأصباغ</th><th>الربح</th><th>الهامش</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr style="cursor:pointer;" onclick="editCar(\'' + _payEsc(r.car.id) + '\')"><td>' + _payEsc(r.car.plate) + '</td><td>' + _payEsc(r.car.owner) + '</td><td>' + serviceBadge(r.car.service) +
          '</td><td>' + fmt(r.revenue) + '</td><td style="color:var(--danger);">' + (r.costs.length ? fmt(r.cost) : '<span style="color:#ff6432;">⚠️ لا تكاليف</span>') +
          '</td><td>' + (r.paint ? fmt(r.paint) : _isPaintService(r.car.service) ? '<span style="color:#ff6432;">⏳ بانتظار الفاتورة</span>' : '<span style="color:var(--muted);">—</span>') + '</td><td><strong style="color:' + (r.profit >= 0 ? 'var(--success)' : 'var(--danger)') + ';">' + fmt(r.profit) + '</strong></td><td>' + pct(r.profit, r.revenue) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  el.innerHTML = html + '</div></div>';
}
