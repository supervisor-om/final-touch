function addCar(){
  const plate=document.getElementById('car-plate').value.trim();
  const owner=document.getElementById('car-owner').value.trim();
  if(!plate||!owner){alert('يرجى إدخال رقم اللوحة واسم المالك');return;}
  const estimate=parseFloat(document.getElementById('car-estimate').value)||0;
  const deposit=parseFloat(document.getElementById('car-deposit').value)||0;
  const svcType=document.getElementById('car-service').value;
  const tplStages=state.stageTemplates[svcType]?JSON.parse(JSON.stringify(state.stageTemplates[svcType])):null;
  const car={id:genId(),plate,owner,phone:document.getElementById('car-phone').value.trim(),model:document.getElementById('car-model').value.trim(),km:document.getElementById('car-km').value.trim(),service:svcType,estimate,deposit,paidTotal:deposit,notes:document.getElementById('car-notes').value.trim(),expectedDate:document.getElementById('car-expected-date').value||'',status:'waiting',stage:0,stages:tplStages,dateIn:today(),dateOut:null,damageMap:window._addCarDamageMap?[...window._addCarDamageMap]:[]};
  state.cars.push(car);
  // حفظ الصور المؤقتة مرتبطة بالسيارة الجديدة
  if (_pendingPhotos.length) {
    setCarPhotos(car.id, { reception: [..._pendingPhotos], delivery: [] });
    _pendingPhotos = [];
    if (document.getElementById('add-car-photo-grid')) document.getElementById('add-car-photo-grid').innerHTML = '';
  }
  window._addCarDamageMap = [];
  saveState();closeModal('modal-add-car');
  ['car-plate','car-owner','car-phone','car-model','car-notes','car-estimate','car-deposit','car-km','car-expected-date'].forEach(id=>{document.getElementById(id).value='';});
  // إرسال رسالة ترحيبية قبل renderAll لتجنب حجب popup
  sendWelcomeMessage(car);
  renderAll();
  openJobCard(car);
}

// UPDATE CAR
let currentStage=0;
function editCar(id){
  state.currentEditCar=id;
  const car=state.cars.find(c=>c.id===id);
  if(!car)return;
  currentStage=car.stage||stageFromStatus(car.status);
  document.getElementById('update-amount').value=car.estimate||0;
  document.getElementById('update-paid').value=car.paidTotal||0;
  const pmEl=document.getElementById('update-payment-method');
  if(pmEl)pmEl.value=car.paymentMethod||'';
  document.getElementById('update-notes').value=car.notes||'';
  document.getElementById('update-phone').value=car.phone||'';
  document.getElementById('update-wakey').value=car.waBotKey||'';
  document.getElementById('update-expected-date').value=car.expectedDate||'';
  // Show/hide sections based on role
  const session=getSession();
  const isAdmin=session&&(session.role==='admin'||session.role==='accountant');
  const paySection=document.getElementById('update-payment-section');
  if(paySection)paySection.style.display=isAdmin?'':'none';
  const stageBtns=document.getElementById('stage-buttons-row');
  if(stageBtns)stageBtns.style.display='flex';
  updateStageUI();calcRemaining();
  // تحميل صور السيارة
  renderPhotoGrid(id,'reception','photo-grid-reception');
  renderPhotoGrid(id,'delivery','photo-grid-delivery');
  // تحميل خريطة الأضرار
  setTimeout(()=>injectDamageMap('edit-dmap-container', car.damageMap||[], 'edit-dmap'), 0);
  openModal('modal-update-car');
}
// QUICK STATUS CHANGE (click badge in table)
function quickStatus(carId,e){
  e.stopPropagation();
  document.getElementById('qs-popup')?.remove();
  const car=state.cars.find(c=>c.id===carId);
  if(!car)return;
  const popup=document.createElement('div');
  popup.id='qs-popup';popup.className='qs-popup';
  const rect=e.currentTarget.getBoundingClientRect();
  const carStages=getCarStages(car);
  popup.innerHTML=carStages.map((s,i)=>`
    <div class="qs-item${car.stage===i?' qs-active':''}" onclick="applyQuickStatus('${carId}',${i})">
      ${s.icon} ${s.label}
    </div>`).join('');
  // حساب الموضع بعد الإضافة للـ DOM لمعرفة الارتفاع الحقيقي
  popup.style.visibility='hidden';
  popup.style.right=(window.innerWidth-rect.right)+'px';
  popup.style.top=(rect.bottom+6)+'px';
  document.body.appendChild(popup);
  const ph=popup.offsetHeight;
  const spaceBelow=window.innerHeight-(rect.bottom+6);
  if(spaceBelow<ph){
    // لا يوجد مساحة كافية أسفل — ضعه فوق الزر
    popup.style.top=Math.max(6,rect.top-ph-6)+'px';
  }
  popup.style.visibility='';
  setTimeout(()=>document.addEventListener('click',closeQsPopup,{once:true}),0);
}
function closeQsPopup(){document.getElementById('qs-popup')?.remove();}
function applyQuickStatus(carId,stage){
  closeQsPopup();
  const car=state.cars.find(c=>c.id===carId);
  if(!car)return;
  const prevStage=car.stage;
  car.stage=stage;
  car.status=statusFromStage(stage,getCarStages(car));
  if(car.status==='delivered'&&!car.dateOut){
    car.dateOut=today();
    const inv={id:state.invoiceCounter++,carId:car.id,owner:car.owner,plate:car.plate,model:car.model,service:car.service,amount:car.estimate||0,deposit:car.deposit||0,paid:car.paidTotal||0,date:today(),notes:car.notes||''};
    state.invoices.push(inv);
  }
  saveState();
  if(car.stage!==prevStage) sendPushNotification(car);
  else if(car.stage===0) sendWelcomeMessage(car);
  renderAll();
}

function setStage(i){currentStage=i;updateStageUI();}
function updateStageUI(){
  const track=document.getElementById('stages-track');
  const btnsRow=document.getElementById('stage-buttons-row');
  if(!track||!btnsRow)return;
  const car=state.cars.find(c=>c.id===state.currentEditCar);
  const stages=getCarStages(car);
  const last=stages.length-1;
  track.innerHTML=stages.map((s,i)=>`<div class="stage-item" id="stage-${i}"><div class="stage-dot">${s.icon}</div><div class="stage-label">${s.label}</div></div>`).join('');
  stages.forEach((_,i)=>{
    const item=document.getElementById('stage-'+i);
    const dot=item.querySelector('.stage-dot');
    item.className='stage-item';dot.className='stage-dot';
    if(i<currentStage){item.classList.add('done');dot.classList.add('done');dot.textContent='✓';}
    else if(i===currentStage){item.classList.add('active');dot.classList.add('active');dot.textContent=stages[i].icon;}
  });
  btnsRow.innerHTML=stages.map((s,i)=>`<button class="btn ${i===last?'btn-success':'btn-outline'} btn-sm" onclick="setStage(${i})">${s.icon} ${s.label}</button>`).join('');
}
function calcRemaining(){
  const total=parseFloat(document.getElementById('update-amount').value)||0;
  const paid=parseFloat(document.getElementById('update-paid').value)||0;
  const rem=Math.max(0,total-paid);
  document.getElementById('pp-total').textContent=total.toFixed(3)+' ر.ع';
  document.getElementById('pp-paid').textContent=paid.toFixed(3)+' ر.ع';
  document.getElementById('pp-remaining').textContent=rem.toFixed(3)+' ر.ع';
  document.getElementById('pp-status').textContent=rem<=0?'✅ مدفوع بالكامل':`⏳ متبقي ${rem.toFixed(3)} ر.ع`;
  document.getElementById('pp-status').style.color=rem<=0?'var(--success)':'var(--danger)';
}
function updateCar(){
  const car=state.cars.find(c=>c.id===state.currentEditCar);
  if(!car)return;
  const prevStage=car.stage;
  car.stage=currentStage;
  car.status=statusFromStage(currentStage,getCarStages(car));
  car.estimate=parseFloat(document.getElementById('update-amount').value)||0;
  car.paidTotal=parseFloat(document.getElementById('update-paid').value)||0;
  const pmSave=document.getElementById('update-payment-method');
  if(pmSave)car.paymentMethod=pmSave.value||car.paymentMethod||'';
  car.notes=document.getElementById('update-notes').value;
  const newPhone=document.getElementById('update-phone').value.trim();
  if(newPhone) car.phone=newPhone;
  car.waBotKey=document.getElementById('update-wakey').value.trim();
  car.expectedDate=document.getElementById('update-expected-date').value||car.expectedDate||'';
  if(car.status==='delivered'&&!car.dateOut){
    car.dateOut=today();
    const inv={id:state.invoiceCounter++,carId:car.id,owner:car.owner,plate:car.plate,model:car.model,service:car.service,amount:car.estimate,deposit:car.deposit||0,paid:car.paidTotal,date:today(),notes:car.notes};
    state.invoices.push(inv);
  }
  saveState();closeModal('modal-update-car');
  if(car.stage!==prevStage) sendPushNotification(car);
  else if(car.stage===0) sendWelcomeMessage(car);
  renderAll();
}

// RECEIPT
function generateReceipt(invId){
  const inv=state.invoices.find(i=>i.id===invId);
  if(!inv)return;
  const remaining=Math.max(0,(inv.amount||0)-(inv.paid||0));
  document.getElementById('receipt-content').innerHTML=`
    <div class="receipt" id="print-receipt">
      <div class="receipt-header">
        <img src="data:image/png;base64,${LOGO_B64}" style="width:80px;height:80px;object-fit:contain;mix-blend-mode:multiply;" alt="logo">
        <div class="receipt-title">اللمسة الأخيرة</div>
        <div class="receipt-sub">THE FINAL TOUCH | للصيانة والسمكرة والدهان</div>
        <div style="font-size:11px;color:#888;margin-top:4px;">📍 مسقط، سلطنة عُمان</div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:14px;">
        <span>رقم الإيصال: <strong>#${inv.id}</strong></span>
        <span>التاريخ: <strong>${formatDate(inv.date)}</strong></span>
      </div>
      <div class="receipt-row"><span>اسم العميل</span><span><strong>${inv.owner}</strong></span></div>
      <div class="receipt-row"><span>رقم اللوحة</span><span><strong>${inv.plate}</strong></span></div>
      <div class="receipt-row"><span>السيارة</span><span><strong>${inv.model||'—'}</strong></span></div>
      <div class="receipt-row"><span>نوع الخدمة</span><span><strong>${inv.service}</strong></span></div>
      ${inv.notes?`<div class="receipt-row"><span>الأعمال المنجزة</span><span style="max-width:180px;text-align:left;font-size:11px;">${inv.notes}</span></div>`:''}
      <div class="receipt-row"><span>المبلغ الكلي</span><span>${parseFloat(inv.amount).toFixed(3)} ر.ع</span></div>
      <div class="receipt-row paid"><span>✅ المدفوع</span><span>${parseFloat(inv.paid||0).toFixed(3)} ر.ع</span></div>
      ${remaining>0?`<div class="receipt-row remaining"><span>⏳ المتبقي</span><span>${remaining.toFixed(3)} ر.ع</span></div>`:''}
      <div class="receipt-row total"><span>💰 الإجمالي</span><span>${parseFloat(inv.amount).toFixed(3)} ر.ع</span></div>
      <div class="receipt-footer">
        <div>${remaining<=0?'✅ تم الدفع بالكامل':'⏳ يوجد مبلغ متبقي'}</div>
        <div style="margin-top:6px;">شكراً لثقتكم بورشة اللمسة الأخيرة 🔧</div>
      </div>
    </div>`;
  openModal('modal-receipt');
}
function printReceipt(){
  const c=document.getElementById('print-receipt').outerHTML;
  const w=window.open('','_blank');
  w.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>body{font-family:'Cairo',sans-serif;display:flex;justify-content:center;padding:40px;background:#f5f5f5;}.receipt{background:white;padding:28px;width:400px;border-radius:12px;}.receipt-header{text-align:center;border-bottom:2px dashed #ddd;padding-bottom:14px;margin-bottom:14px;}.receipt-title{font-size:20px;font-weight:900;color:#1a1a2e;}.receipt-sub{font-size:11px;color:#666;}.receipt-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #f0f0f0;}.receipt-row.total{font-size:15px;font-weight:800;color:#e94560;border-top:2px solid #e94560;border-bottom:none;padding-top:10px;}.receipt-row.paid{color:#00b894;font-weight:700;}.receipt-row.remaining{color:#e94560;font-weight:700;}.receipt-footer{text-align:center;margin-top:14px;font-size:12px;color:#888;}</style></head><body>${c}</body></html>`);
  w.document.close();w.print();
}
function exportReceiptPDF(){
  const inv=state.invoices.find(i=>document.getElementById('receipt-content').innerHTML.includes('#'+i.id));
  printReceipt();
}

// ADD ORDER
function populateCarSelect(){
  const sel=document.getElementById('order-car');
  sel.innerHTML=state.cars.filter(c=>c.status!=='delivered').map(c=>`<option value="${c.id}">${c.plate} - ${c.owner}</option>`).join('');
}
function addOrder(){
  const carId=document.getElementById('order-car').value;
  const car=state.cars.find(c=>c.id===carId);
  state.orders.push({id:genId(),carId,carLabel:car?`${car.plate} - ${car.owner}`:'—',type:document.getElementById('order-type').value,desc:document.getElementById('order-desc').value,tech:document.getElementById('order-tech').value,cost:parseFloat(document.getElementById('order-cost').value)||0,status:'progress',date:today()});
  saveState();closeModal('modal-add-order');
  ['order-desc','order-tech','order-cost'].forEach(id=>{document.getElementById(id).value='';});
  renderAll();
}

// ADD SERVICE
function addService(){
  document.getElementById('svc-edit-id').value='';
  ['svc-name','svc-price','svc-desc'].forEach(id=>{document.getElementById(id).value='';});
  document.getElementById('svc-type').value='صيانة';
  document.getElementById('modal-add-service').querySelector('.modal-title').textContent='🛠️ إضافة خدمة';
  openModal('modal-add-service');
}
function editService(id){
  const s=state.services.find(x=>x.id===id);if(!s)return;
  document.getElementById('svc-edit-id').value=id;
  document.getElementById('svc-name').value=s.name;
  document.getElementById('svc-type').value=s.type;
  document.getElementById('svc-price').value=s.price;
  document.getElementById('svc-desc').value=s.desc||'';
  document.getElementById('modal-add-service').querySelector('.modal-title').textContent='✏️ تعديل الخدمة';
  openModal('modal-add-service');
}
function saveService(){
  const name=document.getElementById('svc-name').value.trim();
  if(!name)return;
  const editId=document.getElementById('svc-edit-id').value;
  const data={name,type:document.getElementById('svc-type').value,price:parseFloat(document.getElementById('svc-price').value)||0,desc:document.getElementById('svc-desc').value};
  if(editId){
    const idx=state.services.findIndex(s=>s.id===editId);
    if(idx!==-1)state.services[idx]={...state.services[idx],...data};
  }else{
    state.services.push({id:genId(),...data});
  }
  saveState();closeModal('modal-add-service');
  renderAll();
}

// ADD EXPENSE
// ── Expense Receipts (stored separately to avoid bloating state) ─────────────
const EXP_RECEIPTS_KEY='ft_exp_receipts';
function loadExpReceipts(){try{return JSON.parse(localStorage.getItem(EXP_RECEIPTS_KEY))||{};}catch(e){return {};}}
function saveExpReceipts(r){try{localStorage.setItem(EXP_RECEIPTS_KEY,JSON.stringify(r));}catch(e){alert('مساحة التخزين ممتلئة.');}}
function getExpReceipt(id){return loadExpReceipts()[id]||null;}

function deleteCar(id){const _dc=getSession();if(!_dc||(_dc.role!=='admin'&&_dc.role!=='accountant')){alert(t('msg_admin_only_delete'));return;}if(!confirm(t('msg_confirm_delete_car')))return;state.cars=state.cars.filter(c=>c.id!==id);saveState();renderAll();}
function deleteExpense(id){if(!confirm('حذف المصروف؟'))return;state.expenses=state.expenses.filter(e=>e.id!==id);setExpReceipt(id,null);saveState();renderExpensesTable();}
function deleteService(id){if(!confirm(t('msg_confirm_delete_service')))return;state.services=state.services.filter(s=>s.id!==id);saveState();renderAll();}
function deleteOrder(id){if(!confirm(t('msg_confirm_delete_order')))return;state.orders=state.orders.filter(o=>o.id!==id);saveState();renderAll();}

function saveAlertDays(){state.alertDays=parseInt(document.getElementById('alert-days').value)||3;saveState();renderAll();}

// ══════════════════════════════════════════════════════════
// نظام الصور — تخزين محلي مضغوط بمعزل عن البيانات الرئيسية
// ══════════════════════════════════════════════════════════
const PHOTOS_KEY = 'ft_photos';
// صور مؤقتة لسيارة جديدة قبل حفظها
let _pendingPhotos = [];

function loadAllPhotos() {
  try { return JSON.parse(localStorage.getItem(PHOTOS_KEY)) || {}; } catch(e) { return {}; }
}
function saveAllPhotos(all) {
  try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(all)); } catch(e) {
    alert('مساحة التخزين ممتلئة. احذف بعض الصور القديمة.');
  }
}
function getCarPhotos(carId) {
  const all = loadAllPhotos();
  return all[carId] || { reception: [], delivery: [] };
}
function setCarPhotos(carId, photos) {
  const all = loadAllPhotos();
  all[carId] = photos;
  saveAllPhotos(all);
}

// ضغط الصورة قبل الحفظ (max 900px، جودة 0.72)
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// رسم شبكة الصور في العنصر المحدد
function renderPhotoGrid(carId, type, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const photos = getCarPhotos(carId);
  const list = photos[type] || [];
  grid.innerHTML = list.map((src, i) => `
    <div style="position:relative;width:68px;height:68px;border-radius:8px;overflow:hidden;border:2px solid rgba(255,255,255,.15);flex-shrink:0;">
      <img src="${src}" onclick="openPhotoLightbox('${carId}','${type}',${i})"
        style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;">
      <button onclick="deleteCarPhoto('${carId}','${type}',${i})"
        style="position:absolute;top:2px;right:2px;background:rgba(233,69,96,.85);border:none;color:#fff;width:18px;height:18px;border-radius:50%;font-size:10px;cursor:pointer;line-height:1;">✕</button>
    </div>`).join('');
}

function openPhotoLightbox(carId, type, idx) {
  const photos = getCarPhotos(carId);
  const src = (photos[type] || [])[idx];
  if (!src) return;
  const lb = document.getElementById('photo-lightbox');
  document.getElementById('photo-lightbox-img').src = src;
  lb.style.display = 'flex';
}

function deleteCarPhoto(carId, type, idx) {
  if (!confirm('حذف هذه الصورة؟')) return;
  const photos = getCarPhotos(carId);
  photos[type].splice(idx, 1);
  setCarPhotos(carId, photos);
  renderPhotoGrid(carId, type, 'photo-grid-' + type);
}

// رفع صور في نافذة التحديث
async function handleCarPhotos(input, type) {
  const carId = state.currentEditCar;
  if (!carId) return;
  const photos = getCarPhotos(carId);
  for (const file of input.files) {
    if (photos[type].length >= 6) { alert('الحد الأقصى 6 صور لكل قسم'); break; }
    const compressed = await compressImage(file);
    photos[type].push(compressed);
  }
  setCarPhotos(carId, photos);
  renderPhotoGrid(carId, type, 'photo-grid-' + type);
  input.value = '';
}

// رفع صور لسيارة جديدة (مؤقتة)
async function handleAddCarPhotos(input) {
  const grid = document.getElementById('add-car-photo-grid');
  for (const file of input.files) {
    if (_pendingPhotos.length >= 6) { alert('الحد الأقصى 6 صور'); break; }
    const compressed = await compressImage(file);
    _pendingPhotos.push(compressed);
  }
  renderPendingPhotos();
  input.value = '';
}
function renderPendingPhotos() {
  const grid = document.getElementById('add-car-photo-grid');
  if (!grid) return;
  grid.innerHTML = _pendingPhotos.map((src, i) => `
    <div style="position:relative;width:68px;height:68px;border-radius:8px;overflow:hidden;border:2px solid rgba(255,255,255,.15);flex-shrink:0;">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover;">
      <button onclick="removePendingPhoto(${i})"
        style="position:absolute;top:2px;right:2px;background:rgba(233,69,96,.85);border:none;color:#fff;width:18px;height:18px;border-radius:50%;font-size:10px;cursor:pointer;line-height:1;">✕</button>
    </div>`).join('');
}
function removePendingPhoto(i) {
  _pendingPhotos.splice(i, 1);
  renderPendingPhotos();
}

// ── إدارة الحالات ─────────────────────────────────────────────
let _currentTplService = null;

function openManageStages(){
  renderStagesManageList();
  switchStagesTab('default');
  openModal('modal-manage-stages');
}

function switchStagesTab(tab){
  document.getElementById('panel-default-stages').style.display = tab==='default'?'':'none';
  document.getElementById('panel-templates').style.display      = tab==='templates'?'':'none';
  document.getElementById('tab-default-stages').className = 'tab'+(tab==='default'?' active':'');
  document.getElementById('tab-templates').className      = 'tab'+(tab==='templates'?' active':'');
  if(tab==='templates') renderTplServiceTabs();
}

function renderTplServiceTabs(){
  const services = Object.keys(state.stageTemplates);
  const el = document.getElementById('tpl-service-tabs');
  el.innerHTML = services.map(s=>`
    <button class="btn btn-sm ${_currentTplService===s?'btn-primary':'btn-outline'}" onclick="selectTplService('${s}')">${s}</button>
  `).join('');
  if(!_currentTplService||!state.stageTemplates[_currentTplService]) _currentTplService=services[0]||null;
  renderTplStageList();
}

function selectTplService(svc){
  _currentTplService=svc;
  renderTplServiceTabs();
}

function renderTplStageList(){
  const el=document.getElementById('tpl-stage-list');
  if(!el||!_currentTplService)return;
  const stages=state.stageTemplates[_currentTplService]||[];
  el.innerHTML=`<div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:8px;">📋 ${_currentTplService}</div>`+
    stages.map((s,i)=>`
    <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:rgba(255,255,255,.04);border-radius:8px;margin-bottom:5px;">
      <input type="text" value="${s.icon}" id="tpl-icon-${i}" style="width:44px;text-align:center;font-size:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#fff;padding:3px;">
      <input type="text" value="${s.label}" id="tpl-label-${i}" style="flex:1;font-size:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#fff;padding:5px 8px;" onkeydown="if(event.key==='Enter')saveTplStage(${i})">
      <button class="btn btn-primary btn-sm" onclick="saveTplStage(${i})" style="padding:4px 8px;">💾</button>
      <button class="btn btn-danger btn-sm" onclick="deleteTplStage(${i})" ${stages.length<=2?'disabled style="opacity:.4"':''} style="padding:4px 8px;">🗑️</button>
    </div>`).join('');
}

function saveTplStage(i){
  const icon=document.getElementById('tpl-icon-'+i).value.trim()||state.stageTemplates[_currentTplService][i].icon;
  const label=document.getElementById('tpl-label-'+i).value.trim();
  if(!label)return;
  state.stageTemplates[_currentTplService][i]={icon,label};
  saveState();renderTplStageList();
}

function deleteTplStage(i){
  const stages=state.stageTemplates[_currentTplService];
  if(stages.length<=2){alert('الحد الأدنى مرحلتان');return;}
  if(!confirm('حذف هذه المرحلة من القالب؟'))return;
  stages.splice(i,1);
  saveState();renderTplStageList();
}

function addTplStage(){
  if(!_currentTplService)return;
  const icon=document.getElementById('tpl-new-icon').value.trim()||'🔹';
  const label=document.getElementById('tpl-new-label').value.trim();
  if(!label){alert('أدخل اسم المرحلة');return;}
  const stages=state.stageTemplates[_currentTplService];
  stages.splice(stages.length-1,0,{icon,label});
  saveState();
  document.getElementById('tpl-new-icon').value='';
  document.getElementById('tpl-new-label').value='';
  renderTplStageList();
}
function renderStagesManageList(){
  const el=document.getElementById('stages-manage-list');
  if(!el)return;
  el.innerHTML=state.stages.map((s,i)=>`
    <div id="stage-row-${i}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:6px;">
      <input type="text" value="${s.icon}" id="edit-icon-${i}" style="width:48px;text-align:center;font-size:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#fff;padding:4px;">
      <input type="text" value="${s.label}" id="edit-label-${i}" style="flex:1;font-size:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#fff;padding:6px 10px;" onkeydown="if(event.key==='Enter')saveStage(${i})">
      <button class="btn btn-primary btn-sm" onclick="saveStage(${i})">💾</button>
      <button class="btn btn-danger btn-sm" onclick="deleteStage(${i})" ${i===0||i===state.stages.length-1?'disabled style="opacity:.4;cursor:not-allowed;"':''}>🗑️</button>
    </div>`).join('');
}
function saveStage(i){
  const icon=document.getElementById('edit-icon-'+i).value.trim()||state.stages[i].icon;
  const label=document.getElementById('edit-label-'+i).value.trim();
  if(!label){alert('أدخل اسم الحالة');return;}
  state.stages[i]={icon,label};
  syncStageArrays();
  saveState();
  renderStagesManageList();
  renderAll();
}
function addStage(){
  const icon=document.getElementById('new-stage-icon').value.trim()||'🔹';
  const label=document.getElementById('new-stage-label').value.trim();
  if(!label){alert('أدخل اسم الحالة');return;}
  // Insert before last stage (تسليم)
  state.stages.splice(state.stages.length-1,0,{icon,label});
  syncStageArrays();
  saveState();
  document.getElementById('new-stage-icon').value='';
  document.getElementById('new-stage-label').value='';
  renderStagesManageList();
  renderAll();
}
function deleteStage(i){
  if(i===0||i===state.stages.length-1){alert('لا يمكن حذف الحالة الأولى أو الأخيرة');return;}
  if(!confirm('حذف هذه الحالة؟ السيارات في هذه الحالة ستنتقل للحالة السابقة.'))return;
  // Shift cars that were at this stage or beyond
  state.cars.forEach(c=>{
    if(c.stage===i) c.stage=Math.max(0,i-1);
    else if(c.stage>i) c.stage--;
    c.status=statusFromStage(c.stage);
  });
  state.stages.splice(i,1);
  syncStageArrays();
  saveState();
  renderStagesManageList();
  renderAll();
}

// ALERTS
function getAlertedCars(){return state.cars.filter(c=>c.status!=='delivered'&&daysSince(c.dateIn)>=state.alertDays);}


function setQuickService(svc) {
  const sel = document.getElementById('car-service');
  if (sel) sel.value = svc;
  document.querySelectorAll('.quick-svc-btn').forEach(b => b.classList.remove('selected'));
  event.target.classList.add('selected');
}

function setCarTemplate(brand, arName, enName) {
  const yearNow = new Date().getFullYear();
  const modelInput = document.getElementById('car-model');
  if (modelInput) modelInput.value = brand + ' ' + enName + ' ' + yearNow;
  document.querySelectorAll('.car-tpl-btn').forEach(b => b.style.borderColor = '');
  event.target.style.borderColor = '#f5a623';
  event.target.style.background = 'rgba(245,166,35,.25)';
}

function setDeliveryDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const iso = d.toISOString().split('T')[0];
  const inp = document.getElementById('car-expected-date');
  if (inp) inp.value = iso;
  document.querySelectorAll('.day-btn').forEach(b => b.style.background = '');
  event.target.style.background = 'rgba(0,212,170,.3)';
}

function toggleOptional() {
  const el = document.getElementById('optional-fields');
  const arrow = document.getElementById('optional-arrow');
  if (el.style.display === 'none') {
    el.style.display = 'block';
    arrow.textContent = '▼';
  } else {
    el.style.display = 'none';
    arrow.textContent = '▶';
  }
}

function searchCustomers(val) {
  const box = document.getElementById('customer-suggestions');
  if (!val || val.length < 2) { box.style.display = 'none'; return; }
  const seen = {};
  const matches = state.cars.filter(c => {
    const key = c.owner + c.phone;
    if (seen[key]) return false;
    seen[key] = true;
    return c.owner.includes(val) || (c.phone||'').includes(val);
  }).slice(0, 6);
  if (!matches.length) { box.style.display = 'none'; return; }
  box.innerHTML = matches.map(c => `
    <div class="sugg-item" onclick="fillCustomer('${c.owner.replace(/'/g,"\'")}','${(c.phone||'').replace(/'/g,"\'")}','${(c.model||'').replace(/'/g,"\'")}')">
      <strong>${c.owner}</strong>
      <span style="color:var(--muted);font-size:11px;margin-right:8px;">${c.phone||''}</span>
      <span style="color:var(--muted);font-size:11px;">${c.model||''}</span>
    </div>`).join('');
  box.style.display = 'block';
}

function fillCustomer(owner, phone, model) {
  document.getElementById('car-owner').value = owner;
  document.getElementById('car-phone').value = phone;
  if (model) document.getElementById('car-model').value = model;
  document.getElementById('customer-search').value = owner;
  document.getElementById('customer-suggestions').style.display = 'none';
}

// Close suggestions on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#customer-suggestions') && !e.target.closest('#customer-search')) {
    const box = document.getElementById('customer-suggestions');
    if (box) box.style.display = 'none';
  }
});

// Fix addCar to read from optional fields correctly
const _origAddCar = addCar;
addCar = function() {
  // Sync optional hidden → visible (if optional collapsed, km/notes may be empty - that's ok)
  _origAddCar();
  // Reset quick buttons after add
  document.querySelectorAll('.quick-svc-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.car-tpl-btn').forEach(b => {
    b.style.borderColor = '';
    b.style.background = '';
  });
  document.querySelectorAll('.day-btn').forEach(b => b.style.background = '');
  const cs = document.getElementById('customer-search');
  if (cs) cs.value = '';
};

// INIT


// ══════════════════════════════════════════
// TRACKING FUNCTIONS
// ══════════════════════════════════════════
const STAGE_LABELS = ['استلام السيارة','تشخيص العطل','بدء الإصلاح','الدهان والتشطيب','جاهزة للتسليم','تم التسليم'];
const STAGE_DESCS  = ['تم استلام سيارتك في الورشة','يتم فحص وتشخيص العطل','الفنيون يعملون على إصلاح سيارتك','مرحلة الدهان والتلميع النهائي','سيارتك جاهزة، يمكنك المجيء لاستلامها 🎉','تم تسليم السيارة بنجاح ✅'];
const STAGE_COLORS = ['#8892a4','#4facfe','#f5a623','#9b59b6','#00d4aa','#00d4aa'];

