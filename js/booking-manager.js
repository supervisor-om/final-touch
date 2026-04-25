// ════════════════════════════════════════════
//  Booking Manager — لوحة إدارة الحجوزات
//  للموظفين في الورشة — يظهر داخل workshop.html
// ════════════════════════════════════════════

var BK_STORES = { bookings: 'finaltouch_bookings' };

function bkLoad(){ try{var r=localStorage.getItem(BK_STORES.bookings); if(r) return JSON.parse(r);}catch(e){} return []; }
function bkSave(data){ try{localStorage.setItem(BK_STORES.bookings,JSON.stringify(data));}catch(e){} }

// ─── Render booking table ───
function renderBookings(){
  var bookings = bkLoad().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  var filter = document.getElementById('bk-filter-status')?.value || '';
  var dateFrom = document.getElementById('bk-date-from')?.value || '';
  var dateTo = document.getElementById('bk-date-to')?.value || '';

  if(filter) bookings = bookings.filter(b => b.status === filter);
  if(dateFrom) bookings = bookings.filter(b => b.date >= dateFrom);
  if(dateTo) bookings = bookings.filter(b => b.date <= dateTo);

  var tbody = document.getElementById('bookings-table-body');
  var empty = document.getElementById('bookings-empty');
  if(!tbody) return;

  if(!bookings.length){
    tbody.innerHTML = ''; if(empty) empty.style.display = 'block';
    return;
  }
  if(empty) empty.style.display = 'none';

  var st = {
    pending: '<span class="badge badge-leave-pending">⏳ جديد</span>',
    confirmed: '<span class="badge badge-leave-approved">✅ مُؤكد</span>',
    arrived: '<span class="badge badge-in">🟢 وصل</span>',
    done: '<span class="badge badge-out">🏁 مكتمل</span>',
    cancelled: '<span class="badge badge-leave-rejected">❌ ملغي</span>'
  };

  tbody.innerHTML = bookings.map(b => {
    var statusActions = '';
    if(b.status === 'pending'){
      statusActions = '<button class="btn btn-success btn-sm" onclick="updateBk(\''+b.id+'\',\'confirmed\')" style="padding:4px 10px;font-size:11px;">✅ تأكيد</button> '+
                      '<button class="btn btn-outline btn-sm" onclick="updateBk(\''+b.id+'\',\'cancelled\')" style="padding:4px 10px;font-size:11px;">❌ إلغاء</button>';
    } else if(b.status === 'confirmed'){
      statusActions = '<button class="btn btn-success btn-sm" onclick="updateBk(\''+b.id+'\',\'arrived\')" style="padding:4px 10px;font-size:11px;">🟪 وصول</button> '+
                      '<button class="btn btn-outline btn-sm" onclick="updateBk(\''+b.id+'\',\'cancelled\')" style="padding:4px 10px;font-size:11px;">❌ إلغاء</button>';
    } else if(b.status === 'arrived'){
      statusActions = '<button class="btn btn-primary btn-sm" onclick="updateBk(\''+b.id+'\',\'done\')" style="padding:4px 10px;font-size:11px;">🏁 إنجاز</button>';
    } else {
      statusActions = '<span style="font-size:11px;color:var(--muted);">—</span>';
    }
    var dateTime = new Date(b.date).toLocaleDateString('ar-SA',{weekday:'short',month:'numeric',day:'numeric'}) + ' · ' + (b.timeLabel||b.time);
    var created = new Date(b.createdAt).toLocaleDateString('ar-SA',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    return '<tr>'+
      '<td><strong>#'+b.id+'</strong></td>'+
      '<td><div>'+b.customerName+'</div><div style="font-size:12px;color:var(--muted);">'+b.phone+'</div></td>'+
      '<td><div>'+(b.plate||'—')+'</div><div style="font-size:12px;color:var(--muted);">'+(b.model||'')+'</div></td>'+
      '<td>'+b.service+'</td>'+
      '<td>'+dateTime+'</td>'+
      '<td>'+st[b.status]+'</td>'+
      '<td>'+(b.notes||'—')+'</td>'+
      '<td style="font-size:11px;color:var(--muted);">'+created+'</td>'+
      '<td>'+statusActions+'</td>'+
    '</tr>';
  }).join('');
}

function updateBk(id, newStatus){
  var bookings = bkLoad();
  var b = bookings.find(x => x.id === id);
  if(!b) return;

  if(newStatus === 'cancelled' && !confirm('هل تريد إلغاء الحجز #'+id+'؟')) return;

  b.status = newStatus;
  if(newStatus === 'done') b.completedAt = nowISO();
  bkSave(bookings);

  // If arriving, add to "New Car" modal pre-filled
  if(newStatus === 'arrived'){
    var fill = 'رقم_اللوحة=' + encodeURIComponent(b.plate) + 
               '&المالك=' + encodeURIComponent(b.customerName) +
               '&الهاتف=' + encodeURIComponent(b.phone) +
               '&الخدمة=' + encodeURIComponent(b.service);
    sessionStorage.setItem('booking_arrived', fill);
    // Show hint to add car
    setTimeout(function(){
      alert('🚗 العميل '+b.customerName+' وصل! انقر "إضافة سيارة" وستنزل البيانات تلقائياً.');
    }, 200);
  }

  renderBookings();
}

// ─── Dashboard counts ───
function renderBookingBadges(){
  var bookings = bkLoad();
  var pending = bookings.filter(b => b.status === 'pending').length;
  var today = new Date().toISOString().split('T')[0];
  var todayCount = bookings.filter(b => b.date === today && ['pending','confirmed','arrived'].includes(b.status)).length;

  var el = document.getElementById('bk-pending-count');
  if(el) el.textContent = pending;
  var el2 = document.getElementById('bk-today-count');
  if(el2) el2.textContent = todayCount;
}

function todayDateStr(){ return new Date().toISOString().split('T')[0]; }

// ─── Check for arriving hints ───
function checkBookingHints(){
  var hint = sessionStorage.getItem('booking_arrived');
  if(hint && typeof openModal === 'function'){
    var parts = hint.split('&');
    var data = {};
    parts.forEach(p => { var [k,v] = p.split('='); try{data[k] = decodeURIComponent(v);}catch(e){} });
    if(document.getElementById('plate')) document.getElementById('plate').value = data['رقم_اللوحة'] || '';
    if(document.getElementById('owner')) document.getElementById('owner').value = data['المالك'] || '';
    if(document.getElementById('phone')) document.getElementById('phone').value = data['الهاتف'] || '';
    if(document.getElementById('service')) document.getElementById('service').value = data['الخدمة'] || '';
    sessionStorage.removeItem('booking_arrived');
  }
}

// Expose globally
window.renderBookings = renderBookings;
window.updateBk = updateBk;
window.renderBookingBadges = renderBookingBadges;
