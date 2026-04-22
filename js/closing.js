function renderMonthlyClosing(){
  if(!document.getElementById('page-closing'))return;
  if(!state.monthlyClosings)state.monthlyClosings=[];

  const now=new Date();
  const curMonth=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const data=getMonthlyData(curMonth);

  // Compute previous month for comparison
  const prevDate=new Date(now.getFullYear(),now.getMonth()-1,1);
  const prevMonth=prevDate.getFullYear()+'-'+String(prevDate.getMonth()+1).padStart(2,'0');
  const prev=getMonthlyData(prevMonth);

  // Update current month card
  document.getElementById('closing-current-title').textContent='📊 '+getMonthLabel(curMonth);
  document.getElementById('closing-current-subtitle').textContent=t('lbl_cl_received')+': '+data.carsReceived+' | '+t('lbl_cl_delivered')+': '+data.carsDelivered+' | '+t('lbl_cl_carryover_count')+': '+data.carsCarryOver;
  document.getElementById('cl-cur-revenue').textContent=fmt(data.totalPaid);
  document.getElementById('cl-cur-expenses').textContent=fmt(data.totalExpenses);
  document.getElementById('cl-cur-profit').textContent=fmt(data.grossProfit);
  document.getElementById('cl-cur-profit').style.color=data.grossProfit>=0?'var(--success)':'var(--danger)';
  document.getElementById('cl-cur-cars').textContent=data.carsReceived;
  document.getElementById('cl-cur-margin').textContent=data.profitMargin.toFixed(1)+'%';
  document.getElementById('cl-cur-margin').style.color=data.profitMargin>=0?'var(--success)':'var(--danger)';
  document.getElementById('cl-cur-carryover').textContent=data.carsCarryOver;

  // Comparison badges vs previous month
  const setEl=(id,html)=>{const el=document.getElementById(id);if(el)el.innerHTML=html;};
  setEl('cl-cmp-revenue',calcChange(data.totalPaid,prev.totalPaid).badge);
  // For expenses: going up is bad, going down is good → invert colors
  const expPct=calcChange(data.totalExpenses,prev.totalExpenses);
  const expBadge=prev.totalExpenses>0?`<span style="font-size:10px;color:${data.totalExpenses<=prev.totalExpenses?'var(--success)':'var(--danger)'};font-weight:700;">${data.totalExpenses<=prev.totalExpenses?'↓':'↑'}${Math.abs(((data.totalExpenses-prev.totalExpenses)/prev.totalExpenses)*100).toFixed(1)}%</span>`:'';
  setEl('cl-cmp-expenses',expBadge);
  setEl('cl-cmp-profit',calcChange(data.grossProfit,prev.grossProfit).badge);
  setEl('cl-cmp-cars',calcChange(data.carsReceived,prev.carsReceived).badge);
  setEl('cl-cmp-margin',calcChange(data.profitMargin,prev.profitMargin).badge);
  setEl('cl-cmp-prev',prev.carsReceived>0||prev.totalPaid>0?`vs. ${getMonthLabel(prevMonth)}`:'' );

  // Current month mini bar chart
  setTimeout(()=>{
    drawBarChart('chart-current-bar',
      [t('lbl_cl_revenue'),t('lbl_cl_expenses'),t('lbl_cl_profit')],
      [{data:[data.totalPaid,data.totalExpenses,Math.max(0,data.grossProfit)],color:'#00d4aa',colorEnd:'#00d4aa44'}],{}
    );
  },50);

  // Trend chart using _closingChartRange
  const trendMonths=getLastNMonths(_closingChartRange,true);
  const trendLabels=trendMonths.map(m=>{
    const idx=parseInt(m.split('-')[1])-1;
    const ar=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const en=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return currentLang==='ar'?ar[idx]:en[idx];
  });
  const trendRevenue=trendMonths.map(m=>getMonthlyData(m).totalPaid);
  const trendExpenses=trendMonths.map(m=>getMonthlyData(m).totalExpenses);
  const trendProfit=trendMonths.map(m=>Math.max(0,getMonthlyData(m).grossProfit));
  setTimeout(()=>drawBarChart('chart-trend-bar',trendLabels,[
    {data:trendRevenue,color:'#00d4aa',colorEnd:'#00d4aa33'},
    {data:trendExpenses,color:'#e94560',colorEnd:'#e9456033'},
    {data:trendProfit,color:'#ffd700',colorEnd:'#ffd70033'}
  ],{}),60);

  // Service donut chart (last 3 months aggregate)
  const last3=getLastNMonths(3,true);
  const svcMap={};
  last3.forEach(m=>{
    const d=getMonthlyData(m);
    Object.entries(d.byService).forEach(([k,v])=>{if(!svcMap[k])svcMap[k]=0;svcMap[k]+=v.count;});
  });
  const svcLabels=Object.keys(svcMap);
  const svcData=svcLabels.map(k=>svcMap[k]);
  const donutColors=['#00d4aa','#4facfe','#ffd700','#e94560','#a29bfe','#fd79a8','#55efc4','#fdcb6e'];
  setTimeout(()=>{
    drawDonutChart('chart-service-donut',svcLabels,svcData.length?svcData:[1],svcLabels.length?donutColors:['#333']);
    const legEl=document.getElementById('chart-service-legend');
    if(legEl)legEl.innerHTML=svcLabels.length?svcLabels.map((lbl,i)=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${donutColors[i%donutColors.length]};display:inline-block;"></span>
          <span>${lbl}</span>
        </div>
        <strong>${svcData[i]}</strong>
      </div>`).join(''):'<div style="color:var(--muted);font-size:12px;text-align:center;">لا توجد بيانات</div>';
  },70);

  // Cars trend line chart
  const carCounts=trendMonths.map(m=>getMonthlyData(m).carsReceived);
  setTimeout(()=>drawLineChart('chart-cars-trend',trendLabels,[{data:carCounts,color:'#4facfe'}]),80);

  // Yearly summary
  renderYearlySummary();

  // Render closing history list
  _renderClosingList();
}

function renderYearlySummary(){
  const el=document.getElementById('yearly-summary-body');
  if(!el)return;
  const yrInput=document.getElementById('closing-year-select');
  const year=yrInput?parseInt(yrInput.value)||new Date().getFullYear():new Date().getFullYear();
  if(yrInput&&!yrInput.value)yrInput.value=year;
  const y=getYearlyData(String(year));
  const profitColor=y.grossProfit>=0?'var(--success)':'var(--danger)';
  el.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px;">
      <div style="background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.2);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">💰 إجمالي الإيرادات</div>
        <div style="font-size:18px;font-weight:900;color:var(--success);">${fmt(y.totalPaid)}</div>
      </div>
      <div style="background:rgba(233,69,96,.08);border:1px solid rgba(233,69,96,.2);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">💸 إجمالي المصروفات</div>
        <div style="font-size:18px;font-weight:900;color:var(--danger);">${fmt(y.totalExpenses)}</div>
      </div>
      <div style="background:rgba(255,179,0,.08);border:1px solid rgba(255,179,0,.2);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">📈 صافي الربح السنوي</div>
        <div style="font-size:18px;font-weight:900;color:${profitColor};">${fmt(y.grossProfit)}</div>
      </div>
      <div style="background:rgba(79,172,254,.08);border:1px solid rgba(79,172,254,.2);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">🚗 سيارات مستلمة</div>
        <div style="font-size:18px;font-weight:900;color:var(--info);">${y.carsReceived}</div>
      </div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      ${y.bestMonth?`<div style="flex:1;min-width:140px;background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.15);border-radius:10px;padding:10px 14px;">
        <div style="font-size:10px;color:var(--muted);">🏆 أفضل شهر</div>
        <div style="font-size:13px;font-weight:700;color:var(--success);margin-top:2px;">${getMonthLabel(y.bestMonth)}</div>
        <div style="font-size:11px;color:var(--muted);">${fmt(y.bestProfit)}</div>
      </div>`:''}
      ${y.worstMonth&&y.worstMonth!==y.bestMonth?`<div style="flex:1;min-width:140px;background:rgba(233,69,96,.06);border:1px solid rgba(233,69,96,.15);border-radius:10px;padding:10px 14px;">
        <div style="font-size:10px;color:var(--muted);">📉 أضعف شهر</div>
        <div style="font-size:13px;font-weight:700;color:var(--danger);margin-top:2px;">${getMonthLabel(y.worstMonth)}</div>
        <div style="font-size:11px;color:var(--muted);">${fmt(y.worstProfit)}</div>
      </div>`:''}
    </div>`;
}

function _renderClosingList(){
  const list=document.getElementById('closing-list');
  if(!list)return;
  const closings=[...(state.monthlyClosings||[])].sort((a,b)=>b.month.localeCompare(a.month));
  if(!closings.length){
    list.innerHTML=`<div class="empty-state" style="padding:40px;"><div class="empty-icon">📅</div><p>${t('lbl_no_closings')}</p></div>`;
    return;
  }
  list.innerHTML=closings.map(c=>{
    const profitColor=c.grossProfit>=0?'var(--success)':'var(--danger)';
    const profitIcon=c.grossProfit>=0?'📈':'📉';
    return`<div style="border-bottom:1px solid var(--border);padding:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <div style="flex:1;min-width:160px;">
        <div style="font-size:14px;font-weight:700;color:var(--text);">${c.monthLabel}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${t('lbl_closed_at')}: ${formatDate(c.closedAt)} • ${t('lbl_closed_by')}: ${c.closedBy||'—'}</div>
        ${c.notes?`<div style="font-size:11px;color:var(--info);margin-top:4px;background:rgba(79,172,254,.08);padding:4px 8px;border-radius:8px;">📝 ${c.notes}</div>`:''}
        <div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;">
          <span style="font-size:11px;background:rgba(0,212,170,.12);color:var(--success);padding:2px 8px;border-radius:20px;">🚗 ${c.carsReceived} ${t('lbl_cl_received')}</span>
          <span style="font-size:11px;background:rgba(79,172,254,.12);color:var(--info);padding:2px 8px;border-radius:20px;">✅ ${c.carsDelivered} ${t('lbl_cl_delivered')}</span>
          ${c.carsCarryOver>0?`<span style="font-size:11px;background:rgba(255,100,50,.12);color:#ff6432;padding:2px 8px;border-radius:20px;">⏳ ${c.carsCarryOver} ${t('lbl_cl_carryover_count')}</span>`:''}
        </div>
      </div>
      <div style="text-align:center;min-width:90px;">
        <div style="font-size:11px;color:var(--muted);">${t('lbl_cl_revenue')}</div>
        <div style="font-size:14px;font-weight:700;color:var(--success);">${fmt(c.totalPaid)}</div>
      </div>
      <div style="text-align:center;min-width:90px;">
        <div style="font-size:11px;color:var(--muted);">${t('lbl_cl_expenses')}</div>
        <div style="font-size:14px;font-weight:700;color:var(--danger);">${fmt(c.totalExpenses)}</div>
      </div>
      <div style="text-align:center;min-width:90px;">
        <div style="font-size:11px;color:var(--muted);">${profitIcon} ${t('lbl_cl_profit')}</div>
        <div style="font-size:14px;font-weight:700;color:${profitColor};">${fmt(c.grossProfit)}</div>
      </div>
      <div style="text-align:center;min-width:60px;">
        <div style="font-size:11px;color:var(--muted);">${t('lbl_cl_margin')}</div>
        <div style="font-size:13px;font-weight:700;color:${profitColor};">${c.profitMargin.toFixed(1)}%</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="viewClosingDetails('${c.id}')">${t('btn_view_details')}</button>
        <button class="btn btn-outline btn-sm" onclick="recalcClosing('${c.id}')" title="إعادة الحساب">🔄</button>
        <button class="btn btn-danger btn-sm" onclick="deleteClosing('${c.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

// ── Open Close Month Modal ───────────────────────────────────────────────────

function openCloseMonthModal(){
  const now=new Date();
  const defMonth=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  document.getElementById('close-month-input').value=defMonth;
  const notesEl=document.getElementById('close-month-notes');
  if(notesEl)notesEl.value='';
  previewCloseMonth(defMonth);
  openModal('modal-close-month');
}

function previewCloseMonth(monthStr){
  if(!monthStr){
    document.getElementById('close-month-preview-content').innerHTML=`<div style="color:var(--muted);font-size:13px;">${t('lbl_select_month_first')}</div>`;
    return;
  }
  const d=getMonthlyData(monthStr);
  const alreadyClosed=state.monthlyClosings&&state.monthlyClosings.some(c=>c.month===monthStr);
  const warn=document.getElementById('close-month-warning');
  if(alreadyClosed){
    warn.style.display='block';
    warn.textContent=t('lbl_already_closed');
    document.getElementById('btn-confirm-close-month').disabled=true;
  } else {
    warn.style.display='none';
    document.getElementById('btn-confirm-close-month').disabled=false;
  }
  const profitColor=d.grossProfit>=0?'var(--success)':'var(--danger)';
  document.getElementById('close-month-preview-content').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="font-size:12px;"><span style="color:var(--muted);">${t('lbl_cl_cars')}:</span> <strong>${d.carsReceived}</strong></div>
      <div style="font-size:12px;"><span style="color:var(--muted);">${t('lbl_cl_delivered')}:</span> <strong>${d.carsDelivered}</strong></div>
      <div style="font-size:12px;"><span style="color:var(--muted);">${t('lbl_cl_carryover_count')}:</span> <strong style="color:#ff6432;">${d.carsCarryOver}</strong></div>
      <div style="font-size:12px;"><span style="color:var(--muted);">${t('lbl_cl_revenue')}:</span> <strong style="color:var(--success);">${fmt(d.totalPaid)}</strong></div>
      <div style="font-size:12px;"><span style="color:var(--muted);">${t('lbl_cl_expenses')}:</span> <strong style="color:var(--danger);">${fmt(d.totalExpenses)}</strong></div>
      <div style="font-size:12px;"><span style="color:var(--muted);">${t('lbl_cl_profit')}:</span> <strong style="color:${profitColor};">${fmt(d.grossProfit)}</strong></div>
    </div>
    ${d.carsCarryOver>0?`<div style="margin-top:10px;font-size:11px;color:#ff6432;padding:8px;background:rgba(255,100,50,.08);border-radius:8px;">⏳ ${d.carsCarryOver} ${t('lbl_cl_carryover_note')}</div>`:''}
  `;
}

function confirmCloseMonth(){
  const monthStr=document.getElementById('close-month-input').value;
  if(!monthStr){alert(t('lbl_select_month_first'));return;}
  if(state.monthlyClosings&&state.monthlyClosings.some(c=>c.month===monthStr)){
    alert(t('lbl_already_closed'));return;
  }
  const d=getMonthlyData(monthStr);
  const session=getSession();
  const notes=(document.getElementById('close-month-notes')?.value||'').trim();
  const rec={
    id:'cl_'+Date.now(),
    month:monthStr,
    monthLabel:getMonthLabel(monthStr),
    closedAt:today(),
    closedBy:session?session.username:'admin',
    notes,
    carsReceived:d.carsReceived, carsDelivered:d.carsDelivered, carsCarryOver:d.carsCarryOver,
    carryOverCarIds:d.carryOverCarIds, deliveredCarIds:d.deliveredCarIds, allCarIds:d.allCarIds,
    totalEstimate:d.totalEstimate, totalPaid:d.totalPaid, totalRemaining:d.totalRemaining,
    expenseIds:d.expenseIds, totalExpenses:d.totalExpenses, grossProfit:d.grossProfit,
    profitMargin:d.profitMargin, byService:d.byService
  };
  if(!state.monthlyClosings)state.monthlyClosings=[];
  state.monthlyClosings.push(rec);
  saveState();
  closeModal('modal-close-month');
  renderMonthlyClosing();
}

// ── View Closing Details ──────────────────────────────────────────────────────

function viewClosingDetails(id){
  const rec=state.monthlyClosings&&state.monthlyClosings.find(c=>c.id===id);
  if(!rec)return;
  document.getElementById('closing-details-title').textContent='📊 '+rec.monthLabel;
  const profitColor=rec.grossProfit>=0?'var(--success)':'var(--danger)';
  const allCars=(rec.allCarIds||[]).map(cid=>state.cars.find(c=>c.id===cid)).filter(Boolean);
  const carryOverCars=(rec.carryOverCarIds||[]).map(cid=>state.cars.find(c=>c.id===cid)).filter(Boolean);
  const expenses=(rec.expenseIds||[]).map(eid=>state.expenses.find(e=>e.id===eid)).filter(Boolean);
  const byService=rec.byService||{};
  const donutColors=['#00d4aa','#4facfe','#ffd700','#e94560','#a29bfe','#fd79a8','#55efc4','#fdcb6e'];

  document.getElementById('closing-details-body').innerHTML=`
    <!-- KPI row (always visible) -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:14px;">
      <div style="background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.25);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">${t('lbl_cl_revenue')}</div>
        <div style="font-size:15px;font-weight:900;color:var(--success);">${fmt(rec.totalPaid)}</div>
      </div>
      <div style="background:rgba(233,69,96,.1);border:1px solid rgba(233,69,96,.25);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">${t('lbl_cl_expenses')}</div>
        <div style="font-size:15px;font-weight:900;color:var(--danger);">${fmt(rec.totalExpenses)}</div>
      </div>
      <div style="background:rgba(255,179,0,.1);border:1px solid rgba(255,179,0,.25);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">${t('lbl_cl_profit')}</div>
        <div style="font-size:15px;font-weight:900;color:${profitColor};">${fmt(rec.grossProfit)}</div>
      </div>
      <div style="background:rgba(79,172,254,.1);border:1px solid rgba(79,172,254,.25);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">${t('lbl_cl_margin')}</div>
        <div style="font-size:15px;font-weight:900;color:${profitColor};">${rec.profitMargin.toFixed(1)}%</div>
      </div>
      <div style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">${t('lbl_cl_received')}</div>
        <div style="font-size:15px;font-weight:900;color:var(--info);">${rec.carsReceived}</div>
      </div>
      <div style="background:rgba(255,100,50,.08);border:1px solid rgba(255,100,50,.2);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--muted);">${t('lbl_cl_carryover_count')}</div>
        <div style="font-size:15px;font-weight:900;color:#ff6432;">${rec.carsCarryOver}</div>
      </div>
    </div>

    ${rec.notes?`<div style="background:rgba(79,172,254,.08);border:1px solid rgba(79,172,254,.2);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;">📝 ${rec.notes}</div>`:''}

    <!-- 4 Tabs -->
    <div class="tabs" id="cd-tabs" style="margin-bottom:0;">
      <button class="tab active" onclick="switchClosingTab('summary',this)">📊 الملخص</button>
      <button class="tab" onclick="switchClosingTab('cars',this)">🚗 السيارات (${allCars.length})</button>
      <button class="tab" onclick="switchClosingTab('expenses',this)">💸 المصروفات (${expenses.length})</button>
      <button class="tab" onclick="switchClosingTab('services',this)">🔧 الخدمات</button>
    </div>

    <!-- Tab: Summary -->
    <div id="cd-tab-summary" style="padding-top:14px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:14px;">
          <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:8px;">${t('closing_service_dist')}</div>
          <div style="display:flex;justify-content:center;"><canvas id="det-donut" width="150" height="150"></canvas></div>
          <div id="det-donut-legend" style="margin-top:8px;"></div>
        </div>
        <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:14px;">
          <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:8px;">📊 إيرادات / مصروفات / ربح</div>
          <canvas id="det-bar" width="200" height="150"></canvas>
        </div>
      </div>
    </div>

    <!-- Tab: Cars -->
    <div id="cd-tab-cars" style="display:none;padding-top:14px;">
      ${allCars.length?`
      <div style="overflow-x:auto;margin-bottom:16px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:rgba(255,255,255,.05);">
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">اللوحة</th>
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">المالك</th>
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">${t('th_cl_service')}</th>
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">${t('th_cl_amount')}</th>
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">الحالة</th>
          </tr></thead>
          <tbody>
            ${allCars.map(c=>`<tr style="border-top:1px solid rgba(255,255,255,.05);">
              <td style="padding:7px 6px;font-weight:700;">${c.plate}</td>
              <td style="padding:7px 6px;">${c.owner}</td>
              <td style="padding:7px 6px;">${serviceBadge(c.service||'—')}</td>
              <td style="padding:7px 6px;color:var(--success);font-weight:700;">${fmt(c.paidTotal||0)}</td>
              <td style="padding:7px 6px;">${statusBadge(c.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`:'<div class="empty-state"><div class="empty-icon">🚗</div><p>لا توجد سيارات</p></div>'}
      ${carryOverCars.length?`
      <div style="background:rgba(255,100,50,.06);border:1px solid rgba(255,100,50,.2);border-radius:12px;padding:12px;">
        <div style="font-size:12px;font-weight:700;color:#ff6432;margin-bottom:10px;">⏳ ${t('lbl_cl_carryover_note')} (${carryOverCars.length})</div>
        ${carryOverCars.map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,100,50,.1);font-size:12px;">
          <div><strong>${c.plate}</strong> — ${c.owner}</div>
          <div>${serviceBadge(c.service||'—')}</div>
          <div style="color:var(--muted);">${fmt(c.estimate||0)}</div>
        </div>`).join('')}
      </div>`:''}
    </div>

    <!-- Tab: Expenses -->
    <div id="cd-tab-expenses" style="display:none;padding-top:14px;">
      ${expenses.length?`
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:rgba(255,255,255,.05);">
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">التاريخ</th>
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">البيان</th>
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">النوع</th>
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">${t('th_cl_amount')}</th>
          </tr></thead>
          <tbody>
            ${expenses.map(e=>`<tr style="border-top:1px solid rgba(255,255,255,.05);">
              <td style="padding:7px 6px;">${formatDate(e.date)}</td>
              <td style="padding:7px 6px;">${e.desc}</td>
              <td style="padding:7px 6px;"><span class="badge badge-maint">${e.type}</span></td>
              <td style="padding:7px 6px;color:var(--danger);font-weight:700;">${fmt(e.amount)}</td>
            </tr>`).join('')}
            <tr style="border-top:2px solid rgba(255,255,255,.1);">
              <td colspan="3" style="padding:7px 6px;font-weight:700;">الإجمالي</td>
              <td style="padding:7px 6px;color:var(--danger);font-weight:900;">${fmt(rec.totalExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>`:'<div class="empty-state"><div class="empty-icon">💸</div><p>لا توجد مصروفات</p></div>'}
    </div>

    <!-- Tab: Services -->
    <div id="cd-tab-services" style="display:none;padding-top:14px;">
      ${Object.keys(byService).length?`
      <div style="overflow-x:auto;margin-bottom:16px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:rgba(255,255,255,.05);">
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">الخدمة</th>
            <th style="padding:8px 6px;text-align:center;color:var(--muted);">العدد</th>
            <th style="padding:8px 6px;text-align:right;color:var(--muted);">المحصّل</th>
            <th style="padding:8px 6px;text-align:center;color:var(--muted);">النسبة</th>
          </tr></thead>
          <tbody>
            ${(()=>{
              const total=Object.values(byService).reduce((s,v)=>s+v.count,0)||1;
              return Object.entries(byService).map(([svc,v])=>`<tr style="border-top:1px solid rgba(255,255,255,.05);">
                <td style="padding:7px 6px;">${serviceBadge(svc)}</td>
                <td style="padding:7px 6px;text-align:center;font-weight:700;">${v.count}</td>
                <td style="padding:7px 6px;color:var(--success);font-weight:700;">${fmt(v.amount)}</td>
                <td style="padding:7px 6px;text-align:center;">
                  <div style="background:rgba(255,255,255,.08);border-radius:20px;height:6px;overflow:hidden;">
                    <div style="background:var(--primary);height:100%;width:${Math.round(v.count/total*100)}%;"></div>
                  </div>
                  <span style="font-size:10px;color:var(--muted);">${Math.round(v.count/total*100)}%</span>
                </td>
              </tr>`).join('');
            })()}
          </tbody>
        </table>
      </div>
      <div style="display:flex;justify-content:center;margin-top:10px;">
        <canvas id="det-svc-donut" width="180" height="180"></canvas>
      </div>`:'<div class="empty-state"><div class="empty-icon">🔧</div><p>لا توجد خدمات</p></div>'}
    </div>
  `;

  setTimeout(()=>{
    const svcLabels=Object.keys(byService);
    const svcData=svcLabels.map(k=>byService[k].count);
    drawDonutChart('det-donut',svcLabels,svcData.length?svcData:[1],svcLabels.length?donutColors:['#333']);
    const legEl=document.getElementById('det-donut-legend');
    if(legEl)legEl.innerHTML=svcLabels.map((l,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;padding:2px 0;"><div style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:${donutColors[i%donutColors.length]};display:inline-block;"></span>${l}</div><strong>${svcData[i]}</strong></div>`).join('');
    drawBarChart('det-bar',[t('lbl_cl_revenue'),t('lbl_cl_expenses'),t('lbl_cl_profit')],
      [{data:[rec.totalPaid,rec.totalExpenses,Math.max(0,rec.grossProfit)],color:'#00d4aa',colorEnd:'#00d4aa44'}],{});
  },80);

  openModal('modal-closing-details');
}

function switchClosingTab(tab, btn){
  ['summary','cars','expenses','services'].forEach(name=>{
    const el=document.getElementById('cd-tab-'+name);
    if(el)el.style.display=name===tab?'block':'none';
  });
  document.querySelectorAll('#cd-tabs .tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  // Draw services donut when that tab is shown
  if(tab==='services'){
    const rec=state.monthlyClosings&&state.monthlyClosings.find(c=>document.getElementById('closing-details-title').textContent.includes(c.monthLabel));
    if(rec){
      const byService=rec.byService||{};
      const donutColors=['#00d4aa','#4facfe','#ffd700','#e94560','#a29bfe','#fd79a8','#55efc4','#fdcb6e'];
      const svcLabels=Object.keys(byService);
      const svcData=svcLabels.map(k=>byService[k].count);
      setTimeout(()=>drawDonutChart('det-svc-donut',svcLabels,svcData.length?svcData:[1],donutColors),30);
    }
  }
}

function deleteClosing(id){
  if(!confirm('حذف هذا الإغلاق؟'))return;
  state.monthlyClosings=state.monthlyClosings.filter(c=>c.id!==id);
  saveState();
  renderMonthlyClosing();
}

// ── Export Closings CSV ───────────────────────────────────────────────────────
function exportClosingsCSV(){
  const closings=(state.monthlyClosings||[]).slice().sort((a,b)=>a.month.localeCompare(b.month));
  if(!closings.length){alert('لا توجد سجلات إغلاق للتصدير');return;}

  const headers=['الشهر','الإيرادات (ر.ع)','المصروفات (ر.ع)','صافي الربح (ر.ع)','هامش الربح %','السيارات المستلمة','السيارات المسلمة','السيارات المعلقة','أغلق بواسطة','الملاحظات'];

  const rows=closings.map(c=>[
    c.monthLabel||c.month,
    (c.totalPaid||0).toFixed(3),
    (c.totalExpenses||0).toFixed(3),
    (c.grossProfit||0).toFixed(3),
    (c.profitMargin||0).toFixed(1)+'%',
    c.carsReceived||0,
    c.carsDelivered||0,
    c.carsCarryOver||0,
    c.closedBy||'',
    (c.notes||'').replace(/,/g,' ')
  ]);

  const BOM='\uFEFF';
  const csvContent=BOM+[headers,...rows].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');

  const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='إغلاق_شهري_'+(new Date().toISOString().slice(0,10))+'.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Print Closing Details ─────────────────────────────────────────────────────
function printClosingDetails(){
  const body=document.getElementById('closing-details-body');
  const title=document.getElementById('closing-details-title').textContent;
  if(!body)return;
  const w=window.open('','_blank');
  w.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><title>${title}</title>
  <style>body{font-family:'Cairo',sans-serif;padding:30px;direction:rtl;background:#fff;color:#111;}
  h1{color:#1a1a2e;border-bottom:3px solid #e94560;padding-bottom:10px;}
  table{width:100%;border-collapse:collapse;}th,td{padding:8px;border:1px solid #ddd;text-align:right;}
  th{background:#1a1a2e;color:white;}canvas{display:none;}</style></head>
  <body><h1>${title}</h1>${body.innerHTML}</body></html>`);
  w.document.close();
  w.print();
}

// ── Attach month input listener ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  const inp=document.getElementById('close-month-input');
  if(inp)inp.addEventListener('change',function(){previewCloseMonth(this.value);});
  // Restore sidebar collapse state
  if(localStorage.getItem('ft_sidebar_collapsed')==='1'){
    const sb=document.getElementById('sidebar');
    const main=document.querySelector('.main');
    const btn=document.getElementById('sidebar-collapse-btn');
    const isRtl=document.documentElement.dir!=='ltr';
    if(sb){
      sb.classList.add('collapsed');
      if(main){if(isRtl)main.style.marginRight='64px';else main.style.marginLeft='64px';}
      if(btn)btn.textContent=isRtl?'\u25B6':'\u25C4';
    }
  }
});

// EXPORT PDF (text-based)
function exportPDF(){
  const revenue=state.invoices.reduce((s,i)=>s+i.amount,0);
  const expenses=state.expenses.reduce((s,e)=>s+e.amount,0);
  const profit=revenue-expenses;
  const w=window.open('','_blank');
  w.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
  <style>body{font-family:'Cairo',sans-serif;padding:40px;direction:rtl;}h1{color:#1a1a2e;border-bottom:3px solid #e94560;padding-bottom:10px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#1a1a2e;color:white;padding:10px;}td{padding:8px;border:1px solid #ddd;}.total{font-weight:900;color:#e94560;font-size:18px;}.profit{color:${profit>=0?'#00b894':'#e94560'};}</style></head>
  <body>
  <h1>📊 التقرير المالي - اللمسة الأخيرة</h1>
  <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
  <h2>ملخص مالي</h2>
  <table><tr><th>البيان</th><th>القيمة</th></tr>
  <tr><td>إجمالي الإيرادات</td><td style="color:green;">${revenue.toFixed(3)} ر.ع</td></tr>
  <tr><td>إجمالي المصروفات</td><td style="color:red;">${expenses.toFixed(3)} ر.ع</td></tr>
  <tr><td class="total">صافي الربح</td><td class="profit total">${profit.toFixed(3)} ر.ع</td></tr></table>
  <h2>الفواتير (${state.invoices.length})</h2>
  <table><tr><th>#</th><th>العميل</th><th>السيارة</th><th>الخدمة</th><th>المبلغ</th><th>التاريخ</th></tr>
  ${state.invoices.map(i=>`<tr><td>#${i.id}</td><td>${i.owner}</td><td>${i.plate}</td><td>${i.service}</td><td>${i.amount.toFixed(3)} ر.ع</td><td>${i.date}</td></tr>`).join('')}
  </table>
  
<!-- ═══════════════════════════════════════════
     CUSTOMER TRACKING OVERLAY
═══════════════════════════════════════════ -->
<div id="customer-tracking-overlay" style="display:none;position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);overflow-y:auto;direction:rtl;font-family:'Cairo',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:30px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:30px;">
      <img id="trk-logo" src="" style="width:110px;height:110px;object-fit:contain;mix-blend-mode:screen;filter:brightness(1.1);margin-bottom:12px;">
      <div style="font-family:'Tajawal',sans-serif;font-size:22px;font-weight:900;color:#fff;">اللمسة الأخيرة</div>
      <div style="font-size:12px;color:#8892a4;letter-spacing:1px;">THE FINAL TOUCH</div>
    </div>

    <!-- Search box (shown when no car found yet) -->
    <div id="trk-search-box">
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:12px;">🔍</div>
        <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:6px;">تتبع سيارتك</div>
        <div style="font-size:13px;color:#8892a4;margin-bottom:20px;">أدخل رقم لوحة السيارة لمتابعة حالة الإصلاح</div>
        <div style="display:flex;gap:10px;max-width:360px;margin:0 auto;">
          <input type="text" id="trk-plate-input" placeholder="مثال: 12345 ع م" 
            style="flex:1;padding:12px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:#fff;font-family:'Cairo',sans-serif;font-size:14px;text-align:center;direction:rtl;"
            onkeypress="if(event.key==='Enter')searchCar()">
          <button onclick="searchCar()" style="padding:12px 20px;background:linear-gradient(135deg,#e94560,#ff6b35);border:none;border-radius:12px;color:white;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;">بحث 🔍</button>
        </div>
        <div id="trk-error" style="margin-top:14px;color:#e94560;font-size:13px;display:none;">⚠️ لم يتم العثور على سيارة بهذا الرقم</div>
      </div>
    </div>

    <!-- Car result card (hidden until search) -->
    <div id="trk-result" style="display:none;">

      <!-- Car info -->
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <div>
            <div style="font-size:22px;font-weight:900;color:#fff;" id="trk-car-plate">—</div>
            <div style="font-size:14px;color:#8892a4;margin-top:2px;" id="trk-car-model">—</div>
          </div>
          <div id="trk-status-badge"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <div style="color:#8892a4;margin-bottom:3px;">👤 المالك</div>
            <div style="color:#fff;font-weight:600;" id="trk-owner">—</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <div style="color:#8892a4;margin-bottom:3px;">🔧 نوع الخدمة</div>
            <div style="color:#fff;font-weight:600;" id="trk-service">—</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <div style="color:#8892a4;margin-bottom:3px;">📅 تاريخ الدخول</div>
            <div style="color:#fff;font-weight:600;" id="trk-date-in">—</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <div style="color:#8892a4;margin-bottom:3px;">⏱️ أيام في الورشة</div>
            <div style="font-weight:700;" id="trk-days">—</div>
          </div>
        </div>
        <!-- Expected delivery - full width -->
        <div id="trk-expected-box" style="background:rgba(0,212,170,0.06);border:1px solid rgba(0,212,170,0.2);border-radius:10px;padding:14px;margin-top:10px;display:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="color:#8892a4;font-size:12px;margin-bottom:3px;">🗓️ تاريخ التسليم المتوقع</div>
              <div style="color:#00d4aa;font-weight:800;font-size:16px;" id="trk-expected-date">—</div>
            </div>
            <div id="trk-days-left-badge"></div>
          </div>
        </div>
        
        </div>
      </div>

      <!-- Stages tracker -->
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;margin-bottom:16px;">
        <div style="font-size:14px;font-weight:700;color:#8892a4;margin-bottom:18px;text-align:center;">📋 مراحل الإصلاح</div>
        <div id="trk-stages-display" style="display:flex;flex-direction:column;gap:12px;"></div>
      </div>

      <!-- Payment info -->
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;margin-bottom:16px;" id="trk-payment-box">
        <div style="font-size:14px;font-weight:700;color:#8892a4;margin-bottom:14px;">💰 معلومات الدفع</div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;">
          <span style="color:#8892a4;">المبلغ الإجمالي</span>
          <span style="color:#fff;font-weight:700;" id="trk-amount">—</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;">
          <span style="color:#8892a4;">✅ المدفوع</span>
          <span style="color:#00d4aa;font-weight:700;" id="trk-paid">—</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:800;" id="trk-remaining-row">
          <span style="color:#8892a4;">⏳ المتبقي</span>
          <span id="trk-remaining">—</span>
        </div>
      </div>

      <!-- Notes -->
      <div id="trk-notes-box" style="background:rgba(79,172,254,0.06);border:1px solid rgba(79,172,254,0.2);border-radius:20px;padding:20px;margin-bottom:16px;display:none;">
        <div style="font-size:14px;font-weight:700;color:#4facfe;margin-bottom:10px;">📝 ملاحظات الورشة</div>
        <div id="trk-notes-text" style="font-size:13px;color:#eaeaea;line-height:1.7;"></div>
      </div>

      <!-- WhatsApp Notification Activation -->
      <div id="trk-notify-box" style="background:rgba(37,211,102,0.06);border:1px solid rgba(37,211,102,0.2);border-radius:16px;padding:18px;margin-bottom:12px;">
        <div style="font-size:13px;color:#25d366;font-weight:700;margin-bottom:10px;text-align:center;">📱 تفعيل إشعارات WhatsApp</div>
        <div style="font-size:12px;color:#8892a4;margin-bottom:12px;line-height:1.7;">
          1. أرسل الرسالة التالية على WhatsApp للرقم <strong style="color:#fff;direction:ltr;">+34 644 597 364</strong>:<br>
          <div style="background:rgba(255,255,255,.07);border-radius:8px;padding:6px 10px;margin:6px 0;font-size:11px;direction:ltr;font-family:monospace;">I allow callmebot to send me messages</div>
          2. ستصلك رسالة بمفتاح API — أدخله هنا:
        </div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="trk-wabot-key" placeholder="أدخل مفتاح API هنا..."
            style="flex:1;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;font-family:'Cairo',sans-serif;font-size:12px;direction:ltr;">
          <button onclick="saveWaBotKey()"
            style="padding:9px 16px;background:linear-gradient(135deg,#25d366,#128c7e);border:none;border-radius:10px;color:#fff;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">
            💾 حفظ
          </button>
        </div>
        <button onclick="openCallMeBotActivation()"
          style="margin-top:10px;width:100%;padding:9px;background:rgba(37,211,102,.15);border:1px solid rgba(37,211,102,.3);border-radius:10px;color:#25d366;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">
          📲 فتح واتساب لإرسال رسالة التفعيل
        </button>
        <div id="trk-notify-status" style="font-size:12px;margin-top:8px;min-height:16px;text-align:center;"></div>
      </div>

      <!-- Search again -->
      <button onclick="resetTracking()" style="width:100%;padding:13px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#eaeaea;font-family:'Cairo',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px;">🔍 البحث عن سيارة أخرى</button>
    </div>

    <div style="text-align:center;margin-top:20px;font-size:11px;color:#4a5568;">
      © اللمسة الأخيرة للصيانة والسمكرة والدهان
    </div>
  </div>
</div>

</body></html>`);
  w.document.close();w.print();
}

// TABS
function switchTab(btn,targetId){
  btn.closest('.page').querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  ['report-financial','report-services','report-cars'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display=id===targetId?'':'none';
  });
}



