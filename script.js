/* =====================================
   SKILLSWAP - MAIN JAVASCRIPT
   UI CONTROLS AND NAVIGATION
===================================== */


// 1. HOMEPAGE JOIN BUTTON

function joinNow() {
    window.location.href = "login.html";
}


// 2. LOGIN AND REGISTER SWITCH

function showLogin() {
    const login = document.getElementById("loginForm");
    const register = document.getElementById("registerForm");

    if (login) {
        login.style.display = "block";
    }

    if (register) {
        register.style.display = "none";
    }
}


function showRegister() {
    const login = document.getElementById("loginForm");
    const register = document.getElementById("registerForm");

    if (login) {
        login.style.display = "none";
    }

    if (register) {
        register.style.display = "block";
    }
}


// 3. DASHBOARD MENU

function toggleMenu() {
    const menu = document.getElementById("sideMenu");

    if (menu) {
        menu.classList.toggle("show");
    }
}


// 4. FIREBASE LOGOUT

async function logoutUser() {

    try {

        const { auth } = await import("./firebase.js");

        const { signOut } = await import(
            "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"
        );

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        console.error("Logout error:", error);

        alert("Logout failed: " + error.message);

    }
}


// 5. MAKE FUNCTIONS AVAILABLE TO HTML

window.joinNow = joinNow;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.toggleMenu = toggleMenu;
window.logoutUser = logoutUser;