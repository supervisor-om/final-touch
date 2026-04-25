// ════════════════════════════════════════════
//  Auth for Attendance Page — shares users with workshop
// ════════════════════════════════════════════

function getUsers() {
  try {
    var raw = localStorage.getItem('ft_users');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  var defaults = [
    { username: 'admin',  password: 'admin1234', role: 'admin'  },
    { username: 'worker', password: '1234',       role: 'worker' }
  ];
  try { localStorage.setItem('ft_users', JSON.stringify(defaults)); } catch(e) {}
  return defaults;
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('ft_session')); } catch(e) { return null; }
}

function setSession(u) { try{sessionStorage.setItem('ft_session',JSON.stringify(u));}catch(e){} }

function clearSession() { try{sessionStorage.removeItem('ft_session');}catch(e){} }

function doLogin() {
  var username = document.getElementById('auth-username').value.trim();
  var password = document.getElementById('auth-password').value;
  var errEl    = document.getElementById('auth-error');
  errEl.style.display = 'none';

  if (!username || !password) {
    errEl.textContent = '⚠️ يرجى إدخال اسم المستخدم وكلمة المرور';
    errEl.style.display = 'block'; return;
  }

  var users = getUsers();
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username && users[i].password === password) {
      user = users[i]; break;
    }
  }

  if (!user) {
    errEl.textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
    errEl.style.display = 'block';
    document.getElementById('auth-password').value = '';
    return;
  }

  setSession(user);
  applyRole(user);
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('main-ui').style.display = 'block';

  // Init attendance after login
  initAttendance();
}

function logout() {
  if (!confirm('هل تريد تسجيل الخروج؟')) return;
  clearSession();
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-error').style.display = 'none';
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('main-ui').style.display = 'none';
}

function applyRole(user) {
  var isAdmin = (user.role === 'admin');

  // Show/hide admin elements
  document.querySelectorAll('.admin-only').forEach(function(el){
    el.style.display = isAdmin ? '' : 'none';
  });

  // Hide admin tab from workers
  document.querySelectorAll('#main-tabs .tab').forEach(function(el){
    if (el.classList.contains('admin-only') && !isAdmin) {
      el.style.display = 'none';
    }
  });

  document.getElementById('user-name').textContent = '👤 ' + user.username;
  document.getElementById('user-role').innerHTML = isAdmin
    ? '<span class="role-badge" style="background:rgba(233,69,96,.15);color:#e94560;border:1px solid rgba(233,69,96,.25);">👑 مسؤول</span>'
    : '<span class="role-badge" style="background:rgba(79,172,254,.15);color:#4facfe;border:1px solid rgba(79,172,254,.25);">👷 عامل</span>';

  // Fill employee dropdowns for admin
  if (isAdmin) populateEmployeeDropdowns();
}

function populateEmployeeDropdowns() {
  var users = getUsers().filter(u => u.role !== 'admin');
  var opts = users.map(u => '<option value="' + u.username + '">' + u.username + '</option>').join('');

  var sel = document.getElementById('log-employee');
  if (sel) { sel.innerHTML = '<option value="">كل الموظفين</option>' + opts; }

  var repSel = document.getElementById('rep-employee');
  if (repSel) { repSel.innerHTML = '<option value="">كل الموظفين</option>' + opts; }
}

// ── Init on load ──────────────────────────
(function initAuth() {
  var session = getSession();
  if (session) {
    applyRole(session);
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('main-ui').style.display = 'block';
    // Init attendance after page load
    if (typeof initAttendance === 'function') {
      initAttendance();
    }
  }
})();
