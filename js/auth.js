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
function saveUsers(u) { try{localStorage.setItem('ft_users',JSON.stringify(u));}catch(e){} }

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('ft_session')); } catch(e) { return null; }
}
function setSession(u) { try{sessionStorage.setItem('ft_session',JSON.stringify(u));}catch(e){} }
function clearSession() { try{sessionStorage.removeItem('ft_session');}catch(e){} }

// ── Login ────────────────────────────────────────────────────────────
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
}

// ── Logout ───────────────────────────────────────────────────────────
function logout() {
  if (!confirm('هل تريد تسجيل الخروج؟')) return;
  clearSession();
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-error').style.display = 'none';
  document.getElementById('auth-overlay').style.display = 'flex';
}

// ── Apply role UI ─────────────────────────────────────────────────────
function applyRole(user) {
  var isAdmin = (user.role === 'admin');

  document.querySelectorAll('.admin-only').forEach(function(el){
    el.classList.toggle('worker-hidden', !isAdmin);
  });

  document.getElementById('auth-user-name').textContent = '👤 ' + user.username;
  document.getElementById('auth-user-role').textContent = isAdmin ? '👑 مسؤول' : '👷 عامل';

  if (isAdmin) {
    showPage('dashboard');
  } else {
    var active = document.querySelector('.page.active');
    if (active) {
      var pid = active.id.replace('page-','');
      var restricted = ['dashboard','invoices','expenses','reports'];
      if (restricted.indexOf(pid) !== -1) showPage('cars');
    }
  }
}

// ── Init on load ─────────────────────────────────────────────────────
function initAuth() {
  // Copy logo from sidebar to login screen
  try {
    var sidebarImg = document.querySelector('.logo-area img');
    var authImg    = document.getElementById('auth-logo-img');
    if (sidebarImg && authImg) authImg.src = sidebarImg.src;
  } catch(e) {}

  // Reset old password format if needed (migration)
  try {
    var raw = localStorage.getItem('ft_users');
    if (raw) {
      var u = JSON.parse(raw);
      var needsReset = u.some(function(x){ return x.password === 'admin@2024'; });
      if (needsReset) localStorage.removeItem('ft_users');
    }
  } catch(e) { localStorage.removeItem('ft_users'); }

  var session = getSession();
  if (session) {
    applyRole(session);
    document.getElementById('auth-overlay').style.display = 'none';
  }
  // overlay stays visible if no session
}

// ── User Management ──────────────────────────────────────────────────
function openUsersModal() {
  renderUsersList();
  openModal('modal-users');
}

function renderUsersList() {
  const users = getUsers();
  const roleLabel = r => r === 'admin' ? '<span style="color:#e94560;font-weight:700;">👑 مسؤول</span>' : '<span style="color:#4facfe;font-weight:700;">👷 عامل</span>';
  document.getElementById('users-list').innerHTML = users.map((u, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;margin-bottom:8px;">
      <div>
        <div style="font-size:13px;font-weight:700;color:#fff;">@${u.username}</div>
        <div style="font-size:11px;margin-top:2px;">${roleLabel(u.role)}</div>
      </div>
      ${u.username !== getSession()?.username
        ? `<button onclick="deleteUser(${i})" style="background:rgba(233,69,96,.15);border:1px solid rgba(233,69,96,.25);color:#e94560;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;">حذف</button>`
        : '<span style="font-size:11px;color:var(--muted);">الحساب الحالي</span>'}
    </div>`).join('');
}

function saveUser() {
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value;
  const role     = document.getElementById('new-role').value;
  const msgEl    = document.getElementById('user-save-msg');

  if (!username || !password) {
    msgEl.innerHTML = '<span style="color:#e94560;">⚠️ يرجى ملء جميع الحقول</span>'; return;
  }
  const users = getUsers();
  const existing = users.findIndex(u => u.username === username);
  if (existing >= 0) {
    users[existing] = { username, password, role };
  } else {
    users.push({ username, password, role });
  }
  saveUsers(users);
  msgEl.innerHTML = '<span style="color:#00d4aa;">✅ تم الحفظ</span>';
  ['new-username','new-password'].forEach(id => document.getElementById(id).value = '');
  renderUsersList();
  setTimeout(() => msgEl.innerHTML = '', 2000);
}

function deleteUser(idx) {
  const users = getUsers();
  if (!confirm(`حذف المستخدم @${users[idx].username}؟`)) return;
  users.splice(idx, 1);
  saveUsers(users);
  renderUsersList();
}

// Run auth check after all scripts are parsed
initAuth();

