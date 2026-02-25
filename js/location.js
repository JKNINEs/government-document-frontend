const API_BASE_URL = 'http://27.254.144.167/api/v1';
let currentLocationId = null;

// ========================================
// READ - โหลดตาราง
// ========================================
async function loadLocations() {
    const tbody = document.getElementById('locationTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#6a1b9a;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</td></tr>';

    try {
        const res    = await fetch(`${API_BASE_URL}/locations`);
        const result = await res.json();
        const data   = result.data || result;

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:#999;">ไม่พบข้อมูลสถานที่</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        data.forEach(loc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${loc.name         || '-'}</td>
           
                <td style="text-align:center;">
                    <div class="action-buttons">
                        <button class="btn-edit"   data-id="${loc.id}"><i class="fas fa-edit"></i> แก้ไข</button>
                        <button class="btn-delete" data-id="${loc.id}"><i class="fas fa-trash"></i> ลบ</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // ✅ ผูก event หลัง render — เก็บข้อมูลใน dataset ไม่ต้องเรียก API ซ้ำ
        document.querySelectorAll('.btn-edit').forEach((btn, index) => {
            const loc = data[index];
            btn.dataset.name         = loc.name         || '';
            btn.dataset.address_no   = loc.address_no   || '';
            btn.dataset.sub_district = loc.sub_district || '';
            btn.dataset.district     = loc.district     || '';
            btn.dataset.province     = loc.province     || '';
            btn.dataset.zipcode      = loc.zipcode      || '';

            btn.addEventListener('click', () => openModalWithData(btn.dataset));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteLocation(btn.dataset.id));
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding:30px;">⚠️ ${err.message}</td></tr>`;
    }
}

// ========================================
// CREATE
// ========================================
async function createLocation(data) {
    try {
        const res    = await fetch(`${API_BASE_URL}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ เพิ่มสถานที่สำเร็จ');
            closeModal();
            loadLocations();
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
async function updateLocation(id, data) {
    try {
        const res    = await fetch(`${API_BASE_URL}/locations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ แก้ไขสถานที่สำเร็จ');
            closeModal();
            loadLocations();
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
async function deleteLocation(id) {
    if (!confirm('ต้องการลบสถานที่นี้ใช่หรือไม่?')) return;

    try {
        const res    = await fetch(`${API_BASE_URL}/locations/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ ลบสถานที่สำเร็จ');
            loadLocations();
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
    currentLocationId = null;
    document.getElementById('modalTitle').textContent = 'เพิ่มสถานที่ใหม่';
    document.getElementById('locationForm').reset();
    document.getElementById('locationModal').classList.add('show');
}

// ========================================
// Modal — เปิดพร้อมข้อมูลสำหรับ Edit
// ========================================
function openModalWithData(dataset) {
    currentLocationId = dataset.id;
    document.getElementById('modalTitle').textContent = 'แก้ไขสถานที่';
    document.getElementById('locationForm').reset();

    // ✅ เติมค่าจาก dataset โดยตรง
    document.getElementById('locName').value        = dataset.name         || '';
    

    document.getElementById('locationModal').classList.add('show');
}

function closeModal() {
    document.getElementById('locationModal').classList.remove('show');
    document.getElementById('locationForm').reset();
    currentLocationId = null;
}

// ========================================
// Form Submit — แยก Create / Update อัตโนมัติ
// ========================================
document.getElementById('locationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        name:         document.getElementById('locName').value.trim(),
        address_no:   null,
        sub_district: null,
        district:     null,
        province:     null,
        zipcode:      null
    };

    if (currentLocationId) {
        await updateLocation(currentLocationId, data);
    } else {
        await createLocation(data);
    }
});

// ปิด Modal เมื่อคลิกนอก
document.getElementById('locationModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ========================================
// Init
// ========================================
document.addEventListener('DOMContentLoaded', loadLocations);
