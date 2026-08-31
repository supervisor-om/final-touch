/* ------------------------------------------------------------------
   طبقة توافق مع Safari 12 (متصفّح iOS 12.5 على الأجهزة القديمة).
   خاصية gap في flexbox لم تصل قبل Safari 14.1، فتلتصق العناصر ببعضها.
   نكتشف غيابها مرّة واحدة ثمّ نحوّلها إلى هوامش مكافئة.
   على المتصفّحات الحديثة تنتهي الدالة فوراً ولا يُثبَّت أيّ مراقِب.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  function flexGapSupported() {
    try {
      var probe = document.createElement('div');
      probe.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;' +
        'position:absolute;visibility:hidden;height:auto;padding:0;border:0;margin:0;';
      var a = document.createElement('span');
      var b = document.createElement('span');
      a.style.cssText = b.style.cssText =
        'display:block;width:1px;height:0;padding:0;border:0;margin:0;';
      probe.appendChild(a);
      probe.appendChild(b);
      var host = document.body || document.documentElement;
      host.appendChild(probe);
      var ok = probe.scrollHeight === 1;
      probe.parentNode.removeChild(probe);
      return ok;
    } catch (e) {
      return true; // عند الشكّ لا نتدخّل
    }
  }

  if (flexGapSupported()) return;

  var root = document.documentElement;
  root.className += ' no-flexgap';
  var rtl = String(root.getAttribute('dir') || '').toLowerCase() === 'rtl';

  // على أيّ جهة يوضع الهامش: يعتمد على اتجاه الصفحة واتجاه المحور معاً
  function marginSide(dir) {
    if (dir.indexOf('column') === 0) {
      return dir === 'column-reverse' ? 'marginBottom' : 'marginTop';
    }
    var reversed = dir === 'row-reverse';
    return (rtl !== reversed) ? 'marginRight' : 'marginLeft';
  }

  // gap تُكتب "8px" أو "4px 10px" (صف ثمّ عمود)
  function parseGap(value) {
    var parts = String(value).trim().split(/\s+/);
    var row = parseFloat(parts[0]);
    var col = parts.length > 1 ? parseFloat(parts[1]) : row;
    return { row: isNaN(row) ? 0 : row, col: isNaN(col) ? 0 : col };
  }

  function patch(el) {
    if (el.getAttribute('data-gapfix')) return;
    var st = el.style;
    if (String(st.display || '').indexOf('flex') === -1) return;

    var shorthand = st.gap || st.gridGap || '';
    var g = shorthand
      ? parseGap(shorthand)
      : { row: parseFloat(st.rowGap) || 0, col: parseFloat(st.columnGap) || 0 };
    if (!g.row && !g.col) return;

    el.setAttribute('data-gapfix', '1');

    var dir = st.flexDirection || 'row';
    var isColumn = dir.indexOf('column') === 0;
    var along = isColumn ? g.row : g.col;
    var side = marginSide(dir);
    var wraps = String(st.flexWrap || '').indexOf('wrap') === 0;
    var kids = el.children;

    for (var i = 0; i < kids.length; i++) {
      if (i > 0 && along) kids[i].style[side] = along + 'px';
      // الصفوف الملتفّة تحتاج فاصلاً رأسياً أيضاً
      if (!isColumn && wraps && g.row) kids[i].style.marginBottom = g.row + 'px';
    }
  }

  // نقرأ el.style فقط (بلا getComputedStyle) حتى لا نُجبر المتصفّح على إعادة تخطيط
  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    var attr = node.getAttribute && node.getAttribute('style');
    if (attr && attr.indexOf('gap') > -1) patch(node);
    if (!node.querySelectorAll) return;
    var found = node.querySelectorAll('[style*="gap"]');
    for (var i = 0; i < found.length; i++) patch(found[i]);
  }

  function scanAll() { scan(document.body || document.documentElement); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAll);
  } else {
    scanAll();
  }

  // التطبيق يعيد بناء الجداول باستمرار، فنعالج المضاف دفعةً واحدة لا عنصراً عنصراً
  if (window.MutationObserver) {
    var defer = window.requestAnimationFrame
      ? function (fn) { window.requestAnimationFrame(fn); }
      : function (fn) { setTimeout(fn, 16); };
    var queue = [];
    var scheduled = false;

    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) queue.push(added[j]);
        }
      }
      if (!queue.length || scheduled) return;
      scheduled = true;
      defer(function () {
        scheduled = false;
        var batch = queue;
        queue = [];
        for (var k = 0; k < batch.length; k++) scan(batch[k]);
      });
    }).observe(root, { childList: true, subtree: true });
  }
})();
