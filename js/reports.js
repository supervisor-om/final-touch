function renderReports(){
  const revenue=state.invoices.reduce((s,i)=>s+i.amount,0);
  const expenses=state.expenses.reduce((s,e)=>s+e.amount,0);
  const profit=revenue-expenses;
  ['rpt-revenue','rpt-expenses','rpt-profit'].forEach((id,i)=>{
    const el=document.getElementById(id);if(!el)return;
    el.textContent=fmt([revenue,expenses,profit][i]);
  });
  document.getElementById('rpt-profit').style.color=profit>=0?'var(--success)':'var(--danger)';

  const fs=document.getElementById('financial-summary');
  if(fs)fs.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:10px;">الإيرادات</div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>عدد الفواتير</span><span>${state.invoices.length}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>إجمالي الإيرادات</span><span style="color:var(--success);">${fmt(revenue)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span>متوسط الفاتورة</span><span>${state.invoices.length?fmt(revenue/state.invoices.length):'0 ر.ع'}</span></div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:10px;">المصروفات</div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>عدد البنود</span><span>${state.expenses.length}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>إجمالي المصروفات</span><span style="color:var(--danger);">${fmt(expenses)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span>متوسط المصروف</span><span>${state.expenses.length?fmt(expenses/state.expenses.length):'0 ر.ع'}</span></div>
      </div>
    </div>
    <div style="margin-top:16px;text-align:center;padding:20px;background:rgba(255,255,255,.05);border-radius:12px;">
      <div style="font-size:12px;color:var(--muted);">صافي الربح</div>
      <div style="font-size:30px;font-weight:900;color:${profit>=0?'var(--success)':'var(--danger)'};">${fmt(profit)}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px;">${profit>=0?'✅ ربح':'❌ خسارة'}</div>
    </div>`;

  const sr=document.getElementById('services-report');
  if(sr){
    const g={};state.invoices.forEach(inv=>{if(!g[inv.service])g[inv.service]={count:0,total:0};g[inv.service].count++;g[inv.service].total+=inv.amount;});
    sr.innerHTML=Object.keys(g).length?Object.entries(g).map(([k,v])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(255,255,255,.05);border-radius:10px;margin-bottom:10px;">
      <div>${serviceBadge(k)}</div>
      <div style="text-align:center;"><div style="font-size:18px;font-weight:800;">${v.count}</div><div style="font-size:11px;color:var(--muted);">طلب</div></div>
      <div style="color:var(--success);font-weight:700;">${fmt(v.total)}</div>
    </div>`).join(''):'<div class="empty-state"><div class="empty-icon">📊</div><p>لا توجد بيانات</p></div>';
  }

  const cr=document.getElementById('cars-report');
  if(cr)cr.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
      <div style="background:rgba(255,255,255,.05);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:var(--info);">${state.cars.length}</div>
        <div style="font-size:12px;color:var(--muted);">إجمالي السيارات</div>
      </div>
      <div style="background:rgba(255,255,255,.05);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:var(--success);">${state.cars.filter(c=>c.status==='delivered').length}</div>
        <div style="font-size:12px;color:var(--muted);">تم تسليمها</div>
      </div>
      <div style="background:rgba(255,255,255,.05);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:var(--gold);">${state.cars.filter(c=>c.status!=='delivered').length}</div>
        <div style="font-size:12px;color:var(--muted);">في الورشة</div>
      </div>
    </div>`;
}

function renderCustomers(){
  const customers={};
  state.cars.forEach(c=>{
    if(!customers[c.owner])customers[c.owner]={phone:c.phone,cars:0,paid:0,remaining:0};
    customers[c.owner].cars++;
    customers[c.owner].paid+=(c.paidTotal||0);
    customers[c.owner].remaining+=Math.max(0,(c.estimate||0)-(c.paidTotal||0));
  });
  const tbody=document.getElementById('customers-table-body');
  if(!Object.keys(customers).length){tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">👤</div><p>لا يوجد عملاء</p></div></td></tr>';return;}
  tbody.innerHTML=Object.entries(customers).map(([name,d])=>`<tr>
    <td><strong>${name}</strong></td><td>${d.phone||'—'}</td><td>${d.cars}</td>
    <td style="color:var(--success);">${d.paid.toFixed(3)} ر.ع</td>
    <td style="color:${d.remaining>0?'var(--danger)':'var(--success)'};">${d.remaining>0?d.remaining.toFixed(3)+' ر.ع':'✅ لا يوجد'}</td>
  </tr>`).join('');
}

// ═══════════════════════════════════════════════════
// MONTHLY CLOSING SYSTEM
// ═══════════════════════════════════════════════════

// ── Monthly Closing — Config & Helpers ───────────────────────────────────────
let _closingChartRange = 6; // 3 | 6 | 12

