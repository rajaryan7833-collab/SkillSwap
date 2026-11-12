import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const teachForm = document.getElementById("teachForm");
const studentNameInput = document.getElementById("studentName");
const addSkillButton = document.getElementById("addSkillButton");

let currentUser = null;

// CHECK LOGIN AND LOAD PROFILE
onAuthStateChanged(auth, async function(user) {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    try {
        const profileRef = doc(db, "studentProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        let studentName = user.displayName || "Student";

        if (profileSnap.exists()) {
            studentName = profileSnap.data().name || studentName;
        }

        if (studentNameInput) {
            studentNameInput.value = studentName;
        }

    } catch (error) {
        console.error("Profile loading error:", error);
    }

});

// ADD NEW SKILL
if (teachForm) {

    teachForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        if (!currentUser) {
            alert("Please wait. Your account is loading.");
            return;
        }

        const name = studentNameInput.value.trim();

        const skill = document.getElementById("skillName").value.trim();

        const description = document.getElementById("skillDescription").value.trim();

        const level = document.getElementById("skillLevel").value;

        // VALIDATION
        if (!name || !skill || !description || !level) {
            alert("Please fill all required fields.");
            return;
        }

        if (name.length > 80 || skill.length > 80 || description.length > 500) {
            alert("Please check the maximum allowed text length.");
            return;
        }

        if (addSkillButton) {
            addSkillButton.disabled = true;
            addSkillButton.textContent = "Saving Skill...";
        }

        try {

            // Email is intentionally not stored publicly
            const skillData = {
                uid: currentUser.uid,
                name: name,
                skill: skill,
                description: description,
                level: level,
                createdAt: serverTimestamp()
            };

            await addDoc(
                collection(db, "skills"),
                skillData
            );

            alert("Your skill has been added successfully!");

            teachForm.reset();

            if (studentNameInput) {
                studentNameInput.value = name;
            }

        } catch (error) {

            console.error("Skill save error:", error);

            alert("Skill save failed: " + error.message);

        } finally {

            if (addSkillButton) {
                addSkillButton.disabled = false;
                addSkillButton.textContent = "Add My Skill";
            }

        }

    });

}