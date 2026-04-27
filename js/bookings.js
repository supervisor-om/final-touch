/**
 * bookings.js — تتبع الحجوزات من Firebase Firestore
 * يتم استدعاؤه داخل index.html في تبويب "تتبع الحجوزات"
 */

(function(){
  'use strict';

  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  let fbInitialized = false;
  let db = null;
  let allBookings = [];
  let currentFilter = 'all';
  const CAPACITY = 4;

  function fmtDate(iso){
    if(!iso) return '-';
    const d = new Date(iso);
    const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    return days[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth()+1);
  }

  function initFirebase(){
    if(fbInitialized) return;
    try{
      if(typeof firebase === 'undefined') return;
      if(firebaseConfig.apiKey.includes('YOUR')) return; // not configured yet
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      fbInitialized = true;
      listenBookings();
    }catch(e){ console.error('Firebase init:', e); }
  }

  function groupByWeek(list){
    const groups = {};
    list.forEach(function(b){
      const key = b.weekKey || 'unknown';
      if(!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return Object.keys(groups).sort().map(function(k){ return {key:k, bookings:groups[k]}; });
  }

  window.filterBookings = function(status, btn){
    currentFilter = status;
    document.querySelectorAll('#page-bookings .filter-bar button').forEach(function(b){
      b.className = 'btn btn-back';
      b.style.cssText = 'width:auto;padding:8px 16px;border-radius:20px;font-size:13px;';
    });
    btn.className = 'btn btn-primary active';
    btn.style.cssText = 'width:auto;padding:8px 16px;border-radius:20px;font-size:13px;';
    renderBookings();
  };

  function updateStats(){
    const c = {pending:0, confirmed:0, waiting:0, cancelled:0};
    allBookings.forEach(function(b){ if(c[b.status] !== undefined) c[b.status]++; });
    updateText('bk-stat-pending', c.pending);
    updateText('bk-stat-confirmed', c.confirmed);
    updateText('bk-stat-waiting', c.waiting);
    updateText('bk-stat-cancelled', c.cancelled);
    updateText('badge-bookings', allBookings.filter(function(b){ return b.status !== 'cancelled'; }).length);
  }

  function updateText(id, val){
    const el = document.getElementById(id);
    if(el) el.textContent = val;
  }

  window.changeBookingStatus = function(id, status){
    if(!db) return;
    db.collection('bookings').where('id','==',id).get().then(function(snap){
      snap.forEach(function(doc){
        db.collection('bookings').doc(doc.id).update({status:status, updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
      });
    });
  };

  window.deleteBooking = function(id){
    if(!confirm('هل أنت متأكد من حذف الحجز؟')) return;
    if(!db) return;
    db.collection('bookings').where('id','==',id).get().then(function(snap){
      snap.forEach(function(doc){ db.collection('bookings').doc(doc.id).delete(); });
    });
  };

  function renderBookings(){
    updateStats();
    const container = document.getElementById('bookings-container');
    const filtered = currentFilter === 'all' ? allBookings : allBookings.filter(function(b){ return b.status === currentFilter; });

    if(filtered.length === 0){
      if(container) container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">لا توجد حجوزات</div>';
      return;
    }

    const weeks = groupByWeek(filtered);
    let html = '';
    weeks.forEach(function(wg){
      const wActive = allBookings.filter(function(b){ return b.weekKey === wg.key && b.status !== 'cancelled'; });
      const count = wActive.length;
      const isFull = count >= CAPACITY;
      const waiters = wActive.filter(function(b){ return b.isWaiting; }).length;
      const label = wg.bookings[0].weekLabel || wg.key;
      const dateR = wg.bookings[0].weekStart ? fmtDate(wg.bookings[0].weekStart) + ' – ' + fmtDate(wg.bookings[0].weekEnd) : wg.key;

      html += '<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;margin-bottom:16px;overflow:hidden;">';
      html += '<div style="padding:14px 18px;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
      html += '<div style="font-size:15px;font-weight:800;">📅 ' + label + ' <span style="color:var(--muted);font-weight:400;font-size:13px;">' + dateR + '</span></div>';
      html += '<div style="font-size:11px;padding:4px 12px;border-radius:20px;font-weight:700;' + (isFull ? 'background:rgba(233,69,96,.12);color:#e94560;' : 'background:rgba(0,212,170,.12);color:#00d4aa;') + '">' + (isFull ? 'ممتلئ' + (waiters > 0 ? ' (+' + waiters + ' انتظار)' : '') : 'متاح (' + (CAPACITY - count) + ' خالية)') + '</div>';
      html += '</div><div style="padding:12px 16px;">';

      wg.bookings.forEach(function(b){
        const posText = b.isWaiting ? '#' + b.position + ' انتظار' : '#' + b.position + ' / ' + CAPACITY;
        html += '<div style="display:flex;flex-direction:column;gap:8px;padding:12px;border-bottom:1px solid rgba(255,255,255,.08);transition:background .2s;" onmouseover="this.style.background=\'rgba(255,255,255,.03)\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
        html += '<div style="font-family:\'Tajawal\',sans-serif;font-size:15px;font-weight:800;color:#4facfe;">' + b.id + '</div>';
        html += '<div><span style="font-size:11px;padding:3px 10px;border-radius:12px;font-weight:700;';
        if(b.status === 'pending') html += 'background:rgba(79,172,254,.12);color:#4facfe;">';
        else if(b.status === 'confirmed') html += 'background:rgba(0,212,170,.12);color:#00d4aa;">';
        else if(b.status === 'waiting') html += 'background:rgba(245,166,35,.12);color:#f5a623;">';
        else html += 'background:rgba(233,69,96,.12);color:#e94560;">';
        html += b.status + '</span></div></div>';
        html += '<div style="font-size:13px;color:var(--text);line-height:1.8;">';
        html += '<div>👤 <strong style="color:var(--muted);font-weight:600;">الاسم:</strong> ' + (b.customerName || '-') + ' · 📱 ' + (b.phone || '-') + '</div>';
        html += '<div>🚗 <strong style="color:var(--muted);font-weight:600;">اللوحة:</strong> ' + (b.plate || '-') + ' · 🏷️ ' + (b.model || '-') + '</div>';
        html += '<div>🔧 <strong style="color:var(--muted);font-weight:600;">الخدمة:</strong> ' + (b.service || '-') + ' · 📊 <strong style="color:var(--muted);font-weight:600;">الترتيب:</strong> ' + posText + '</div>';
        if(b.notes) html += '<div>📝 <strong style="color:var(--muted);font-weight:600;">ملاحظات:</strong> ' + b.notes + '</div>';
        html += '</div>';
        html += '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">';
        if(b.status !== 'confirmed') html += '<button onclick="changeBookingStatus(\'' + b.id + '\','confirmed'" style="padding:6px 14px;border:none;border-radius:8px;font-family:\'Cairo\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;background:#00d4aa;color:#fff;">✅ تأكيد</button>';
        if(b.status !== 'waiting') html += '<button onclick="changeBookingStatus(\'' + b.id + '\','waiting'" style="padding:6px 14px;border:none;border-radius:8px;font-family:\'Cairo\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;background:#f5a623;color:#000;">🟡 انتظار</button>';
        if(b.status !== 'cancelled') html += '<button onclick="changeBookingStatus(\'' + b.id + '\','cancelled'" style="padding:6px 14px;border:none;border-radius:8px;font-family:\'Cairo\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;background:#e94560;color:#fff;">❌ إلغاء</button>';
        html += '<button onclick="deleteBooking(\'' + b.id + '\')" style="padding:6px 14px;border:none;border-radius:8px;font-family:\'Cairo\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.1);color:var(--muted);border:1px solid rgba(255,255,255,.1)!important;">🗑 حذف</button>';
        html += '</div></div>';
      });
      html += '</div></div>';
    });
    if(container) container.innerHTML = html;
  }

  function listenBookings(){
    if(!db) return;
    db.collection('bookings').onSnapshot(function(snap){
      allBookings = snap.docs.map(function(d){ return d.data(); });
      // Only render if page is active
      const page = document.getElementById('page-bookings');
      if(page && page.classList.contains('active')) renderBookings();
    }, function(err){
      console.error(err);
      var c = document.getElementById('bookings-container');
      if(c) c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger);">❌ خطأ في الاتصال بالسحابة</div>';
    });
  }

  // Wire nav click
  document.addEventListener('DOMContentLoaded', function(){
    var bkNav = document.querySelector('.nav-item[onclick*="showPage(\'bookings\')"]');
    if(bkNav){
      var original = bkNav.getAttribute('onclick');
      bkNav.removeAttribute('onclick');
      bkNav.addEventListener('click', function(){
        if(typeof showPage === 'function') showPage('bookings');
        setTimeout(function(){
          initFirebase();
          renderBookings();
        }, 60);
      });
    }
  });
})();
