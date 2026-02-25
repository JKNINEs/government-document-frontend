/**
 * mode-selector.js
 * วางที่ ../js/mode-selector.js
 * 
 * หน้าที่: จัดการ modal เลือก mode (สร้างใหม่ / แก้ไข)
 * และอัปเดต isEditMode, currentBatchId ให้ create.js รู้ว่าจะ POST หรือ PUT
 *
 * ⚠️ โหลด script นี้ "หลัง" create.js เสมอ
 */

// ============================================================
// State ที่ใช้ร่วมกับ create.js
// (create.js ต้องประกาศ isEditMode / currentBatchId เป็น var ระดับ global)
// ============================================================

let _msEditSearchOpen = false;
let _msBatchList      = [];

// ============================================================
// เปิด / ปิด Modal
// ============================================================
function openModeModal() {
    document.getElementById('modeModal').classList.add('ms-open');
    _resetEditSearch();
    _loadBatchListForMs();
}

function closeModeModal() {
    document.getElementById('modeModal').classList.remove('ms-open');
    _resetEditSearch();
}

// ============================================================
// SET CREATE MODE  →  POST
// ============================================================
function setCreateMode() {
    // อัปเดต global ของ create.js
    isEditMode     = false;
    currentBatchId = null;

    document.getElementById('is_edit_mode').value = 'false';
    document.getElementById('batch_id').value      = '';

    _updateBadge('create');
    _clearForm();
    closeModeModal();

    // hint ให้ user กรอกรุ่นใหม่
    const batchInput = document.getElementById('batchInput');
    batchInput.value = '';
    batchInput.style.backgroundColor = '';
    batchInput.placeholder = 'พิมพ์เพื่อค้นหา...';
    batchInput.focus();

    console.log('✅ Mode: CREATE (POST)');
}

// ============================================================
// Toggle ช่องค้นหา EDIT
// ============================================================
function toggleEditSearchInModal() {
    if (_msEditSearchOpen) {
        _resetEditSearch();
    } else {
        _openEditSearch();
    }
}

function _openEditSearch() {
    _msEditSearchOpen = true;
    document.getElementById('msEditSearchBox').classList.add('ms-open');
    document.getElementById('editModeCard').classList.add('ms-active');
    document.getElementById('msEditArrow').classList.add('ms-rotate');
    document.getElementById('msEditError').style.display   = 'none';
    document.getElementById('msEditLoading').style.display = 'none';
    document.getElementById('msEditBatchInput').value = '';
    setTimeout(() => document.getElementById('msEditBatchInput').focus(), 100);
}

function _resetEditSearch() {
    _msEditSearchOpen = false;
    document.getElementById('msEditSearchBox')?.classList.remove('ms-open');
    document.getElementById('editModeCard')?.classList.remove('ms-active');
    document.getElementById('msEditArrow')?.classList.remove('ms-rotate');
    if (document.getElementById('msEditError'))
        document.getElementById('msEditError').style.display = 'none';
    if (document.getElementById('msEditLoading'))
        document.getElementById('msEditLoading').style.display = 'none';
}

// ============================================================
// LOAD BATCH FOR EDIT  →  PUT
// ============================================================
async function loadBatchForEdit() {
    const code    = document.getElementById('msEditBatchInput').value.trim();
    const errEl   = document.getElementById('msEditError');
    const loadEl  = document.getElementById('msEditLoading');

    if (!code) {
        document.getElementById('msEditBatchInput').focus();
        return;
    }

    errEl.style.display  = 'none';
    loadEl.style.display = 'block';

    try {
        // ค้นหาจาก list ที่โหลดไว้ก่อน
        const found = _msBatchList.find(b =>
            b.batch_code === code || b.batch_code?.toLowerCase() === code.toLowerCase()
        );

        const targetId = found?.id ?? null;

        if (targetId) {
            // โหลดผ่าน create.js function
            await loadBatchDataForEdit(targetId);

            // ยืนยัน mode เป็น EDIT
            isEditMode     = true;
            currentBatchId = targetId;
            document.getElementById('is_edit_mode').value = 'true';
            document.getElementById('batch_id').value     = targetId;

            _updateBadge('edit', code);
            loadEl.style.display = 'none';
            closeModeModal();
            console.log(`✅ Mode: EDIT (PUT) — batch_id: ${targetId}, batch_code: ${code}`);
        } else {
            // fallback: fetch โดยตรงผ่าน detail endpoint
            const res    = await fetch(`${API_BASE_URL}/training_batches/detail/${encodeURIComponent(code)}`);
            const result = await res.json();

            loadEl.style.display = 'none';

            if (result.status === 'success' && result.data?.batch_id) {
                fillFormWithData(result.data);

                isEditMode     = true;
                currentBatchId = result.data.batch_id;
                document.getElementById('is_edit_mode').value = 'true';
                document.getElementById('batch_id').value     = result.data.batch_id;

                _updateBadge('edit', code);
                closeModeModal();
                console.log(`✅ Mode: EDIT (PUT) — batch_id: ${result.data.batch_id}`);
            } else {
                errEl.style.display = 'block';
            }
        }
    } catch (e) {
        loadEl.style.display = 'none';
        errEl.style.display  = 'block';
        console.error('mode-selector loadBatchForEdit error:', e);
    }
}

// ============================================================
// อัปเดต Badge แสดงสถานะ
// ============================================================
function _updateBadge(mode, batchCode = '') {
    const badge = document.getElementById('modeBadge');
    if (!badge) return;

    if (mode === 'edit') {
        badge.className   = 'mode-badge edit';
        badge.textContent = `✏️ แก้ไข${batchCode ? ' — ' + batchCode : ''}`;
    } else {
        badge.className   = 'mode-badge create';
        badge.textContent = '➕ สร้างใหม่';
    }
}

// ============================================================
// ล้างฟอร์มทั้งหมด (เมื่อ switch ไป Create Mode)
// ============================================================
function _clearForm() {
    const ids = [
        'batchInput','systemCodeInput','requestDocNoInput','annountment',
        'trainingDateInput','targetGroupInput','requestDateInput',
        'activityNameInput','kindOfFiscalInput','planNameInput','projectNameInput',
        'ActivityInput','subActivityInput','expensesInput','fiscalYearInput',
        'courseNameInput','courseCodeInput','courseTypeInput','courseHoursInput',
        'courseHoursInput1','locationNameInput',
        'instructorsInput','idCardInput',
        'controller','controller_position',
        'coordinator1','coordinator_position1',
        'coordinator2','coordinator_position2',
        'coordinator3','coordinator_position3',
        'borrowname','borrowname_position3',
        'loanNameInput','applicant_count','durationDaysInput',
        'costSpeakerNameInput','material','costFoodNameInput',
        'snack_mue','food_budget',
        'total_inst','total_food','total_material','total_food_snack','total_all_budget',
        'batch_id','activity_id','course_id','location_id','instructor_id',
        'controller_id','coordinator1_id','coordinator2_id','coordinator3_id','borrow_staff_id'
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // reset select
    const timeSelect = document.getElementById('trainingTimeInput');
    if (timeSelect) timeSelect.selectedIndex = 0;
}

// ============================================================
// โหลด Batch List สำหรับ datalist autocomplete
// ============================================================
async function _loadBatchListForMs() {
    if (_msBatchList.length > 0) return; // โหลดแล้ว ไม่โหลดซ้ำ
    try {
        const res    = await fetch(`${API_BASE_URL}/training_batches`);
        const result = await res.json();
        if (result.status === 'success') {
            _msBatchList = result.data;
            const dl = document.getElementById('msEditBatchDatalist');
            dl.innerHTML = '';
            result.data.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.batch_code;
                dl.appendChild(opt);
            });
        }
    } catch (e) {
        console.warn('mode-selector: โหลด batch list ไม่ได้', e);
    }
}

// ============================================================
// Event Listeners
// ============================================================
document.addEventListener('DOMContentLoaded', function () {

    // ปิดเมื่อคลิก overlay
    document.getElementById('modeModal')?.addEventListener('click', function (e) {
        if (e.target === this) closeModeModal();
    });

    // Enter ในช่องค้นหา
    document.getElementById('msEditBatchInput')?.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') loadBatchForEdit();
    });

    // ซ่อน error เมื่อพิมพ์ใหม่
    document.getElementById('msEditBatchInput')?.addEventListener('input', function () {
        document.getElementById('msEditError').style.display = 'none';
    });

    // Escape ปิด modal
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModeModal();
    });

    // ตรวจ URL param ?id= ตั้งแต่ load (เผื่อมาจาก index)
    // create.js จะจัดการอยู่แล้ว แต่เราอัปเดต badge ด้วย
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('id')) {
        // รอให้ create.js โหลดข้อมูลก่อน แล้วค่อย update badge
        setTimeout(() => {
            const batchCode = document.getElementById('batchInput')?.value || '';
            _updateBadge('edit', batchCode);
        }, 1500);
    }
});