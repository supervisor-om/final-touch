// ════════════════════════════════════════════
//  FinalTouch Attendance System
//  Clock-in/out, Overtime Requests, Leave Requests, Reports
// ════════════════════════════════════════════

// ── Helpers ───────────────────────────────
function nowISO()  { return new Date().toISOString(); }
function fmtDate(iso) { if(!iso) return '—'; return new Date(iso).toLocaleDateString('ar-SA'); }
function fmtTime(iso) { if(!iso) return '—'; return new Date(iso).toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}); }
function fmtDT(iso)   { if(!iso) return '—'; return fmtDate(iso) + ' ' + fmtTime(iso); }
function todayStr()   { return new Date().toISOString().split('T')[0]; }
function daysDiff(a,b){
  var d1=new Date(a), d2=new Date(b);
  return Math.max(1, Math.ceil((d2 - d1) / (1000*60*60*24)) + 1);
}
function flash(msg, type){
  var el=document.getElementById('flash');
  el.textContent=msg; el.className='flash '+(type||'success');
  el.style.display='block';
  setTimeout(function(){el.style.display='none';},2800);
}

// ── DB Keys ───────────────────────────────
var ATT_STORES = {
  logs:    'attendance_logs',
  ot:      'ot_requests',
  leaves:  'leave_requests',
  settings:'attendance_settings',
  users:   'ft_users'
};

// Use localStorage for simplicity (single device)
function attLoad(key){
  try{ var r=localStorage.getItem(key); if(r) return JSON.parse(r); }catch(e){}
  if(key===ATT_STORES.logs) return [];
  if(key===ATT_STORES.ot)    return [];
  if(key===ATT_STORES.leaves)return [];
  return {};
}
function attSave(key, data){
  try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){ console.warn('[AttSave]',e); }
}

// ── Init ──────────────────────────────────
var currentUser = null;
var currentSession = null;

function initAttendance(){
  currentSession = getSession();
  currentUser = currentSession ? currentSession.username : 'unknown';

  // Set today defaults
  document.getElementById('ot-date').value = todayStr();
  document.getElementById('leave-from').value = todayStr();
  document.getElementById('leave-to').value = todayStr();

  var now=new Date();
  document.getElementById('rep-month').value = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0');

  updateClockUI();
  renderTodayEntries();
  renderMyOT();
  renderMyLeaves();
  if(currentSession && currentSession.role==='admin'){
    renderPendingOT();
    renderPendingLeaves();
  }
  populateEmployeeDropdowns();

  // Live status refresh
  setInterval(updateClockUI, 30000);
}

// ── Navigation ────────────────────────────
function showSection(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('sec-'+id).classList.add('active');
  document.getElementById('tab-'+id).classList.add('active');

  if(id==='ot'){ renderMyOT(); if(currentSession&&currentSession.role==='admin') renderPendingOT(); }
  if(id==='leaves'){ renderMyLeaves(); if(currentSession&&currentSession.role==='admin') renderPendingLeaves(); }
  if(id==='logs') renderLogs();
  if(id==='reports') populateEmployeeDropdowns();
}

// ═══════════════════════════════════════════
//  CLOCK IN / OUT
// ═══════════════════════════════════════════

function clockIn(){
  if(!currentUser) return;
  var logs = attLoad(ATT_STORES.logs);
  var today = todayStr();
  // Check if already clocked in today without clock out
  var lastToday = logs.filter(l=>l.username===currentUser && l.date===today).pop();
  if(lastToday && !lastToday.outAt){
    flash('عندك تسجيل حضور سابق اليوم بدون خروج!','error'); return;
  }
  var entry = {
    id: 'clk_'+Date.now()+'_'+Math.random().toString(36).slice(2),
    username: currentUser,
    date: today,
    inAt: nowISO(),
    outAt: null,
    noteIn: 'تسجيل حضور تلقائي',
    noteOut: '',
    totalHours: 0
  };
  logs.push(entry);
  attSave(ATT_STORES.logs, logs);
  flash('✅ تم تسجيل الحضور: ' + fmtTime(entry.inAt));
  updateClockUI();
  renderTodayEntries();
}

function clockOut(){
  if(!currentUser) return;
  var logs = attLoad(ATT_STORES.logs);
  var today = todayStr();
  var entry = logs.find(l=>l.username===currentUser && l.date===today && !l.outAt);
  if(!entry){
    flash('مافي تسجيل حضور اليوم!','error'); return;
  }
  entry.outAt = nowISO();
  entry.noteOut = 'تسجيل خروج تلقائي';
  var ms = new Date(entry.outAt) - new Date(entry.inAt);
  entry.totalHours = Math.round(ms / (1000*60*60) * 100) / 100;
  attSave(ATT_STORES.logs, logs);
  flash('✅ تم تسجيل الخروج: ' + fmtTime(entry.outAt) + ' | ⏱️ '+entry.totalHours+' ساعة');
  updateClockUI();
  renderTodayEntries();
}

function updateClockUI(){
  var logs = attLoad(ATT_STORES.logs);
  var today = todayStr();
  var entry = logs.find(l=>l.username===currentUser && l.date===today && !l.outAt);
  var inEl = document.getElementById('btn-clock-in');
  var outEl = document.getElementById('btn-clock-out');
  var statusBar = document.getElementById('clock-status-bar');
  var lblIn = document.getElementById('lbl-in-time');
  var lblOut = document.getElementById('lbl-out-time');

  if(entry){
    // Currently clocked IN
    inEl.disabled = true;
    outEl.disabled = false;
    lblIn.textContent = fmtTime(entry.inAt);
    lblOut.textContent = '--:--';
    statusBar.className = 'current-status working';
    statusBar.style.display='block';
    // Calculate elapsed
    var ms = Date.now() - new Date(entry.inAt).getTime();
    var hrs = Math.floor(ms/(1000*60*60));
    var mins = Math.floor((ms%(1000*60*60))/(1000*60));
    statusBar.innerHTML = '🟢 الحضور من ' + fmtTime(entry.inAt) + ' · ⏱️ ' + hrs + ':' + mins.toString().padStart(2,'0') + ' ساعة';
  } else {
    // Not clocked in today OR already clocked out
    var completed = logs.filter(l=>l.username===currentUser && l.date===today && l.outAt).pop();
    if(completed){
      inEl.disabled = false;
      outEl.disabled = true;
      lblIn.textContent = fmtTime(completed.inAt);
      lblOut.textContent = fmtTime(completed.outAt);
      statusBar.className = 'current-status out';
      statusBar.style.display='block';
      statusBar.innerHTML = '⏹️ خرجت الساعة ' + fmtTime(completed.outAt) + ' · إجمالي ' + completed.totalHours + ' ساعة';
    } else {
      inEl.disabled = false;
      outEl.disabled = true;
      lblIn.textContent = '--:--';
      lblOut.textContent = '--:--';
      statusBar.style.display = 'none';
    }
  }

  // Admin always can see all
  if(currentSession && currentSession.role==='admin'){
    inEl.disabled = true;
    outEl.disabled = true;
    lblIn.textContent = 'للمسؤول';
    lblOut.textContent = 'نظرة عامة';
  }

  document.getElementById('today-date').textContent = new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

// ── Today entries table ─────────────────
function renderTodayEntries(){
  var logs = attLoad(ATT_STORES.logs);
  var today = todayStr();
  var entries = [];

  if(currentSession && currentSession.role==='admin'){
    // Admin sees all today
    entries = logs.filter(l=>l.date===today).sort((a,b)=>a.inAt.localeCompare(b.inAt));
  } else {
    entries = logs.filter(l=>l.username===currentUser && l.date===today);
  }

  // Summary
  var totalEmp = 0, totalOts = 0, stillIn = 0;
  entries.forEach(e=>{
    totalEmp++;
    if(!e.outAt) stillIn++;
    else totalOts += e.totalHours;
  });
  document.getElementById('today-summary').innerHTML =
    '<div class="summary-card"><div class="summary-value">'+totalEmp+'</div><div class="summary-label">تسجيلات</div></div>' +
    '<div class="summary-card"><div class="summary-value" style="color:var(--success);">'+stillIn+'</div><div class="summary-label">داخل الآن</div></div>' +
    '<div class="summary-card"><div class="summary-value OT">'+Math.round(totalOts)+'</div><div class="summary-label">ساعات إجمالية</div></div>';

  var tbody = document.getElementById('today-entries');
  if(!entries.length){ tbody.innerHTML='<tr><td colspan="3"><div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد تسجيلات اليوم</p></div></td></tr>'; return; }
  tbody.innerHTML = entries.map(e=>{
    var type = !e.outAt ? '<span class="badge badge-in">🟢 حضور</span>' : '<span class="badge badge-out">🏁 مكتمل</span>';
    return '<tr><td>'+fmtTime(e.inAt)+'</td><td>'+type+'</td><td>'+(e.noteIn||'')+'</td></tr>';
  }).join('');
}

// ── Logs search ──────────────────────────
function renderLogs(){
  var logs = attLoad(ATT_STORES.logs);
  var from = document.getElementById('log-from').value;
  var to = document.getElementById('log-to').value;
  var emp = document.getElementById('log-employee').value;

  var filtered = logs.slice().sort((a,b)=>new Date(b.inAt)-new Date(a.inAt));
  if(from) filtered = filtered.filter(l=>l.date>=from);
  if(to)   filtered = filtered.filter(l=>l.date<=to);
  if(emp)  filtered = filtered.filter(l=>l.username===emp);

  var tbody = document.getElementById('logs-table');
  var empty = document.getElementById('logs-empty');
  if(!filtered.length){ tbody.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  tbody.innerHTML = filtered.map(l=>{
    var status=l.outAt?'<span class="badge badge-out">مكتمل</span>':'<span class="badge badge-in">مفتوح</span>';
    return '<tr><td>'+fmtDate(l.date)+'</td><td>'+l.username+'</td><td>'+fmtTime(l.inAt)+'</td><td>'+fmtTime(l.outAt)+'</td><td>'+(l.totalHours||'—')+'</td><td>'+status+'</td></tr>';
  }).join('');
}

// ═══════════════════════════════════════════
//  OVERTIME REQUESTS
// ═══════════════════════════════════════════

function requestOT(){
  var date = document.getElementById('ot-date').value;
  var hrs = parseFloat(document.getElementById('ot-hours').value);
  var reason = document.getElementById('ot-reason').value.trim();

  if(!date || !hrs || hrs<=0){ flash('يرجى تعبئة البيانات كاملة','error'); return; }
  if(!reason){ flash('يرجى كتابة سبب الساعات الإضافية','error'); return; }

  var ots = attLoad(ATT_STORES.ot);
  ots.push({
    id: 'ot_'+Date.now()+'_'+Math.random().toString(36).slice(2),
    username: currentUser,
    date: date,
    hours: hrs,
    reason: reason,
    status: 'pending',
    createdAt: nowISO(),
    approvedBy: null,
    approvedAt: null,
    rejectReason: null
  });
  attSave(ATT_STORES.ot, ots);
  flash('✅ تم إرسال طلب '+hrs+' ساعة إضافية');
  document.getElementById('ot-hours').value='';
  document.getElementById('ot-reason').value='';
  renderMyOT();
  if(currentSession && currentSession.role==='admin') renderPendingOT();
}

function renderMyOT(){
  var status = document.getElementById('ot-filter-status').value;
  var ots = attLoad(ATT_STORES.ot);
  var mine = ots.filter(o=>o.username===currentUser).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  if(status) mine = mine.filter(o=>o.status===status);

  var tbody = document.getElementById('ot-table');
  var empty = document.getElementById('ot-empty');
  if(!mine.length){ tbody.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  tbody.innerHTML = mine.map(o=>{
    var badge = o.status==='approved'?'<span class="badge badge-leave-approved">✅ مقبول</span>':
                o.status==='rejected'?'<span class="badge badge-leave-rejected">❌ مرفوض</span>':
                '<span class="badge badge-leave-pending">⏳ قيد المراجعة</span>';
    var by = o.approvedBy ? o.approvedBy + ' · ' + fmtDate(o.approvedAt) : '—';
    return '<tr><td>'+fmtDate(o.date)+'</td><td>'+o.hours+'</td><td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+o.reason+'</td><td>'+badge+'</td><td style="font-size:12px;">'+by+'</td></tr>';
  }).join('');
}

// ── Admin: pending OT approvals ──────────
function renderPendingOT(){
  var ots = attLoad(ATT_STORES.ot).filter(o=>o.status==='pending').sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  var tbody = document.getElementById('ot-pending-table');
  var empty = document.getElementById('ot-pending-empty');
  if(!ots.length){ tbody.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  tbody.innerHTML = ots.map(o=>{
    return '<tr><td>'+o.username+'</td><td>'+fmtDate(o.date)+'</td><td>'+o.hours+'</td><td>'+o.reason+'</td><td style="font-size:12px;">'+fmtDT(o.createdAt)+'</td>' +
      '<td><button class="btn btn-success btn-sm" onclick="approveOT(\''+o.id+'\',true)" style="padding:5px 12px;font-size:11px;">✅ موافقة</button> ' +
      '<button class="btn btn-outline btn-sm" onclick="approveOT(\''+o.id+'\',false)" style="padding:5px 12px;font-size:11px;">❌ رفض</button></td></tr>';
  }).join('');
}

function approveOT(id, approve){
  var ots = attLoad(ATT_STORES.ot);
  var ot = ots.find(o=>o.id===id);
  if(!ot) return;
  if(approve){
    ot.status='approved'; ot.approvedBy=currentUser; ot.approvedAt=nowISO();
    flash('✅ تمت الموافقة على ساعات '+ot.username);
  } else {
    var reason = prompt('سبب الرفض:','');
    if(reason===null) return;
    ot.status='rejected'; ot.approvedBy=currentUser; ot.rejectReason=reason||''; ot.approvedAt=nowISO();
    flash('❌ تم رفض طلب '+ot.username,'error');
  }
  attSave(ATT_STORES.ot, ots);
  renderPendingOT();
}

// ═══════════════════════════════════════════
//  LEAVE REQUESTS
// ═══════════════════════════════════════════

function initLeaveListeners(){
  var f = document.getElementById('leave-from');
  var t = document.getElementById('leave-to');
  if(f && t){
    f.addEventListener('change', updateLeaveDays);
    t.addEventListener('change', updateLeaveDays);
  }
}
function updateLeaveDays(){
  var from = document.getElementById('leave-from').value;
  var to = document.getElementById('leave-to').value;
  if(from && to) document.getElementById('leave-days-preview').textContent = daysDiff(from, to);
}

function requestLeave(){
  var type = document.getElementById('leave-type').value;
  var fromDate = document.getElementById('leave-from').value;
  var toDate = document.getElementById('leave-to').value;
  var reason = document.getElementById('leave-reason').value.trim();

  if(!fromDate || !toDate){ flash('يرجى اختيار الفترة','error'); return; }
  if(new Date(fromDate) > new Date(toDate)){ flash('تاريخ البداية يجب أن يكون قبل النهاية','error'); return; }

  var days = daysDiff(fromDate, toDate);
  var leaves = attLoad(ATT_STORES.leaves);
  leaves.push({
    id: 'lv_'+Date.now()+'_'+Math.random().toString(36).slice(2),
    username: currentUser,
    type: type,
    fromDate: fromDate,
    toDate: toDate,
    days: days,
    reason: reason || '',
    status: 'pending',
    createdAt: nowISO(),
    approvedBy: null,
    approvedAt: null,
    rejectReason: null
  });
  attSave(ATT_STORES.leaves, leaves);
  flash('✅ تم إرسال طلب إجازة '+days+' يوم');
  document.getElementById('leave-reason').value='';
  renderMyLeaves();
  if(currentSession && currentSession.role==='admin') renderPendingLeaves();
}

function renderMyLeaves(){
  var leaves = attLoad(ATT_STORES.leaves);
  var mine = leaves.filter(l=>l.username===currentUser).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  var tbody = document.getElementById('leaves-table');
  var empty = document.getElementById('leaves-empty');
  if(!mine.length){ tbody.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  var types={annual:'🌴 سنوية',sick:'🤒 مرضية',emergency:'🚨 طارئة',unpaid:'💸 بدون راتب'};
  tbody.innerHTML = mine.map(l=>{
    var badge = l.status==='approved'?'<span class="badge badge-leave-approved">✅ مقبول</span>':
                l.status==='rejected'?'<span class="badge badge-leave-rejected">❌ مرفوض</span>':
                '<span class="badge badge-leave-pending">⏳ قيد المراجعة</span>';
    return '<tr><td>'+types[l.type]+'</td><td>'+fmtDate(l.fromDate)+'</td><td>'+fmtDate(l.toDate)+'</td><td>'+l.days+'</td><td>'+badge+'</td><td>'+(l.reason||'—')+'</td></tr>';
  }).join('');
}

function renderPendingLeaves(){
  var leaves = attLoad(ATT_STORES.leaves).filter(l=>l.status==='pending').sort((a,b)=>new Date(a.fromDate)-new Date(b.fromDate));
  var tbody = document.getElementById('leaves-pending-table');
  var empty = document.getElementById('leaves-pending-empty');
  if(!leaves.length){ tbody.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  var types={annual:'🌴 سنوية',sick:'🤒 مرضية',emergency:'🚨 طارئة',unpaid:'💸 بدون راتب'};
  tbody.innerHTML = leaves.map(l=>{
    return '<tr><td>'+l.username+'</td><td>'+types[l.type]+'</td><td>'+fmtDate(l.fromDate)+'</td><td>'+fmtDate(l.toDate)+'</td><td>'+l.days+'</td><td>'+(l.reason||'—')+'</td>' +
      '<td><button class="btn btn-success btn-sm" onclick="approveLeave(\''+l.id+'\',true)" style="padding:5px 12px;font-size:11px;">✅ موافقة</button> ' +
      '<button class="btn btn-outline btn-sm" onclick="approveLeave(\''+l.id+'\',false)" style="padding:5px 12px;font-size:11px;">❌ رفض</button></td></tr>';
  }).join('');
}

function approveLeave(id, approve){
  var leaves = attLoad(ATT_STORES.leaves);
  var lv = leaves.find(l=>l.id===id);
  if(!lv) return;
  if(approve){
    lv.status='approved'; lv.approvedBy=currentUser; lv.approvedAt=nowISO();
    flash('✅ تمت الموافقة على إجازة '+lv.username);
  } else {
    var reason = prompt('سبب الرفض:','');
    if(reason===null) return;
    lv.status='rejected'; lv.approvedBy=currentUser; lv.rejectReason=reason||''; lv.approvedAt=nowISO();
    flash('❌ تم رفض إجازة '+lv.username,'error');
  }
  attSave(ATT_STORES.leaves, leaves);
  renderPendingLeaves();
}

// ═══════════════════════════════════════════
//  REPORTS (Admin)
// ═══════════════════════════════════════════

function generateReport(){
  var month = document.getElementById('rep-month').value;
  var emp = document.getElementById('rep-employee').value;
  if(!month){ flash('اختر الشهر','error'); return; }

  var [yr,mo] = month.split('-').map(Number);
  var logs = attLoad(ATT_STORES.logs);
  var filtered = logs.filter(l=>{
    var d = new Date(l.date);
    if(d.getFullYear()!==yr || d.getMonth()+1!==mo) return false;
    if(emp && l.username!==emp) return false;
    return true;
  }).sort((a,b)=>new Date(a.inAt)-new Date(b.inAt));

  var totalHrs = filtered.reduce((s,l)=>s+(l.totalHours||0),0);
  var completed = filtered.filter(l=>l.outAt).length;
  var incomplete = filtered.filter(l=>!l.outAt).length;

  document.getElementById('report-summary').innerHTML =
    '<div class="summary-card"><div class="summary-value">'+filtered.length+'</div><div class="summary-label">تسجيلات</div></div>' +
    '<div class="summary-card"><div class="summary-value" style="color:var(--success);">'+completed+'</div><div class="summary-label">مكتمل</div></div>' +
    '<div class="summary-card"><div class="summary-value" style="color:var(--danger);">'+incomplete+'</div><div class="summary-label">مفتوح</div></div>' +
    '<div class="summary-card"><div class="summary-value OT">'+Math.round(totalHrs)+'</div><div class="summary-label">إجمالي ساعات</div></div>';

  var tbody = document.getElementById('report-table');
  var wrap = document.getElementById('report-table-wrap');
  var empty = document.getElementById('report-empty');
  if(!filtered.length){ wrap.style.display='none'; empty.style.display='block'; return; }
  wrap.style.display=''; empty.style.display='none';
  tbody.innerHTML = filtered.map(l=>{
    var status = l.outAt? '<span class="badge badge-out">مكتمل</span>' : '<span class="badge badge-in">مفتوح</span>';
    return '<tr><td>'+fmtDate(l.date)+'</td><td>'+l.username+'</td><td>'+fmtTime(l.inAt)+'</td><td>'+fmtTime(l.outAt)+'</td><td>'+(l.totalHours||'—')+'</td><td>—</td><td>'+status+'</td></tr>';
  }).join('');
}
