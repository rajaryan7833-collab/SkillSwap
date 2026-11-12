import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");


// FIREBASE ERROR MESSAGES
function getErrorMessage(error) {

    const errorMessages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must contain at least 6 characters.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/network-request-failed": "Network error. Please check your internet."
    };

    return errorMessages[error.code] || error.message;
}


// REGISTER NEW ACCOUNT
if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        const registerButton = registerForm.querySelector('button[type="submit"]');

        if (!name) {
            alert("Please enter your name.");
            return;
        }

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = "Creating Account...";

        try {

            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(result.user, {
                displayName: name
            });

            alert("Account created successfully!");

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error("Registration error:", error);

            alert("Registration failed: " + getErrorMessage(error));

        } finally {

            registerButton.disabled = false;
            registerButton.textContent = "Create Account";

        }

    });

}


// LOGIN EXISTING ACCOUNT
if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const loginButton = loginForm.querySelector('button[type="submit"]');

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            alert("Login successful!");

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error("Login error:", error);

            alert("Login failed: " + getErrorMessage(error));

        } finally {

            loginButton.disabled = false;
            loginButton.textContent = "Login";

        }

    });

}