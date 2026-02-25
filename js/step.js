document.addEventListener('DOMContentLoaded', () => {
    const steps    = document.querySelectorAll('.form-step');
    const nextBtns = document.querySelectorAll('.nextBtn');
    const backBtns = document.querySelectorAll('.backBtn');
    const stepTabs = document.querySelectorAll('.step-tab');
    

    let currentStep = 0; // ✅ ต้องเพิ่มบรรทัดนี้เพื่อกำหนดจุดเริ่มต้น
    showStep(currentStep); // ✅ เรียกใช้งานผ่านตัวแปรที่ประกาศไว้

    document.querySelectorAll('[data-menu]').forEach(item => {
        item.addEventListener('click', function() {
            const menu = this.dataset.menu;
            const createBtn = document.getElementById('saveBtn'); // หรือ class ของปุ่มสีเขียว
            const stepHeader = document.querySelector('.step-header');
            const formArea   = document.querySelector('.form-step');

            // เมนูที่ไม่ใช่หน้าหลัก → ซ่อน step และปุ่ม
            const isMainPage = menu === 'main' || !menu; // ปรับตามชื่อเมนูหลักของคุณ

            if (createBtn) createBtn.style.display = isMainPage ? 'block' : 'none';
            if (stepHeader) stepHeader.style.display = isMainPage ? 'flex' : 'none';
        });
    });
    /* ===============================
       STEP TAB ACTIVE
    =============================== */
    function updateStepTabs(index) {
        stepTabs.forEach(tab => tab.classList.remove('active'));
        if (stepTabs[index]) {
            stepTabs[index].classList.add('active');
        }
    }


    function showStep(index) {
    const allSteps = document.querySelectorAll('.form-step');
    const tableArea = document.getElementById('dynamicTableArea'); // ดึงพื้นที่ตารางมาเช็ก

    if (index < 0 || index >= allSteps.length) return;

    // 1. จัดการเรื่อง Class active (เพื่อให้รู้ว่าอยู่ step ไหน)
    allSteps.forEach(step => step.classList.remove('active'));
    allSteps[index].classList.add('active');

    // 2. ควบคุมการแสดงผล (Logic สำคัญ)
    // ถ้า tableArea กำลังแสดงผลอยู่ (display !== 'none') ให้ซ่อน Step นี้ไว้ก่อน
    if (tableArea && tableArea.style.display !== 'none') {
        allSteps[index].style.display = 'none'; 
    } else {
        // ถ้าไม่ได้ดูตารางอยู่ ให้แสดง Step ตามปกติ
        allSteps.forEach(s => s.style.display = 'none');
        allSteps[index].style.display = 'block';
    }

    window.scrollTo(0, 0);
    updateStepTabs(index);

    // ส่วนของข้อมูลเงินยืม
    if (index === 2 && window.batchDetailData) {
        const loanInput = document.getElementById('loanNameInput');
        if (loanInput) {
            loanInput.value = window.batchDetailData.contract_no || "";
        }
    }
}
    /* ===============================
       INIT FIRST STEP
    =============================== */
   
    nextBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // ป้องกันพฤติกรรมดั้งเดิมของปุ่ม
            
            // ตรวจสอบจำนวน Step ที่มีอยู่จริงในขณะนั้น
            const allSteps = document.querySelectorAll('.form-step');
            
            if (currentStep < allSteps.length - 1) {
                currentStep++;
                console.log("Moving to Step Index:", currentStep); // ตรวจสอบใน Console
                showStep(currentStep);
            } else {
                console.warn("Reached the last step.");
            }
        });
    });

    backBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    /* ===============================
       CLICK STEP TAB
    =============================== */
    stepTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const stepIndex = Number(tab.dataset.step);
            if (Number.isInteger(stepIndex)) {
                currentStep = stepIndex;
                showStep(currentStep);
            }
        });
    });
});
