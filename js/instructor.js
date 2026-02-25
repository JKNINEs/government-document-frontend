const API_BASE_URL = 'http://27.254.144.167/api/v1';
let currentInstructorId = null;

// ========================================
// READ - โหลดตาราง
// ========================================
async function loadInstructors() {
    const tbody = document.getElementById('instructorTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#6a1b9a;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</td></tr>';

    try {
        const res    = await fetch(`${API_BASE_URL}/instructors`);
        const result = await res.json();
        const data   = result.data || result;

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:#999;">ไม่พบข้อมูลวิทยากร</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        data.forEach(instr => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${instr.name        || '-'}</td>
                <td>${instr.skill_field || '-'}</td>
                <td>${instr.tel         || '-'}</td>
                <td style="text-align:center;">
                    <div class="action-buttons">
                        <button class="btn-edit"   data-id="${instr.id}"><i class="fas fa-edit"></i> แก้ไข</button>
                        <button class="btn-delete" data-id="${instr.id}"><i class="fas fa-trash"></i> ลบ</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // ✅ ผูก event หลัง render — เก็บข้อมูลใน dataset ไม่ต้องเรียก API ซ้ำ
        document.querySelectorAll('.btn-edit').forEach((btn, index) => {
            const instr = data[index];
            btn.dataset.name    = instr.name        || '';
            btn.dataset.skill   = instr.skill_field || '';
            btn.dataset.id_card = instr.id_card     || '';
            btn.dataset.tel     = instr.tel         || '';

            btn.addEventListener('click', () => openModalWithData(btn.dataset));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteInstructor(btn.dataset.id));
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding:30px;">⚠️ ${err.message}</td></tr>`;
    }
}

// ========================================
// CREATE
// ========================================
async function createInstructor(data) {
    try {
        const res    = await fetch(`${API_BASE_URL}/instructors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ เพิ่มวิทยากรสำเร็จ');
            closeModal();
            loadInstructors();
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
async function updateInstructor(id, data) {
    try {
        const res    = await fetch(`${API_BASE_URL}/instructors/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ แก้ไขวิทยากรสำเร็จ');
            closeModal();
            loadInstructors();
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
async function deleteInstructor(id) {
    if (!confirm('ต้องการลบวิทยากรนี้ใช่หรือไม่?')) return;

    try {
        const res    = await fetch(`${API_BASE_URL}/instructors/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ ลบวิทยากรสำเร็จ');
            loadInstructors();
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
    currentInstructorId = null;
    document.getElementById('modalTitle').textContent = 'เพิ่มวิทยากรใหม่';
    document.getElementById('instructorForm').reset();
    document.getElementById('instructorModal').classList.add('show');
}

// ========================================
// Modal — เปิดพร้อมข้อมูลสำหรับ Edit
// ========================================
function openModalWithData(dataset) {
    currentInstructorId = dataset.id;
    document.getElementById('modalTitle').textContent = 'แก้ไขวิทยากร';
    document.getElementById('instructorForm').reset();

    document.getElementById('instrName').value   = dataset.name    || '';
    document.getElementById('instrSkill').value  = dataset.skill   || '';
    document.getElementById('instrIdCard').value = dataset.id_card || '';
    document.getElementById('instrTel').value    = dataset.tel     || '';

    document.getElementById('instructorModal').classList.add('show');
}

function closeModal() {
    document.getElementById('instructorModal').classList.remove('show');
    document.getElementById('instructorForm').reset();
    currentInstructorId = null;
}

// ========================================
// Form Submit — แยก Create / Update อัตโนมัติ
// ========================================
document.getElementById('instructorForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        name:          document.getElementById('instrName').value.trim(),
        skill:         document.getElementById('instrSkill').value.trim(),
        in_card:       document.getElementById('instrIdCard').value.trim(),
        tel:           document.getElementById('instrTel').value.trim(),
        address_no:    null,
        moo:           null,
        road:          null,
        sub_distruict: null,
        district:      null,
        province:      null,
        zipcode:       null
    };

    if (currentInstructorId) {
        await updateInstructor(currentInstructorId, data); // ✅ PUT
    } else {
        await createInstructor(data);                      // ✅ POST
    }
});

// ปิด Modal เมื่อคลิกนอก
document.getElementById('instructorModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ========================================
// Init
// ========================================
document.addEventListener('DOMContentLoaded', loadInstructors);
