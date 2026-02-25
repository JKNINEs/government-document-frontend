function toggleSubMenu(element) {
    const group = element.parentElement;
    
    // ตรวจสอบสถานะก่อนเปลี่ยน เพื่อไม่ให้ Browser คำนวณฟรี
    if (group.classList.contains('active')) {
        group.classList.remove('active');
    } else {
        // (Optional) ปิดเมนูอื่นก่อนเปิดอันใหม่ ถ้าแลคให้คอมเมนต์บรรทัดนี้ทิ้ง
        // document.querySelectorAll('.menu-group').forEach(g => g.classList.remove('active'));
        group.classList.add('active');
    }
}