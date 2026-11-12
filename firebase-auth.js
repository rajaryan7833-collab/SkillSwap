import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const googleLoginButton = document.getElementById("googleLoginButton");

function getErrorMessage(error) {
    const errors = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must contain at least 6 characters.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "Account not found. Please register first.",
        "auth/popup-closed-by-user": "Google sign-in was cancelled.",
        "auth/popup-blocked": "Allow popups and try again."
    };

    return errors[error.code] || error.message || "Something went wrong.";
}

async function createStudentProfile(user, name = "") {
    const privateRef = doc(db, "studentProfiles", user.uid);
    const publicRef = doc(db, "publicProfiles", user.uid);

    const privateSnapshot = await getDoc(privateRef);
    const publicSnapshot = await getDoc(publicRef);

    const studentName =
        name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student";

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

// Registration
if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        if (!name || !email || !password) {
            alert("Please fill all fields.");
            return;
        }

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

            alert("Account created successfully!");
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Registration error:", error);
            alert(getErrorMessage(error));
        }
    });
}

// Email login
if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            const result = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            await createStudentProfile(result.user);

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);
            alert(getErrorMessage(error));
        }
    });
}

// Google login
if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async function() {
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);

            await createStudentProfile(result.user);

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Google login error:", error);
            alert(getErrorMessage(error));
        }
    });
}