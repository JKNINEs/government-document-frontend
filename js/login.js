const API_BASE_URL = 'http://27.254.144.167/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;

    loginBtn.addEventListener('click', handleLogin);

    document.getElementById('password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});

async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        const result = await res.json();

        if (result.status === 'success') {
            localStorage.setItem('isLoggedIn', 'true');

            if (result.user.role === 'admin') {
                localStorage.setItem('adminUser', JSON.stringify(result.user));
                window.location.href = 'pages/admin/dashboard.html';
            } else {
                window.location.href = 'home.html';
            }
        } else {
            alert('❌ ' + (result.detail || result.message || 'เข้าสู่ระบบไม่สำเร็จ'));
        }
    } catch (err) {
        alert('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
        loginBtn.disabled = false;
    }
}