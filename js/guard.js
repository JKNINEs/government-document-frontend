document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        document.body.classList.add("ready");
    } else {
        window.location.replace("login.html");
    }
});