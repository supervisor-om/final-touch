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
    net: _r3(gross - overhead), wip: wip, noCost: rows.filter(function (r) { return !r.costs.length; }).length };
}

function renderProfitReport() {
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
    '<button class="btn btn-outline btn-sm" onclick="_profitMonth=\'all\';renderProfitReport()">كل الفترات</button></div></div><div class="card-body">' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
      tile('فواتير السيارات المُسلَّمة', d.revenue, 'var(--info)') + tile('التكاليف المباشرة', d.cost, 'var(--danger)') + tile('🎨 منها أصباغ ' + pct(d.paint, d.revenue), d.paint, '#c77dff') +
      tile('مجمل الربح ' + pct(d.gross, d.revenue), d.gross, d.gross >= 0 ? 'var(--success)' : 'var(--danger)') +
      tile('مصروفات عامة', d.overhead, 'var(--danger)') +
      tile('صافي الربح التشغيلي', d.net, d.net >= 0 ? 'var(--success)' : 'var(--danger)') + '</div>' +
    '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">' + (period === 'all' ? 'كل الفترات' : 'الفترة: ' + _payEsc(getMonthLabel(period))) +
      ' · تكاليف على سيارات لم تُسلَّم بعد: ' + fmt(d.wip) + ' (تُحسب عند التسليم)' +
      (d.noCost ? ' · <span style="color:#ff6432;">⚠️ ' + d.noCost + ' سيارة بلا تكاليف مسجّلة — ربحها مبالغ فيه</span>' : '') + '</div>';
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
          '</td><td>' + (r.paint ? fmt(r.paint) : '<span style="color:var(--muted);">—</span>') + '</td><td><strong style="color:' + (r.profit >= 0 ? 'var(--success)' : 'var(--danger)') + ';">' + fmt(r.profit) + '</strong></td><td>' + pct(r.profit, r.revenue) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  el.innerHTML = html + '</div></div>';
}
