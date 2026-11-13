import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const googleButton = document.getElementById("googleLoginButton");

function showMessage(message) {
    alert(message);
}

function getErrorMessage(error) {
    console.error("Firebase error:", error);

    const errors = {
        "auth/email-already-in-use": "This email is already registered. Please sign in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must contain at least 6 characters.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "Account not found. Please create an account first.",
        "auth/popup-closed-by-user": "Google sign-in was cancelled.",
        "auth/popup-blocked": "Allow popups in your browser and try again.",
        "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
        "auth/operation-not-allowed": "This login method is not enabled in Firebase."
    };

    return errors[error.code] || error.message || "Something went wrong.";
}

// CREATE STUDENT PROFILE
async function createStudentProfile(user, name = "") {
    const privateRef = doc(db, "studentProfiles", user.uid);
    const publicRef = doc(db, "publicProfiles", user.uid);

    const studentName =
        name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student";

    const privateSnapshot = await getDoc(privateRef);
    const publicSnapshot = await getDoc(publicRef);

    if (!privateSnapshot.exists()) {
        await setDoc(privateRef, {
            uid: user.uid,
            email: user.email || "",
            name: studentName,
            mobile: "",
            college: "",
            course: "",
            year: "",
            about: "",
            teach: [],
            learn: [],
            selectedSkillIds: [],
            updatedAt: serverTimestamp()
        });
    }

    if (!publicSnapshot.exists()) {
        await setDoc(publicRef, {
            uid: user.uid,
            name: studentName,
            college: "",
            course: "",
            year: "",
            about: "",
            teach: [],
            learn: [],
            updatedAt: serverTimestamp()
        });
    }
}

// REGISTER WITH EMAIL
if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        if (!name || !email || !password) {
            showMessage("Please fill all fields.");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must contain at least 6 characters.");
            return;
        }

        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Creating Account...";

        try {
            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(result.user, {
                displayName: name
            });

            await createStudentProfile(result.user, name);

            showMessage("Account created successfully!");
            window.location.href = "dashboard.html";

        } catch (error) {
            showMessage(getErrorMessage(error));
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create Account →";
        }
    });
}

// LOGIN WITH EMAIL
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {
            showMessage("Please enter your email and password.");
            return;
        }

        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Signing In...";

        try {
            const result = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            await createStudentProfile(result.user);

            window.location.href = "dashboard.html";

        } catch (error) {
            showMessage(getErrorMessage(error));
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Login to Account →";
        }
    });
}

// GOOGLE LOGIN
if (googleButton) {
    googleButton.addEventListener("click", async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: "select_account"
        });

        googleButton.disabled = true;
        googleButton.textContent = "Connecting to Google...";

        try {
            const result = await signInWithPopup(auth, provider);

            await createStudentProfile(result.user);

            window.location.href = "dashboard.html";

        } catch (error) {
            showMessage(getErrorMessage(error));
        } finally {
            googleButton.disabled = false;
            googleButton.textContent = "Continue with Google";
        }
    });
}