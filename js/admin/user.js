// ===== users.js — CRUD ผู้ใช้ =====

let allUsers = []
let deleteTargetId = null

// ===== Init =====
async function init() {
  await checkAuth()
  await loadUsers()
}

// ===== Load Users =====
async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    })
    const data = await res.json()

    if (data.status !== 'success') {
      showToast('โหลดข้อมูลไม่สำเร็จ', 'error')
      return
    }

    allUsers = data.users
    document.getElementById('userCount').textContent = allUsers.length
    renderTable(allUsers)
  } catch (err) {
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error')
  }
}

// ===== Render Table =====
function renderTable(users) {
  const tbody = document.getElementById('usersBody')
  document.getElementById('tableInfo').textContent = `แสดง ${users.length} รายการ จากทั้งหมด ${allUsers.length} รายการ`

  if (!users.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">ไม่พบข้อมูลที่ค้นหา</div>
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
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditModal(${u.id})" title="แก้ไข">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="openDeleteConfirm(${u.id}, '${u.username}')" title="ลบ">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('')
}

// ===== Filter / Search =====
function filterTable() {
  const search = document.getElementById('searchInput').value.toLowerCase()
  const role = document.getElementById('roleFilter').value

  const filtered = allUsers.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search) ||
                        (u.fullname || '').toLowerCase().includes(search)
    const matchRole = !role || u.role === role
    return matchSearch && matchRole
  })

  renderTable(filtered)
}

// ===== Open Add Modal =====
function openAddModal() {
  document.getElementById('modalTitle').textContent = '➕ เพิ่มผู้ใช้ใหม่'
  document.getElementById('editUserId').value = ''
  document.getElementById('inputUsername').value = ''
  document.getElementById('inputPassword').value = ''
  document.getElementById('inputFullname').value = ''
  document.getElementById('inputRole').value = 'user'
  document.getElementById('pwHintLabel').style.display = 'none'
  document.getElementById('inputPassword').placeholder = 'กรอกรหัสผ่าน *'
  openModal('userModal')
}

// ===== Open Edit Modal =====
function openEditModal(userId) {
  const user = allUsers.find(u => u.id === userId)
  if (!user) return

  document.getElementById('modalTitle').textContent = '✏️ แก้ไขข้อมูลผู้ใช้'
  document.getElementById('editUserId').value = user.id
  document.getElementById('inputUsername').value = user.username
  document.getElementById('inputPassword').value = ''
  document.getElementById('inputFullname').value = user.fullname || ''
  document.getElementById('inputRole').value = user.role
  document.getElementById('pwHintLabel').style.display = 'inline'
  document.getElementById('inputPassword').placeholder = 'เว้นว่างหากไม่ต้องการเปลี่ยน'
  openModal('userModal')
}

// ===== Save (Add / Edit) =====
async function saveUser() {
  const userId = document.getElementById('editUserId').value
  const username = document.getElementById('inputUsername').value.trim()
  const password = document.getElementById('inputPassword').value
  const fullname = document.getElementById('inputFullname').value.trim()
  const role = document.getElementById('inputRole').value

  // Validate
  if (!username || !fullname) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error')
    return
  }
  if (!userId && !password) {
    showToast('กรุณากรอกรหัสผ่าน', 'error')
    return
  }

  const btn = document.getElementById('saveBtn')
  btn.textContent = '⏳ กำลังบันทึก...'
  btn.disabled = true

  try {
    let res, data

    if (userId) {
      // Edit
      const body = { username, fullname, role }
      if (password) body.password = password

      res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })
    } else {
      // Add
      res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, fullname, role })
      })
    }

    data = await res.json()

    if (res.ok && data.status === 'success') {
      showToast(data.message, 'success')
      closeModal('userModal')
      await loadUsers()
    } else {
      showToast(data.detail || 'เกิดข้อผิดพลาด', 'error')
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error')
  } finally {
    btn.textContent = '💾 บันทึก'
    btn.disabled = false
  }
}

// ===== Open Delete Confirm =====
function openDeleteConfirm(userId, username) {
  deleteTargetId = userId
  document.getElementById('confirmName').textContent = `"${username}"`
  openModal('confirmModal')
}

// ===== Confirm Delete =====
async function confirmDelete() {
  if (!deleteTargetId) return

  const btn = document.getElementById('confirmDeleteBtn')
  btn.textContent = '⏳ กำลังลบ...'
  btn.disabled = true

  try {
    const res = await fetch(`${API_BASE}/admin/users/${deleteTargetId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    const data = await res.json()

    if (res.ok && data.status === 'success') {
      showToast(data.message, 'success')
      closeModal('confirmModal')
      await loadUsers()
    } else {
      showToast(data.detail || 'ลบไม่สำเร็จ', 'error')
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error')
  } finally {
    deleteTargetId = null
    btn.textContent = '🗑️ ลบ'
    btn.disabled = false
  }
}

// ===== Toggle Password Visibility =====
function togglePw() {
  const input = document.getElementById('inputPassword')
  const btn = document.getElementById('pwToggle')
  if (input.type === 'password') {
    input.type = 'text'
    btn.textContent = '🙈'
  } else {
    input.type = 'password'
    btn.textContent = '👁️'
  }
}

init()