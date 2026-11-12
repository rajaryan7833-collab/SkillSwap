import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const profileForm = document.getElementById("profileForm");
const profileDisplay = document.getElementById("profileDisplay");
const saveButton = document.getElementById("saveProfileButton");

let currentUser = null;


// GET STUDENT INITIALS
function getInitials(name) {

    if (!name) return "SS";

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join("");
}


// UPDATE HEADER INITIALS
function updateHeader(name) {

    const initials = document.getElementById("headerProfileInitials");

    if (initials) {
        initials.textContent = getInitials(name);
    }
}


// DISPLAY PROFILE DETAILS
function displayProfile(profile) {

    if (!profileDisplay) return;

    profileDisplay.innerHTML = "";

    const details = [
        ["Full Name", profile.name],
        ["College", profile.college],
        ["Course", profile.course],
        ["Study Year", profile.year],
        ["About Me", profile.about],
        ["Skills I Can Teach", profile.teach],
        ["Skills I Want to Learn", profile.learn]
    ];

    details.forEach(function(item) {

        const card = document.createElement("div");
        card.className = "card";

        const heading = document.createElement("h3");
        heading.textContent = item[0];

        const value = document.createElement("p");
        value.textContent = item[1] || "Not added";

        card.append(heading, value);
        profileDisplay.appendChild(card);

    });
}


// LOAD EXISTING PROFILE
async function loadProfile(user) {

    try {

        const profileRef = doc(db, "studentProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {

            const profile = profileSnap.data();

            document.getElementById("profileName").value = profile.name || "";
            document.getElementById("mobileNumber").value = profile.mobile || "";
            document.getElementById("collegeName").value = profile.college || "";
            document.getElementById("courseName").value = profile.course || "";
            document.getElementById("studyYear").value = profile.year || "";
            document.getElementById("aboutMe").value = profile.about || "";
            document.getElementById("teachingSkills").value = profile.teach || "";
            document.getElementById("learningSkills").value = profile.learn || "";

            displayProfile(profile);

            updateHeader(profile.name || user.displayName);

        } else {

            updateHeader(user.displayName);

            profileDisplay.innerHTML =
                "<p>Your profile is not created yet. Fill the form to get started.</p>";

            document.getElementById("profileName").value =
                user.displayName || "";

        }

    } catch (error) {

        console.error("Profile loading error:", error);

        alert("Profile loading failed: " + error.message);

    }

}


// CHECK LOGIN STATUS
onAuthStateChanged(auth, async function(user) {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

    await loadProfile(user);

});


// SAVE PROFILE
if (profileForm) {

    profileForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        if (!currentUser) {

            alert("Please wait. Your account is loading.");
            return;

        }

        const name = document.getElementById("profileName").value.trim();
        const mobile = document.getElementById("mobileNumber").value.trim();

        if (!name) {

            alert("Please enter your full name.");
            return;

        }

        if (mobile && !/^[0-9]{10}$/.test(mobile)) {

            alert("Please enter a valid 10-digit mobile number.");
            return;

        }

        if (saveButton) {

            saveButton.disabled = true;
            saveButton.textContent = "Saving...";

        }

        const profile = {

            uid: currentUser.uid,
            email: currentUser.email || "",
            name: name,
            mobile: mobile,

            college: document.getElementById("collegeName").value.trim(),
            course: document.getElementById("courseName").value.trim(),
            year: document.getElementById("studyYear").value.trim(),
            about: document.getElementById("aboutMe").value.trim(),
            teach: document.getElementById("teachingSkills").value.trim(),
            learn: document.getElementById("learningSkills").value.trim(),

            updatedAt: serverTimestamp()

        };


        // PUBLIC INFORMATION ONLY
        const publicProfile = {

            uid: currentUser.uid,
            name: profile.name,
            college: profile.college,
            course: profile.course,
            year: profile.year,
            about: profile.about,
            teach: profile.teach,
            learn: profile.learn,

            updatedAt: serverTimestamp()

        };


        try {

            await Promise.all([

                setDoc(
                    doc(db, "studentProfiles", currentUser.uid),
                    profile,
                    { merge: true }
                ),

                setDoc(
                    doc(db, "publicProfiles", currentUser.uid),
                    publicProfile,
                    { merge: true }
                )

            ]);

            await updateProfile(currentUser, {
                displayName: name
            });

            displayProfile(profile);

            updateHeader(name);

            alert("Profile saved successfully!");

        } catch (error) {

            console.error("Profile save error:", error);

            alert("Profile save failed: " + error.message);

        } finally {

            if (saveButton) {

                saveButton.disabled = false;
                saveButton.textContent = "Save Profile";

            }

        }

    });

}