// ===== dashboard.js =====

let allUsers = []

async function init() {
  await checkAuth()
  await loadStats()
}

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    })
    const data = await res.json()

    if (data.status !== 'success') return

    allUsers = data.users

    const total = allUsers.length
    const adminCount = allUsers.filter(u => u.role === 'admin').length
    const userCount = allUsers.filter(u => u.role === 'user').length

    document.getElementById('statTotal').textContent = total
    document.getElementById('statAdmin').textContent = adminCount
    document.getElementById('statUser').textContent = userCount
    document.getElementById('userCount').textContent = total

    renderRecentUsers(allUsers.slice(-5).reverse())
  } catch (err) {
    console.error(err)
  }
}

function renderRecentUsers(users) {
  const tbody = document.getElementById('recentUsersBody')

  if (!users.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <div class="empty-text">ยังไม่มีผู้ใช้ในระบบ</div>
          </div>
        </td>
      </tr>`
    return
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td class="td-mono" style="color:var(--text-muted)">${u.id}</td>
      <td><strong>${u.username}</strong></td>
      <td>${u.fullname || '—'}</td>
      <td>
        <span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">
          ${u.role === 'admin' ? '🛡️' : '👤'} ${u.role}
        </span>
      </td>
      <td class="td-mono" style="font-size:12px;color:var(--text-muted)">${formatDate(u.created_at)}</td>
    </tr>
  `).join('')
}

init()