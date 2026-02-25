// ===== utils.js — ฟังก์ชันกลางที่ใช้ทุกหน้า =====

const API_BASE = 'http://27.254.144.167/api/v1'

// ===== Toast Notification =====
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer')
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`
  container.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

// ===== Modal =====
function openModal(id) {
  document.getElementById(id).classList.add('active')
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active')
}

// ปิด modal เมื่อกด overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active')
  }
})

// ===== Format Date =====
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

// ===== Logout =====
async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })
  } catch (_) {}
  window.location.href = '/login.html'
}

// ===== Check Auth (เรียกทุกหน้า) =====
async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    })
    if (res.status === 401 || res.status === 403) {
      window.location.href = '../login.html'
      return null
    }
    // ดึงข้อมูล admin จาก cookie/session ที่ฝั่ง server รู้จัก
    // อ่านชื่อจาก localStorage ที่ login.js บันทึกไว้
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}')
    if (user.username) {
      const el = document.getElementById('profileName')
      const av = document.getElementById('avatarLetter')
      if (el) el.textContent = user.full_name || user.username
      if (av) av.textContent = (user.full_name || user.username).charAt(0).toUpperCase()
    }
    return user
  } catch (_) {
    window.location.href = '../login.html'
    return null
  }
}