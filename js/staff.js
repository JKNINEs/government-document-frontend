const API_BASE_URL = 'http://27.254.144.167/api/v1';
let currentStaffId = null;

// ========================================
// READ - โหลดตาราง
// ========================================
async function loadStaff() {
    const tbody = document.getElementById('staffTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#6a1b9a;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</td></tr>';

    try {
        const res    = await fetch(`${API_BASE_URL}/staff`);
        const result = await res.json();
        const data   = result.data || result;

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#999;">ไม่พบข้อมูลเจ้าหน้าที่</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        data.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name       || '-'}</td>
                <td>${s.position   || '-'}</td>
                <td>${s.work_group || '-'}</td>
                <td>${s.tel        || '-'}</td>
                <td style="text-align:center;">
                    <div class="action-buttons">
                        <button class="btn-edit"   data-id="${s.id}"><i class="fas fa-edit"></i> แก้ไข</button>
                        <button class="btn-delete" data-id="${s.id}"><i class="fas fa-trash"></i> ลบ</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // ✅ ผูก event หลัง render — เก็บข้อมูลใน dataset
        document.querySelectorAll('.btn-edit').forEach((btn, index) => {
            const s = data[index];
            btn.dataset.name       = s.name       || '';
            btn.dataset.position   = s.position   || '';
            btn.dataset.work_group = s.work_group || '';
            btn.dataset.job_desc   = s.job_desc   || '';
            btn.dataset.tel        = s.tel        || '';

            btn.addEventListener('click', () => openModalWithData(btn.dataset));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteStaff(btn.dataset.id));
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:30px;">⚠️ ${err.message}</td></tr>`;
    }
}

// ========================================
// CREATE
// ========================================
async function createStaff(data) {
    try {
        const res    = await fetch(`${API_BASE_URL}/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ เพิ่มเจ้าหน้าที่สำเร็จ');
            closeModal();
            loadStaff();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (err) {
        alert('❌ ไม่สามารถเพิ่มข้อมูลได้: ' + err.message);
    }
}

// ========================================
// UPDATE
// ========================================
async function updateStaff(id, data) {
    try {
        const res    = await fetch(`${API_BASE_URL}/staff/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ แก้ไขเจ้าหน้าที่สำเร็จ');
            closeModal();
            loadStaff();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (err) {
        alert('❌ ไม่สามารถแก้ไขข้อมูลได้: ' + err.message);
    }
}

// ========================================
// DELETE
// ========================================
async function deleteStaff(id) {
    if (!confirm('ต้องการลบเจ้าหน้าที่นี้ใช่หรือไม่?')) return;

    try {
        const res    = await fetch(`${API_BASE_URL}/staff/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ ลบเจ้าหน้าที่สำเร็จ');
            loadStaff();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (err) {
        alert('❌ ไม่สามารถลบข้อมูลได้: ' + err.message);
    }
}

// ========================================
// Modal — เปิดสำหรับ Create
// ========================================
function openModal(mode) {
    currentStaffId = null;
    document.getElementById('modalTitle').textContent = 'เพิ่มเจ้าหน้าที่ใหม่';
    document.getElementById('staffForm').reset();
    document.getElementById('staffModal').classList.add('show');
}

// ========================================
// Modal — เปิดพร้อมข้อมูลสำหรับ Edit
// ========================================
function openModalWithData(dataset) {
    currentStaffId = dataset.id;
    document.getElementById('modalTitle').textContent = 'แก้ไขเจ้าหน้าที่';
    document.getElementById('staffForm').reset();

    document.getElementById('staffName').value      = dataset.name       || '';
    document.getElementById('staffPosition').value  = dataset.position   || '';
    document.getElementById('staffWorkGroup').value = dataset.work_group || '';
    // document.getElementById('staffJobDesc').value   = dataset.job_desc   || '';
    document.getElementById('staffTel').value       = dataset.tel        || '';

    document.getElementById('staffModal').classList.add('show');
}

function closeModal() {
    document.getElementById('staffModal').classList.remove('show');
    document.getElementById('staffForm').reset();
    currentStaffId = null;
}

// ========================================
// Form Submit — แยก Create / Update อัตโนมัติ
// ========================================
document.getElementById('staffForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        name:       document.getElementById('staffName').value.trim(),
        position:   document.getElementById('staffPosition').value.trim(),
        work_group: document.getElementById('staffWorkGroup').value.trim(),
        // job_desc:   document.getElementById('staffJobDesc').value.trim() || null,
        tel:        document.getElementById('staffTel').value.trim()     || null
    };

    if (currentStaffId) {
        await updateStaff(currentStaffId, data); // ✅ PUT
    } else {
        await createStaff(data);                 // ✅ POST
    }
});

// ปิด Modal เมื่อคลิกนอก
document.getElementById('staffModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ========================================
// Init
// ========================================
document.addEventListener('DOMContentLoaded', loadStaff);
