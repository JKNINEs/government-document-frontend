// ===== templates.js — จัดการ Template Word =====

let _uploadTarget = null  // { filename, displayName }
let _selectedFile = null

// ===== Init =====
async function init() {
  await checkAuth()
  await loadTemplates()
}

// ===== Load Templates =====
async function loadTemplates() {
  const grid = document.getElementById('templateGrid')

  try {
    const res = await fetch(`${API_BASE}/admin/templates`, { credentials: 'include' })

    if (res.status === 401 || res.status === 403) {
      window.location.href = '../login.html'
      return
    }

    const data = await res.json()
    if (data.status !== 'success') {
      grid.innerHTML = `<div class="template-error">⚠️ โหลดข้อมูลไม่สำเร็จ</div>`
      return
    }

    renderGrid(data.templates)
  } catch (err) {
    grid.innerHTML = `<div class="template-error">⚠️ เกิดข้อผิดพลาด: ${err.message}</div>`
  }
}

// ===== Render Grid =====
function renderGrid(templates) {
  const grid = document.getElementById('templateGrid')

  if (!templates || templates.length === 0) {
    grid.innerHTML = `<div class="template-empty">ไม่พบไฟล์ template</div>`
    return
  }

  grid.innerHTML = templates.map(t => {
    const sizeLabel = t.exists ? formatBytes(t.size_bytes) : '—'
    const dateLabel = t.updated_at
      ? new Date(t.updated_at * 1000).toLocaleDateString('th-TH', {
          day: '2-digit', month: 'short', year: 'numeric'
        })
      : '—'

    const statusBadge = t.exists
      ? `<span class="template-badge badge-ok">✔ พร้อมใช้งาน</span>`
      : `<span class="template-badge badge-missing">✘ ไม่พบไฟล์</span>`

    const downloadBtn = t.exists
      ? `<button class="btn btn-ghost btn-sm" onclick="downloadTemplate('${t.filename}')">⬇️ ดาวน์โหลด</button>`
      : `<button class="btn btn-ghost btn-sm" disabled style="opacity:.4;cursor:not-allowed;">⬇️ ดาวน์โหลด</button>`

    return `
      <div class="template-card">
        <div class="template-card-header">
          <div class="template-doc-icon">📄</div>
          <div>${statusBadge}</div>
        </div>
        <div>
          <div class="template-display-name">${t.display_name}</div>
          <div class="template-filename">${t.filename}</div>
          <div class="template-meta">
            <span>📦 ${sizeLabel}</span>
            <span>🕐 ${dateLabel}</span>
          </div>
        </div>
        <div class="template-card-footer">
          ${downloadBtn}
          <button class="btn btn-primary btn-sm" onclick="openUploadModal('${t.filename}', '${t.display_name}')">
            ⬆️ อัปโหลด
          </button>
        </div>
      </div>`
  }).join('')
}

// ===== Download =====
async function downloadTemplate(filename) {
  try {
    const cacheBust = `?t=${Date.now()}`
    const res = await fetch(`${API_BASE}/admin/templates/${encodeURIComponent(filename)}/download${cacheBust}`, {
      credentials: 'include'
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
      showToast(err.detail || 'ดาวน์โหลดไม่สำเร็จ', 'error')
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    showToast(`ดาวน์โหลด "${filename}" สำเร็จ`, 'success')
  } catch (err) {
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error')
  }
}

// ===== Upload Modal =====
function openUploadModal(filename, displayName) {
  _uploadTarget = { filename, displayName }
  _selectedFile = null

  document.getElementById('uploadTargetName').textContent = displayName
  document.getElementById('selectedFile').style.display = 'none'
  document.getElementById('uploadProgress').style.display = 'none'
  document.getElementById('uploadBtn').disabled = true
  document.getElementById('fileInput').value = ''
  document.getElementById('dropZone').classList.remove('drag-over')

  openModal('uploadModal')
}

// ===== Drag & Drop =====
function onDragOver(e) {
  e.preventDefault()
  document.getElementById('dropZone').classList.add('drag-over')
}

function onDragLeave() {
  document.getElementById('dropZone').classList.remove('drag-over')
}

function onDrop(e) {
  e.preventDefault()
  document.getElementById('dropZone').classList.remove('drag-over')
  const file = e.dataTransfer.files[0]
  if (file) setSelectedFile(file)
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (file) setSelectedFile(file)
}

function setSelectedFile(file) {
  if (!file.name.endsWith('.docx')) {
    showToast('รองรับเฉพาะไฟล์ .docx', 'error')
    return
  }

  _selectedFile = file
  document.getElementById('selectedFileName').textContent = file.name
  document.getElementById('selectedFileSize').textContent = `(${formatBytes(file.size)})`
  document.getElementById('selectedFile').style.display = 'flex'
  document.getElementById('uploadBtn').disabled = false
}

function clearFile() {
  _selectedFile = null
  document.getElementById('fileInput').value = ''
  document.getElementById('selectedFile').style.display = 'none'
  document.getElementById('uploadBtn').disabled = true
}

// ===== Do Upload =====
async function doUpload() {
  if (!_selectedFile || !_uploadTarget) return

  const progressWrap = document.getElementById('uploadProgress')
  const progressFill = document.getElementById('progressFill')
  const progressLabel = document.getElementById('progressLabel')
  const uploadBtn = document.getElementById('uploadBtn')

  uploadBtn.disabled = true
  progressWrap.style.display = 'block'
  progressFill.style.width = '0%'
  progressLabel.textContent = 'กำลังอัปโหลด...'

  const formData = new FormData()
  formData.append('file', _selectedFile)

  try {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          progressFill.style.width = pct + '%'
          progressLabel.textContent = `กำลังอัปโหลด... ${pct}%`
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          let detail = `HTTP ${xhr.status}`
          try { detail = JSON.parse(xhr.responseText).detail || detail } catch {}
          reject(new Error(detail))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อ')))

      xhr.open('POST', `${API_BASE}/admin/templates/${encodeURIComponent(_uploadTarget.filename)}/upload`)
      xhr.withCredentials = true
      xhr.send(formData)
    })

    progressFill.style.width = '100%'
    progressLabel.textContent = 'อัปโหลดสำเร็จ ✔'

    showToast(`อัปโหลด "${_uploadTarget.displayName}" สำเร็จ`, 'success')

    setTimeout(() => {
      closeModal('uploadModal')
      loadTemplates()
    }, 800)

  } catch (err) {
    progressLabel.textContent = 'เกิดข้อผิดพลาด ✘'
    progressFill.style.background = 'var(--danger)'
    uploadBtn.disabled = false
    showToast(err.message, 'error')
  }
}

// ===== Format Bytes =====
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

init()