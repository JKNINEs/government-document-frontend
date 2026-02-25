const API_BASE_URL = 'http://27.254.144.167/api/v1'

let applicantsList = [];
let currentMode = 'create';
let currentApplicantId = null;
let bulkEditApplicants = [];

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const id = urlParams.get('id');
    
    if (mode === 'edit' && id) {
        currentMode = 'edit';
        currentApplicantId = id;
        loadApplicantForEdit(id);
    } else if (mode === 'bulk-edit') {
        currentMode = 'bulk-edit';
        showBulkEditMode();
    } else {
        currentMode = 'create';
        loadBatchDropdown();
    }
});

// ========================================
// Mode: Bulk Edit
// ========================================
async function showBulkEditMode() {
    document.getElementById('singleEditMode').style.display = 'none';
    document.getElementById('bulkCreateMode').style.display = 'none';
    document.getElementById('bulkEditMode').style.display = 'block';
    document.getElementById('formTitle').textContent = 'แก้ไขผลการฝึกทั้งรุ่น';
    await loadBatchDropdownForBulkEdit();
}

async function loadBatchDropdownForBulkEdit() {
    try {
        const response = await fetch(`${API_BASE_URL}/training_batches`);
        const result = await response.json();

        const input    = document.getElementById('edit_batch_code');
        const datalist = document.getElementById('edit_batch_options');
        datalist.innerHTML = '';

        if (result.status === 'success') {
            const batches = result.data;

            batches.forEach(batch => {
                const opt = document.createElement('option');
                opt.value = batch.batch_code;
                datalist.appendChild(opt);
            });

            input.addEventListener('input', () => {
                const val   = input.value.trim();
                const match = batches.find(b => b.batch_code.toString() === val);
                if (match) {
                    loadApplicantsForBulkEdit(val);
                } else {
                    if (!val) {
                        document.getElementById('bulkEditTable').style.display = 'none';
                    }
                }
            });
        }
    } catch (err) {
        console.error('Error loading batches:', err);
        alert('ไม่สามารถโหลดรายการรุ่นได้');
    }
}

async function loadApplicantsForBulkEdit(batchCode) {
    if (!batchCode) {
        document.getElementById('bulkEditTable').style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/applicants/batch/${batchCode}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            bulkEditApplicants = result.data;
            document.getElementById('selectedBatchCode').textContent = batchCode;
            document.getElementById('bulkEditTable').style.display = 'block';
            renderBulkEditTable();
        } else {
            alert('ไม่พบรายชื่อในรุ่นนี้');
        }
    } catch (err) {
        console.error('Error loading applicants:', err);
        alert('เกิดข้อผิดพลาดในการโหลดรายชื่อ');
    }
}

function renderBulkEditTable() {
    const tbody = document.getElementById('bulkEditTableBody');
    tbody.innerHTML = '';
    
    bulkEditApplicants.forEach((applicant, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${applicant.name}</td>
            <td>${applicant.gender}</td>
            <td style="text-align: center;">
                <label style="display: flex; align-items: center; gap: 8px; justify-content: center; cursor: pointer;">
                    <input 
                        type="checkbox" 
                        class="result-checkbox"
                        data-id="${applicant.id}"
                        ${applicant.result === 'ผ่าน' ? 'checked' : ''}
                        onchange="updateBulkResult(${applicant.id}, this.checked)">
                    <span class="result-label-${applicant.id}">
                        ${applicant.result === 'ผ่าน' ? '✅ ผ่าน' : '⏳ รอผล'}
                    </span>
                </label>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateBulkResult(id, isChecked) {
    const applicant = bulkEditApplicants.find(a => a.id === id);
    if (applicant) {
        applicant.result = isChecked ? 'ผ่าน' : null;
        const label = document.querySelector(`.result-label-${id}`);
        if (label) {
            label.textContent = isChecked ? '✅ ผ่าน' : '⏳ รอผล';
        }
    }
}

function selectAllPassed(selectAll) {
    bulkEditApplicants.forEach(applicant => {
        applicant.result = selectAll ? 'ผ่าน' : null;
    });
    renderBulkEditTable();
}

async function saveBulkResults() {
    if (bulkEditApplicants.length === 0) {
        alert('❌ ไม่มีรายชื่อให้บันทึก');
        return;
    }
    
    const passedIds = bulkEditApplicants
        .filter(a => a.result === 'ผ่าน')
        .map(a => a.id);
    
    if (!confirm(`💾 บันทึกผลการฝึก (ผ่าน ${passedIds.length} คน) ใช่หรือไม่?`)) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/applicants/bulk-update-result`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ids: passedIds, result: 'ผ่าน' })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ บันทึกสำเร็จ!');
            window.location.href = '../index.html';
        } else {
            alert('❌ เกิดข้อผิดพลาด: ' + result.message);
        }
    } catch (err) {
        console.error('❌ Save Error:', err);
        alert('เกิดข้อผิดพลาดในการบันทึก');
    }
}

function goBackToApplicantList() {
    window.location.href = '../index.html?menu=applicant';
}

// ========================================
// Mode: Single Edit
// ========================================
async function loadApplicantForEdit(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/applicants/${id}`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            const applicant = result.data;
            
            document.getElementById('bulkCreateMode').style.display = 'none';
            document.getElementById('bulkEditMode').style.display = 'none';
            document.getElementById('singleEditMode').style.display = 'block';
            document.getElementById('formTitle').textContent = 'แก้ไขข้อมูลผู้สมัคร';
            
            document.getElementById('applicantId').value = applicant.id;
            document.getElementById('single_batch_code').value = applicant.batch_code;
            document.getElementById('single_name').value = applicant.name;
            document.getElementById('single_gender').value = applicant.gender;
            document.getElementById('single_result').value = applicant.result || '';
            
            document.getElementById('singleApplicantForm').addEventListener('submit', updateSingleApplicant);
        } else {
            alert('ไม่พบข้อมูลผู้สมัคร');
            window.history.back();
        }
    } catch (err) {
        console.error('Error loading applicant:', err);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        window.history.back();
    }
}

async function updateSingleApplicant(e) {
    e.preventDefault();
    
    const id = document.getElementById('applicantId').value;
    const data = {
        name: document.getElementById('single_name').value,
        gender: document.getElementById('single_gender').value,
        result: document.getElementById('single_result').value || null
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/applicants/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ แก้ไขข้อมูลสำเร็จ');
            window.location.href = '../index.html';
        } else {
            alert('❌ เกิดข้อผิดพลาด: ' + result.message);
        }
    } catch (err) {
        console.error('Update Error:', err);
        alert('เกิดข้อผิดพลาดในการบันทึก');
    }
}

// ========================================
// Mode: Bulk Create
// ========================================
async function loadBatchDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/training_batches`);
        const result = await response.json();

        const datalist = document.getElementById('batch_options');
        datalist.innerHTML = '';

        if (result.status === 'success') {
            result.data.forEach(batch => {
                const opt = document.createElement('option');
                opt.value = batch.batch_code;
                datalist.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Error loading batches:', err);
        alert('ไม่สามารถโหลดรายการรุ่นได้');
    }
}

function parseNames() {
    const batchCode = document.getElementById('batch_code').value.trim();
    const namesText = document.getElementById('namesInput').value.trim();
    const defaultGender = document.getElementById('defaultGender').value;
    
    if (!batchCode) { alert('❌ กรุณาเลือกรุ่น'); return; }
    if (!namesText) { alert('❌ กรุณากรอกรายชื่อ'); return; }
    
    const lines = namesText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) { alert('❌ ไม่พบรายชื่อ'); return; }

    function detectGender(name) {
        const femalePrefix = ['นาง', 'นางสาว', 'ด.ญ.', 'เด็กหญิง'];
        for (const prefix of femalePrefix) {
            if (name.startsWith(prefix)) return 'หญิง';
        }
        return 'ชาย';
    }
    
    applicantsList = lines.map((name, index) => ({
        id: Date.now() + index,
        name: name,
        gender: detectGender(name),
        result: null
    }));
    
    renderTable();
    document.getElementById('applicantForm').style.display = 'none';
    document.getElementById('applicantTable').style.display = 'block';
}

function renderTable() {
    const tbody = document.getElementById('applicantTableBody');
    tbody.innerHTML = '';
    
    applicantsList.forEach((applicant, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <input 
                    type="text" 
                    value="${applicant.name}" 
                    onchange="updateName(${applicant.id}, this.value)"
                    style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td>
                <select class="gender-select" onchange="updateGender(${applicant.id}, this.value)">
                    <option value="ชาย" ${applicant.gender === 'ชาย' ? 'selected' : ''}>ชาย</option>
                    <option value="หญิง" ${applicant.gender === 'หญิง' ? 'selected' : ''}>หญิง</option>
                </select>
            </td>
            <td style="text-align: center;">
                <label style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                    <input 
                        type="checkbox" 
                        class="result-checkbox"
                        ${applicant.result === 'ผ่าน' ? 'checked' : ''}
                        onchange="updateResult(${applicant.id}, this.checked)">
                    <span>${applicant.result === 'ผ่าน' ? '✅ ผ่าน' : '⏳ รอผล'}</span>
                </label>
            </td>
            <td style="text-align: center;">
                <button 
                    type="button" 
                    class="btn-danger" 
                    onclick="removeApplicant(${applicant.id})"
                    style="padding: 6px 12px;">
                    🗑️ ลบ
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateName(id, newName) {
    const applicant = applicantsList.find(a => a.id === id);
    if (applicant) applicant.name = newName;
}

function updateGender(id, newGender) {
    const applicant = applicantsList.find(a => a.id === id);
    if (applicant) applicant.gender = newGender;
}

function updateResult(id, isChecked) {
    const applicant = applicantsList.find(a => a.id === id);
    if (applicant) {
        applicant.result = isChecked ? 'ผ่าน' : null;
        renderTable();
    }
}

function removeApplicant(id) {
    if (!confirm('ต้องการลบรายชื่อนี้ใช่หรือไม่?')) return;
    applicantsList = applicantsList.filter(a => a.id !== id);
    renderTable();
}

function resetForm() {
    document.getElementById('applicantForm').style.display = 'block';
    document.getElementById('applicantTable').style.display = 'none';
    applicantsList = [];
}

async function saveApplicants() {
    const batchCode = document.getElementById('batch_code').value;
    
    if (applicantsList.length === 0) { alert('❌ ไม่มีรายชื่อให้บันทึก'); return; }
    if (!confirm(`💾 บันทึกรายชื่อ ${applicantsList.length} คน ใช่หรือไม่?`)) return;
    
    try {
        const data = {
            batch_code: batchCode,
            applicants: applicantsList.map(a => ({
                name: a.name,
                gender: a.gender,
                result: a.result
            }))
        };
        
        const response = await fetch(`${API_BASE_URL}/applicants/bulk`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ บันทึกสำเร็จ!');
            window.location.href = '../index.html';
        } else {
            alert('❌ เกิดข้อผิดพลาด: ' + result.message);
        }
    } catch (err) {
        console.error('❌ Save Error:', err);
        alert('เกิดข้อผิดพลาดในการบันทึก');
    }
}