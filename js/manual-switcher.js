document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.manual-nav .nav-item');
    const contentSections = document.querySelectorAll('.manual-content .doc-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // 1. ดึง ID เป้าหมาย
            const targetId = this.getAttribute('href').replace('#', '');

            // 2. ซ่อนเนื้อหาทั้งหมดก่อน
            contentSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // 3. แสดงเฉพาะ Section ที่เลือก
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
            }

            // 4. ทำไฮไลท์ที่เมนู (ลบของเก่า เพิ่มของใหม่)
            sidebarLinks.forEach(l => l.style.backgroundColor = 'transparent');
            this.style.backgroundColor = '#f3e5f5'; // สีม่วงอ่อน
            this.style.borderRadius = '5px';

            // เลื่อนจอกลับไปข้างบน
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // ตั้งค่าเริ่มต้น: ให้แสดงอันที่มี class active หรืออันแรกสุด
    const defaultSection = document.querySelector('.doc-section.active') || contentSections[0];
    if (defaultSection) {
        defaultSection.style.display = 'block';
    }
});