// ══════════════════════════════════════════════════════════════════
//  سجلّ الدفعات — كل مبلغ يُقبض يُسجَّل بتاريخه وطريقته ومن استلمه.
//  car.payments هو المرجع؛ car.paidTotal يبقى مجموعاً مشتقاً منه لأن
//  الفاتورة والتتبّع وبطاقة العمل تقرؤه.
//  الإيراد الشهري والصندوق اليومي يُحسبان من تاريخ الدفعة لا من تاريخ دخول السيارة.
// ══════════════════════════════════════════════════════════════════

const PAY_METHODS = {
  cash:     '💵 كاش',
  visa:     '💳 بطاقة',
  transfer: '🏦 تحويل',
  '':       '❔ غير محدد'
};
const PAY_TYPES = { deposit:'دفعة مقدّمة', payment:'دفعة', adjustment:'تصحيح' };

function _r3(n) { return Math.round((n || 0) * 1000) / 1000; }
function _payEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
function _payUser() {
  var s = (typeof getSession === 'function') ? getSession() : null;
  return s && s.username ? s.username : '';
}
function _isoToLocalDate(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  return isNaN(d) ? '' : localISODate(d);
}

// بناء السجل للسيارات القديمة، ومطابقته مع paidTotal إن عدّلته نسخة قديمة
// من التطبيق على جهاز آخر. يُرجع true إن تغيّر شيء.
function ensurePayments(car) {
  if (!car) return false;
  var paid = _r3(car.paidTotal);
  if (!Array.isArray(car.payments)) {
    car.payments = [];
    var dep = _r3(car.deposit);
    var depPart = (dep > 0 && dep <= paid) ? dep : 0;
    if (depPart > 0) {
      car.payments.push({ id: genId(), type: 'deposit', amount: depPart, method: '',
        date: car.dateIn || today(), at: '', by: '', migrated: true });
    }
    var rest = _r3(paid - depPart);
    if (rest > 0.0005) {
      car.payments.push({ id: genId(), type: 'payment', amount: rest, method: car.paymentMethod || '',
        date: _isoToLocalDate(car.paymentConfirmedAt) || car.dateOut || car.dateIn || today(),
        at: car.paymentConfirmedAt || '', by: '', migrated: true });
    }
    return true;
  }
  var sum = sumPayments(car);
  if (Math.abs(sum - paid) > 0.0005) {
    car.payments.push({ id: genId(), type: 'adjustment', amount: _r3(paid - sum), method: '',
      date: today(), at: new Date().toISOString(), by: 'system',
      note: 'تسوية تلقائية: المدفوع عُدِّل من نسخة قديمة من التطبيق' });
    return true;
  }
  return false;
}

function sumPayments(car) {
  return _r3((car.payments || []).reduce(function (s, p) { return s + (parseFloat(p.amount) || 0); }, 0));
}

function syncAllPayments() {
  var changed = false;
  (state.cars || []).forEach(function (c) { if (ensurePayments(c)) changed = true; });
  return changed;
}

// تسجيل دفعة جديدة (أو تصحيح بالسالب) وتحديث المجموع.
function addPayment(car, opts) {
  ensurePayments(car);
  var amount = _r3(opts.amount);
  if (!amount) return null;
  var p = {
    id: genId(),
    type: opts.type || (amount < 0 ? 'adjustment' : 'payment'),
    amount: amount,
    method: opts.method || '',
    date: opts.date || today(),
    at: new Date().toISOString(),
    by: _payUser()
  };
  if (opts.note) p.note = opts.note;
  car.payments.push(p);
  car.paidTotal = sumPayments(car);
  return p;
}

// كل الدفعات عبر كل السيارات مع بيانات السيارة.
function allPayments() {
  var out = [];
  (state.cars || []).forEach(function (c) {
    ensurePayments(c);
    c.payments.forEach(function (p) { out.push({ p: p, car: c }); });
  });
  return out;
}
function paymentsWhere(pred) { return allPayments().filter(function (x) { return pred(x.p.date || ''); }); }

// ── سجل الدفعات داخل نافذة تعديل السيارة ────────────────────────────
function renderPaymentLog(car) {
  var anchor = document.getElementById('update-paid');
  if (!anchor || !car) return;
  var box = document.getElementById('update-payments-log');
  if (!box) {
    box = document.createElement('div');
    box.id = 'update-payments-log';
    box.style.cssText = 'margin:4px 0 12px;font-size:12px;';
    var group = anchor.closest('.form-row') || anchor.closest('.form-group') || anchor.parentNode;
    group.parentNode.insertBefore(box, group.nextSibling);
  }
  ensurePayments(car);
  var rows = car.payments.slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });
  if (!rows.length) { box.innerHTML = '<div style="color:var(--muted);">📒 لا توجد دفعات مسجّلة بعد</div>'; return; }
  box.innerHTML = '<div style="font-weight:700;margin-bottom:6px;">📒 سجل الدفعات</div>' +
    '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">' +
    rows.map(function (p) {
      var neg = p.amount < 0;
      return '<div style="display:flex;gap:8px;justify-content:space-between;padding:6px 10px;border-bottom:1px solid var(--border);">' +
        '<span style="white-space:nowrap;"><bdi>' + _payEsc(p.date) + '</bdi></span>' +
        '<span style="flex:1;color:var(--muted);">' + _payEsc(PAY_TYPES[p.type] || p.type) + ' · ' + _payEsc(PAY_METHODS[p.method] || p.method) +
        (p.by ? ' · ' + _payEsc(p.by) : '') + (p.migrated ? ' · مُرحَّلة' : '') + (p.note ? ' · ' + _payEsc(p.note) : '') + '</span>' +
        '<strong style="white-space:nowrap;color:' + (neg ? 'var(--danger)' : 'var(--success)') + ';">' + fmt(p.amount) + '</strong></div>';
    }).join('') + '</div>' +
    '<div style="color:var(--muted);margin-top:4px;">تعديل حقل «المدفوع» يُسجَّل كدفعة أو تصحيح بتاريخ اليوم، ولا يمحو السجل.</div>';
}

// ── لوحتا الصندوق اليومي وأعمار الذمم في صفحة الفواتير ────────────────
var _cashDate = null;
function _ensurePanels() {
  var page = document.getElementById('page-invoices');
  if (!page) return null;
  var wrap = document.getElementById('payments-panels');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'payments-panels';
    wrap.innerHTML =
      '<div class="card" style="margin-bottom:16px;"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
        '<div class="card-title">💰 الصندوق اليومي</div>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
          '<input type="date" id="cash-date" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;" onchange="_cashDate=this.value;renderCashBox()">' +
          '<button class="btn btn-outline btn-sm" onclick="printCashBox()">🖨️ طباعة</button>' +
        '</div></div><div class="card-body" id="cash-box-body"></div></div>' +
      '<div class="card" style="margin-bottom:16px;"><div class="card-header"><div class="card-title">⏳ الذمم المدينة وأعمارها</div></div>' +
        '<div class="card-body" id="aging-body"></div></div>';
    page.insertBefore(wrap, page.firstChild);
  }
  return wrap;
}

function _cashData(date) {
  var pays = paymentsWhere(function (d) { return d === date; });
  var byMethod = {};
  pays.forEach(function (x) { var m = x.p.method || ''; byMethod[m] = _r3((byMethod[m] || 0) + x.p.amount); });
  var totalIn = _r3(pays.reduce(function (s, x) { return s + x.p.amount; }, 0));
  var exps = (state.expenses || []).filter(function (e) { return e.date === date; });
  var totalOut = _r3(exps.reduce(function (s, e) { return s + (e.amount || 0); }, 0));
  return { pays: pays, byMethod: byMethod, totalIn: totalIn, exps: exps, totalOut: totalOut, net: _r3(totalIn - totalOut) };
}

function renderCashBox() {
  if (!_ensurePanels()) return;
  var date = _cashDate || today();
  var inp = document.getElementById('cash-date'); if (inp && inp.value !== date) inp.value = date;
  var d = _cashData(date);
  var tile = function (label, val, color) {
    return '<div style="flex:1;min-width:110px;background:rgba(0,0,0,.15);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">' +
      '<div style="font-size:11px;color:var(--muted);">' + label + '</div><div style="font-size:16px;font-weight:900;color:' + color + ';">' + fmt(val) + '</div></div>';
  };
  var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
    tile('المقبوضات', d.totalIn, 'var(--success)') + tile('المصروفات', d.totalOut, 'var(--danger)') +
    tile('الصافي', d.net, d.net >= 0 ? 'var(--success)' : 'var(--danger)') + '</div>';
  var methods = Object.keys(d.byMethod);
  if (methods.length) {
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;">' + methods.map(function (m) {
      return '<span class="badge badge-maint">' + _payEsc(PAY_METHODS[m] || m) + ': ' + fmt(d.byMethod[m]) + '</span>';
    }).join('') + '</div>' +
    '<div style="font-size:11px;color:var(--muted);margin-bottom:10px;">طابِق «💵 كاش» مع النقد الفعلي في الدرج، و«🏦 تحويل» مع كشف البنك.</div>';
  }
  if (!d.pays.length) html += '<div style="color:var(--muted);font-size:13px;">لا مقبوضات في هذا اليوم</div>';
  else html += '<div class="table-wrap"><table><thead><tr><th>السيارة</th><th>العميل</th><th>النوع</th><th>الطريقة</th><th>المستلم</th><th>المبلغ</th></tr></thead><tbody>' +
    d.pays.map(function (x) {
      return '<tr><td>' + _payEsc(x.car.plate) + '</td><td>' + _payEsc(x.car.owner) + '</td><td>' + _payEsc(PAY_TYPES[x.p.type] || x.p.type) +
        '</td><td>' + _payEsc(PAY_METHODS[x.p.method] || x.p.method) + '</td><td>' + _payEsc(x.p.by || '—') +
        '</td><td><strong style="color:' + (x.p.amount < 0 ? 'var(--danger)' : 'var(--success)') + ';">' + fmt(x.p.amount) + '</strong></td></tr>';
    }).join('') + '</tbody></table></div>';
  document.getElementById('cash-box-body').innerHTML = html;
}

function printCashBox() {
  var date = _cashDate || today();
  var d = _cashData(date);
  var w = window.open('', '_blank');
  if (!w) return;
  w.document.write('<html dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:Cairo,Tahoma,sans-serif;padding:24px;color:#111;}' +
    'table{width:100%;border-collapse:collapse;margin:10px 0;}th{background:#1a1a2e;color:#fff;padding:7px;text-align:right;}td{padding:6px;border:1px solid #ddd;}' +
    '.sig{margin-top:40px;display:flex;justify-content:space-between;}</style></head><body>' +
    '<h2>💰 الصندوق اليومي — ' + _payEsc(date) + '</h2>' +
    '<table><tr><th>البند</th><th>المبلغ</th></tr>' +
    Object.keys(d.byMethod).map(function (m) { return '<tr><td>مقبوضات ' + _payEsc(PAY_METHODS[m] || m) + '</td><td>' + d.byMethod[m].toFixed(3) + ' ر.ع</td></tr>'; }).join('') +
    '<tr><td><strong>إجمالي المقبوضات</strong></td><td><strong>' + d.totalIn.toFixed(3) + ' ر.ع</strong></td></tr>' +
    '<tr><td>المصروفات (' + d.exps.length + ')</td><td>' + d.totalOut.toFixed(3) + ' ر.ع</td></tr>' +
    '<tr><td><strong>الصافي</strong></td><td><strong>' + d.net.toFixed(3) + ' ر.ع</strong></td></tr></table>' +
    '<table><tr><th>السيارة</th><th>العميل</th><th>الطريقة</th><th>المستلم</th><th>المبلغ</th></tr>' +
    d.pays.map(function (x) { return '<tr><td>' + _payEsc(x.car.plate) + '</td><td>' + _payEsc(x.car.owner) + '</td><td>' + _payEsc(PAY_METHODS[x.p.method] || x.p.method) +
      '</td><td>' + _payEsc(x.p.by || '—') + '</td><td>' + x.p.amount.toFixed(3) + '</td></tr>'; }).join('') + '</table>' +
    '<p>النقد الفعلي في الدرج: ____________ &nbsp; الفرق: ____________</p>' +
    '<div class="sig"><span>المحاسب: ____________</span><span>المدير: ____________</span></div></body></html>');
  w.document.close();
  w.print();
}

function _agingRows() {
  var rows = [];
  (state.cars || []).forEach(function (c) {
    var rem = _r3((c.estimate || 0) - (c.paidTotal || 0));
    if (rem <= 0.0005) return;
    var delivered = c.status === 'delivered';
    rows.push({ car: c, rem: rem, delivered: delivered, days: daysSince(delivered ? (c.dateOut || c.dateIn) : c.dateIn) });
  });
  return rows.sort(function (a, b) { return b.days - a.days; });
}

function renderAging() {
  if (!_ensurePanels()) return;
  var rows = _agingRows();
  var recv = rows.filter(function (r) { return r.delivered; });
  var wip = rows.filter(function (r) { return !r.delivered; });
  var buckets = [['0–30 يوم', 0, 30], ['31–60 يوم', 31, 60], ['61–90 يوم', 61, 90], ['أكثر من 90', 91, 1e9]];
  var sums = buckets.map(function (b) {
    return _r3(recv.filter(function (r) { return r.days >= b[1] && r.days <= b[2]; }).reduce(function (s, r) { return s + r.rem; }, 0));
  });
  var colors = ['var(--success)', 'var(--gold, #f5a623)', '#ff6432', 'var(--danger)'];
  var totalRecv = _r3(sums.reduce(function (s, v) { return s + v; }, 0));
  var totalWip = _r3(wip.reduce(function (s, r) { return s + r.rem; }, 0));
  var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' + buckets.map(function (b, i) {
    return '<div style="flex:1;min-width:100px;background:rgba(0,0,0,.15);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">' +
      '<div style="font-size:11px;color:var(--muted);">' + b[0] + '</div><div style="font-size:15px;font-weight:900;color:' + colors[i] + ';">' + fmt(sums[i]) + '</div></div>';
  }).join('') + '</div>' +
  '<div style="font-size:12px;color:var(--muted);margin-bottom:10px;">مستحق على سيارات مُسلَّمة: <strong style="color:var(--danger);">' + fmt(totalRecv) +
  '</strong> · متبقٍّ على سيارات ما زالت في الورشة: <strong>' + fmt(totalWip) + '</strong> (العمر من تاريخ التسليم)</div>';
  if (!recv.length) html += '<div style="color:var(--muted);font-size:13px;">✅ لا ذمم على سيارات مُسلَّمة</div>';
  else html += '<div class="table-wrap"><table><thead><tr><th>العميل</th><th>الهاتف</th><th>السيارة</th><th>منذ التسليم</th><th>المتبقي</th></tr></thead><tbody>' +
    recv.map(function (r) {
      var c = r.car;
      var color = r.days > 90 ? 'var(--danger)' : r.days > 60 ? '#ff6432' : r.days > 30 ? 'var(--gold, #f5a623)' : 'var(--text)';
      return '<tr><td>' + _payEsc(c.owner) + '</td><td><bdi>' + _payEsc(c.phone || '—') + '</bdi></td><td>' + _payEsc(c.plate) + (c.model ? ' / ' + _payEsc(c.model) : '') +
        '</td><td style="color:' + color + ';font-weight:700;">' + r.days + ' يوم</td><td><strong style="color:var(--danger);">' + fmt(r.rem) + '</strong></td></tr>';
    }).join('') + '</tbody></table></div>';
  document.getElementById('aging-body').innerHTML = html;
}

function renderPaymentsPanels() {
  if (syncAllPayments()) saveState();
  renderCashBox();
  renderAging();
}

// ترحيل السجل عند التحميل (قبل أي عرض أو حساب للإيراد).
(function () { try { if (typeof state !== 'undefined' && syncAllPayments()) saveState(); } catch (e) { console.warn('[payments] migrate', e); } })();
