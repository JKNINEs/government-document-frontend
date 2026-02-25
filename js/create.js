// create.js - จัดการทั้ง CREATE และ EDIT ในหน้าเดียว

const API_BASE_URL = 'http://27.254.144.167/api/v1';

let currentStep = 0;
const totalSteps = 3;
let isEditMode = false;
let currentBatchId = null;

// ========================================
// Initial Load
// ========================================
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllMasterData();

    const urlParams = new URLSearchParams(window.location.search);
    const batchId   = urlParams.get('id');
    
    const pageTitle = document.getElementById('pageTitle'); // ✅ เก็บไว้ก่อน

    if (batchId) {
        isEditMode     = true;
        currentBatchId = batchId;
        
        const batchIdEl = document.getElementById('batch_id');
        const editModeEl = document.getElementById('is_edit_mode');
        const pageTitle = document.getElementById('pageTitle');
        if (batchIdEl) batchIdEl.value = batchId;          // ✅ guard
        if (editModeEl) editModeEl.value = 'true';         // ✅ guard
        if (pageTitle) pageTitle.textContent = 'แก้ไขข้อมูลรุ่นการอบรม'; // ✅ guard
        
        await loadBatchDataForEdit(batchId);
    } else {
        if (pageTitle) pageTitle.textContent = 'สร้างรุ่นการอบรมใหม่';   // ✅ guard
        
        const batchInput = document.getElementById('batchInput');
        if (batchInput) setupBatchInputListener();         // ✅ guard
    }

    if (document.querySelector('.step-tab')) setupStepNavigation();   // ✅ guard
    if (document.getElementById('saveBtn'))  setupSaveButton();       // ✅ guard
    if (document.getElementById('costSpeakerNameInput')) setupCalculations(); // ✅ guard
});

// ========================================
// Load Master Data
// ========================================
async function loadAllMasterData() {
    try {
        await Promise.all([
            loadBatches(),
            loadActivities(),
            loadCourses(),
            loadLocations(),
            loadInstructors(),
            loadStaff(),
            loadPlans(),
            loadProjects()
        ]);
    } catch (error) {
        console.error('Error loading master data:', error);
        alert('ไม่สามารถโหลดข้อมูลพื้นฐานได้');
    }
}

async function loadPlans() {
    try {
        const response = await fetch(`${API_BASE_URL}/master_plans`);
        const result = await response.json();
        if (result.status === 'success') {
            window.masterPlans = result.data;
            setupPlanDropdown();
        }
    } catch (error) { console.error('Error loading plans:', error); }
}

async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/master_projects`);
        const result = await response.json();
        if (result.status === 'success') {
            window.masterProjects = result.data;
            setupProjectDropdown();
        }
    } catch (error) { console.error('Error loading projects:', error); }
}

async function loadBatches() {
    try {
        const response = await fetch(`${API_BASE_URL}/training_batches`);
        const result = await response.json();
        if (result.status === 'success') {
            // เก็บไว้ใช้ใน mode-selector.js ด้วย
            window.masterBatches = result.data;

            const datalist = document.getElementById('batchOptions');
            datalist.innerHTML = '';
            result.data.forEach(batch => {
                const option = document.createElement('option');
                option.value = batch.batch_code;
                option.dataset.id = batch.id;
                datalist.appendChild(option);
            });
        }
    } catch (error) { console.error('Error loading batches:', error); }
}

async function loadActivities() {
    try {
        const response = await fetch(`${API_BASE_URL}/project_activities`);
        const result = await response.json();
        if (result.status === 'success') {
            window.masterActivities = result.data;
            setupActivityDropdown();
        }
    } catch (error) { console.error('Error loading activities:', error); }
}

async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/master_courses`);
        const result = await response.json();
        if (result.status === 'success') {
            window.masterCourses = result.data;
            setupCourseDropdown();
        }
    } catch (error) { console.error('Error loading courses:', error); }
}

async function loadLocations() {
    try {
        const response = await fetch(`${API_BASE_URL}/locations`);
        const result = await response.json();
        if (result.status === 'success') {
            window.masterLocations = result.data;
            setupLocationDropdown();
        }
    } catch (error) { console.error('Error loading locations:', error); }
}

async function loadInstructors() {
    try {
        const response = await fetch(`${API_BASE_URL}/instructors`);
        const result = await response.json();
        if (result.status === 'success') {
            window.masterInstructors = result.data;
            setupInstructorDropdown();
        }
    } catch (error) { console.error('Error loading instructors:', error); }
}

async function loadStaff() {
    try {
        const response = await fetch(`${API_BASE_URL}/staff`);
        const result = await response.json();
        if (result.status === 'success') {
            window.masterStaff = result.data;
            setupStaffDropdowns();
        }
    } catch (error) { console.error('Error loading staff:', error); }
}

// ========================================
// Setup Dropdowns
// ========================================
function setupActivityDropdown() {
    const input    = document.getElementById('activityNameInput');
    const dropdown = document.getElementById('activityNameDropdown');
    setupSearchableDropdown(input, dropdown, window.masterActivities, 'activity_name', 'id', (item) => {
        if (item && item.id) {
            // ✅ เลือกจาก dropdown → auto fill
            document.getElementById('kindOfFiscalInput').value = item.kind_of_fiscal || '';
            document.getElementById('planNameInput').value     = item.plan_name || '';
            document.getElementById('projectNameInput').value  = item.project_name || '';
            document.getElementById('ActivityInput').value     = item.activity || '';
            document.getElementById('subActivityInput').value  = item.sub_activity_name || '';
            document.getElementById('expensesInput').value     = item.expenses || '';
            document.getElementById('fiscalYearInput').value   = item.fiscal_year || '';
            document.getElementById('activity_id').value       = item.id;
        } else {
            // ✅ พิมพ์เอง (item = null) → ล้างค่า
            document.getElementById('kindOfFiscalInput').value = '';
            document.getElementById('planNameInput').value     = '';
            document.getElementById('projectNameInput').value  = '';
            document.getElementById('ActivityInput').value     = '';
            document.getElementById('subActivityInput').value  = '';
            document.getElementById('expensesInput').value     = '';
            document.getElementById('fiscalYearInput').value   = '';
            document.getElementById('activity_id').value       = '';
        }
    });
}

function setupCourseDropdown() {
    const nameInput    = document.getElementById('courseNameInput');
    const codeInput    = document.getElementById('courseCodeInput');
    const nameDropdown = document.getElementById('courseNameDropdown');
    const codeDropdown = document.getElementById('courseCodeDropdown');

    const autoFill = (item) => {
        if (item && item.id) {
            document.getElementById('courseNameInput').value  = item.name || '';
            document.getElementById('courseCodeInput').value  = item.code || '';
            document.getElementById('courseTypeInput').value  = item.course_type || '';
            document.getElementById('courseHoursInput').value = item.hours || '';
            document.getElementById('courseHoursInput1').value= item.hours || '';
            document.getElementById('course_id').value        = item.id;
            calculateTotals();
        } else {
            document.getElementById('courseTypeInput').value  = '';
            document.getElementById('courseHoursInput').value = '';
            document.getElementById('courseHoursInput1').value= '';
            document.getElementById('course_id').value        = '';
        }
    };
    setupSearchableDropdown(nameInput, nameDropdown, window.masterCourses, 'name', 'id', autoFill);
    setupSearchableDropdown(codeInput, codeDropdown, window.masterCourses, 'code', 'id', autoFill);
}

function setupLocationDropdown() {
    const input    = document.getElementById('locationNameInput');
    const dropdown = document.getElementById('locationDropdown');
    setupSearchableDropdown(input, dropdown, window.masterLocations, 'name', 'id', (item) => {
        document.getElementById('location_id').value = (item && item.id) ? item.id : '';
    });
}

function setupInstructorDropdown() {
    const input    = document.getElementById('instructorsInput');
    const dropdown = document.getElementById('instructorsDropdown');
    setupSearchableDropdown(input, dropdown, window.masterInstructors, 'name', 'id', (item) => {
        if (item && item.id) {
            document.getElementById('idCardInput').value    = item.id_card || '';
            document.getElementById('instructor_id').value = item.id;
        } else {
            document.getElementById('idCardInput').value    = '';
            document.getElementById('instructor_id').value = '';
        }
    });
}

function setupStaffDropdowns() {
    const staffInputs = [
        { input: 'controller',   id: 'controller_id',  position: 'controller_position'  },
        { input: 'coordinator1', id: 'coordinator1_id', position: 'coordinator_position1'},
        { input: 'coordinator2', id: 'coordinator2_id', position: 'coordinator_position2'},
        { input: 'coordinator3', id: 'coordinator3_id', position: 'coordinator_position3'},
        { input: 'borrowname',   id: 'borrow_staff_id', position: 'borrowname_position3' }
    ];
    staffInputs.forEach(config => {
        const input = document.getElementById(config.input);
        if (!input) return; // ✅ guard
        const dropdown = input.nextElementSibling;
        if (!dropdown) return;  // ✅ guard
        setupSearchableDropdown(input, dropdown, window.masterStaff, 'name', 'id', (item) => {
            if (item && item.id) {
                document.getElementById(config.position).value = item.position || '';
                document.getElementById(config.id).value       = item.id;
            } else {
                document.getElementById(config.position).value = '';
                document.getElementById(config.id).value       = '';
            }
        });
    });
}

function setupPlanDropdown() {
    const input    = document.getElementById('planNameInput');
    const dropdown = document.getElementById('planDropdown');
    if (!input || !dropdown || !window.masterPlans) return;
    setupSearchableDropdown(input, dropdown, window.masterPlans, 'name', 'id', (item) => {
        input.value = item.plan_name || item.name || '';
    });
}

function setupProjectDropdown() {
    const input    = document.getElementById('projectNameInput');
    const dropdown = document.getElementById('projectDropdown');
    if (!input || !dropdown || !window.masterProjects) return;
    setupSearchableDropdown(input, dropdown, window.masterProjects, 'name', 'id', (item) => {
        input.value = item.project_name || item.name || '';
    });
}

// ========================================
// Searchable Dropdown Helper
// ========================================
function setupSearchableDropdown(input, dropdown, data, displayField, idField, onSelect) {
    input.removeAttribute('readonly');

    input.addEventListener('focus', () => renderDropdown(''));
    input.addEventListener('input', function() { renderDropdown(this.value); });
    input.addEventListener('blur',  function() { setTimeout(() => dropdown.style.display = 'none', 200); });
    input.addEventListener('click', function(e) { e.stopPropagation(); });

    function renderDropdown(searchText) {
        dropdown.innerHTML = '';
        if (!data || data.length === 0) {
            dropdown.innerHTML = '<div class="select-option" style="color:#999;padding:10px;">ไม่มีข้อมูล</div>';
            dropdown.style.display = 'block';
            return;
        }
        const filtered = searchText
            ? data.filter(item => item[displayField]?.toLowerCase().includes(searchText.toLowerCase()))
            : data;

        if (filtered.length === 0 && searchText) {
            const div = document.createElement('div');
            div.className = 'select-option';
            div.style.cssText = 'padding:10px 14px;cursor:pointer;color:#007bff;font-style:italic;';
            div.innerHTML = `✏️ ใช้: "<strong>${searchText}</strong>" (พิมพ์เอง)`;
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.value = searchText;
                onSelect(null); // ✅ ส่ง null เพื่อให้รู้ว่าพิมพ์เอง
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(div);
            dropdown.style.display = 'block';
            return;
        }

        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'select-option';
            div.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid #f0f0f0;';
            let displayText = item[displayField] || '';
            if (displayField === 'name' && item.code) displayText += ` (${item.code})`;
            div.textContent = displayText;
            div.addEventListener('mouseenter', () => div.style.backgroundColor = '#ede7f6');
            div.addEventListener('mouseleave', () => div.style.backgroundColor = 'white');
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                input.value = item[displayField];
                onSelect(item);
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(div);
        });
        dropdown.style.display = 'block';
    }
}

// ========================================
// Step Navigation
// ========================================
function setupStepNavigation() {
    document.querySelectorAll('.step-tab').forEach(tab => {
        tab.addEventListener('click', function() { goToStep(parseInt(this.dataset.step)); });
    });
    document.querySelectorAll('.nextBtn').forEach(btn => {
        btn.addEventListener('click', function() { if (validateCurrentStep()) goToStep(currentStep + 1); });
    });
    document.querySelectorAll('.backBtn').forEach(btn => {
        btn.addEventListener('click', function() { goToStep(currentStep - 1); });
    });
}

function goToStep(step) {
    if (step < 0 || step > totalSteps) return;
    document.getElementById(`step-${currentStep + 1}`).classList.remove('active');
    document.querySelectorAll('.step-tab')[currentStep].classList.remove('active');
    currentStep = step;
    document.getElementById(`step-${currentStep + 1}`).classList.add('active');
    document.querySelectorAll('.step-tab')[currentStep].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentStep() {
    if (currentStep === 0) {
        const required = ['batchInput', 'activityNameInput', 'courseNameInput', 'locationNameInput'];
        for (let id of required) {
            const input = document.getElementById(id);
            if (!input.value.trim()) {
                alert('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
                input.focus();
                return false;
            }
        }
    } else if (currentStep === 1) {
        if (!document.getElementById('instructorsInput').value) {
            alert('กรุณาเลือกวิทยากร');
            return false;
        }
    }
    return true;
}

// ========================================
// Calculations
// ========================================
function setupCalculations() {
    ['costSpeakerNameInput','courseHoursInput','food_budget','material',
     'costFoodNameInput','applicant_count','durationDaysInput','snack_mue']
    .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateTotals);
    });
}

function calculateTotals() {
    const speaker  = parseFloat(document.getElementById('costSpeakerNameInput').value) || 0;
    const hours    = parseFloat(document.getElementById('courseHoursInput').value) || 0;
    const food     = parseFloat(document.getElementById('food_budget').value) || 0;
    const material = parseFloat(document.getElementById('material').value) || 0;
    const snack    = parseFloat(document.getElementById('costFoodNameInput').value) || 0;
    const count    = parseInt(document.getElementById('applicant_count').value) || 0;
    const days     = parseInt(document.getElementById('durationDaysInput').value) || 0;
    const snackMue = parseInt(document.getElementById('snack_mue').value) || 0;

    document.getElementById('total_inst').value       = (speaker * hours).toFixed(2);
    document.getElementById('total_food').value       = (food * count * days).toFixed(2);
    document.getElementById('total_material').value   = (material * count).toFixed(2);
    document.getElementById('total_food_snack').value = (snack * count * snackMue).toFixed(2);
    document.getElementById('total_all_budget').value = (
        speaker * hours + food * count * days + material * count + snack * count * snackMue
    ).toFixed(2);
}

// ========================================
// Load Batch Data
// ========================================
async function loadBatchDataForEdit(batchId) {
    try {
        const response = await fetch(`${API_BASE_URL}/training_batches`);
        const result   = await response.json();
        if (result.status === 'success') {
            const batch = result.data.find(b => b.id == batchId);
            if (batch) {
                currentBatchId = batch.id;
                await loadBatchDataByCode(batch.batch_code);
                isEditMode = true;
                document.getElementById('is_edit_mode').value = 'true';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('ไม่สามารถโหลดข้อมูลได้');
    }
}

async function loadBatchDataByCode(batchCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/training_batches/detail/${batchCode}`);
        const result   = await response.json();
        if (result.status === 'success') {
            fillFormWithData(result.data);
            isEditMode     = true;
            currentBatchId = result.data.batch_id;
            if (document.getElementById('batch_id'))
                document.getElementById('batch_id').value = result.data.batch_id;
            if (document.getElementById('is_edit_mode'))
                document.getElementById('is_edit_mode').value = 'true';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('ไม่สามารถโหลดข้อมูลได้');
    }
}

// ========================================
// ✅ fillFormWithData — แก้ปัญหาค่าหาย
//    เฉพาะ field ที่มีค่าจริง (ไม่ใช่ null/undefined) เท่านั้น
//    ถึงจะ overwrite ค่าใน input
// ========================================
function fillFormWithData(data) {
    const fieldMap = {
        // Step 1
        'batchInput':        data.batch_code,
        'systemCodeInput':   data.code_system,
        'requestDocNoInput': data.request_doc_no,
        'trainingDateInput': data.training_dates_text,
        'targetGroupInput':  data.target_group,
        'requestDateInput':  data.request_date,
        'trainingTimeInput': data.training_time,
        'annountment':       data.announce_date,

        // Activity
        'activityNameInput': data.activity_name,
        'kindOfFiscalInput': data.kind_of_fiscal,
        'planNameInput':     data.plan_name,
        'projectNameInput':  data.project_name,
        'ActivityInput':     data.activity,
        'subActivityInput':  data.sub_activity,
        'expensesInput':     data.expenses,
        'fiscalYearInput':   data.kind_of_year,

        // Course
        'courseNameInput':   data.course_name,
        'courseCodeInput':   data.course_code,
        'courseTypeInput':   data.training_type,
        'courseHoursInput':  data.duration,
        'courseHoursInput1': data.duration,

        // Location
        'locationNameInput': data.location_name,

        // Step 2
        'instructorsInput':      data.instructor_name,
        'idCardInput':           data.instructor_id_card,
        'controller':            data.controller_name,
        'controller_position':   data.controller_pos,
        'coordinator1':          data.coord1_name,
        'coordinator_position1': data.coord1_position,
        'coordinator2':          data.coord2_name,
        'coordinator_position2': data.coord2_position,
        'coordinator3':          data.coord3_name,
        'coordinator_position3': data.coord3_position,
        'borrowname':            data.borrow_name,
        'borrowname_position3':  data.coord4_position,

        // Step 3
        'durationDaysInput':    data.duration_days,
        'costSpeakerNameInput': data.budget_speaker,
        'food_budget':          data.budget_food,
        'material':             data.budget_material,
        'costFoodNameInput':    data.budget_snack,
        'snack_mue':            data.number_of_snacks,
        'applicant_count':      data.applicant_count ?? '0',

        // Hidden IDs
        'batch_id':        data.batch_id,
        'activity_id':     data.activity_id,
        'course_id':       data.course_id,
        'location_id':     data.location_id,
        'instructor_id':   data.instructor_id,
        'controller_id':   data.controller_id,
        'coordinator1_id': data.coordinator_1_id,
        'coordinator2_id': data.coordinator_2_id,
        'coordinator3_id': data.coordinator_3_id,
        'borrow_staff_id': data.borrow_staff_id,
    };

    Object.keys(fieldMap).forEach(id => {
        const el  = document.getElementById(id);
        const val = fieldMap[id];
        if (!el) return;

        // ✅ KEY FIX: อัปเดตเฉพาะเมื่อ API ส่งค่ามาจริง (ไม่ใช่ null/undefined)
        // ป้องกันค่าที่กรอกไว้แล้วโดน overwrite ด้วย null
        if (val !== null && val !== undefined && val !== '') {
            el.value = val;
        }
        // ✅ ยกเว้น Hidden ID fields — ควร set เสมอ แม้จะเป็น 0 หรือ ''
        // เพื่อให้ PUT ส่ง ID ที่ถูกต้อง
        const hiddenIds = ['batch_id','activity_id','course_id','location_id',
                           'instructor_id','controller_id','coordinator1_id',
                           'coordinator2_id','coordinator3_id','borrow_staff_id'];
        if (hiddenIds.includes(id)) {
            el.value = val ?? '';
        }
    });

    calculateTotals();

    if (data.applicants_list?.length > 0) displayApplicants(data.applicants_list);
    if (data.passed_list?.length > 0)     displayPassedApplicants(data.passed_list);
}

// ========================================
// ✅ setupBatchInputListener — แก้ปัญหาค่าหายใน Create Mode
//    เดิม: ล้าง batchInput.value = '' ทำให้ค่าหาย
//    ใหม่: แค่ตรวจว่า batch_code ซ้ำไหม ไม่ล้างค่าที่กรอกไปแล้ว
// ========================================
function setupBatchInputListener() {
    const batchInput  = document.getElementById('batchInput');
    let debounceTimer = null;
    let lastChecked   = '';  // ✅ เก็บค่าล่าสุดที่ check แล้ว ไม่ fetch ซ้ำ

    batchInput.addEventListener('input', function() {
        const val = this.value.trim();

        // รีเซ็ต style เมื่อพิมพ์ใหม่
        batchInput.style.backgroundColor = '';
        document.getElementById('status').textContent = '';

        if (!val || val === lastChecked) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            lastChecked = val;
            try {
                const response = await fetch(`${API_BASE_URL}/training_batches/detail/${encodeURIComponent(val)}`);
                const result   = await response.json();

                if (result.status === 'success') {
                    // ✅ รุ่นนี้มีอยู่แล้ว — แจ้งเตือน แต่ "ไม่ล้างค่า" และ "ไม่ auto-fill ทับ"
                    batchInput.style.backgroundColor = '#fff3cd';
                    const statusEl = document.getElementById('status');
                    if (statusEl) {
                        statusEl.innerHTML = `⚠️ รุ่น <strong>${val}</strong> มีอยู่แล้วในระบบ — กรอกรุ่นใหม่หรือ<a href="#" onclick="loadAsReference('${val}'); return false;" style="margin-left:4px;color:#0284c7;">โหลดเป็นต้นแบบ</a>`;
                    }
                } else {
                    // รุ่นใหม่ — OK
                    batchInput.style.backgroundColor = '#f0fdf4';
                    const statusEl = document.getElementById('status');
                    if (statusEl) statusEl.textContent = '✅ รุ่นใหม่';
                }
            } catch (err) {
                console.error('Batch check error:', err);
            }
        }, 500);
    });
}

// ✅ โหลดเป็นต้นแบบ (ใช้ค่าเดิมมาเป็น reference แต่ยังเป็น POST)
async function loadAsReference(batchCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/training_batches/detail/${encodeURIComponent(batchCode)}`);
        const result   = await response.json();
        if (result.status === 'success') {
            const currentBatchVal = document.getElementById('batchInput').value; // จำค่าเดิมไว้

            fillFormWithData(result.data);

            // เป็น POST — ล้าง ID ทั้งหมด
            isEditMode     = false;
            currentBatchId = null;
            document.getElementById('batch_id').value      = '';
            document.getElementById('is_edit_mode').value  = 'false';

            // ✅ คืนค่า batchInput กลับเป็น value เดิมที่ user พิมพ์
            document.getElementById('batchInput').value = currentBatchVal;
            document.getElementById('batchInput').style.backgroundColor = '#fff3cd';

            const statusEl = document.getElementById('status');
            if (statusEl) statusEl.textContent = '📋 โหลดต้นแบบแล้ว — กรอกเลขรุ่นใหม่แล้วกดบันทึก';

            alert('โหลดข้อมูลต้นแบบแล้ว กรุณาเปลี่ยนเลขรุ่นการอบรมก่อนกดบันทึก');
        }
    } catch (error) {
        console.error('Error loading reference:', error);
        alert('ไม่สามารถโหลดข้อมูลต้นแบบได้');
    }
}

function displayApplicants(applicants) {
    const box = document.getElementById('applicantNamesBox');
    if (!box) return;
    box.innerHTML = applicants.map((a, i) =>
        `<div class="applicant-item">${i+1}. ${a.name} (${a.gender})</div>`
    ).join('');
}

function displayPassedApplicants(passed) {
    const box = document.getElementById('nameInput');
    if (!box) return;
    box.innerHTML = passed.map((a, i) =>
        `<div class="applicant-item">${i+1}. ${a.name} (${a.gender}) - ${a.result}</div>`
    ).join('');
}

// ========================================
// Save Button
// ========================================
function setupSaveButton() {
    document.getElementById('saveBtn').addEventListener('click', async function() {
        if (!confirm(isEditMode ? 'ยืนยันการแก้ไขข้อมูล?' : 'ยืนยันการบันทึกข้อมูล?')) return;
        await saveBatch();
    });
}

async function saveBatch() {
    try {
        const formData = {
            batch_code:          document.getElementById('batchInput').value,
            request_doc_no:      document.getElementById('requestDocNoInput').value   || null,
            request_date:        document.getElementById('requestDateInput').value     || null,
            system_code:         document.getElementById('systemCodeInput').value      || null,
            activity_id:         parseInt(document.getElementById('activity_id').value)  || null,
            course_id:           parseInt(document.getElementById('course_id').value)    || null,
            location_id:         parseInt(document.getElementById('location_id').value)  || null,
            instructor_id:       parseInt(document.getElementById('instructor_id').value)|| null,
            start_date:          null,
            end_date:            null,
            training_dates_text: document.getElementById('trainingDateInput').value    || null,
            borrow_date:         null,
            training_time:       document.getElementById('trainingTimeInput').value    || null,
            duration_days:       parseInt(document.getElementById('durationDaysInput').value) || 0,
            target_group:        document.getElementById('targetGroupInput').value     || null,
            budget_speaker:      parseFloat(document.getElementById('costSpeakerNameInput').value) || 0,
            budget_material:     parseFloat(document.getElementById('material').value)           || 0,
            budget_food:         parseFloat(document.getElementById('food_budget').value)         || 0,
            budget_snack:        parseFloat(document.getElementById('costFoodNameInput').value)   || 0,
            controller_id:       parseInt(document.getElementById('controller_id').value)    || null,
            coordinator_1_id:    parseInt(document.getElementById('coordinator1_id').value)  || null,
            coordinator_2_id:    parseInt(document.getElementById('coordinator2_id').value)  || null,
            coordinator_3_id:    parseInt(document.getElementById('coordinator3_id').value)  || null,
            borrow_staff_id:     parseInt(document.getElementById('borrow_staff_id').value)  || null,
            cert_announce_date:  document.getElementById('annountment').value || null,
            number_of_snacks:    parseInt(document.getElementById('snack_mue').value) || 0,
        };

        const url    = isEditMode ? `${API_BASE_URL}/training_batches/${currentBatchId}` : `${API_BASE_URL}/training_batches`;
        const method = isEditMode ? 'PUT' : 'POST';

        console.log(`📤 ${method} → ${url}`, formData); // debug

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert(isEditMode ? '✅ แก้ไขข้อมูลสำเร็จ' : '✅ บันทึกข้อมูลสำเร็จ');
            window.location.href = '../index.html';
        } else {
            alert('❌ เกิดข้อผิดพลาด: ' + (result.message || JSON.stringify(result)));
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('ไม่สามารถบันทึกข้อมูลได้');
    }
}