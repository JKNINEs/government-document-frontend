const API_BASE_URL = 'http://27.254.144.167/api/v1';
let currentBatchCode = null; // ใช้ batch_code แทน id

// ========================================
// READ - โหลดตาราง
// ========================================
async function loadLoans() {
    const tbody = document.getElementById('loanTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a1b9a;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</td></tr>';

    try {
        const res    = await fetch(`${API_BASE_URL}/loans`);
        const result = await res.json();
        const data   = result.data || result;

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#999;">ไม่พบข้อมูลรายการยืมเงิน</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        data.forEach(loan => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${loan.batch_code   || '-'}</td>
                <td>${loan.contract_no  || '-'}</td>
                <td style="text-align:center;">${loan.loan_head_count || '0'}</td>
                <td>${formatDate(loan.loan_date)}</td>
                <td>${formatDate(loan.clearance_date)}</td>
                <td>${loan.clearance_head_day1  || '-'}</td>
                <td>${loan.clearance_head_day2  || '-'}</td>
                <td style="text-align:center;">
                    <div class="action-buttons">
                        <button class="btn-edit"   data-code="${loan.batch_code}"><i class="fas fa-edit"></i> แก้ไข</button>
                        <button class="btn-delete" data-code="${loan.batch_code}"><i class="fas fa-trash"></i> ลบ</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // ✅ ผูก event หลัง render
        document.querySelectorAll('.btn-edit').forEach((btn, index) => {
            const loan = data[index];
            btn.dataset.contract_no        = loan.contract_no        || '';
            btn.dataset.loan_head_count    = loan.loan_head_count    || '';
            btn.dataset.loan_date          = loan.loan_date          || '';
            btn.dataset.clearance_date     = loan.clearance_date     || '';
            btn.dataset.clearance_head_day1 = loan.clearance_head_day1 || '';
            btn.dataset.clearance_head_day2 = loan.clearance_head_day2 || '';

            btn.addEventListener('click', () => openModalWithData(btn.dataset));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteLoan(btn.dataset.code));
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:30px;">⚠️ ${err.message}</td></tr>`;
    }
}

// ========================================
// CREATE / UPDATE — ใช้ endpoint เดียวกัน (ON DUPLICATE KEY)
// ========================================
async function saveLoan(data) {
    try {
        const res    = await fetch(`${API_BASE_URL}/loan/update-clearance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ บันทึกข้อมูลสำเร็จ');
            closeModal();
            loadLoans();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (err) {
        alert('❌ ไม่สามารถบันทึกข้อมูลได้: ' + err.message);
    }
}

// ========================================
// DELETE
// ========================================
async function deleteLoan(batchCode) {
    if (!confirm(`ต้องการลบรายการยืมเงินรุ่น ${batchCode} ใช่หรือไม่?`)) return;

    try {
        const res    = await fetch(`${API_BASE_URL}/loan/batch/${batchCode}`, { method: 'DELETE' });
        const result = await res.json();

        if (result.status === 'success') {
            alert('✅ ลบรายการสำเร็จ');
            loadLoans();
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
    currentBatchCode = null;
    document.getElementById('modalTitle').textContent = 'เพิ่มรายการยืมเงิน';
    document.getElementById('loanForm').reset();
    document.getElementById('loanBatchCode').disabled = false;
    document.getElementById('loanModal').classList.add('show');
}

// ========================================
// Modal — เปิดพร้อมข้อมูลสำหรับ Edit
// ========================================
function openModalWithData(dataset) {
    currentBatchCode = dataset.code;
    document.getElementById('modalTitle').textContent = `แก้ไขรายการรุ่น ${currentBatchCode}`;
    document.getElementById('loanForm').reset();

    document.getElementById('loanBatchCode').value      = dataset.code                || '';
    document.getElementById('loanBatchCode').disabled   = true; // ✅ ล็อค batch_code ตอนแก้ไข
    document.getElementById('loanContractNo').value     = dataset.contract_no         || '';
    document.getElementById('loanHeadCount').value      = dataset.loan_head_count     || '';
    document.getElementById('loanLoadDate').value = toInputDate(dataset.loan_date);
    document.getElementById('loanClearanceDate').value  = toInputDate(dataset.clearance_date);
    document.getElementById('loanClearanceDay1').value  = dataset.clearance_head_day1 || '';
    document.getElementById('loanClearanceDay2').value  = dataset.clearance_head_day2 || '';

    document.getElementById('loanModal').classList.add('show');
}

function closeModal() {
    document.getElementById('loanModal').classList.remove('show');
    document.getElementById('loanForm').reset();
    document.getElementById('loanBatchCode').disabled = false;
    currentBatchCode = null;
}

// ========================================
// Form Submit
// ========================================
document.getElementById('loanForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        batch_code:          document.getElementById('loanBatchCode').value.trim(),
        contract_no:         document.getElementById('loanContractNo').value.trim()  || null,
        clearance_head:      parseInt(document.getElementById('loanHeadCount').value)  || 0,
        loan_date: document.getElementById('loanLoadDate').value            || null,
        clearance_date:      document.getElementById('loanClearanceDate').value       || null,
        clearance_head_day1: parseInt(document.getElementById('loanClearanceDay1').value) || 0,
        clearance_head_day2: parseInt(document.getElementById('loanClearanceDay2').value) || 0
    };

    await saveLoan(data); // ✅ POST เสมอ (backend ใช้ ON DUPLICATE KEY)
});

// ========================================
// Helper
// ========================================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function toInputDate(dateStr) {
    if (!dateStr) return '';
    // แปลงให้เป็น YYYY-MM-DD สำหรับ input[type=date]
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toISOString().split('T')[0];
}

// ปิด Modal เมื่อคลิกนอก
document.getElementById('loanModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ========================================
// Init
// ========================================
document.addEventListener('DOMContentLoaded', loadLoans);
