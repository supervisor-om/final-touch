function showPage(id){
  // Role-based access check
  try{
    var _sess=JSON.parse(sessionStorage.getItem('ft_session'));
    if(_sess && _sess.role!=='admin' && ADMIN_PAGES_SET.indexOf(id)!==-1){
      var b=document.createElement('div');
      b.style.cssText='position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(233,69,96,.9);color:#fff;padding:12px 24px;border-radius:12px;font-weight:700;font-size:13px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.4);';
      b.textContent='🔒 هذه الصفحة للمسؤول فقط';
      document.body.appendChild(b);setTimeout(function(){b.remove();},2500);
      return;
    }
  }catch(e){}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes("'"+id+"'"))n.classList.add('active');});
  const titleKeys={dashboard:'nav_dashboard',cars:'nav_cars',delivered:'nav_delivered',alerts:'nav_alerts',maintenance:'nav_maintenance',services:'nav_services',invoices:'nav_invoices',expenses:'nav_expenses',reports:'nav_reports',customers:'nav_customers',closing:'nav_closing'};
  document.getElementById('page-title').textContent=t(titleKeys[id]||'')||'';
  renderAll();
  if(document.getElementById('sidebar').classList.contains('open'))toggleSidebar();
}
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-backdrop').classList.toggle('open');
  document.body.style.overflow = document.getElementById('sidebar').classList.contains('open') ? 'hidden' : '';
}

function toggleSidebarCollapse(){
  const sb=document.getElementById('sidebar');
  const main=document.querySelector('.main');
  const btn=document.getElementById('sidebar-collapse-btn');
  const isRtl=document.documentElement.dir!=='ltr';
  sb.classList.toggle('collapsed');
  const collapsed=sb.classList.contains('collapsed');
  if(main){
    if(isRtl) main.style.marginRight=collapsed?'64px':'270px';
    else main.style.marginLeft=collapsed?'64px':'270px';
  }
  if(btn) btn.textContent=collapsed?(isRtl?'\u25B6':'\u25C4'):(isRtl?'\u25C4':'\u25B6');
  localStorage.setItem('ft_sidebar_collapsed',collapsed?'1':'0');
}

// MODALS
function openModal(id){
  document.getElementById(id).classList.add('open');
  if(id==='modal-add-order') populateCarSelect();
  if(id==='modal-add-car'){
    window._addCarDamageMap=[];
    setTimeout(()=>injectDamageMap('add-dmap-container',[],  'add-dmap'),0);
  }
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));

// ADD CAR
