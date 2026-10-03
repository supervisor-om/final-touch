// يضع لكل خلية جدول data-label من عنوان عمودها، فتعرضها css/mobile.css
// على الجوال كبطاقة «العنوان: القيمة». الجداول تُعاد كتابتها كثيراً (renderAll،
// النوافذ)، لذا نراقب الصفحة ونوسم الجديد فقط.
(function () {
  function labelTable(table) {
    var heads = table.querySelectorAll('thead th');
    if (!heads.length) return;
    var labels = [];
    for (var i = 0; i < heads.length; i++) {
      var span = parseInt(heads[i].getAttribute('colspan'), 10) || 1;
      var txt = (heads[i].textContent || '').trim();
      for (var k = 0; k < span; k++) labels.push(txt);
    }
    var rows = table.querySelectorAll('tbody tr');
    for (var r = 0; r < rows.length; r++) {
      var col = 0;
      var cells = rows[r].children;
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        var cs = parseInt(cell.getAttribute('colspan'), 10) || 1;
        if (cs === 1 && cell.getAttribute('data-label') == null) cell.setAttribute('data-label', labels[col] || '');
        col += cs;
      }
    }
  }
  function labelAll() {
    var tables = document.querySelectorAll('.table-wrap table');
    for (var i = 0; i < tables.length; i++) labelTable(tables[i]);
  }
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    (window.requestAnimationFrame || setTimeout)(function () { pending = false; labelAll(); });
  }
  function start() {
    labelAll();
    if (window.MutationObserver) new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
