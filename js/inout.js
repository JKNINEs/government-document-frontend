document.addEventListener('DOMContentLoaded', () => {
    const authBtn = document.getElementById('authBtn');
    if (!authBtn) return;

    // ✅ เช็คจาก localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        authBtn.textContent  = 'ออกจากระบบ';
        authBtn.dataset.state = 'logout';
        authBtn.classList.add('logout');    // ✅ เพิ่ม
        authBtn.classList.remove('login');
    } else {
        authBtn.textContent  = 'เข้าสู่ระบบ';
        authBtn.dataset.state = 'login';
        authBtn.classList.add('login');     // ✅ เพิ่ม
        authBtn.classList.remove('logout'); // ✅ เพิ่ม
    }
    authBtn.classList.add('ready'); 

    authBtn.addEventListener('click', () => {
        if (authBtn.dataset.state === 'logout') {
            logout(authBtn);
        } else {
            window.location.href = 'login.html';
        }
    });
});

async function logout(authBtn) {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error('Logout error:', err);
    }

    localStorage.removeItem('isLoggedIn'); // ✅ ลบ state ออก
    authBtn.textContent   = 'เข้าสู่ระบบ';
    authBtn.dataset.state = 'login';
    window.location.href  = 'login.html';
}