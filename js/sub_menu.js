const BASE_API = 'http://127.0.0.1:8000/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOM Loaded - SubMenu Script Start");
    
    const formBox = document.querySelector('.content');
    if (!formBox) { console.error("❌ ไม่พบ .content element"); return; }

    let tableArea = document.getElementById('dynamicTableArea');
    if (!tableArea) {
        tableArea = document.createElement('div');
        tableArea.id = 'dynamicTableArea';
        tableArea.style.display = 'none'; 
        formBox.appendChild(tableArea);
    }

    const menuItems = document.querySelectorAll('[data-menu]');
    const urlParams = new URLSearchParams(window.location.search);
    const menuParam = urlParams.get('menu');
    
    if (menuParam) {
        const mainCreateBtn = document.getElementById('mainCreateBtn');
        if (mainCreateBtn) mainCreateBtn.style.display = 'none';
        document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
        const stepHeader = document.querySelector('.step-header');
        if (stepHeader) stepHeader.style.display = 'none';
        tableArea.style.display = 'block';
        
        if (menuParam === 'applicant') fetchApplicantsData(tableArea);
        else if (menuParam === 'staff') fetchStaffData(tableArea);
        else if (menuParam === 'course') fetchCourseData(tableArea);
        else if (menuParam === 'project') fetchProjectData(tableArea);
        else if (menuParam === 'place') fetchLocationsData(tableArea);
        else if (menuParam === 'trainer') fetchInstructorsData(tableArea);
        else if (menuParam === 'load_date') fetchLoanRecordData(tableArea);
    }

    menuItems.forEach(menu => {
        menu.addEventListener('click', () => {
            const type = menu.dataset.menu;
            const mainCreateBtn = document.getElementById('mainCreateBtn');
            if (mainCreateBtn) mainCreateBtn.style.display = 'none';
            document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
            const stepHeader = document.querySelector('.step-header');
            if (stepHeader) stepHeader.style.display = 'none';
            tableArea.style.display = 'none';
            tableArea.innerHTML = '';

            const menuMap = {
                'staff':                          fetchStaffData,
                'course':                         fetchCourseData,
                'project':                        fetchProjectData,
                'place':                          fetchLocationsData,
                'trainer':                        fetchInstructorsData,
                'applicant':                      fetchApplicantsData,
                'load_date':                      fetchLoanRecordData,
                'training-approval-info':         fetchInfoData,
                'eligible-candidates-announcement': fetchCandidatesData,
                'material-requisition-form':      fetchMaterialData,
                'loan-request':                   fetchRequestData,
                'completion-announcement':        fetchCompletionData,
                'speaker-fee-claim':              fetchFeeData,
                'food-fee-claim':                 fetchFoodData,
                'foodsnack-fee-claim':            fetchFoodsnackData,
            };

            if (menuMap[type]) {
                tableArea.style.display = 'block';
                menuMap[type](tableArea);
            } else if (type === 'org') {
                if (mainCreateBtn) mainCreateBtn.style.display = 'block';
                document.querySelector('.form-step.active')?.setAttribute('style', 'display: block');
                if (stepHeader) stepHeader.style.display = 'flex';
            }
        });
    });

    // ── Helper: โหลด datalist รุ่น ─────────────────────────────────
    function loadBatchOptions(batchOptions, statusDiv) {
        if (statusDiv) statusDiv.innerText = "กำลังโหลดข้อมูลรุ่น...";
        fetch(`${BASE_API}/training_batches`)
            .then(res => res.ok ? res.json() : Promise.reject('Network error'))
            .then(response => {
                const data = response.data || response;
                batchOptions.innerHTML = '';
                if (Array.isArray(data)) {
                    data.forEach(batch => {
                        const option = document.createElement('option');
                        option.value = batch.batch_code || batch.name;
                        batchOptions.appendChild(option);
                    });
                    if (statusDiv) statusDiv.innerText = `: พบ ${data.length} รุ่น`;
                }
            })
            .catch(err => {
                console.error("❌ Fetch Error:", err);
                if (statusDiv) statusDiv.innerHTML = '<span style="color:red;">โหลดข้อมูลไม่สำเร็จ</span>';
            });
    }

    // ── Helper: เจนเอกสาร .docx ────────────────────────────────────
    async function generateDoc(endpoint, batchCode, fileName, btn, statusDiv) {
        btn.disabled = true;
        statusDiv.innerHTML = '⏳ กำลังสร้างเอกสาร...';
        try {
            const response = await fetch(`${BASE_API}/${endpoint}/${encodeURIComponent(batchCode)}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.detail || `HTTP ${response.status}`);
            }
            const blob = await response.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            statusDiv.innerHTML = '✅ ดาวน์โหลดเอกสารสำเร็จ!';
        } catch (err) {
            console.error("❌ Error:", err);
            statusDiv.innerHTML = `<span style="color:red;">❌ ${err.message}</span>`;
        } finally {
            btn.disabled = false;
        }
    }

    // ── Helper: setup template ที่มีแค่ datalist (ไม่มีปุ่ม gen) ────
    function setupBatchTemplate(target, templateId) {
        const template = document.getElementById(templateId);
        if (!template) { console.error(`❌ ไม่พบ Template: ${templateId}`); return false; }
        target.innerHTML = '';
        target.appendChild(template.content.cloneNode(true));
        const batchOptions = document.getElementById('batchOptions');
        const statusDiv    = document.getElementById('status');
        loadBatchOptions(batchOptions, statusDiv);
        return true;
    }

    // ── Helper: setup template ที่มีปุ่ม gen เอกสาร ────────────────
    function setupGenTemplate(target, templateId, btnId, endpoint, filePrefix) {
        const template = document.getElementById(templateId);
        if (!template) { console.error(`❌ ไม่พบ Template: ${templateId}`); return; }
        target.innerHTML = '';
        target.appendChild(template.content.cloneNode(true));

        const batchInput   = document.getElementById('batchInput');
        const batchOptions = document.getElementById('batchOptions');
        const statusDiv    = document.getElementById('status');
        const btn          = document.getElementById(btnId);

        loadBatchOptions(batchOptions, statusDiv);

        btn.addEventListener('click', async () => {
            const batchCode = batchInput.value.trim();
            if (!batchCode) { alert('❌ กรุณาเลือกหรือกรอกเลขรุ่นก่อน'); return; }
            await generateDoc(endpoint, batchCode, `${filePrefix} ${batchCode}.docx`, btn, statusDiv);
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // ฟังก์ชันตาราง Master Data
    // ─────────────────────────────────────────────────────────────────

    function fetchCourseData(target) {
        target.innerHTML = '<div style="padding:40px;text-align:center;">กำลังโหลดข้อมูลหลักสูตร...</div>';
        fetch(`${BASE_API}/master_courses`)
            .then(res => { if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); return res.json(); })
            .then(response => {
                const data = response.data || response;
                const template = document.getElementById('courseTableTemplate');
                if (!template) return;
                const clone = template.content.cloneNode(true);
                const tbody = clone.querySelector('#courseTableBody');
                tbody.innerHTML = '';
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">ไม่พบข้อมูลหลักสูตร</td></tr>';
                } else {
                    data.forEach(c => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${c.code||'-'}</td><td>${c.name||'-'}</td>
                            <td style="text-align:center;">${c.hours||'0'}</td>
                            <td>${c.course_type||'-'}</td><td>${c.sub_type||'-'}</td>
                            <td style="text-align:center;">
                                <div style="display:flex;gap:5px;justify-content:center;">
                                    <button class="btn-edit" onclick="editCourse('${c.id}')">แก้ไข</button>
                                    <button class="btn-delete" onclick="deleteCourse('${c.id}')">ลบ</button>
                                </div>
                            </td>`;
                        tbody.appendChild(tr);
                    });
                }
                target.innerHTML = ''; target.appendChild(clone);
            })
            .catch(err => { target.innerHTML = `<div style="text-align:center;color:red;padding:40px;"><h3>⚠️ เกิดข้อผิดพลาด</h3><p>${err.message}</p></div>`; });
    }

    function fetchStaffData(target) {
    target.innerHTML = '<div style="padding:40px;text-align:center;">กำลังโหลดข้อมูลเจ้าหน้าที่...</div>';
    fetch(`${BASE_API}/staff`)
        .then(res => res.json())  // ✅ ลบ res.ok check ออก เอา json มาตรงๆ
        .then(response => {
            const data = response.data || response;
            const template = document.getElementById('staffTableTemplate');
            if (!template) return;
            const clone = template.content.cloneNode(true);
            const tbody = clone.querySelector('#staffTableBody');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">ไม่พบข้อมูลเจ้าหน้าที่</td></tr>';
            } else {
                data.forEach(s => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${s.name||s.full_name||'-'}</td><td>${s.position||'-'}</td>
                        <td>${s.work_group||s.department||'-'}</td><td>${s.tel||s.phone||'-'}</td>
                        <td style="text-align:center;">
                            <div style="display:flex;gap:5px;justify-content:center;">
                                <button class="btn-edit" onclick="editStaff('${s.id}')">แก้ไข</button>
                                <button class="btn-delete" onclick="deleteStaff('${s.id}')">ลบ</button>
                            </div>
                        </td>`;
                    tbody.appendChild(tr);
                });
            }
            target.innerHTML = ''; target.appendChild(clone);
        })
        .catch(err => {
            target.innerHTML = `<div style="color:red;padding:40px;">❌ ${err.message}</div>`;
        });
}

    function fetchProjectData(target) {
        target.innerHTML = '<div style="padding:40px;text-align:center;">กำลังโหลดข้อมูลโครงการ...</div>';
        fetch(`${BASE_API}/project_activities`)
            .then(res => { if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); return res.json(); })
            .then(response => {
                const data = response.data || response;
                const template = document.getElementById('projectTableTemplate');
                if (!template) return;
                const clone = template.content.cloneNode(true);
                const tbody = clone.querySelector('#projectTableBody');
                tbody.innerHTML = '';
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">ไม่พบข้อมูลโครงการ</td></tr>';
                } else {
                    data.forEach(p => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${p.activity_name||'-'}</td><td>${p.fiscal_year||'-'}</td>
                            <td>${p.kind_of_fiscal||'-'}</td><td>${p.expenses||'-'}</td>
                            <td>${p.activity||'-'}</td><td>${p.sub_activity_name||'-'}</td>
                            <td>${p.project_name||'-'}</td><td>${p.plan_name||'-'}</td>
                            <td>${p.target_goal||'-'}</td>
                            <td style="text-align:center;">
                                <div style="display:flex;gap:5px;justify-content:center;">
                                    <button class="btn-edit" onclick="editProject('${p.id}')">แก้ไข</button>
                                    <button class="btn-delete" onclick="deleteProject('${p.id}')">ลบ</button>
                                </div>
                            </td>`;
                        tbody.appendChild(tr);
                    });
                }
                target.innerHTML = ''; target.appendChild(clone);
            })
            .catch(err => { target.innerHTML = `<div style="text-align:center;color:red;padding:40px;"><h3>⚠️ เกิดข้อผิดพลาด</h3><p>${err.message}</p></div>`; });
    }

    function fetchInstructorsData(target) {
        target.innerHTML = '<div style="padding:40px;text-align:center;">กำลังโหลดข้อมูลวิทยากร...</div>';
        fetch(`${BASE_API}/instructors`)
            .then(res => { if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); return res.json(); })
            .then(response => {
                const data = response.data || response;
                const template = document.getElementById('instructorsTableTemplate');
                if (!template) return;
                const clone = template.content.cloneNode(true);
                const tbody = clone.querySelector('#instructorsTableBody');
                tbody.innerHTML = '';
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">ไม่พบข้อมูลวิทยากร</td></tr>';
                } else {
                    data.forEach(i => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${i.name||'-'}</td><td>${i.id_card||'-'}</td>
                            <td>${i.skill_field||'-'}</td><td>${i.tel||'-'}</td>
                            <td style="text-align:center;">
                                <div style="display:flex;gap:5px;justify-content:center;">
                                    <button class="btn-edit" onclick="editInstructor('${i.id}')">แก้ไข</button>
                                    <button class="btn-delete" onclick="deleteInstructor('${i.id}')">ลบ</button>
                                </div>
                            </td>`;
                        tbody.appendChild(tr);
                    });
                }
                target.innerHTML = ''; target.appendChild(clone);
            })
            .catch(err => { target.innerHTML = `<div style="text-align:center;color:red;padding:40px;"><h3>⚠️ เกิดข้อผิดพลาด</h3><p>${err.message}</p></div>`; });
    }

    function fetchLocationsData(target) {
        target.innerHTML = '<div style="padding:40px;text-align:center;">กำลังโหลดข้อมูลสถานที่...</div>';
        fetch(`${BASE_API}/locations`)
            .then(res => { if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); return res.json(); })
            .then(response => {
                const data = response.data || response;
                const template = document.getElementById('locationsTableTemplate');
                if (!template) return;
                const clone = template.content.cloneNode(true);
                const tbody = clone.querySelector('#locationsTableBody');
                tbody.innerHTML = '';
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:20px;">ไม่พบข้อมูลสถานที่</td></tr>';
                } else {
                    data.forEach(l => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${l.name||'-'}</td>
                            <td style="text-align:center;">
                                <div style="display:flex;gap:5px;justify-content:center;">
                                    <button class="btn-edit" onclick="editLocation('${l.id}')">แก้ไข</button>
                                    <button class="btn-delete" onclick="deleteLocation('${l.id}')">ลบ</button>
                                </div>
                            </td>`;
                        tbody.appendChild(tr);
                    });
                }
                target.innerHTML = ''; target.appendChild(clone);
            })
            .catch(err => { target.innerHTML = `<div style="text-align:center;color:red;padding:40px;"><h3>⚠️ เกิดข้อผิดพลาด</h3><p>${err.message}</p></div>`; });
    }

    function fetchApplicantsData(target) {
        target.innerHTML = '<div style="padding:40px;text-align:center;">กำลังโหลดข้อมูลผู้สมัคร...</div>';
        fetch(`${BASE_API}/applicants`)
            .then(res => { if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); return res.json(); })
            .then(response => {
                const data = response.data || response;
                const template = document.getElementById('applicantsTableTemplate');
                if (!template) return;
                const clone = template.content.cloneNode(true);
                const tbody = clone.querySelector('#applicantsTableBody');
                tbody.innerHTML = '';
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">ไม่พบข้อมูลผู้สมัคร</td></tr>';
                } else {
                    data.forEach(a => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${a.batch_code||'-'}</td><td>${a.name||'-'}</td>
                            <td>${a.gender||'-'}</td><td>${a.result||'รอผล'}</td>
                            <td style="text-align:center;">
                                <div style="display:flex;gap:5px;justify-content:center;">
                                    <button class="btn-edit" onclick="editApplicant('${a.id}')">แก้ไข</button>
                                    <button class="btn-delete" onclick="deleteApplicant('${a.id}')">ลบ</button>
                                </div>
                            </td>`;
                        tbody.appendChild(tr);
                    });
                }
                target.innerHTML = ''; target.appendChild(clone);
            })
            .catch(err => { target.innerHTML = `<div style="text-align:center;color:red;padding:40px;"><h3>⚠️ เกิดข้อผิดพลาด</h3><p>${err.message}</p></div>`; });
    }

    function fetchLoanRecordData(target) {
        target.innerHTML = '<div style="padding:40px;text-align:center;">กำลังโหลดรายการยืมเงิน...</div>';
        fetch(`${BASE_API}/loans`)
            .then(res => { if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); return res.json(); })
            .then(response => {
                const data = response.data || response;
                const template = document.getElementById('loadrecordTableTemplate');
                if (!template) return;
                const clone = template.content.cloneNode(true);
                const tbody = clone.querySelector('#loadrecordTableBody');
                tbody.innerHTML = '';
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">ไม่พบรายการยืมเงิน</td></tr>';
                } else {
                    data.forEach(l => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${l.batch_code||'-'}</td><td>${l.contract_no||'-'}</td>
                            <td>${l.loan_head_count||'-'}</td><td>${l.loan_date||'-'}</td>
                            <td>${l.clearance_date||'-'}</td><td>${l.clearance_head_day1||'-'}</td>
                            <td>${l.clearance_head_day2||'-'}</td>
                            <td style="text-align:center;">
                                <div style="display:flex;gap:5px;justify-content:center;">
                                    <button class="btn-edit" onclick="editLoad('${l.id}')">แก้ไข</button>
                                    <button class="btn-delete" onclick="deleteLoad('${l.id}')">ลบ</button>
                                </div>
                            </td>`;
                        tbody.appendChild(tr);
                    });
                }
                target.innerHTML = ''; target.appendChild(clone);
            })
            .catch(err => { target.innerHTML = `<div style="text-align:center;color:red;padding:40px;"><h3>⚠️ เกิดข้อผิดพลาด</h3><p>${err.message}</p></div>`; });
    }

    // ─────────────────────────────────────────────────────────────────
    // ฟังก์ชันเอกสาร (ใช้ Helper ทั้งหมด)
    // ─────────────────────────────────────────────────────────────────
    function fetchInfoData(target) {
        setupGenTemplate(target, 'approvalTemplate', 'saveBtn', 'generate-doc', 'เอกสารอนุมัติฝึก');
    }
    function fetchCandidatesData(target) {
        setupGenTemplate(target, 'candidatesTemplate', 'apcBtn', 'generate-schedule', 'รายชื่อผู้มีสิทธิ์เข้าอบรม');
    }
    function fetchMaterialData(target) {
        setupGenTemplate(target, 'materialTemplate', 'mtrBtn', 'Material', 'เบิกวัสดุ');
    }
    function fetchRequestData(target){
        setupGenTemplate(target, 'requestTemplate', 'saveBtn', 'summary', 'หักล้างเงินยืม');
    }
    function fetchCompletionData(target) {
        setupGenTemplate(target, 'completionTemplate', 'cptBtn', 'complete', 'ประกาศจบ');
    }

    function fetchFeeData(target) {
        setupGenTemplate(target, 'feeTemplate', 'saveBtn', 'generate-inst', 'เบิกค่าวิทยากร');
    }
    function fetchFoodData(target) {
        setupGenTemplate(target, 'FoodTemplate', 'foodBtn', 'generate-food', 'เบิกค่าอาหาร');
    }
    function fetchFoodsnackData(target) {
        setupGenTemplate(target, 'FoodsnackTemplate', 'foodBtn', 'generate-food-snack', 'เบิกค่าอาหารว่าง');
    }
});

// ─────────────────────────────────────────────────────────────────
// Global functions
// ─────────────────────────────────────────────────────────────────
function editCourse(id)       { window.location.href = 'pages/course_form.html'; }
function openCourseModal()    { window.location.href = 'pages/course_form.html'; }
function deleteCourse(id) {
    if (!confirm("คุณต้องการลบกิจกรรมนี้ใช่หรือไม่?")) return;
    fetch(`${BASE_API}/master_courses/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(response => {
            if (response.status === 'success') {
                alert('✅ ลบข้อมูลสำเร็จ');
                const tableArea = document.getElementById('dynamicTableArea');
                if (tableArea) fetchCourseData(tableArea);
            } else { alert('❌ เกิดข้อผิดพลาด: ' + response.message); }
        })
        .catch(() => alert('เกิดข้อผิดพลาดในการลบข้อมูล'));
}

function editStaff(id)        { window.location.href = 'pages/staff_form.html'; }
function deleteStaff(id)      { window.location.href = 'pages/staff_form.html'; }
function openStaffModal()     { window.location.href = 'pages/staff_form.html'; }

function editProject(id)      { window.location.href = `pages/project_form.html?tab=activities&id=${id}&mode=edit`; }
function deleteProject(id)    { window.location.href = 'pages/project_form.html'; }
function openProjectModal()   { window.location.href = 'pages/project_form.html?mode=create'; }

function editInstructor(id)   { window.location.href = 'pages/instructor_form.html'; }
function deleteInstructor(id) { window.location.href = 'pages/instructor_form.html'; }
function openInstructorModal(){ window.location.href = 'pages/instructor_form.html'; }

function editLocation(id)     { window.location.href = 'pages/location_form.html'; }
function deleteLocation(id)   { window.location.href = 'pages/location_form.html'; }
function openLocationModal()  { window.location.href = 'pages/location_form.html'; }

function editApplicant(id)    { window.location.href = `pages/applicant_form.html?id=${id}&mode=edit`; }
function openApplicantModal() { window.location.href = 'pages/applicant_form.html?mode=create'; }
function openBulkEditApplicantModal() { window.location.href = 'pages/applicant_form.html?mode=bulk-edit'; }
async function deleteApplicant(id) {
    if (!confirm('ต้องการลบรายชื่อนี้ใช่หรือไม่?')) return;
    try {
        const res    = await fetch(`${BASE_API}/applicants/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.status === 'success') alert('✅ ลบข้อมูลเรียบร้อย');
        else alert('❌ เกิดข้อผิดพลาด: ' + result.message);
    } catch { alert('เกิดข้อผิดพลาดในการลบ'); }
}

function editLoad(id)         { window.location.href = 'pages/loan_form.html'; }
function deleteLoad(id)       { window.location.href = 'pages/loan_form.html'; }
function openLoanModal()      { window.location.href = 'pages/loan_form.html'; }