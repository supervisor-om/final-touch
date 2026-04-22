// ── رسالة ترحيبية عند تسجيل السيارة ─────────────────────────
// ── بطاقة العمل JOB CARD ──
function openJobCard(car){
  if(!state.jobCardCounter) state.jobCardCounter=75;
  const num = String(state.jobCardCounter++).padStart(4,'0');
  car.jobCardNo = num;
  saveState();
  const svc = car.service||'';
  const box = v => {
    const checked = svc.includes(v);
    return `<span style="display:inline-block;width:13px;height:13px;border:1.5px solid #000;margin-left:3px;vertical-align:middle;text-align:center;line-height:11px;font-size:10px;">${checked?'✓':''}</span>`;
  };
  const w = window.open('','_blank','width=860,height=1200');
  if(!w){alert('يرجى السماح بالنوافذ المنبثقة لطباعة بطاقة العمل');return;}
  w.document.write(`<!DOCTYPE html><html lang="ar"><head>
<meta charset="UTF-8"><title>Job Card #${num}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,sans-serif;font-size:10.5px;color:#000;background:#fff;padding:12px;}
.jc{border:2px solid #1a3a6e;max-width:800px;margin:0 auto;}
/* HEADER */
.jc-head{display:flex;align-items:stretch;border-bottom:2px solid #1a3a6e;}
.jc-head-left{padding:7px 10px;font-size:9.5px;line-height:1.75;min-width:185px;border-left:1px solid #1a3a6e;direction:ltr;}
.jc-head-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 8px;text-align:center;border-left:1px solid #1a3a6e;}
.jc-head-right{padding:7px 10px;font-size:9.5px;line-height:1.75;min-width:175px;text-align:right;direction:rtl;}
.jc-co-name-ar{font-size:15px;font-weight:900;color:#1a3a6e;}
.jc-co-name-en{font-size:13px;font-weight:900;color:#1a3a6e;letter-spacing:.5px;}
.jc-badge{display:inline-block;background:#1a3a6e;color:#fff;border-radius:30px;padding:3px 14px;font-size:9px;font-weight:700;margin:4px 0;}
.jc-card-title{font-size:14px;font-weight:900;color:#1a3a6e;margin-top:4px;letter-spacing:.5px;}
/* NO + DATES ROW */
.jc-no-row{display:flex;align-items:center;border-bottom:1px solid #1a3a6e;padding:5px 10px;gap:16px;direction:ltr;}
.jc-no-label{font-weight:700;font-size:11px;}
.jc-no-val{color:#c0392b;font-size:22px;font-weight:900;letter-spacing:2px;min-width:70px;}
.jc-date-pair{display:flex;align-items:baseline;gap:5px;font-size:10px;}
.jc-date-pair label{font-weight:700;white-space:nowrap;}
.jc-dotline{flex:1;border-bottom:1px dotted #555;min-width:90px;height:13px;display:inline-block;vertical-align:bottom;}
/* CUSTOMER FIELDS */
.jc-cust{border-bottom:1px solid #1a3a6e;padding:4px 10px;direction:rtl;}
.jc-cust-row{display:flex;align-items:baseline;gap:6px;margin-bottom:3px;}
.jc-cust-row label{font-weight:700;white-space:nowrap;font-size:10px;}
.jc-cust-row .en{direction:ltr;font-size:9px;color:#444;}
.jc-dotfill{flex:1;border-bottom:1px dotted #555;height:13px;}
/* VEHICLE TABLE */
.jc-veh{border-bottom:1px solid #1a3a6e;}
.jc-veh table{width:100%;border-collapse:collapse;}
.jc-veh td{border:1px solid #1a3a6e;padding:3px 7px;font-size:10px;}
.jc-veh td.lbl{font-weight:700;background:#f0f4ff;width:140px;}
/* SERVICE CHECKBOXES */
.jc-svc{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #1a3a6e;}
.jc-svc-cell{padding:5px 8px;border-left:1px solid #1a3a6e;font-size:11px;font-weight:700;display:flex;align-items:center;gap:5px;}
.jc-svc-cell:last-child{border-left:none;}
.jc-svc-cell .ar{font-size:11px;}
.jc-svc-cell .en{font-size:9px;color:#333;}
/* JOBS + DIAGRAM */
.jc-body{display:flex;border-bottom:1px solid #1a3a6e;min-height:230px;}
.jc-jobs{flex:1;padding:6px 10px;border-left:1px solid #1a3a6e;}
.jc-jobs-hdr{font-size:12px;font-weight:900;text-align:center;margin-bottom:5px;color:#1a3a6e;direction:ltr;}
.jc-jline{border-bottom:1px solid #ccc;height:22px;margin-bottom:1px;}
.jc-diagram{width:185px;padding:5px;display:flex;align-items:center;justify-content:center;}
/* AMOUNT */
.jc-amt{border-bottom:1px solid #1a3a6e;padding:5px 10px;font-size:11px;font-weight:700;direction:ltr;}
/* TERMS */
.jc-terms{border-bottom:1px solid #1a3a6e;}
.jc-terms-hdr{background:#1a3a6e;color:#fff;text-align:center;font-weight:700;font-size:10px;padding:3px;}
.jc-terms-body{display:flex;direction:ltr;}
.jc-terms-en{flex:1;padding:5px 8px;font-size:8px;line-height:1.55;border-left:1px solid #1a3a6e;}
.jc-terms-ar{flex:1;padding:5px 8px;font-size:8px;line-height:1.55;text-align:right;direction:rtl;}
/* AUTH */
.jc-auth{border-bottom:1px solid #1a3a6e;}
.jc-auth-body{display:flex;direction:ltr;}
.jc-auth-en{flex:1;padding:6px 8px;font-size:8.5px;line-height:1.5;border-left:1px solid #1a3a6e;}
.jc-auth-ar{flex:1;padding:6px 8px;font-size:8.5px;line-height:1.5;text-align:right;direction:rtl;}
/* SIGNATURES */
.jc-sigs{display:flex;direction:ltr;}
.jc-sig{flex:1;padding:8px 12px;border-left:1px solid #1a3a6e;font-size:10px;}
.jc-sig:last-child{border-left:none;}
.jc-sigline{border-bottom:1px solid #000;margin-top:22px;}
@media print{body{padding:0;}.no-print{display:none!important;}}
</style>
</head><body>
<div class="no-print" style="text-align:center;margin-bottom:10px;display:flex;gap:10px;justify-content:center;">
  <button onclick="window.print()" style="background:#1a3a6e;color:#fff;border:none;border-radius:8px;padding:8px 28px;font-size:14px;cursor:pointer;font-weight:700;">🖨️ طباعة</button>
  <button onclick="window.close()" style="background:#555;color:#fff;border:none;border-radius:8px;padding:8px 20px;font-size:14px;cursor:pointer;">✕ إغلاق</button>
</div>
<div class="jc">

  <!-- HEADER -->
  <div class="jc-head">
    <div class="jc-head-left">
      <div><b>C.R. : 1205078</b></div>
      <div>GSM: 97100917</div>
      <div>Maabilah Ind.</div>
      <div>Road No: 8</div>
      <div>Sultanate of Oman</div>
      <div>E-mail: alkhuseibi@live.com</div>
    </div>
    <div class="jc-head-center">
      <div class="jc-co-name-ar">اللمسة الأخيرة الحديثة للتجارة</div>
      <div class="jc-co-name-en">FINAL TOUCH MODERN TRADING</div>
      <div class="jc-badge">إصلاح وسمكرة ودهان المركبات &nbsp;|&nbsp; REPAIR POLISHING &amp; PAINTING OF MOTORS VEHICLES</div>
      <div class="jc-card-title">بطاقة عـمـل &nbsp; JOB CARD</div>
    </div>
    <div class="jc-head-right">
      <div><b>سـ.ت: ١٢٠٥٠٧٨</b></div>
      <div>نقال: ٩٧١٠٠٩١٧</div>
      <div>العيبيلة الصناعية</div>
      <div>شارع رقم ٨</div>
      <div>سلطنة عمان</div>
    </div>
  </div>

  <!-- NO + DATES -->
  <div class="jc-no-row">
    <span class="jc-no-label">No.</span>
    <span class="jc-no-val">${num}</span>
    <span class="jc-date-pair"><label>Order Date</label><span class="jc-dotline" style="min-width:110px;">&nbsp;${car.dateIn||''}</span></span>
    <span class="jc-date-pair"><label>Delivery Date</label><span class="jc-dotline" style="min-width:110px;">&nbsp;${car.expectedDate||''}</span></span>
  </div>

  <!-- CUSTOMER -->
  <div class="jc-cust">
    <div class="jc-cust-row">
      <label>Name of Customer:</label><span class="jc-dotfill">&nbsp;${car.owner}</span>
      <label style="margin-right:20px;">:اسم العميل</label>
    </div>
    <div class="jc-cust-row">
      <label>Tel. No. :</label><span class="jc-dotfill">&nbsp;${car.phone||''}</span>
      <label style="margin-right:20px;">:هاتف رقم</label>
    </div>
  </div>

  <!-- VEHICLE TABLE -->
  <div class="jc-veh">
    <table>
      <tr>
        <td class="lbl">نوع السيـارة</td>
        <td>${car.service||''}</td>
        <td class="lbl" style="text-align:left;direction:ltr;">رقم السيارة</td>
        <td style="direction:ltr;">${car.plate}</td>
      </tr>
      <tr>
        <td class="lbl" style="direction:ltr;">Make of Vehicle :</td>
        <td>${car.model||''}</td>
        <td class="lbl" style="text-align:left;direction:ltr;">Vehicle No :</td>
        <td style="direction:ltr;">${car.km ? 'KM: '+car.km : ''}</td>
      </tr>
    </table>
  </div>

  <!-- SERVICE CHECKBOXES -->
  <div class="jc-svc">
    <div class="jc-svc-cell"><span class="ar">ميكانيك</span>${box('ميكانيك')}<span class="en">MECHANICAL</span></div>
    <div class="jc-svc-cell"><span class="ar">سمكرة</span>${box('سمكرة')}<span class="en">DENTING</span></div>
    <div class="jc-svc-cell"><span class="ar">دهان</span>${box('دهان')}<span class="en">PAINTING</span></div>
    <div class="jc-svc-cell"><span class="ar">كهربائي</span>${box('كهربائي')}<span class="en">ELECTRICAL</span></div>
  </div>

  <!-- JOBS + DIAGRAM -->
  <div class="jc-body">
    <div class="jc-jobs">
      <div class="jc-jobs-hdr">أعمـال JOBS</div>
      ${Array(10).fill(0).map(()=>'<div class="jc-jline"></div>').join('')}
    </div>
    <div class="jc-diagram">
      <!-- Car top+side exploded view matching the original card -->
      <svg viewBox="0 0 160 300" xmlns="http://www.w3.org/2000/svg" width="170">
        <!-- TOP VIEW (center) -->
        <!-- Car body outline -->
        <rect x="48" y="60" width="64" height="170" rx="10" fill="none" stroke="#1a3a6e" stroke-width="2"/>
        <!-- Hood -->
        <path d="M52,60 L52,35 Q80,22 108,35 L108,60Z" fill="none" stroke="#1a3a6e" stroke-width="1.5"/>
        <!-- Trunk -->
        <path d="M52,230 L52,255 Q80,268 108,255 L108,230Z" fill="none" stroke="#1a3a6e" stroke-width="1.5"/>
        <!-- Windshield front -->
        <path d="M55,80 Q80,65 105,80" fill="none" stroke="#1a3a6e" stroke-width="1"/>
        <!-- Windshield rear -->
        <path d="M55,210 Q80,225 105,210" fill="none" stroke="#1a3a6e" stroke-width="1"/>
        <!-- Door split -->
        <line x1="48" y1="148" x2="112" y2="148" stroke="#1a3a6e" stroke-width="0.8" stroke-dasharray="4,2"/>
        <!-- Hood line -->
        <line x1="48" y1="90" x2="112" y2="90" stroke="#1a3a6e" stroke-width="0.8"/>
        <!-- Trunk line -->
        <line x1="48" y1="200" x2="112" y2="200" stroke="#1a3a6e" stroke-width="0.8"/>
        <!-- Center line -->
        <line x1="80" y1="90" x2="80" y2="200" stroke="#aaa" stroke-width="0.5"/>
        <!-- Front wheels -->
        <rect x="30" y="88" width="16" height="32" rx="3" fill="none" stroke="#1a3a6e" stroke-width="1.5"/>
        <rect x="114" y="88" width="16" height="32" rx="3" fill="none" stroke="#1a3a6e" stroke-width="1.5"/>
        <!-- Rear wheels -->
        <rect x="30" y="168" width="16" height="32" rx="3" fill="none" stroke="#1a3a6e" stroke-width="1.5"/>
        <rect x="114" y="168" width="16" height="32" rx="3" fill="none" stroke="#1a3a6e" stroke-width="1.5"/>
        <!-- FRONT label -->
        <text x="80" y="14" text-anchor="middle" font-size="9" fill="#1a3a6e" font-weight="bold">FRONT</text>
        <line x1="60" y1="17" x2="100" y2="17" stroke="#1a3a6e" stroke-width="0.8"/>
        <!-- REAR label -->
        <text x="80" y="292" text-anchor="middle" font-size="9" fill="#1a3a6e" font-weight="bold">REAR</text>
        <line x1="60" y1="280" x2="100" y2="280" stroke="#1a3a6e" stroke-width="0.8"/>
        <!-- LEFT label -->
        <text x="5" y="150" text-anchor="middle" font-size="8" fill="#1a3a6e" transform="rotate(-90,5,150)">LEFT</text>
        <!-- RIGHT label -->
        <text x="155" y="150" text-anchor="middle" font-size="8" fill="#1a3a6e" transform="rotate(90,155,150)">RIGHT</text>
      </svg>
    </div>
  </div>

  <!-- AMOUNT -->
  <div class="jc-amt">Amount R.O. &nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;.&nbsp;${car.estimate?'<span style="color:#c0392b;">'+car.estimate+' R.O.</span>':''}</div>

  <!-- TERMS -->
  <div class="jc-terms">
    <div class="jc-terms-hdr">Terms &amp; Condition</div>
    <div class="jc-terms-body">
      <div class="jc-terms-en">
        &bull; Vehicle driven &amp; stored at owners risk.<br>
        &bull; We take no responsibility for the valuables left in the vehicle.<br>
        &bull; Any Vehicle not collected within 10 days of notification of it's readiness will subject to demurrage @ R.O. 5 Per day.<br>
        &bull; Company is not responsible for fixing any duplicated parts supplied by the customer and it has been fixed with customer own risk.<br>
        &bull; After completion of the work please take balance spare parts old spare parts within 2 days. Otherwise we are not responsible for that items.
      </div>
      <div class="jc-terms-ar">
        &bull; تم قيادة وإدخال السيارة تحت مسؤولية المالك.<br>
        &bull; الإدارة غير مسؤولة عن فقدان الحاجات الثمينة المتروكة داخل السيارة.<br>
        &bull; سيتم احتساب مبلغ خمسة ريالات عمانية عن كل يوم تأخير في استلام السيارة التي مضت أكثر من عشرة أيام من تاريخ التبليغ عن انتهاء اصلاحها.<br>
        &bull; الإدارة والورشة غير مسؤولة عن تركيب أي قطع تجارية المشتراه من قبل الزبون وعلى الزبون أن يتحمل مسؤولية تركيبها.<br>
        &bull; عند الانتهاء من تصليح السيارة يرجى أخذ جميع القطع القديمة التابعة للسيارة مدة اقصاها يومين وسوف لن تتحمل الشركة أي مسؤولية إتجاه المالك بعد مضي يومين.
      </div>
    </div>
  </div>

  <!-- AUTHORISATION -->
  <div class="jc-auth">
    <div class="jc-auth-body">
      <div class="jc-auth-en">I hereby authorise you to carry out the above repairs along with necessary materials as you see fit. You will not be held responsible for any loss caused beyond your control.</div>
      <div class="jc-auth-ar">أفوض الشركة للقيام بتصليح السيارة ولتغيير القطع الغيار الضرورية حسب ما هو مبين اعلاه والورشان غير مسؤولة عن أي عطل قد يحصل خارج عن إرادتها.</div>
    </div>
  </div>

  <!-- REGISTERED DAMAGES -->
  ${(car.damageMap && car.damageMap.length) ? buildJobCardDamageSection(car.damageMap) : ''}

  <!-- SIGNATURES -->
  <div class="jc-sigs">
    <div class="jc-sig" style="direction:rtl;text-align:right;">
      <div>توقيع مشـرف الورشة</div>
      <div style="font-size:9px;color:#555;">Signature of workshop Supervisor</div>
      <div class="jc-sigline"></div>
    </div>
    <div class="jc-sig" style="direction:ltr;">
      <div style="text-align:right;direction:rtl;">تـوقيـع العميـل&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      <div style="font-size:9px;color:#555;">Signature of Customer</div>
      <div class="jc-sigline"></div>
    </div>
  </div>

</div>
</body></html>`);
  w.document.close();
}

function sendWelcomeMessage(car) {
  const nl = '\n';
  const trackUrl = getTrackingURL(car);
  const msg =
    'مرحباً ' + car.owner + ' 👋' + nl + nl +
    'تم استلام سيارتكم في ورشة اللمسة الأخيرة 🔧' + nl +
    'رقم اللوحة: ' + car.plate + (car.model ? ' (' + car.model + ')' : '') + nl +
    (car.service ? 'نوع الخدمة: ' + car.service + nl : '') +
    (car.expectedDate ? 'موعد التسليم المتوقع: ' + car.expectedDate + nl : '') +
    nl +
    'يمكنكم متابعة سير العمل على سيارتكم من خلال الرابط:' + nl +
    trackUrl + nl + nl +
    'شكراً لثقتكم بنا 🙏';

  // بناء البانر
  const old = document.getElementById('wa-welcome-banner');
  if (old) old.remove();

  const banner = document.createElement('div');
  banner.id = 'wa-welcome-banner';
  banner.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;background:linear-gradient(135deg,#0f3460,#1a4a8a);border:1px solid rgba(79,172,254,.4);border-radius:16px;padding:14px 20px;display:flex;align-items:center;gap:14px;box-shadow:0 6px 30px rgba(0,0,0,.4);font-family:var(--font-main);direction:rtl;max-width:92vw;';

  if (car.phone) {
    let phone = car.phone.replace(/[^0-9+]/g,'').replace(/^\+/,'');
    if (phone.startsWith('00'))         phone = phone.slice(2);
    else if (phone.startsWith('0'))     phone = '968' + phone.slice(1);
    else if (/^[79]\d{7}$/.test(phone)) phone = '968' + phone;
    const waUrl = 'whatsapp://send?phone=' + phone + '&text=' + encodeURIComponent(msg);
    banner.innerHTML = `
      <span style="font-size:22px;">💬</span>
      <div style="flex:1;">
        <div style="color:#fff;font-size:13px;font-weight:700;">أرسل رسالة ترحيب للعميل</div>
        <div style="color:rgba(255,255,255,.7);font-size:11px;">${car.owner} — ${car.plate}</div>
      </div>
      <a href="${waUrl}" target="_blank" rel="noopener"
         style="background:#25d366;color:#fff;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:900;text-decoration:none;white-space:nowrap;"
         onclick="setTimeout(()=>document.getElementById('wa-welcome-banner')?.remove(),500)">
        إرسال ▶
      </a>
      <button onclick="document.getElementById('wa-welcome-banner').remove()"
        style="background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:16px;flex-shrink:0;">✕</button>`;
  } else {
    banner.innerHTML = `
      <span style="font-size:22px;">💬</span>
      <div style="flex:1;">
        <div style="color:#fff;font-size:13px;font-weight:700;">تم تسجيل السيارة ✅</div>
        <div style="color:rgba(255,255,255,.7);font-size:11px;">أضف رقم هاتف العميل لإرسال رسالة ترحيب</div>
      </div>
      <button onclick="document.getElementById('wa-welcome-banner').remove()"
        style="background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:16px;flex-shrink:0;">✕</button>`;
  }

  document.body.appendChild(banner);
  setTimeout(() => banner?.remove(), 40000);
}

// ── إشعار WhatsApp — يعرض زر قابل للضغط لتجاوز popup blocker ──
function sendPushNotification(car) {
  // مرحلة الاستلام → أرسل رسالة ترحيبية مع رابط التتبع
  if ((car.stage || 0) === 0) { sendWelcomeMessage(car); return; }
  const carStages = getCarStages(car);
  const idx   = car.stage || 0;
  const s     = carStages[idx] || carStages[carStages.length-1];
  const label = s.icon + ' ' + s.label;

  // Remove old banner if exists
  const old = document.getElementById('wa-notify-banner');
  if (old) old.remove();

  const banner = document.createElement('div');
  banner.id = 'wa-notify-banner';
  banner.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;background:#25d366;border-radius:16px;padding:14px 24px;display:flex;align-items:center;gap:14px;box-shadow:0 6px 30px rgba(0,0,0,.35);font-family:var(--font-main);direction:rtl;max-width:90vw;';

  let actionHtml;
  if (car.phone) {
    const nl  = '\n';
    const trackUrl = getTrackingURL(car);

    // Build message
    let msg = 'مرحباً ' + car.owner + ' 👋' + nl + nl +
      'سيارتك ' + car.plate + (car.model ? ' (' + car.model + ')' : '') + nl +
      'وصلت إلى مرحلة: ' + label + nl;

    // If ready for delivery (stage 4), add remaining amount
    if (idx === 4) {
      const total     = parseFloat(car.estimate) || 0;
      const paid      = parseFloat(car.paidTotal) || 0;
      const remaining = total - paid;
      if (remaining > 0) {
        msg += nl + '💰 المبلغ المتبقي: ' + remaining.toLocaleString('ar-OM') + ' ر.ع' + nl;
      } else if (total > 0) {
        msg += nl + '✅ تم سداد المبلغ كاملاً' + nl;
      }
    }

    msg += nl + '🔍 تتبع سيارتك: ' + trackUrl + nl + nl +
      'ورشة اللمسة الأخيرة 🔧';

    let phone = car.phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
    if (phone.startsWith('00'))          phone = phone.slice(2);
    else if (phone.startsWith('0'))      phone = '968' + phone.slice(1);
    else if (/^[79]\d{7}$/.test(phone)) phone = '968' + phone;

    if (phone) {
      const waUrl = 'whatsapp://send?phone=' + phone + '&text=' + encodeURIComponent(msg);
      actionHtml = `<a href="${waUrl}"
         style="background:#fff;color:#25d366;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:900;text-decoration:none;white-space:nowrap;"
         onclick="setTimeout(()=>document.getElementById('wa-notify-banner')?.remove(),500)">
        إرسال ▶
      </a>`;
    } else {
      actionHtml = `<span style="background:rgba(0,0,0,.2);color:#fff;border-radius:10px;padding:8px 14px;font-size:12px;">رقم غير صحيح</span>`;
    }
  } else {
    actionHtml = `<span style="background:rgba(0,0,0,.2);color:#fff;border-radius:10px;padding:8px 14px;font-size:12px;">أضف رقم هاتف العميل</span>`;
  }

  banner.innerHTML = `
    <span style="font-size:22px;">💬</span>
    <div>
      <div style="color:#fff;font-size:13px;font-weight:700;">إشعار واتساب — ${car.owner}</div>
      <div style="color:rgba(255,255,255,.85);font-size:11px;">${label}</div>
    </div>
    ${actionHtml}
    <button onclick="document.getElementById('wa-notify-banner').remove()"
      style="background:rgba(0,0,0,.15);border:none;color:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:16px;line-height:1;flex-shrink:0;">✕</button>
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner?.remove(), 30000);
}

// ── تفعيل إشعارات WhatsApp من صفحة التتبع ──────────────────
function openCallMeBotActivation(phone) {
  const activationMsg = 'I allow callmebot to send me messages';
  const botPhone = '34644597364';
  window.open('https://wa.me/' + botPhone + '?text=' + encodeURIComponent(activationMsg), '_blank');
}

function saveWaBotKey() {
  const keyInput = document.getElementById('trk-wabot-key');
  const plateInput = document.getElementById('trk-plate-input');
  if (!keyInput || !plateInput) return;
  const key = keyInput.value.trim();
  const plate = plateInput.value.trim().toLowerCase();
  if (!key || !plate) {
    document.getElementById('trk-wabot-status').textContent = '⚠️ أدخل المفتاح';
    return;
  }
  const car = state.cars.find(c => c.plate.trim().toLowerCase() === plate);
  if (!car) {
    document.getElementById('trk-wabot-status').textContent = '⚠️ السيارة غير موجودة';
    return;
  }
  car.waBotKey = key;
  saveState();
  document.getElementById('trk-wabot-status').textContent = '✅ تم حفظ المفتاح! ستصلك إشعارات WhatsApp';
  document.getElementById('trk-wabot-status').style.color = '#00d4aa';
  setTimeout(() => {
    const el = document.getElementById('trk-wabot-status');
    if (el) el.textContent = '';
  }, 3000);
}

