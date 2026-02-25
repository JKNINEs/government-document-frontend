const API_BASE_URL = 'http://27.254.144.167/api/v1';
let currentCourseId = null;

// ========================================
// CREATE - เพิ่มหลักสูตรใหม่
// ========================================
async function createCourse(data) {
    try {
        const res = await fetch(`${API_BASE_URL}/master_courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ เพิ่มหลักสูตรสำเร็จ');
            closeModal();
            loadCourses(); // Refresh ตาราง
        } else {
            alert('❌ เกิดข้อผิดพลาด: ' + result.message);
        }
    } catch (err) {
        alert('❌ ไม่สามารถเพิ่มข้อมูลได้: ' + err.message);
    }
}

// ========================================
// READ - ดึงข้อมูลหลักสูตรทั้งหมด
// ========================================
async function loadCourses() {
    const tbody = document.getElementById('courseTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a1b9a;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</td></tr>';

    try {
        const res = await fetch(`${API_BASE_URL}/master_courses`);
        const result = await res.json();
        const data = result.data || result;

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#999;">ไม่พบข้อมูลหลักสูตร</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        data.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.code || '-'}</td>
                <td>${c.name || '-'}</td>
                <td style="text-align:center;">${c.hours || '0'}</td>
                <td>${getBadge(c.course_type)}</td>
                <td>${c.sub_type || '-'}</td>
                <td style="text-align:center;">
                    <button class="btn-edit" data-id="${c.id}">
                        <i class="fas fa-edit"></i> แก้ไข
                    </button>
                    <button class="btn-delete" data-id="${c.id}">
                        <i class="fas fa-trash"></i> ลบ
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // ✅ ผูก event หลัง render เสร็จ (ป้องกัน apostrophe พัง onclick)
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openModal('edit', btn.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteCourse(btn.dataset.id));
        });

    } catch (err) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align:center; color:red; padding:30px;">
                ⚠️ เกิดข้อผิดพลาด: ${err.message}
            </td></tr>`;
    }
}

// ========================================
// READ ONE - ดึงข้อมูลหลักสูตรรายชิ้น (สำหรับ Edit)
// ========================================
async function loadCourseData(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/master_courses/${id}`);
        const result = await res.json();
        const c = result.data || result;

        // เติมข้อมูลลงฟอร์ม
        document.getElementById('courseCode').value    = c.code        || '';
        document.getElementById('courseName').value    = c.name        || '';
        document.getElementById('courseHours').value   = c.hours       || '';
        document.getElementById('courseType').value    = c.course_type || '';
        document.getElementById('courseSubType').value = c.sub_type    || '';

    } catch (err) {
        alert('❌ ไม่สามารถโหลดข้อมูลได้: ' + err.message);
    }
}

// ========================================
// UPDATE - แก้ไขหลักสูตร
// ========================================
async function updateCourse(id, data) {
    try {
        const res = await fetch(`${API_BASE_URL}/master_courses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ แก้ไขหลักสูตรสำเร็จ');
            closeModal();
            loadCourses(); // Refresh ตาราง
        } else {
            alert('❌ เกิดข้อผิดพลาด: ' + result.message);
        }
    } catch (err) {
        alert('❌ ไม่สามารถแก้ไขข้อมูลได้: ' + err.message);
    }
}

// ========================================
// DELETE - ลบหลักสูตร
// ========================================
async function deleteCourse(id) {
    if (!confirm('คุณต้องการลบหลักสูตรนี้ใช่หรือไม่?')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/master_courses/${id}`, {
            method: 'DELETE'
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ ลบหลักสูตรสำเร็จ');
            loadCourses(); // Refresh ตาราง
        } else {
            alert('❌ เกิดข้อผิดพลาด: ' + result.message);
        }
    } catch (err) {
        alert('❌ ไม่สามารถลบข้อมูลได้: ' + err.message);
    }
}

// ========================================
// Modal Control
// ========================================
async function openModal(mode, id = null) {
    currentCourseId = id;
    document.getElementById('modalTitle').textContent = mode === 'create' ? 'เพิ่มหลักสูตรใหม่' : 'แก้ไขหลักสูตร';
    document.getElementById('courseForm').reset();

    if (mode === 'edit' && id) {
        await loadCourseData(id); // โหลดข้อมูลเดิมเข้าฟอร์ม
    }

    document.getElementById('courseModal').classList.add('show');
}

function closeModal() {
    document.getElementById('courseModal').classList.remove('show');
    document.getElementById('courseForm').reset();
    currentCourseId = null;
}

// ========================================
// Form Submit — แยก Create / Update อัตโนมัติ
// ========================================
document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        code:        document.getElementById('courseCode').value.trim(),
        name:        document.getElementById('courseName').value.trim(),
        hours:       parseInt(document.getElementById('courseHours').value) || 0,
        course_type: document.getElementById('courseType').value,
        sub_type:    document.getElementById('courseSubType').value.trim()
    };

    if (currentCourseId) {
        await updateCourse(currentCourseId, data); // ✅ PUT
    } else {
        await createCourse(data);                  // ✅ POST
    }
});

// ========================================
// Helper
// ========================================
function getBadge(type) {
    if (!type) return '-';
    const map = {
        'ยกระดับฝีมือ':           'background:#e3f2fd; color:#1565c0;',
        'อาชีพเสริม':          'background:#e8f5e9; color:#2e7d32;',
        'เตรียมเข้าทำงาน':          'background:#fff3e0; color:#e65100;',
    };
    const style = map[type] || 'background:#f5f5f5; color:#333;';
    return `<span style="padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600; ${style}">${type}</span>`;
}

// ปิด Modal เมื่อคลิกนอก
document.getElementById('courseModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ========================================
// Init
// ========================================
document.addEventListener('DOMContentLoaded', loadCourses);
