function setExpReceipt(id,src){const r=loadExpReceipts();if(src)r[id]=src;else delete r[id];saveExpReceipts(r);}

function openAddExpenseModal(){
  document.getElementById('exp-editing-id').value='';
  document.getElementById('exp-modal-title').textContent='💸 إضافة مصروف';
  ['exp-desc','exp-amount','exp-notes'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('exp-type').value='قطع غيار';
  document.getElementById('exp-date').value=today();
  document.getElementById('exp-receipt-preview').style.display='none';
  document.getElementById('exp-receipt-none').style.display='';
  document.getElementById('exp-receipt-file').value='';
  openModal('modal-add-expense');
}

function editExpense(id){
  const e=state.expenses.find(x=>x.id===id);
  if(!e)return;
  document.getElementById('exp-editing-id').value=id;
  document.getElementById('exp-modal-title').textContent='✏️ تعديل المصروف';
  document.getElementById('exp-desc').value=e.desc||'';
  document.getElementById('exp-type').value=e.type||'قطع غيار';
  document.getElementById('exp-amount').value=e.amount||'';
  document.getElementById('exp-date').value=e.date||today();
  document.getElementById('exp-notes').value=e.notes||'';
  // receipt
  const receipt=getExpReceipt(id);
  if(receipt){
    document.getElementById('exp-receipt-img').src=receipt;
    document.getElementById('exp-receipt-preview').style.display='flex';
    document.getElementById('exp-receipt-none').style.display='none';
  } else {
    document.getElementById('exp-receipt-preview').style.display='none';
    document.getElementById('exp-receipt-none').style.display='';
  }
  document.getElementById('exp-receipt-file').value='';
  openModal('modal-add-expense');
}

function saveExpenseForm(){
  const desc=document.getElementById('exp-desc').value.trim();
  const amount=parseFloat(document.getElementById('exp-amount').value)||0;
  if(!desc){alert('يرجى إدخال البيان');return;}
  if(!amount){alert('يرجى إدخال المبلغ');return;}
  const type=document.getElementById('exp-type').value;
  const date=document.getElementById('exp-date').value||today();
  const notes=document.getElementById('exp-notes').value.trim();
  const editingId=document.getElementById('exp-editing-id').value;

  // Handle receipt image
  const imgEl=document.getElementById('exp-receipt-img');
  const newReceipt=(imgEl&&imgEl.src&&imgEl.src.startsWith('data:'))?imgEl.src:null;

  if(editingId){
    // Edit existing
    const idx=state.expenses.findIndex(e=>e.id===editingId);
    if(idx>=0){state.expenses[idx]={...state.expenses[idx],desc,type,amount,date,notes};}
    if(newReceipt)setExpReceipt(editingId,newReceipt);
    else if(!document.getElementById('exp-receipt-preview').style.display||document.getElementById('exp-receipt-preview').style.display==='none'){
      // user removed receipt
      setExpReceipt(editingId,null);
    }
  } else {
    // New expense
    const id=genId();
    state.expenses.push({id,desc,type,amount,date,notes});
    if(newReceipt)setExpReceipt(id,newReceipt);
  }
  saveState();
  closeModal('modal-add-expense');
  renderExpensesTable();
}

function previewExpenseReceipt(input){
  const file=input.files[0];
  if(!file)return;
  compressImage(file).then(src=>{
    document.getElementById('exp-receipt-img').src=src;
    document.getElementById('exp-receipt-preview').style.display='flex';
    document.getElementById('exp-receipt-none').style.display='none';
  });
}

function clearExpenseReceipt(){
  document.getElementById('exp-receipt-img').src='';
  document.getElementById('exp-receipt-preview').style.display='none';
  document.getElementById('exp-receipt-none').style.display='';
  document.getElementById('exp-receipt-file').value='';
}

function viewReceipt(src){
  document.getElementById('receipt-view-img').src=src;
  document.getElementById('receipt-download-link').href=src;
  openModal('modal-receipt-view');
}

// DELETE

function renderInvoicesTable(){
  const tbody=document.getElementById('invoices-table-body');
  if(!state.invoices.length){tbody.innerHTML='<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">🧾</div><p>لا توجد فواتير</p></div></td></tr>';return;}
  tbody.innerHTML=state.invoices.map(inv=>{
    const rem=Math.max(0,(inv.amount||0)-(inv.paid||0));
    return`<tr>
      <td><strong>#${inv.id}</strong></td><td>${inv.owner}</td>
      <td>${inv.plate}${inv.model?' / '+inv.model:''}</td><td>${serviceBadge(inv.service)}</td>
      <td><strong>${(inv.amount||0).toFixed(3)} ر.ع</strong></td>
      <td style="color:var(--info);">${(inv.deposit||0).toFixed(3)} ر.ع</td>
      <td style="color:var(--success);">${(inv.paid||0).toFixed(3)} ر.ع</td>
      <td style="color:${rem>0?'var(--danger)':'var(--success)'};">${rem>0?rem.toFixed(3)+' ر.ع':'✅ مكتمل'}</td>
      <td>${formatDate(inv.date)}</td>
      <td><button class="btn btn-outline btn-sm" onclick="generateReceipt(${inv.id})">🧾 إيصال</button></td>
    </tr>`;
  }).join('');
}

function renderExpensesTable(){
  const search=(document.getElementById('exp-search')?.value||'').toLowerCase();
  const fType=document.getElementById('exp-filter-type')?.value||'';
  const fMonth=document.getElementById('exp-filter-month')?.value||'';

  // Apply filters
  let filtered=[...state.expenses].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(search)filtered=filtered.filter(e=>(e.desc||'').toLowerCase().includes(search)||(e.notes||'').toLowerCase().includes(search));
  if(fType)filtered=filtered.filter(e=>e.type===fType);
  if(fMonth)filtered=filtered.filter(e=>(e.date||'').startsWith(fMonth));

  // Filter info
  const info=document.getElementById('exp-filter-info');
  if(info){
    if(search||fType||fMonth){
      info.textContent=`${filtered.length} من أصل ${state.expenses.length}`;
      info.style.color='var(--info)';
    } else {
      info.textContent=`${state.expenses.length} سجل`;
      info.style.color='var(--muted)';
    }
  }

  // Table
  const tbody=document.getElementById('expenses-table-body');
  if(!tbody)return;
  if(!filtered.length){
    tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">💸</div><p>${state.expenses.length?'لا توجد نتائج للفلتر':'لا توجد مصروفات'}</p>${state.expenses.length&&(search||fType||fMonth)?`<button class="btn btn-outline btn-sm" onclick="clearExpFilters()">مسح الفلتر</button>`:''}</div></td></tr>`;
  } else {
    const receipts=loadExpReceipts();
    tbody.innerHTML=filtered.map(e=>{
      const receipt=receipts[e.id];
      const typeEmoji={قطع:'🔧','مرافق':'💡','رواتب':'👷','إيجار':'🏠','أدوات':'🛠️','أخرى':'📦'};
      const emoji=Object.keys(typeEmoji).find(k=>e.type.startsWith(k));
      return`<tr>
        <td style="white-space:nowrap;font-size:12px;">${formatDate(e.date)}</td>
        <td>
          <div style="font-weight:600;">${e.desc}</div>
          ${e.notes?`<div style="font-size:11px;color:var(--muted);margin-top:2px;">📝 ${e.notes}</div>`:''}
        </td>
        <td><span class="badge badge-maint">${typeEmoji[emoji]||'📦'} ${e.type}</span></td>
        <td><strong style="color:var(--danger);white-space:nowrap;">${fmt(e.amount)}</strong></td>
        <td style="text-align:center;">${receipt?`<img src="${receipt}" style="width:44px;height:34px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid var(--border);" onclick="viewReceipt('${receipt}')" title="عرض الفاتورة">`:
        `<span style="font-size:11px;color:var(--muted);">—</span>`}</td>
        <td>
          <div style="display:flex;gap:5px;">
            <button class="btn btn-outline btn-sm" onclick="editExpense('${e.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteExpense('${e.id}')">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // Update stats (always from ALL expenses, not filtered)
  const all=state.expenses;
  const now=new Date();
  const curMonth=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const total=all.reduce((s,e)=>s+e.amount,0);
  const thisMonth=all.filter(e=>(e.date||'').startsWith(curMonth)).reduce((s,e)=>s+e.amount,0);
  const avg=all.length?total/all.length:0;
  const parts=all.filter(e=>e.type==='قطع غيار').reduce((s,e)=>s+e.amount,0);
  const util=all.filter(e=>['مرافق','إيجار','أدوات'].includes(e.type)).reduce((s,e)=>s+e.amount,0);
  const labor=all.filter(e=>e.type==='رواتب').reduce((s,e)=>s+e.amount,0);

  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('exp-total',fmt(total));
  set('exp-this-month',fmt(thisMonth));
  set('exp-avg',fmt(avg));
  set('exp-parts',fmt(parts));
  set('exp-util',fmt(util));
  set('exp-labor',fmt(labor));
}

function clearExpFilters(){
  ['exp-search','exp-filter-type','exp-filter-month'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.value='';
  });
  renderExpensesTable();
}

function exportExpensesPDF(){
  const fMonth=document.getElementById('exp-filter-month')?.value||'';
  const fType=document.getElementById('exp-filter-type')?.value||'';
  let filtered=[...state.expenses].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(fMonth)filtered=filtered.filter(e=>(e.date||'').startsWith(fMonth));
  if(fType)filtered=filtered.filter(e=>e.type===fType);
  const total=filtered.reduce((s,e)=>s+e.amount,0);
  const title=fMonth?`المصروفات — ${fMonth}`:'سجل المصروفات الكامل';
  const w=window.open('','_blank');
  w.document.write(`<html dir="rtl"><head><meta charset="UTF-8">
  <style>body{font-family:'Cairo',sans-serif;padding:30px;direction:rtl;color:#111;}
  h1{color:#1a1a2e;border-bottom:3px solid #e94560;padding-bottom:10px;margin-bottom:6px;}
  p{color:#555;font-size:13px;margin-bottom:20px;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  th{background:#1a1a2e;color:white;padding:9px 10px;text-align:right;font-size:13px;}
  td{padding:8px 10px;border:1px solid #ddd;font-size:13px;}
  tr:nth-child(even)td{background:#f9f9f9;}
  .total{font-weight:900;font-size:15px;color:#e94560;}
  .badge{background:#eee;padding:2px 8px;border-radius:12px;font-size:11px;}
  </style></head><body>
  <h1>💸 ${title}</h1>
  <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')} — عدد السجلات: ${filtered.length}</p>
  <table><tr><th>التاريخ</th><th>البيان</th><th>النوع</th><th>المبلغ</th><th>ملاحظات</th></tr>
  ${filtered.map(e=>`<tr><td>${e.date}</td><td>${e.desc}</td><td><span class="badge">${e.type}</span></td><td style="color:red;font-weight:700;">${e.amount.toFixed(3)} ر.ع</td><td style="font-size:12px;color:#555;">${e.notes||'—'}</td></tr>`).join('')}
  <tr><td colspan="3" style="text-align:center;font-weight:700;">الإجمالي</td><td class="total">${total.toFixed(3)} ر.ع</td><td></td></tr>
  </table></body></html>`);
  w.document.close();
  w.print();
}

