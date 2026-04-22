// RENDER ALL
function renderAll(){
  renderDashboard();renderCarsTable();renderDeliveredTable();renderAlertsTable();
  renderOrdersTable();renderServicesTable();renderInvoicesTable();renderExpensesTable();
  renderReports();renderCustomers();renderMonthlyClosing();updateBadges();
}

function updateBadges(){
  document.getElementById('badge-cars').textContent=state.cars.filter(c=>c.status!=='delivered').length;
  const al=getAlertedCars().length;
  document.getElementById('badge-alerts').textContent=al;
  document.getElementById('badge-alerts').style.display=al?'':'none';
}

function renderDashboard(){
  const active=state.cars.filter(c=>c.status!=='delivered');
  const revenue=state.invoices.reduce((s,i)=>s+i.amount,0);
  const expenses=state.expenses.reduce((s,e)=>s+e.amount,0);
  const profit=revenue-expenses;
  const pending=state.cars.filter(c=>c.status!=='delivered').reduce((s,c)=>s+(c.estimate||0),0);
  document.getElementById('stat-cars').textContent=active.length;
  document.getElementById('stat-revenue').textContent=fmt(revenue);
  document.getElementById('stat-expenses').textContent=fmt(expenses);
  document.getElementById('stat-profit').textContent=fmt(profit);
  document.getElementById('stat-profit').style.color=profit>=0?'var(--success)':'var(--danger)';
  document.getElementById('stat-pending').textContent=fmt(pending);

  const alerted=getAlertedCars();
  const banner=document.getElementById('alert-banner-area');
  banner.innerHTML=alerted.length?`<div class="alert-banner"><span class="ab-icon">🔔</span><div class="ab-text">يوجد <span class="ab-count">${alerted.length}</span> سيارة تجاوزت ${state.alertDays} أيام في الورشة! <button class="btn btn-outline btn-sm" style="margin-right:10px;" onclick="showPage('alerts')">عرض التفاصيل</button></div></div>`:'';

  const total=state.invoices.length||1;
  const maint=state.invoices.filter(i=>i.service.includes('صيان')).length;
  const body=state.invoices.filter(i=>i.service.includes('سمكرة')).length;
  const paint=state.invoices.filter(i=>i.service.includes('دهان')).length;
  const pm=Math.round(maint/total*100),pb=Math.round(body/total*100),pp=Math.round(paint/total*100);
  document.getElementById('pct-maint').textContent=pm+'%';document.getElementById('bar-maint').style.width=pm+'%';
  document.getElementById('pct-body').textContent=pb+'%';document.getElementById('bar-body').style.width=pb+'%';
  document.getElementById('pct-paint').textContent=pp+'%';document.getElementById('bar-paint').style.width=pp+'%';

  const recent=state.cars.filter(c=>c.status!=='delivered').slice(-5).reverse();
  const tbody=document.getElementById('dash-cars-table');
  tbody.innerHTML=recent.length?recent.map(c=>{
    const days=daysSince(c.dateIn);
    const over=days>=state.alertDays;
    return`<tr><td><strong>${c.plate}</strong></td><td>${c.owner}</td><td>${statusBadge(c.status)}</td><td style="color:${over?'var(--danger)':'var(--success)'};">${days} يوم${over?' ⚠️':''}</td></tr>`;
  }).join(''):'<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">🚗</div><p>لا توجد سيارات</p></div></td></tr>';
}

function renderCarsTable(){
  const session=getSession();
  const isAdmin=session&&session.role==='admin';
  const search=(document.getElementById('search-cars')?.value||'').toLowerCase();
  const fs=document.getElementById('filter-status')?.value||'';
  const fv=document.getElementById('filter-service')?.value||'';
  let cars=state.cars.filter(c=>c.status!=='delivered');
  if(search)cars=cars.filter(c=>c.plate.toLowerCase().includes(search)||c.owner.toLowerCase().includes(search)||(c.model||'').toLowerCase().includes(search));
  if(fs)cars=cars.filter(c=>c.status===fs);
  if(fv)cars=cars.filter(c=>c.service.includes(fv));
  document.getElementById('cars-count').textContent=cars.length;
  // Update header: hide payment column for workers
  const payTh=document.querySelector('#page-cars th:nth-child(8)');
  if(payTh)payTh.style.display=isAdmin?'':'none';
  const tbody=document.getElementById('cars-table-body');
  if(!cars.length){tbody.innerHTML=`<tr><td colspan="${isAdmin?12:11}"><div class="empty-state"><div class="empty-icon">🚗</div><p>لا توجد سيارات</p></div></td></tr>`;return;}
  tbody.innerHTML=cars.map((c,i)=>{
    const days=daysSince(c.dateIn);const over=days>=state.alertDays;
    const rem=Math.max(0,(c.estimate||0)-(c.paidTotal||0));
    const stageLabel=STAGE_ICONS[c.stage||0]+' '+STAGES[c.stage||0];
    return`<tr>
      <td>${i+1}</td><td><strong>${c.plate}</strong></td><td>${c.owner}</td><td>${c.phone||'—'}</td>
      <td>${c.model||'—'}</td><td>${serviceBadge(c.service)}</td>
      <td><span class="badge badge-progress">${stageLabel}</span></td>
      ${isAdmin?`<td style="font-size:12px;">
        <div style="color:var(--success);">✅ ${(c.paidTotal||0).toFixed(3)}</div>
        ${rem>0?`<div style="color:var(--danger);">⏳ ${rem.toFixed(3)}</div>`:''}
      </td>`:''}
      <td style="color:${over?'var(--danger)':'var(--success)'};">${days}${over?' ⚠️':''}</td>
      <td>${c.expectedDate?`<span style="font-size:12px;color:${new Date(c.expectedDate)<new Date()?'var(--danger)':'var(--success)'};">${formatDate(c.expectedDate)}</span>`:'<span style="color:var(--muted);font-size:12px;">—</span>'}</td>
      <td><span class="qs-badge" onclick="quickStatus('${c.id}',event)" title="انقر لتغيير الحالة">${statusBadge(c.status)}</span></td>
      <td><div style="display:flex;gap:5px;">
        <button class="btn btn-primary btn-sm" onclick="editCar('${c.id}')">✏️</button>
        <button class="btn btn-outline btn-sm" onclick="openJobCard(state.cars.find(x=>x.id==='${c.id}'))" title="طباعة بطاقة العمل">📋</button>
        ${(()=>{const p=getCarPhotos(c.id);return(p.reception.length||p.delivery.length)?`<button class="btn btn-outline btn-sm" onclick="editCar('${c.id}')" title="توجد صور">📷${p.reception.length+p.delivery.length}</button>`:''})()}
        ${isAdmin?`<button class="btn btn-danger btn-sm" onclick="deleteCar('${c.id}')">🗑️</button>`:''}
      </div></td>
    </tr>`;
  }).join('');
}

function buildDeliveredRow(c){
  const inv=state.invoices.find(i=>i.carId===c.id);
  const days=c.dateOut&&c.dateIn?Math.floor((new Date(c.dateOut)-new Date(c.dateIn))/(1000*60*60*24)):0;
  const remaining=Math.max(0,(c.estimate||0)-(c.paidTotal||0));
  const methodLabel={cash:'💵 كاش',visa:'💳 فيزا',transfer:'🏦 تحويل'}[c.paymentMethod]||'';
  const session=getSession();
  const isAdmin=session&&(session.role==='admin'||session.role==='accountant');
  const isConfirmed=c.paymentConfirmed;
  const confirmBtn=!isConfirmed
    ?`<button class="btn btn-sm" onclick="openConfirmPayment('${c.id}')" style="background:linear-gradient(135deg,var(--gold),#ff8c00);color:#000;font-weight:700;white-space:nowrap;font-size:11px;">💰 تأكيد الدفع</button>`
    :`<span style="font-size:11px;color:var(--success);font-weight:700;white-space:nowrap;">✅ مؤكد${methodLabel?`<br><span style="font-size:10px;color:var(--info);">${methodLabel}</span>`:''}</span>`;
  return`<tr>
    <td><strong>${c.plate}</strong></td>
    <td>
      <div style="font-weight:600;">${c.owner}</div>
      ${c.phone?`<div style="font-size:11px;color:var(--muted);">${c.phone}</div>`:''}
    </td>
    <td style="font-size:12px;">
      <div>${c.model||'—'}</div>
      ${!isAdmin&&c.notes?`<div style="font-size:11px;color:var(--muted);margin-top:3px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${c.notes}">${c.notes}</div>`:''}
    </td>
    <td>${serviceBadge(c.service)}</td>
    ${isAdmin?`
    <td><strong style="color:var(--gold);">${(c.estimate||0).toFixed(3)} ر.ع</strong></td>
    <td>
      <div style="color:var(--success);font-weight:600;">${(c.paidTotal||0).toFixed(3)} ر.ع</div>
      ${remaining>0?`<div style="font-size:10px;color:var(--danger);">متبقي: ${remaining.toFixed(3)}</div>`:''}
      ${methodLabel?`<div style="font-size:10px;color:var(--info);margin-top:2px;">${methodLabel}</div>`:''}
    </td>`:''}
    <td style="font-size:12px;">${formatDate(c.dateIn)}</td>
    <td style="font-size:12px;">${formatDate(c.dateOut)}</td>
    <td style="text-align:center;"><span style="background:rgba(79,172,254,.12);color:var(--info);padding:2px 8px;border-radius:8px;font-size:12px;font-weight:600;">${days}د</span></td>
    <td>
      <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
        ${isAdmin?confirmBtn:''}
        <button class="btn btn-primary btn-sm" onclick="editCar('${c.id}')" title="تعديل">✏️</button>
        ${inv?`<button class="btn btn-outline btn-sm" onclick="generateReceipt(${inv.id})" title="إيصال">🧾</button>`:''}
        <button class="btn btn-outline btn-sm" onclick="restoreCarToWorkshop('${c.id}')" title="استرجاع إلى الورشة" style="color:var(--gold);">↩️</button>
        ${isAdmin?`<button class="btn btn-danger btn-sm" onclick="deleteCar('${c.id}')" title="حذف">🗑️</button>`:''}
      </div>
    </td>
  </tr>`;
}

function renderDeliveredTable(){
  const tbody=document.getElementById('delivered-table-body');
  if(!tbody)return;

  // Role
  const _ds=getSession();
  const isAdmin=_ds&&(_ds.role==='admin'||_ds.role==='accountant');
  const cols=isAdmin?10:8;

  // Show/hide amount columns in header
  const thAmt=document.getElementById('del-th-amount');
  const thPaid=document.getElementById('del-th-paid');
  if(thAmt)thAmt.style.display=isAdmin?'':'none';
  if(thPaid)thPaid.style.display=isAdmin?'':'none';

  // Fill service filter options
  const svcSel=document.getElementById('del-filter-service');
  if(svcSel&&svcSel.options.length<=1){
    const services=[...new Set(state.cars.filter(c=>c.status==='delivered'&&c.service).map(c=>c.service))].sort();
    services.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;svcSel.appendChild(o);});
  }

  // Filters
  const search=(document.getElementById('del-search')?.value||'').toLowerCase();
  const fService=document.getElementById('del-filter-service')?.value||'';
  const fMonth=document.getElementById('del-filter-month')?.value||'';

  let delivered=state.cars.filter(c=>c.status==='delivered');
  if(search) delivered=delivered.filter(c=>(c.plate||'').toLowerCase().includes(search)||(c.owner||'').toLowerCase().includes(search));
  if(fService) delivered=delivered.filter(c=>c.service===fService);
  if(fMonth) delivered=delivered.filter(c=>(c.dateOut||'').startsWith(fMonth));

  document.getElementById('delivered-count').textContent=state.cars.filter(c=>c.status==='delivered').length;

  if(!delivered.length){
    tbody.innerHTML=`<tr><td colspan="${cols}"><div class="empty-state"><div class="empty-icon">✅</div><p>${search||fService||fMonth?'لا توجد نتائج للفلتر':'لا توجد سيارات مسلَّمة'}</p>${(search||fService||fMonth)?'<button class="btn btn-outline btn-sm" onclick="clearDeliveredFilters()">مسح الفلتر</button>':''}</div></td></tr>`;
    return;
  }

  // Sort descending by dateOut
  delivered.sort((a,b)=>(b.dateOut||'').localeCompare(a.dateOut||''));

  // Group by month
  const groups={};
  delivered.forEach(c=>{
    const key=(c.dateOut||'').substring(0,7)||'0000-00';
    if(!groups[key])groups[key]=[];
    groups[key].push(c);
  });

  let html='';
  Object.entries(groups).sort((a,b)=>b[0].localeCompare(a[0])).forEach(([month,cars])=>{
    const label=month==='0000-00'?'غير محدد':new Date(month+'-15').toLocaleDateString('ar-SA',{year:'numeric',month:'long'});
    const monthTotal=cars.reduce((s,c)=>s+(c.paidTotal||0),0);
    const collapsed=localStorage.getItem('del_collapsed_'+month)==='1';
    html+=`<tr onclick="toggleDeliveredMonth('${month}')" style="cursor:pointer;background:rgba(79,172,254,.07);border-top:2px solid rgba(79,172,254,.18);">
      <td colspan="${cols}" style="padding:10px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;color:var(--info);">📅 ${label} <span style="font-size:12px;opacity:.65;font-weight:400;">(${cars.length} سيارة)</span></span>
          ${isAdmin?`<span style="color:var(--success);font-size:13px;font-weight:700;">${monthTotal.toFixed(3)} ر.ع</span>`:''}
          <span style="color:var(--muted);font-size:14px;">${collapsed?'▼':'▲'}</span>
        </div>
      </td>
    </tr>`;
    if(!collapsed) cars.forEach(c=>{html+=buildDeliveredRow(c);});
  });

  tbody.innerHTML=html;
}

function toggleDeliveredMonth(month){
  const key='del_collapsed_'+month;
  localStorage.setItem(key,localStorage.getItem(key)==='1'?'0':'1');
  renderDeliveredTable();
}

function clearDeliveredFilters(){
  ['del-search','del-filter-service','del-filter-month'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  renderDeliveredTable();
}

function restoreCarToWorkshop(id){
  if(!confirm('إعادة هذه السيارة إلى قسم "السيارات في الورشة"؟\nسيتم حذف الفاتورة المرتبطة بها.'))return;
  const car=state.cars.find(c=>c.id===id);
  if(!car)return;
  car.status='waiting';
  car.dateOut=null;
  state.invoices=state.invoices.filter(i=>i.carId!==id);
  saveState();
  renderAll();
  showPage('cars');
}

function openConfirmPayment(carId){
  const car=state.cars.find(c=>c.id===carId);
  if(!car)return;
  const remaining=Math.max(0,(car.estimate||0)-(car.paidTotal||0));
  document.getElementById('cp-car-info').innerHTML=`
    <div style="background:rgba(0,0,0,.2);border-radius:10px;padding:12px;margin-bottom:14px;">
      <div style="font-weight:700;font-size:15px;">${car.plate} — ${car.owner}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px;">${car.model||''} ${car.service?'| '+car.service:''}</div>
      <div style="display:flex;gap:16px;margin-top:10px;font-size:13px;flex-wrap:wrap;">
        <span>💰 إجمالي: <strong style="color:var(--gold);">${(car.estimate||0).toFixed(3)} ر.ع</strong></span>
        <span>✅ مدفوع: <strong style="color:var(--success);">${(car.paidTotal||0).toFixed(3)} ر.ع</strong></span>
        <span>⏳ متبقي: <strong style="color:var(--danger);">${remaining.toFixed(3)} ر.ع</strong></span>
      </div>
    </div>`;
  document.getElementById('cp-amount').value=remaining.toFixed(3);
  document.getElementById('cp-method').value=car.paymentMethod||'';
  document.getElementById('cp-car-id').value=carId;
  document.querySelectorAll('.cp-method-btn').forEach(b=>b.classList.remove('selected'));
  if(car.paymentMethod){
    const btn=document.querySelector(`.cp-method-btn[data-method="${car.paymentMethod}"]`);
    if(btn)btn.classList.add('selected');
  }
  openModal('modal-confirm-payment');
}

function selectPayMethod(method,btn){
  document.getElementById('cp-method').value=method;
  document.querySelectorAll('.cp-method-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
}

function submitConfirmPayment(){
  const carId=document.getElementById('cp-car-id').value;
  const method=document.getElementById('cp-method').value;
  const amount=parseFloat(document.getElementById('cp-amount').value)||0;
  if(!method){alert('يرجى اختيار طريقة الدفع');return;}
  if(amount<=0){alert('يرجى إدخال مبلغ صحيح');return;}
  const car=state.cars.find(c=>c.id===carId);
  if(!car)return;
  car.paidTotal=(car.paidTotal||0)+amount;
  car.paymentMethod=method;
  car.paymentConfirmed=true;
  car.paymentConfirmedAt=new Date().toISOString();
  const inv=state.invoices.find(i=>i.carId===carId);
  if(inv){inv.paid=car.paidTotal;inv.paymentMethod=method;}
  saveState();
  closeModal('modal-confirm-payment');
  renderAll();
}

function renderAlertsTable(){
  const alerted=getAlertedCars();
  if(document.getElementById('alert-days'))document.getElementById('alert-days').value=state.alertDays;
  const tbody=document.getElementById('alerts-table-body');
  const _as=getSession();const _aAdmin=_as&&_as.role==='admin';
  if(!alerted.length){tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">✅</div><p>لا توجد سيارات متأخرة</p></div></td></tr>';return;}
  tbody.innerHTML=alerted.map(c=>{
    const days=daysSince(c.dateIn);
    return`<tr>
      <td><strong>${c.plate}</strong></td><td>${c.owner}</td><td>${c.model||'—'}</td>
      <td>${serviceBadge(c.service)}</td>
      <td><span class="badge badge-alert">⚠️ ${days} يوم</span></td>
      <td>${statusBadge(c.status)}</td>
      <td><button class="btn btn-primary btn-sm" onclick="editCar('${c.id}')">✏️ تحديث</button></td>
    </tr>`;
  }).join('');
}

function renderOrdersTable(){
  const tbody=document.getElementById('orders-table-body');
  if(!state.orders.length){tbody.innerHTML='<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚙️</div><p>لا توجد أوامر</p></div></td></tr>';return;}
  tbody.innerHTML=state.orders.map((o,i)=>`<tr>
    <td><strong>#${i+1}</strong></td><td>${o.carLabel}</td><td>${serviceBadge(o.type)}</td>
    <td style="max-width:180px;font-size:12px;">${o.desc||'—'}</td><td>${fmt(o.cost)}</td>
    <td>${o.tech||'—'}</td><td><span class="badge badge-progress">🔧 جاري</span></td>
    <td><button class="btn btn-danger btn-sm" onclick="deleteOrder('${o.id}')">🗑️</button></td>
  </tr>`).join('');
}

function renderServicesTable(){
  const tbody=document.getElementById('services-table-body');
  if(!state.services.length){tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🛠️</div><p>لا توجد خدمات</p></div></td></tr>';return;}
  tbody.innerHTML=state.services.map(s=>`<tr>
    <td><strong>${s.name}</strong></td><td>${serviceBadge(s.type)}</td>
    <td><strong style="color:var(--gold);">${parseFloat(s.price).toFixed(3)}</strong></td>
    <td style="font-size:12px;">${s.desc||'—'}</td>
    <td><div style="display:flex;gap:5px;"><button class="btn btn-outline btn-sm" onclick="editService('${s.id}')">✏️</button><button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">🗑️</button></div></td>
  </tr>`).join('');
}

