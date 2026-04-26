// ════════════════════════════════════════════
//  Booking Manager — لوحة إدارة الحجوزات
//  نظام أسبوعي: ٤ سيارات في الأسبوع
// ════════════════════════════════════════════

var BK_STORES = { bookings: 'finaltouch_bookings' };
var CAPACITY = 4;
var WEEKS_TO_SHOW = 8;

function bkLoad(){ try{var r=localStorage.getItem(BK_STORES.bookings); if(r) return JSON.parse(r);}catch(e){} return []; }
function bkSave(data){ try{localStorage.setItem(BK_STORES.bookings,JSON.stringify(data));}catch(e){} }

// ─── Helpers ───
function nowISO(){ return new Date().toISOString(); }
function getWeekRange(offset){
  var now = new Date();
  var day = now.getDay(); // 0=Sun
  var d = new Date(now);
  d.setDate(d.getDate() - day + (offset * 7));
  var end = new Date(d); end.setDate(d.getDate() + 6);
  return { key:d.toISOString().split('T')[0], start:d, end:end, label:d.getDate()+'/'+(d.getMonth()+1)+' – '+end.getDate()+'/'+(end.getMonth()+1) };
}
function fmtDate(iso){
  var d=new Date(iso); return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
}
function fmtWeekRange(startIso,endIso){
  var s=new Date(startIso), e=new Date(endIso);
  return s.getDate()+'/'+(s.getMonth()+1)+' – '+e.getDate()+'/'+(e.getMonth()+1)+'/'+e.getFullYear();
}

// ─── Weekly Calendar Render ───
function renderBookingCalendar(){
  var container = document.getElementById('booking-calendar');
  if(!container) return;
  var all = bkLoad().filter(b=>b.status!=='cancelled');

  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">';
  for(var i=0; i<WEEKS_TO_SHOW; i++){
    var wk = getWeekRange(i);
    var list = all.filter(b=>b.weekKey===wk.key).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    var taken = Math.min(list.length, CAPACITY);
    var wait = Math.max(0, list.length - CAPACITY);
    var avail = Math.max(0, CAPACITY - list.length);
    var isFull = avail === 0;

    var cls = isFull ? 'border:1px solid rgba(233,69,96,.3);background:rgba(233,69,96,.06);' :
              avail <= 1 ? 'border:1px solid rgba(245,166,35,.3);background:rgba(245,166,35,.06);' :
              'border:1px solid rgba(0,212,170,.25);background:rgba(0,212,170,.05);';

    html += '<div style="border-radius:12px;padding:14px;text-align:center;'+cls+'">';
    html += '<div style="font-size:11px;color:var(--muted);font-weight:700;margin-bottom:4px;">'+(i===0?'هذا الأسبوع':i===1?'الأسبوع القادم':'الأسبوع '+ (i+1))+'</div>';
    html += '<div style="font-size:14px;font-weight:800;margin-bottom:8px;">'+fmtWeekRange(wk.start.toISOString().split('T')[0], wk.end.toISOString().split('T')[0])+'</div>';

    // Dots
    html += '<div style="display:flex;justify-content:center;gap:6px;margin-bottom:8px;">';
    for(var j=0; j<4; j++){
      if(j < taken) html += '<div style="width:16px;height:16px;border-radius:50%;background:var(--success);border:1px solid var(--success);"></div>';
      else html += '<div style="width:16px;height:16px;border-radius:50%;border:1px dashed var(--muted);opacity:.4;"></div>';
    }
    if(wait>0){
      for(var j=0; j<Math.min(wait,3); j++) html += '<div style="width:16px;height:16px;border-radius:50%;background:rgba(245,166,35,.4);border:1px solid var(--gold);" title="انتظار"></div>';
    }
    html += '</div>';

    html += '<div style="font-size:12px;font-weight:700;">'+(isFull ? '<span style="color:var(--danger);">ممتلئ</span> · '+wait+' انتظار':'<span style="color:var(--success);">'+avail+' متاح</span> من 4')+'</div>';

    // Mini list
    if(list.length){
      html += '<div style="margin-top:8px;text-align:right;font-size:12px;">';
      list.slice(0,4).forEach((b,idx)=>{
        var color = idx < CAPACITY ? 'var(--success)' : 'var(--gold)';
        html += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border);">'+
                '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;">'+b.customerName+'</span>'+
                '<span style="color:'+color+';font-weight:700;">#'+b.position+'</span></div>';
      });
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

// ─── Booking Table ───
function renderBookings(){
  var bookings = bkLoad().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  var filter = document.getElementById('bk-filter-status')?.value || '';

  if(filter) bookings = bookings.filter(b=>b.status===filter);

  var tbody = document.getElementById('bookings-table-body');
  var empty = document.getElementById('bookings-empty');
  if(!tbody) return;

  if(!bookings.length){
    tbody.innerHTML=''; if(empty) empty.style.display='block';
    return;
  }
  if(empty) empty.style.display='none';

  var st={
    pending:'<span class="badge badge-leave-pending">⏳ جديد</span>',
    confirmed:'<span class="badge badge-leave-approved">✅ مُؤكد</span>',
    arrived:'<span class="badge badge-in">🟢 وصل</span>',
    done:'<span class="badge badge-out">🏁 مكتمل</span>',
    cancelled:'<span class="badge badge-leave-rejected">❌ ملغي</span>'
  };

  tbody.innerHTML = bookings.map(function(b){
    var weekLabel = b.weekLabel || fmtWeekRange(b.weekStart||b.weekKey, b.weekEnd||b.weekKey);
    var posDot = b.isWaiting
      ? '<span style="color:var(--gold);font-weight:900;margin-left:4px;">#'+b.position+' ⏳</span>'
      : '<span style="color:var(--success);font-weight:900;margin-left:4px;">#'+b.position+' ✅</span>';
    var statusActions = '';
    if(b.status==='pending'){
      statusActions = '<button class="btn btn-success btn-sm" onclick="updateBk(\''+b.id+'\',\'confirmed\')" style="padding:4px 10px;font-size:11px;">✅ تأكيد</button> '+
                      '<button class="btn btn-outline btn-sm" onclick="cancelBk(\''+b.id+'\')" style="padding:4px 10px;font-size:11px;">❌ إلغاء</button>';
    } else if(b.status==='confirmed'){
      statusActions = '<button class="btn btn-success btn-sm" onclick="updateBk(\''+b.id+'\',\'arrived\')" style="padding:4px 10px;font-size:11px;">🟪 وصول</button> '+
                      '<button class="btn btn-outline btn-sm" onclick="cancelBk(\''+b.id+'\')" style="padding:4px 10px;font-size:11px;">❌ إلغاء</button>';
    } else if(b.status==='arrived'){
      statusActions = '<button class="btn btn-primary btn-sm" onclick="updateBk(\''+b.id+'\',\'done\')" style="padding:4px 10px;font-size:11px;">🏁 إنجاز</button>';
    } else {
      statusActions = '<span style="font-size:11px;color:var(--muted);">—</span>';
    }
    var created = new Date(b.createdAt).toLocaleDateString('ar-SA',{month:'numeric',day:'numeric'});
    return '<tr>'+
      '<td><strong>'+b.id+'</strong>'+posDot+'</td>'+
      '<td><div>'+b.customerName+'</div><div style="font-size:12px;color:var(--muted);">'+b.phone+'</div></td>'+
      '<td><div>'+(b.plate||'—')+'</div><div style="font-size:12px;color:var(--muted);">'+(b.model||'')+'</div></td>'+
      '<td>'+b.service+'</td>'+
      '<td>'+weekLabel+'</td>'+
      '<td>'+st[b.status]+'</td>'+
      '<td>'+(b.notes||'—')+'</td>'+
      '<td>'+statusActions+'</td>'+
    '</tr>';
  }).join('');
}

function cancelBk(id){
  if(!confirm('هل تريد إلغاء الحجز '+id+'؟')) return;
  updateBk(id,'cancelled');
}

function updateBk(id, newStatus){
  var bookings = bkLoad();
  var b = bookings.find(x=>x.id===id);
  if(!b) return;

  b.status = newStatus;
  if(newStatus==='cancelled') b.cancelledAt = nowISO();
  if(newStatus==='done') b.completedAt = nowISO();
  bkSave(bookings);

  if(newStatus==='arrived'){
    var fill = 'رقم_اللوحة=' + encodeURIComponent(b.plate) +
               '&المالك=' + encodeURIComponent(b.customerName) +
               '&الهاتف=' + encodeURIComponent(b.phone) +
               '&الخدمة=' + encodeURIComponent(b.service) +
               '&weekKey=' + encodeURIComponent(b.weekKey);
    sessionStorage.setItem('booking_arrived', fill);
    setTimeout(function(){
      alert('🚗 العميل '+b.customerName+' وصل! انقر "إضافة سيارة" وستنزل البيانات تلقائياً.');
    },200);
  }

  renderBookings();
  renderBookingCalendar();
  renderBookingBadges();
}

// ─── Dashboard counts ───
function renderBookingBadges(){
  var bookings = bkLoad();
  var pending = bookings.filter(b=>b.status==='pending').length;
  var inQueue = bookings.filter(b=>b.isWaiting&&['pending','confirmed'].includes(b.status)).length;

  var el = document.getElementById('bk-pending-count');
  if(el) el.textContent = pending;
  var el2 = document.getElementById('bk-queue-count');
  if(el2) el2.textContent = inQueue;
}

// Expose
window.renderBookings = renderBookings;
window.updateBk = updateBk;
window.cancelBk = cancelBk;
window.renderBookingBadges = renderBookingBadges;
window.renderBookingCalendar = renderBookingCalendar;
