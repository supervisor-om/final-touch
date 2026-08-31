/* ------------------------------------------------------------------
   قراءة رقم اللوحة من صورة — محلّياً داخل المتصفّح.
   لا خادم، ولا مفتاح API، ولا تُرسَل الصورة إلى أيّ جهة.

   محرّك القراءة (tesseract.js) يُحمَّل عند أوّل استخدام فقط لا مع
   الصفحة، حتى لا يبطئ التطبيق على من لا يستعمل الميزة.
   إن تعذّر تحميله (جهاز قديم أو بلا إنترنت) تبقى الصورة محفوظة
   ويُدخَل الرقم يدوياً — الميزة لا توقف العمل أبداً.
   ------------------------------------------------------------------ */
var PLATE_SCAN = (function () {
  'use strict';

  var V = '5.1.1';
  var SRC = {
    lib:    'https://cdn.jsdelivr.net/npm/tesseract.js@' + V + '/dist/tesseract.min.js',
    worker: 'https://cdn.jsdelivr.net/npm/tesseract.js@' + V + '/dist/worker.min.js',
    core:   'https://cdn.jsdelivr.net/npm/tesseract.js-core@' + V + '/',
    lang:   'https://tessdata.projectnaptha.com/4.0.0_fast'
  };

  var worker = null, loading = null;
  var el = {}, img = null, sel = null, drag = null;

  // ─────────────── تحميل المحرّك (مرّة واحدة لكل جلسة) ───────────────
  function loadLib() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = SRC.lib;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('تعذّر تحميل محرّك القراءة')); };
      document.head.appendChild(s);
    });
  }

  function getWorker(onProgress) {
    if (worker) return Promise.resolve(worker);
    if (loading) return loading;
    loading = loadLib().then(function () {
      return window.Tesseract.createWorker('eng', 1, {
        workerPath: SRC.worker,
        corePath:   SRC.core,
        langPath:   SRC.lang,
        logger: function (m) {
          if (!onProgress || !m) return;
          if (m.status === 'recognizing text') {
            onProgress('يقرأ الأرقام… ' + Math.round((m.progress || 0) * 100) + '٪');
          } else {
            onProgress('يجهّز المحرّك… (تنزيل لمرّة واحدة)');
          }
        }
      });
    }).then(function (w) {
      // أرقام فقط: يمنع المحرّك من تخمين حروف مكان الأرقام
      return w.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: '7'
      }).then(function () { worker = w; loading = null; return w; });
    })['catch'](function (e) { loading = null; throw e; });
    return loading;
  }

  // ─────────────── تجهيز الصورة قبل القراءة ───────────────
  // عتبة أوتسو تفصل الحبر عن الخلفية تلقائياً مهما كانت الإضاءة
  function otsu(hist, total) {
    var sum = 0, i;
    for (i = 0; i < 256; i++) sum += i * hist[i];
    var sumB = 0, wB = 0, best = -1, lo = 128, hi = 128;
    for (i = 0; i < 256; i++) {
      wB += hist[i];
      if (!wB) continue;
      var wF = total - wB;
      if (!wF) break;
      sumB += i * hist[i];
      var mB = sumB / wB, mF = (sum - sumB) / wF;
      var v = wB * wF * (mB - mF) * (mB - mF);
      // بين قمّتَي الحبر والخلفية فجوة تتساوى فيها كل العتبات. أخذ أوّلها
      // يلصق العتبة بحافّة الحبر، فتكفي ضوضاء يسيرة لابتلاع أطراف الأرقام.
      // نتتبّع طرفَي المدى المتساوي ونأخذ منتصفه ليبقى هامش على الجانبين.
      if (v > best) { best = v; lo = hi = i; }
      else if (v === best) { hi = i; }
    }
    return (lo + hi) >> 1;
  }

  function preprocess(image, box) {
    var sx = Math.max(0, Math.round(box.x * image.naturalWidth));
    var sy = Math.max(0, Math.round(box.y * image.naturalHeight));
    var sw = Math.max(8, Math.round(box.w * image.naturalWidth));
    var sh = Math.max(8, Math.round(box.h * image.naturalHeight));

    // المحرّك يحتاج ارتفاع حرف ~٣٠ بكسل، والقصّ من صورة جوّال أصغر من ذلك
    var scale = Math.min(6, Math.max(2, 900 / sw));
    var w = Math.round(sw * scale), h = Math.round(sh * scale);

    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);

    var data = ctx.getImageData(0, 0, w, h), p = data.data;
    var hist = [], i;
    for (i = 0; i < 256; i++) hist[i] = 0;
    for (i = 0; i < p.length; i += 4) {
      var g = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) | 0;
      p[i] = p[i + 1] = p[i + 2] = g;
      hist[g]++;
    }
    var t = otsu(hist, w * h), dark = 0;
    for (i = 0; i < p.length; i += 4) {
      var v = p[i] > t ? 255 : 0;
      if (!v) dark++;
      p[i] = p[i + 1] = p[i + 2] = v;
    }
    // اللوحة العُمانية حبر داكن على أبيض؛ إن غلب الداكن فالتحديد معكوس
    if (dark > w * h * 0.55) {
      for (i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = 255 - p[i];
    }
    ctx.putImageData(data, 0, 0);
    return c;
  }

  // ─────────────── الواجهة ───────────────
  function btnStyle(bg) {
    return 'background:' + bg + ';color:#fff;border:none;border-radius:10px;padding:11px 18px;' +
      'font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;margin:4px;';
  }

  function build() {
    if (el.root) return;
    var o = document.createElement('div');
    o.id = 'plate-scan-overlay';
    o.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;left:0;z-index:10000;' +
      'background:rgba(10,15,30,.96);flex-direction:column;align-items:center;' +
      'justify-content:center;padding:16px;direction:rtl;';
    o.innerHTML =
      '<div style="color:#fff;font-size:15px;font-weight:900;margin-bottom:4px;">📸 قراءة رقم اللوحة</div>' +
      '<div style="color:#9aa4bf;font-size:12px;margin-bottom:10px;text-align:center;line-height:1.7;max-width:340px;">' +
        'حدّد اللوحة وحدها: المس زاوية واسحب حتى الزاوية المقابلة.<br>كلّما ضاق التحديد على الأرقام زادت الدقّة.</div>' +
      '<div id="ps-stage" style="position:relative;max-width:100%;max-height:56vh;line-height:0;' +
        'border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.18);touch-action:none;">' +
        '<img id="ps-img" style="max-width:100%;max-height:56vh;display:block;" alt="">' +
        '<div id="ps-box" style="display:none;position:absolute;border:2px solid #e94560;' +
          'box-shadow:0 0 0 9999px rgba(0,0,0,.45);pointer-events:none;"></div>' +
      '</div>' +
      '<div id="ps-status" style="color:#ffd166;font-size:12px;min-height:20px;margin-top:10px;text-align:center;"></div>' +
      '<div style="margin-top:8px;display:flex;flex-wrap:wrap;justify-content:center;">' +
        '<button type="button" id="ps-read"   style="' + btnStyle('#e94560') + '">✅ اقرأ الرقم</button>' +
        '<button type="button" id="ps-retake" style="' + btnStyle('rgba(255,255,255,.12)') + '">🔄 صورة أخرى</button>' +
        '<button type="button" id="ps-cancel" style="' + btnStyle('rgba(255,255,255,.12)') + '">إلغاء</button>' +
      '</div>';
    document.body.appendChild(o);

    el.root   = o;
    el.img    = o.querySelector('#ps-img');
    el.stage  = o.querySelector('#ps-stage');
    el.box    = o.querySelector('#ps-box');
    el.status = o.querySelector('#ps-status');

    o.querySelector('#ps-read').onclick   = read;
    o.querySelector('#ps-retake').onclick = function () { close(); start(); };
    o.querySelector('#ps-cancel').onclick = close;

    el.stage.addEventListener('mousedown', onDown);
    el.stage.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    // Safari 12 لا يعرف Pointer Events، فنستعمل أحداث اللمس الكلاسيكية
    el.stage.addEventListener('touchstart', onDown, false);
    el.stage.addEventListener('touchmove', onMove, false);
    document.addEventListener('touchend', onUp, false);
  }

  function point(e) {
    var r = el.stage.getBoundingClientRect();
    var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    return { x: (t.clientX - r.left) / r.width, y: (t.clientY - r.top) / r.height };
  }

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function onDown(e) {
    if (!img) return;
    e.preventDefault();
    drag = point(e);
    sel = null;
    paint();
  }

  function onMove(e) {
    if (!drag) return;
    e.preventDefault();
    var p = point(e);
    var x1 = clamp01(Math.min(drag.x, p.x)), y1 = clamp01(Math.min(drag.y, p.y));
    var x2 = clamp01(Math.max(drag.x, p.x)), y2 = clamp01(Math.max(drag.y, p.y));
    sel = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    paint();
  }

  function onUp() {
    if (!drag) return;
    drag = null;
    // لمسة عابرة بلا سحب: نعيد التحديد الافتراضي بدل تركه فارغاً
    if (!sel || sel.w < 0.04 || sel.h < 0.02) { sel = defaultBox(); paint(); }
  }

  function defaultBox() { return { x: 0.22, y: 0.55, w: 0.56, h: 0.22 }; }

  function paint() {
    if (!sel) { el.box.style.display = 'none'; return; }
    el.box.style.display = 'block';
    el.box.style.left   = (sel.x * 100) + '%';
    el.box.style.top    = (sel.y * 100) + '%';
    el.box.style.width  = (sel.w * 100) + '%';
    el.box.style.height = (sel.h * 100) + '%';
  }

  function status(msg) {
    if (el.status) el.status.textContent = msg || '';
  }

  function close() {
    if (el.root) el.root.style.display = 'none';
    img = null; sel = null; drag = null;
  }

  // ─────────────── التشغيل ───────────────
  function start() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment'); // يفتح الكاميرا الخلفية على الجوّال
    input.style.display = 'none';
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (f) show(f);
      input.value = '';
    };
    document.body.appendChild(input);
    input.click();
    setTimeout(function () {
      if (input.parentNode) input.parentNode.removeChild(input);
    }, 60000);
  }

  function show(file) {
    build();
    var reader = new FileReader();
    reader.onload = function (e) {
      el.img.onload = function () {
        img = el.img;
        sel = defaultBox();
        paint();
        status('');
      };
      el.img.src = e.target.result;
      el.root.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  function read() {
    if (!img || !sel) { status('حدّد اللوحة أوّلاً'); return; }
    status('يجهّز…');
    var canvas;
    try {
      canvas = preprocess(img, sel);
    } catch (e) {
      finish('', 0, 'تعذّرت معالجة الصورة');
      return;
    }
    getWorker(status)
      .then(function (w) { return w.recognize(canvas); })
      .then(function (r) {
        var digits = ((r && r.data && r.data.text) || '').replace(/[^0-9]/g, '');
        var conf   = (r && r.data && r.data.confidence) || 0;
        finish(digits, conf, null);
      })['catch'](function (err) {
        finish('', 0, (err && err.message) || 'تعذّرت القراءة الآلية على هذا الجهاز');
      });
  }

  function finish(digits, conf, errMsg) {
    var photo = el.img ? el.img.src : '';
    // الصورة تُضاف إلى صور الاستلام حتى لو فشلت القراءة — لا يضيع جهد التصوير
    if (window.onPlateScanned) {
      try { window.onPlateScanned(photo, digits); } catch (e) {}
    }
    var field = document.getElementById('car-plate');
    if (digits && field) {
      field.value = digits;
      field.focus();
    }
    close();

    if (errMsg) {
      alert('⚠️ ' + errMsg + '\n\nالصورة حُفظت مع السيارة. أدخل الرقم يدوياً.');
    } else if (!digits) {
      alert('لم أتبيّن أرقاماً داخل التحديد.\n\nالصورة حُفظت. جرّب تحديداً أضيق على الأرقام وحدها، أو أدخل الرقم يدوياً.');
    } else {
      alert('الرقم المقروء: ' + digits +
        (conf < 70 ? '\n\n⚠️ الثقة منخفضة — راجع الرقم.' : '') +
        '\n\nأضف حروف اللوحة يدوياً (مثل: ع م).');
    }
  }

  return { start: start };
})();
