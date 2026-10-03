// ══════════════════════════════════════════════════════════════════
//  تقرير الأرباح الشهري للشركاء — صفحة جاهزة للطباعة/الحفظ PDF.
//  الربح الموزَّع = صافي الربح النقدي للشهر (المقبوض − المصروفات)، وهو
//  نفس رقم الإغلاق الشهري. ربحية الأعمال (حسب التسليم) تُعرض تحليلاً فقط.
//  الشركاء ونسبهم في state.partners ويُزامَنون مع السحابة.
// ══════════════════════════════════════════════════════════════════

function _ensurePartnersModal() {
  var m = document.getElementById('modal-partners-report');
  if (m) return m;
  m = document.createElement('div');
  m.className = 'modal-overlay';
  m.id = 'modal-partners-report';
  m.style.zIndex = 300;
  var inp = 'padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;width:100%;';
  m.innerHTML = '<div class="modal" style="max-width:520px;">' +
    '<div class="modal-header"><div class="modal-title">📄 تقرير الأرباح للشركاء</div>' +
      '<button class="modal-close" onclick="closeModal(\'modal-partners-report\')">✕</button></div>' +
    '<div class="modal-body">' +
      '<div class="form-group"><label>الشهر</label><input type="month" id="pr-month" style="' + inp + '" onchange="partnersPreview()"></div>' +
      '<div style="font-weight:700;margin:12px 0 6px;">👥 الشركاء ونسبهم</div>' +
      '<div id="pr-partners"></div>' +
      '<button type="button" class="btn btn-outline btn-sm" onclick="partnersAddRow()">➕ إضافة شريك</button>' +
      '<div id="pr-preview" style="margin-top:12px;font-size:13px;"></div>' +
    '</div>' +
    '<div class="modal-footer" style="display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;">' +
      '<button class="btn btn-outline" onclick="closeModal(\'modal-partners-report\')">إلغاء</button>' +
      '<button class="btn btn-primary" onclick="printPartnersReport()">📄 إنشاء التقرير (PDF)</button></div></div>';
  document.body.appendChild(m);
  return m;
}

function openPartnersReport() {
  _ensurePartnersModal();
  var d = new Date();
  // في أول عشرة أيام يكون المقصود غالباً الشهر المنتهي
  var month = d.getDate() <= 10 ? localISODate(new Date(d.getFullYear(), d.getMonth() - 1, 1)).slice(0, 7) : today().slice(0, 7);
  document.getElementById('pr-month').value = month;
  var list = (state.partners && state.partners.length) ? state.partners : [{ name: '', share: 50 }, { name: '', share: 50 }];
  document.getElementById('pr-partners').innerHTML = '';
  list.forEach(function (p) { partnersAddRow(p.name, p.share); });
  partnersPreview();
  openModal('modal-partners-report');
}

function partnersAddRow(name, share) {
  var box = document.getElementById('pr-partners');
  var row = document.createElement('div');
  row.className = 'pr-row';
  row.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;align-items:center;';
  var st = 'padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;';
  row.innerHTML = '<input type="text" class="pr-name" placeholder="اسم الشريك" style="flex:1;' + st + '">' +
    '<input type="number" class="pr-share" placeholder="%" step="0.01" min="0" max="100" style="width:80px;' + st + '" oninput="partnersPreview()">' +
    '<span style="color:var(--muted);">%</span>' +
    '<button type="button" class="btn btn-danger btn-sm" onclick="this.parentNode.remove();partnersPreview()">✕</button>';
  row.querySelector('.pr-name').value = name || '';
  row.querySelector('.pr-share').value = (share === 0 || share) ? share : '';
  box.appendChild(row);
  partnersPreview();
}

function _readPartners() {
  return [].slice.call(document.querySelectorAll('#pr-partners .pr-row')).map(function (r) {
    return { name: r.querySelector('.pr-name').value.trim(), share: parseFloat(r.querySelector('.pr-share').value) || 0 };
  }).filter(function (p) { return p.name || p.share; });
}

function _partnersData(month) {
  var cash = getMonthlyData(month);
  var exps = (state.expenses || []).filter(function (e) { return (e.date || '').indexOf(month) === 0; });
  var expByType = {};
  exps.forEach(function (e) { var t = e.type || 'أخرى'; expByType[t] = _r3((expByType[t] || 0) + (e.amount || 0)); });
  var pays = paymentsWhere(function (d) { return d.indexOf(month) === 0; });
  var byMethod = {};
  pays.forEach(function (x) { var m = x.p.method || ''; byMethod[m] = _r3((byMethod[m] || 0) + x.p.amount); });
  var prof = profitData(month);
  var closing = activeClosing(month);
  var receivables = _agingRows().filter(function (r) { return r.delivered; });
  return {
    month: month, cash: cash, net: _r3(cash.totalPaid - cash.totalExpenses), expByType: expByType, byMethod: byMethod,
    prof: prof, closing: closing, receivables: receivables,
    receivablesTotal: _r3(receivables.reduce(function (s, r) { return s + r.rem; }, 0))
  };
}

function partnersPreview() {
  var el = document.getElementById('pr-preview');
  if (!el) return;
  var month = document.getElementById('pr-month').value;
  if (!month) { el.innerHTML = ''; return; }
  var d = _partnersData(month);
  var ps = _readPartners();
  var total = ps.reduce(function (s, p) { return s + p.share; }, 0);
  el.innerHTML =
    '<div>صافي الربح النقدي لـ ' + _payEsc(getMonthLabel(month)) + ': <strong style="color:' + (d.net >= 0 ? 'var(--success)' : 'var(--danger)') + ';">' + fmt(d.net) + '</strong></div>' +
    (Math.abs(total - 100) > 0.01 ? '<div style="color:var(--danger);margin-top:4px;">⚠️ مجموع النسب ' + total.toFixed(2) + '% (يجب أن يكون 100%)</div>' : '') +
    (d.closing ? '<div style="color:var(--success);margin-top:4px;">🔒 الشهر مُغلق — الأرقام نهائية</div>'
      : '<div style="color:#ff6432;margin-top:4px;">⚠️ الشهر غير مُغلق — ستظهر الأرقام في التقرير «أولية»</div>') +
    (d.prof.paintPending ? '<div style="color:#ff6432;margin-top:4px;">⏳ ' + d.prof.paintPending + ' سيارة دهان بانتظار فاتورة الأصباغ</div>' : '');
}

function printPartnersReport() {
  var month = document.getElementById('pr-month').value;
  if (!month) { alert('اختر الشهر'); return; }
  var ps = _readPartners();
  var total = ps.reduce(function (s, p) { return s + p.share; }, 0);
  if (!ps.length || ps.some(function (p) { return !p.name; })) { alert('أدخل اسم كل شريك'); return; }
  if (Math.abs(total - 100) > 0.01) { alert('مجموع نسب الشركاء ' + total.toFixed(2) + '% — يجب أن يكون 100%'); return; }
  state.partners = ps;
  saveState();
  var w = window.open('', '_blank');
  if (!w) { alert('اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة'); return; }
  w.document.write(buildPartnersReportHTML(month, ps));
  w.document.close();
  var go = function () { setTimeout(function () { w.focus(); w.print(); }, 600); };
  if (w.document.readyState === 'complete') go(); else w.onload = go;
}

function buildPartnersReportHTML(month, partners) {
  var d = _partnersData(month);
  var E = _payEsc;
  var n3 = function (v) { return (v || 0).toFixed(3); };
  var money = function (v) { return '<span class="num">' + n3(v) + '</span> ر.ع'; };
  var label = getMonthLabel(month);
  var status = d.closing
    ? '🔒 نهائي — الشهر مُغلق بتاريخ ' + E(formatDate(d.closing.closedAt)) + (d.closing.closedBy ? ' بواسطة ' + E(d.closing.closedBy) : '')
    : '⚠️ أرقام أولية — الشهر لم يُغلق بعد';
  var logo = (typeof LOGO_B64 !== 'undefined' && LOGO_B64) ? '<img src="data:image/png;base64,' + LOGO_B64 + '" class="logo" alt="">' : '';
  var rows = function (obj, labels) {
    return Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).map(function (k) {
      return '<tr><td>' + E(labels ? (labels[k] || k) : k) + '</td><td class="l">' + money(obj[k]) + '</td></tr>';
    }).join('');
  };
  var p = d.prof;
  var svcs = Object.keys(p.byService).sort(function (a, b) { return p.byService[b].profit - p.byService[a].profit; });
  var pct = function (a, b) { return b > 0 ? (a / b * 100).toFixed(1) + '%' : '—'; };
  var methodLabels = { cash: 'كاش', visa: 'بطاقة', transfer: 'تحويل بنكي', '': 'غير محدد' };

  var html = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>تقرير الأرباح — ' + E(label) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">' +
    '<style>' +
    '@page{size:A4;margin:14mm 12mm;}' +
    '*{box-sizing:border-box;}body{font-family:Cairo,Tahoma,sans-serif;color:#1a1a2e;margin:0;padding:18px;font-size:12.5px;line-height:1.6;background:#fff;}' +
    '.head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #e94560;padding-bottom:10px;margin-bottom:12px;}' +
    '.logo{width:64px;height:64px;object-fit:contain;}' +
    'h1{font-size:20px;margin:0;}h2{font-size:14px;margin:18px 0 6px;color:#e94560;border-bottom:1px solid #eee;padding-bottom:3px;}' +
    '.sub{color:#666;font-size:12px;}.status{display:inline-block;margin-top:4px;padding:2px 10px;border-radius:12px;font-size:11.5px;font-weight:700;' +
      (d.closing ? 'background:#e6f8f3;color:#0a8a6a;' : 'background:#fff1e8;color:#c2410c;') + '}' +
    '.kpis{display:flex;gap:8px;flex-wrap:wrap;}.kpi{flex:1;min-width:120px;border:1px solid #e5e5ea;border-radius:10px;padding:8px 10px;text-align:center;}' +
    '.kpi .t{font-size:11px;color:#666;}.kpi .v{font-size:16px;font-weight:900;}' +
    '.big{border:2px solid #1a1a2e;}.pos{color:#0a8a6a;}.neg{color:#d62845;}' +
    'table{width:100%;border-collapse:collapse;margin:4px 0;page-break-inside:auto;}tr{page-break-inside:avoid;}' +
    'th{background:#1a1a2e;color:#fff;padding:6px 8px;text-align:right;font-size:11.5px;}td{padding:5px 8px;border-bottom:1px solid #eee;}' +
    'td.l,th.l{text-align:left;}.num{direction:ltr;unicode-bidi:embed;font-variant-numeric:tabular-nums;}' +
    'tr.tot td{font-weight:900;border-top:2px solid #1a1a2e;background:#f7f7fa;}' +
    '.note{font-size:11px;color:#666;margin-top:4px;}.warn{color:#c2410c;}' +
    '.sigs{display:flex;gap:16px;flex-wrap:wrap;margin-top:30px;}.sig{flex:1;min-width:140px;border-top:1px solid #999;padding-top:6px;text-align:center;font-size:12px;}' +
    '.foot{margin-top:18px;font-size:10.5px;color:#999;text-align:center;}' +
    '@media print{body{padding:0;}.noprint{display:none;}}' +
    '</style></head><body>' +
    '<div class="noprint" style="background:#fff8e1;border:1px solid #f5d76e;padding:8px 12px;border-radius:8px;margin-bottom:12px;font-size:12px;">' +
      'لحفظه PDF: اختر «حفظ بتنسيق PDF / Save as PDF» من نافذة الطباعة، ثم أرسله للشركاء. ' +
      '<button onclick="window.print()" style="font-family:inherit;margin-inline-start:6px;">🖨️ طباعة / PDF</button></div>' +
    '<div class="head">' + logo + '<div><h1>تقرير الأرباح الشهري للشركاء</h1>' +
      '<div class="sub">ورشة اللمسة الأخيرة — للصيانة والسمكرة والدهان · ' + E(label) + ' · تاريخ الإصدار: ' + E(formatDate(today())) + '</div>' +
      '<div class="status">' + status + '</div></div></div>' +

    '<h2>١. الخلاصة</h2><div class="kpis">' +
      '<div class="kpi"><div class="t">المقبوضات</div><div class="v pos">' + money(d.cash.totalPaid) + '</div></div>' +
      '<div class="kpi"><div class="t">المصروفات</div><div class="v neg">' + money(d.cash.totalExpenses) + '</div></div>' +
      '<div class="kpi big"><div class="t">صافي الربح القابل للتوزيع</div><div class="v ' + (d.net >= 0 ? 'pos' : 'neg') + '">' + money(d.net) + '</div></div></div>' +
    '<div class="note">صافي الربح = ما قُبض فعلاً من العملاء خلال الشهر − ما صُرف خلاله (أساس نقدي، مطابق للإغلاق الشهري).</div>' +

    '<h2>٢. توزيع الأرباح على الشركاء</h2>' +
    '<table><tr><th>الشريك</th><th>النسبة</th><th class="l">الحصة</th></tr>' +
    (function () {
      var used = 0;
      return partners.map(function (pt, i) {
        var share = i === partners.length - 1 ? _r3(d.net - used) : _r3(d.net * pt.share / 100);
        used = _r3(used + share);
        return '<tr><td>' + E(pt.name) + '</td><td><span class="num">' + pt.share + '%</span></td><td class="l"><strong class="' + (share >= 0 ? 'pos' : 'neg') + '">' + money(share) + '</strong></td></tr>';
      }).join('');
    })() +
    '<tr class="tot"><td>الإجمالي</td><td><span class="num">100%</span></td><td class="l">' + money(d.net) + '</td></tr></table>' +
    (d.net < 0 ? '<div class="note warn">الشهر خاسر: الحصص بالسالب تمثّل نصيب كل شريك من الخسارة.</div>' : '') +

    '<h2>٣. المقبوضات حسب طريقة الدفع</h2>' +
    (Object.keys(d.byMethod).length ? '<table><tr><th>الطريقة</th><th class="l">المبلغ</th></tr>' + rows(d.byMethod, methodLabels) +
      '<tr class="tot"><td>الإجمالي</td><td class="l">' + money(d.cash.totalPaid) + '</td></tr></table>' : '<div class="note">لا مقبوضات</div>') +

    '<h2>٤. المصروفات حسب النوع</h2>' +
    (Object.keys(d.expByType).length ? '<table><tr><th>النوع</th><th class="l">المبلغ</th></tr>' + rows(d.expByType) +
      '<tr class="tot"><td>الإجمالي</td><td class="l">' + money(d.cash.totalExpenses) + '</td></tr></table>' : '<div class="note">لا مصروفات</div>') +

    '<h2>٥. ربحية الأعمال المُسلَّمة هذا الشهر</h2>' +
    '<div class="kpis">' +
      '<div class="kpi"><div class="t">سيارات مُسلَّمة</div><div class="v">' + p.rows.length + '</div></div>' +
      '<div class="kpi"><div class="t">قيمة فواتيرها</div><div class="v">' + money(p.revenue) + '</div></div>' +
      '<div class="kpi"><div class="t">تكاليفها المباشرة</div><div class="v neg">' + money(p.cost) + '</div></div>' +
      '<div class="kpi"><div class="t">مجمل الربح <span class="num">' + pct(p.gross, p.revenue) + '</span></div><div class="v pos">' + money(p.gross) + '</div></div></div>' +
    (svcs.length ? '<table><tr><th>الخدمة</th><th>عدد</th><th class="l">الفواتير</th><th class="l">التكاليف</th><th class="l">منها أصباغ</th><th class="l">الربح</th><th>الهامش</th></tr>' +
      svcs.map(function (s) {
        var b = p.byService[s];
        return '<tr><td>' + E(s) + '</td><td>' + b.count + '</td><td class="l">' + money(b.revenue) + '</td><td class="l">' + money(b.cost) +
          '</td><td class="l">' + money(b.paint) + '</td><td class="l"><strong>' + money(b.profit) + '</strong></td><td><span class="num">' + pct(b.profit, b.revenue) + '</span></td></tr>';
      }).join('') + '</table>' : '') +
    '<div class="note">هذا القسم حسب تاريخ التسليم ولكل سيارة تكاليفها المربوطة بها، لذا قد يختلف عن الأساس النقدي أعلاه.' +
      (p.paintPending ? ' <span class="warn">⏳ ' + p.paintPending + ' سيارة دهان لم تُوزَّع عليها فاتورة الأصباغ بعد — ربحها هنا أعلى من الحقيقي.</span>' : '') +
      (p.noCost && !p.paintPending ? ' <span class="warn">⚠️ ' + p.noCost + ' سيارة بلا تكاليف مسجّلة.</span>' : '') + '</div>' +

    '<h2>٦. مبالغ مستحقة على العملاء (حتى تاريخ الإصدار)</h2>' +
    (d.receivables.length ? '<table><tr><th>العميل</th><th>السيارة</th><th>منذ التسليم</th><th class="l">المتبقي</th></tr>' +
      d.receivables.slice(0, 15).map(function (r) {
        return '<tr><td>' + E(r.car.owner) + '</td><td>' + E(r.car.plate) + '</td><td><span class="num">' + r.days + '</span> يوم</td><td class="l">' + money(r.rem) + '</td></tr>';
      }).join('') + '<tr class="tot"><td colspan="3">الإجمالي' + (d.receivables.length > 15 ? ' (' + d.receivables.length + ' عميل)' : '') + '</td><td class="l">' + money(d.receivablesTotal) + '</td></tr></table>' +
      '<div class="note">هذه المبالغ غير داخلة في ربح الشهر؛ تُضاف إلى ربح الشهر الذي تُحصَّل فيه.</div>'
      : '<div class="note">✅ لا مبالغ مستحقة على سيارات مُسلَّمة</div>') +

    '<div class="sigs">' + partners.map(function (pt) { return '<div class="sig">' + E(pt.name) + '<br><span style="color:#999;">التوقيع</span></div>'; }).join('') + '</div>' +
    '<div class="foot">أُعدّ آلياً من نظام إدارة ورشة اللمسة الأخيرة · ' + E(today()) + '</div>' +
    '</body></html>';
  return html;
}

// أزرار الفتح: صفحة الإغلاق الشهري وتبويب الربحية
function _ensurePartnersButtons() {
  var page = document.getElementById('page-closing');
  if (page && !document.getElementById('btn-partners-report')) {
    var anchor = page.querySelector('button[onclick="openCloseMonthModal()"]');
    if (anchor) {
      var b = document.createElement('button');
      b.id = 'btn-partners-report';
      b.className = 'btn btn-outline btn-sm';
      b.textContent = '📄 تقرير الشركاء';
      b.onclick = openPartnersReport;
      anchor.parentNode.insertBefore(b, anchor);
    }
  }
}
