function setClosingRange(n){
  _closingChartRange = n;
  document.querySelectorAll('.closing-range-btn').forEach(b=>{
    b.style.background = parseInt(b.dataset.range)===n ? 'var(--primary)' : 'rgba(255,255,255,.07)';
    b.style.color = parseInt(b.dataset.range)===n ? '#fff' : 'var(--muted)';
  });
  // Re-render only charts, not entire page
  const months = getLastNMonths(_closingChartRange, true);
  const labels = months.map(m=>{
    const idx=parseInt(m.split('-')[1])-1;
    const ar=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const en=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return currentLang==='ar'?ar[idx]:en[idx];
  });
  const trendRevenue=months.map(m=>getMonthlyData(m).totalPaid);
  const trendExpenses=months.map(m=>getMonthlyData(m).totalExpenses);
  const trendProfit=months.map(m=>Math.max(0,getMonthlyData(m).grossProfit));
  const carCounts=months.map(m=>getMonthlyData(m).carsReceived);
  // Resize canvas width to fit new range
  const canvas=document.getElementById('chart-trend-bar');
  if(canvas){canvas.width=Math.max(400,n*80);canvas.style.minWidth=Math.max(400,n*80)+'px';}
  setTimeout(()=>{
    drawBarChart('chart-trend-bar',labels,[
      {data:trendRevenue,color:'#00d4aa',colorEnd:'#00d4aa33'},
      {data:trendExpenses,color:'#e94560',colorEnd:'#e9456033'},
      {data:trendProfit,color:'#ffd700',colorEnd:'#ffd70033'}
    ],{});
    drawLineChart('chart-cars-trend',labels,[{data:carCounts,color:'#4facfe'}]);
  },30);
}

// Returns {badge: HTML string} comparing current to previous value
function calcChange(cur, prev){
  if(!prev||prev===0)return{badge:''};
  const pct=((cur-prev)/Math.abs(prev))*100;
  const abs=Math.abs(pct);
  if(abs<0.5)return{badge:`<span style="font-size:10px;color:var(--muted);">→ 0%</span>`};
  const up=cur>=prev;
  const color=up?'var(--success)':'var(--danger)';
  const arrow=up?'↑':'↓';
  return{badge:`<span style="font-size:10px;color:${color};font-weight:700;">${arrow}${abs.toFixed(1)}%</span>`};
}

// Re-calculate and update a closing record in-place
function recalcClosing(id){
  const rec=state.monthlyClosings&&state.monthlyClosings.find(c=>c.id===id);
  if(!rec)return;
  if(!confirm(`إعادة حساب إغلاق ${rec.monthLabel}؟ سيتم تحديث جميع الأرقام من البيانات الحالية.`))return;
  const d=getMonthlyData(rec.month);
  Object.assign(rec,{
    carsReceived:d.carsReceived, carsDelivered:d.carsDelivered, carsCarryOver:d.carsCarryOver,
    carryOverCarIds:d.carryOverCarIds, deliveredCarIds:d.deliveredCarIds, allCarIds:d.allCarIds,
    totalEstimate:d.totalEstimate, totalPaid:d.totalPaid, totalRemaining:d.totalRemaining,
    expenseIds:d.expenseIds, totalExpenses:d.totalExpenses, grossProfit:d.grossProfit,
    profitMargin:d.profitMargin, byService:d.byService
  });
  saveState();
  renderMonthlyClosing();
}

// Calculate yearly totals
function getYearlyData(year){
  const months=[];
  for(let m=1;m<=12;m++)months.push(year+'-'+String(m).padStart(2,'0'));
  const data=months.map(m=>getMonthlyData(m));
  const totalPaid=data.reduce((s,d)=>s+d.totalPaid,0);
  const totalExpenses=data.reduce((s,d)=>s+d.totalExpenses,0);
  const grossProfit=totalPaid-totalExpenses;
  const carsReceived=data.reduce((s,d)=>s+d.carsReceived,0);
  // Best & worst months
  let bestMonth=null,bestProfit=-Infinity,worstMonth=null,worstProfit=Infinity;
  data.forEach((d,i)=>{
    if(d.carsReceived>0||d.totalPaid>0){
      if(d.grossProfit>bestProfit){bestProfit=d.grossProfit;bestMonth=months[i];}
      if(d.grossProfit<worstProfit){worstProfit=d.grossProfit;worstMonth=months[i];}
    }
  });
  return{totalPaid,totalExpenses,grossProfit,carsReceived,bestMonth,worstMonth,bestProfit,worstProfit};
}

// Returns all stats for a given month string "YYYY-MM"
// Revenue is attributed to dateIn (registration month), NOT dateOut
function getMonthlyData(monthStr){
  const allCars = state.cars.filter(c=>(c.dateIn||'').startsWith(monthStr));
  const delivered = allCars.filter(c=>c.status==='delivered');
  const carryOver = allCars.filter(c=>c.status!=='delivered');
  const totalEstimate = allCars.reduce((s,c)=>s+(c.estimate||0),0);
  const totalPaid = allCars.reduce((s,c)=>s+(c.paidTotal||0),0);
  const monthExpenses = state.expenses.filter(e=>(e.date||'').startsWith(monthStr));
  const totalExpenses = monthExpenses.reduce((s,e)=>s+(e.amount||0),0);
  const grossProfit = totalPaid - totalExpenses;
  const profitMargin = totalPaid>0?(grossProfit/totalPaid)*100:0;
  // Service distribution
  const byService = {};
  allCars.forEach(c=>{
    const svc = c.service||'أخرى';
    if(!byService[svc])byService[svc]={count:0,amount:0};
    byService[svc].count++;
    byService[svc].amount+=(c.paidTotal||0);
  });
  return {
    carsReceived:allCars.length, carsDelivered:delivered.length, carsCarryOver:carryOver.length,
    carryOverCarIds:carryOver.map(c=>c.id), deliveredCarIds:delivered.map(c=>c.id),
    allCarIds:allCars.map(c=>c.id),
    totalEstimate, totalPaid, totalRemaining:totalEstimate-totalPaid,
    expenseIds:monthExpenses.map(e=>e.id), totalExpenses, grossProfit, profitMargin,
    byService
  };
}

// Get label for a month string "YYYY-MM"
function getMonthLabel(monthStr){
  if(!monthStr)return '';
  const months=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthsEn=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [y,m]=monthStr.split('-');
  const idx=parseInt(m)-1;
  const name=currentLang==='ar'?months[idx]:monthsEn[idx];
  return name+' '+y;
}

// Get last N months as "YYYY-MM" strings (newest first or oldest first)
function getLastNMonths(n, oldestFirst){
  const result=[];
  const now=new Date();
  for(let i=n-1;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    result.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));
  }
  return oldestFirst?result:result.reverse();
}

// ── Vanilla JS Chart Helpers ─────────────────────────────────────────────────

function drawBarChart(canvasId, labels, datasets, options){
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const pad={top:20,right:20,bottom:40,left:70};
  const chartW=W-pad.left-pad.right;
  const chartH=H-pad.top-pad.bottom;
  ctx.clearRect(0,0,W,H);

  const allVals=datasets.flatMap(d=>d.data);
  const maxVal=Math.max(...allVals,1);
  const minVal=Math.min(...allVals,0);
  const range=maxVal-minVal||1;

  const nGroups=labels.length;
  const nSeries=datasets.length;
  const groupW=chartW/nGroups;
  const barW=Math.min(groupW*0.7/nSeries,32);
  const gap=groupW*0.15;

  // Grid lines
  ctx.strokeStyle='rgba(255,255,255,0.07)';
  ctx.lineWidth=1;
  const gridSteps=5;
  for(let i=0;i<=gridSteps;i++){
    const y=pad.top+chartH-i*(chartH/gridSteps);
    ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+chartW,y);ctx.stroke();
    // Y axis labels
    const val=minVal+i*(range/gridSteps);
    ctx.fillStyle='rgba(255,255,255,0.45)';
    ctx.font='10px Cairo,sans-serif';
    ctx.textAlign='right';
    const label=val>=1000?(val/1000).toFixed(1)+'k':val.toFixed(0);
    ctx.fillText(label,pad.left-6,y+4);
  }

  // Bars
  datasets.forEach((ds,si)=>{
    ds.data.forEach((val,gi)=>{
      const barH=Math.abs(val-minVal)/range*chartH;
      const x=pad.left+gi*groupW+gap+(si*(barW+(nSeries>1?2:0)));
      const y=pad.top+chartH-(val-minVal)/range*chartH;
      // Gradient
      const grad=ctx.createLinearGradient(0,y,0,y+barH);
      grad.addColorStop(0,ds.color);
      grad.addColorStop(1,ds.colorEnd||ds.color+'44');
      ctx.fillStyle=grad;
      const r=4;
      ctx.beginPath();
      ctx.moveTo(x+r,y);ctx.lineTo(x+barW-r,y);
      ctx.quadraticCurveTo(x+barW,y,x+barW,y+r);
      ctx.lineTo(x+barW,y+barH);ctx.lineTo(x,y+barH);
      ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
      ctx.closePath();ctx.fill();
      // Value on bar
      if(val>0&&barH>18){
        ctx.fillStyle='rgba(255,255,255,0.85)';
        ctx.font='bold 9px Cairo,sans-serif';
        ctx.textAlign='center';
        const lbl=val>=1000?(val/1000).toFixed(1)+'k':val.toFixed(1);
        ctx.fillText(lbl,x+barW/2,y+barH-4);
      }
    });
  });

  // X axis labels
  ctx.fillStyle='rgba(255,255,255,0.6)';
  ctx.font='10px Cairo,sans-serif';
  ctx.textAlign='center';
  labels.forEach((lbl,i)=>{
    const x=pad.left+i*groupW+groupW/2;
    ctx.fillText(lbl,x,H-8);
  });
}

function drawDonutChart(canvasId, labels, data, colors){
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const total=data.reduce((s,v)=>s+v,0)||1;
  const cx=W/2, cy=H/2, R=Math.min(W,H)/2-16, innerR=R*0.55;
  let startAngle=-Math.PI/2;
  data.forEach((val,i)=>{
    const sweep=(val/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,startAngle,startAngle+sweep);
    ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];
    ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.3)';
    ctx.lineWidth=2;
    ctx.stroke();
    startAngle+=sweep;
  });
  // Inner circle (donut hole)
  ctx.beginPath();
  ctx.arc(cx,cy,innerR,0,Math.PI*2);
  ctx.fillStyle='#1a1a2e';
  ctx.fill();
  // Center text
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.font='bold 14px Cairo,sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(data.reduce((s,v)=>s+v,0)+'',cx,cy-6);
  ctx.font='10px Cairo,sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.fillText(currentLang==='ar'?'سيارة':'cars',cx,cy+10);
  ctx.textBaseline='alphabetic';
}

function drawLineChart(canvasId, labels, datasets){
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const pad={top:20,right:20,bottom:36,left:40};
  const chartW=W-pad.left-pad.right, chartH=H-pad.top-pad.bottom;
  ctx.clearRect(0,0,W,H);
  const allVals=datasets.flatMap(d=>d.data);
  const maxVal=Math.max(...allVals,1);
  // Grid
  ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=pad.top+i*(chartH/4);
    ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+chartW,y);ctx.stroke();
  }
  // Lines
  const n=labels.length;
  datasets.forEach(ds=>{
    if(!ds.data.length)return;
    ctx.strokeStyle=ds.color;
    ctx.lineWidth=2.5;
    ctx.lineJoin='round';
    ctx.beginPath();
    ds.data.forEach((v,i)=>{
      const x=pad.left+i*(chartW/(n-1||1));
      const y=pad.top+chartH-(v/maxVal)*chartH;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
    // Dots
    ds.data.forEach((v,i)=>{
      const x=pad.left+i*(chartW/(n-1||1));
      const y=pad.top+chartH-(v/maxVal)*chartH;
      ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);
      ctx.fillStyle=ds.color;ctx.fill();
      ctx.strokeStyle='#1a1a2e';ctx.lineWidth=2;ctx.stroke();
      // Value label
      ctx.fillStyle='rgba(255,255,255,0.75)';
      ctx.font='9px Cairo,sans-serif';ctx.textAlign='center';
      ctx.fillText(v,x,y-9);
    });
  });
  // X labels
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.font='9px Cairo,sans-serif';ctx.textAlign='center';
  labels.forEach((lbl,i)=>{
    const x=pad.left+i*(chartW/(n-1||1));
    ctx.fillText(lbl,x,H-8);
  });
}

// ── Render Monthly Closing Page ───────────────────────────────────────────────

