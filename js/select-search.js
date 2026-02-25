const API_BASE_URL = 'http://27.254.144.167/api/v1'

async function initTrainingBatchDropdown() {
    const input = document.getElementById('batchInput');
    const datalist = document.getElementById('batchOptions');
    const status = document.getElementById('status');

    if (!input || !datalist) return;

    try {
        const response = await fetch(`${API_BASE_URL}/training_batches`);
        const result = await response.json();
        
        const batches = result.data; 

        datalist.innerHTML = '';
        batches.forEach(batch => {
            const option = document.createElement('option');
            option.value = batch.batch_code; 
            option.textContent = batch.course_name || ""; 
            datalist.appendChild(option);
        });

        input.addEventListener('input', async () => {
            const val = input.value.trim();
            
            const match = batches.find(b => b.batch_code.toString() === val);
            
            if (match) {
                await autoFillBatchDetail(val); 
            }
        });

    } catch (err) {
        console.error("Error loading batches:", err);
        if (status) status.innerText = "❌ ไม่สามารถโหลดข้อมูลเลขรุ่นได้";
    }
}


document.addEventListener('DOMContentLoaded', () => {
    initTrainingBatchDropdown();

    const confirmButtons = document.querySelectorAll('.confirmBtn');

    const handleDownload = function (e) {
        e.preventDefault();

        const batchInput = document.getElementById('batchInput');
        if (!batchInput || !batchInput.value.trim()) {
            alert("กรุณาเลือกเลขรุ่นก่อนครับ");
            return;
        }

        const batchCode = batchInput.value.trim();

        const btn = e.currentTarget;
        btn.innerText = "⏳ กำลังสร้างไฟล์ ZIP...";
        btn.disabled = true;

        window.location.href = `${API_BASE_URL}/generate-all/${batchCode}`;

        setTimeout(() => {
            btn.innerText = "ยืนยัน";
            btn.disabled = false;
        }, 8000);
    };

    confirmButtons.forEach(btn => {
        if (btn.id === 'saveBtn') return;
        btn.addEventListener('click', handleDownload);
    });
});


async function autoFillBatchDetail(batchCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/training_batches/detail/${batchCode}`);
        const result = await response.json();

        if (result.status === "success") {
            const data = result.data;
            window.batchDetailData = data;
            
            isEditMode = true;
            currentBatchId = data.batch_id;
            console.log("Edit Mode ON, ID:", currentBatchId);

            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            };

            // --- STEP 1: ข้อมูลทั่วไป ---
            document.getElementById('systemCodeInput').value = data.code_system || "";
            document.getElementById('trainingDateInput').value = data.training_dates_text || "";
            document.getElementById('targetGroupInput').value = data.target_group || "";
            document.getElementById('trainingTimeInput').value = data.training_time || "";
            document.getElementById('requestDocNoInput').value = data.request_doc_no || "";
            document.getElementById('requestDateInput').value = data.request_date || "";

            document.getElementById('courseNameInput').value = data.course_name || "";
            document.getElementById('courseCodeInput').value = data.course_code || "";
            document.getElementById('locationNameInput').value = data.location_name || "";
            document.getElementById('courseTypeInput').value = data.training_type || "";
            document.getElementById('courseHoursInput').value = data.duration || "";

            document.getElementById('projectNameInput').value = data.project_name || "";
            document.getElementById('kindOfFiscalInput').value = data.kind_of_fiscal || "";
            document.getElementById('planNameInput').value = data.plan_name || "";
            document.getElementById('ActivityInput').value = data.activity || "";
            document.getElementById('subActivityInput').value = data.sub_activity || "";
            document.getElementById('fiscalYearInput').value = data.kind_of_year || "";
            document.getElementById('expensesInput').value = data.expenses || "";
            document.getElementById('activityNameInput').value = data.activity_name || "";

            document.getElementById('instructorsInput').value = data.instructor_name || "";
            document.getElementById('idCardInput').value = data.instructor_id_card || "";
            document.getElementById('controller').value = data.controller_name || "";
            document.getElementById('controller_position').value = data.controller_pos || "";
            document.getElementById('coordinator1').value = data.coord1_name || "";
            document.getElementById('coordinator_position1').value = data.coord1_position || "";
            document.getElementById('coordinator2').value = data.coord2_name || "";
            document.getElementById('coordinator_position2').value = data.coord2_position || "";
            document.getElementById('coordinator3').value = data.coord3_name || "";
            document.getElementById('coordinator_position3').value = data.coord3_position || "";
            
            document.getElementById('courseHoursInput1').value = data.duration || "";
            document.getElementById('durationDaysInput').value = data.duration_days || "";
            document.getElementById('applicant_count').value = data.applicant_count || "";
            document.getElementById('snack_mue').value = data.number_of_snacks || "";
            document.getElementById('costSpeakerNameInput').value = data.budget_speaker || "";
            document.getElementById('total_inst').value = data.total_inst || "";
            document.getElementById('food_budget').value = data.budget_food || "";
            document.getElementById('costFoodNameInput').value = data.budget_snack || "";
            document.getElementById('costMaterialNameInput').value = data.budget_material || "";
            document.getElementById('head_day1').value = data.head_day1 || "";
            document.getElementById('head_day2').value = data.head_day2 || "";
            
            if (data.calculated) {
                document.getElementById('total_food').value = data.calculated.total_food || "";
                document.getElementById('total_food_snack').value = data.calculated.total_food_snack || "";
                document.getElementById('total_all_budget').value = data.calculated.total_all_budget || "";
                document.getElementById('total_all_material').value = data.calculated.total_material || "";
            }

            updateApplicantUI(data);
            console.log("Auto-fill completed for batch:", batchCode);
        }
    } catch (err) {
        console.error("Error fetching detail:", err);
    }
}

function updateApplicantUI(data) {
    const allBox = document.getElementById('applicantNamesBox');
    if (allBox) {
        allBox.innerHTML = ''; 
        if (data.applicants_list && data.applicants_list.length > 0) {
            data.applicants_list.forEach((person, index) => {
                const div = document.createElement('div');
                div.className = 'applicant-item';
                div.innerHTML = `<span>${index + 1}. ${person.name} (${person.gender})</span>`;
                allBox.appendChild(div);
            });
        } else {
            allBox.innerHTML = '<div class="no-data">ไม่พบรายชื่อผู้สมัคร</div>';
        }
    }

    const passedBox = document.getElementById('nameInput');
    if (passedBox) {
        passedBox.innerHTML = '';
        if (data.passed_list && data.passed_list.length > 0) {
            data.passed_list.forEach((person, index) => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <span>${index + 1}. ${person.name}</span>
                        <span style="color: green; font-weight: bold;">${person.result}</span>
                    </div>`;
                passedBox.appendChild(div);
            });
        } else {
            passedBox.innerHTML = '<div class="no-data">ยังไม่มีรายชื่อผู้ผ่านการอบรม</div>';
        }
    }
}