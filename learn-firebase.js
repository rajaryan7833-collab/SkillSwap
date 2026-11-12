import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// =====================================
// SKILLSWAP - LEARN SKILLS
// =====================================

const learnContainer = document.getElementById("learnSkills");
const selectedContainer = document.getElementById("selectedSkills");

let currentUser = null;
let selectedSkillIds = [];

// Built-in courses
const starterCourses = [
    {
        id: "starter-c",
        name: "C Programming",
        description: "Learn C programming from basics to problem solving.",
        level: "Beginner",
        icon: "💻"
    },
    {
        id: "starter-cpp",
        name: "C++ Programming",
        description: "Explore C++ concepts and object-oriented programming.",
        level: "Beginner",
        icon: "⚙️"
    },
    {
        id: "starter-java",
        name: "Java Programming",
        description: "Learn Java, classes, objects and programming fundamentals.",
        level: "Beginner",
        icon: "☕"
    },
    {
        id: "starter-python",
        name: "Python",
        description: "Start coding with Python through easy examples.",
        level: "Beginner",
        icon: "🐍"
    },
    {
        id: "starter-web-development",
        name: "Web Development",
        description: "Learn HTML, CSS and JavaScript to build websites.",
        level: "Beginner",
        icon: "🌐"
    }
];

let allSkills = [...starterCourses];

// =====================================
// CREATE SKILL CARD
// =====================================

function createSkillCard(skill, isSelectedPage = false) {

    const card = document.createElement("div");
    card.className = "card";

    card.style.cssText = `
        background:linear-gradient(145deg,#151e32,#202b45);
        border:1px solid rgba(139,92,246,.3);
        border-radius:18px;
        padding:22px;
        margin:10px;
        min-width:220px;
        flex:1;
        color:white;
        box-shadow:0 8px 25px rgba(0,0,0,.18);
    `;

    const heading = document.createElement("h3");
    heading.textContent = (skill.icon || "📘") + " " + skill.name;
    heading.style.marginBottom = "12px";

    const description = document.createElement("p");
    description.textContent = skill.description || "Explore this skill and start learning.";
    description.style.cssText = "color:#cbd5e1;line-height:1.6;min-height:55px;";

    const level = document.createElement("p");
    level.textContent = "Level: " + (skill.level || "Beginner");
    level.style.cssText = "color:#c4b5fd;margin:12px 0;font-size:14px;";

    const startButton = document.createElement("button");
    startButton.textContent = "Start Learning →";

    startButton.style.cssText = `
        width:100%;
        padding:12px;
        margin-top:8px;
        border:0;
        border-radius:10px;
        color:white;
        background:linear-gradient(135deg,#7c3aed,#4f46e5);
        font-weight:600;
        cursor:pointer;
    `;

    startButton.addEventListener("click", function() {
        window.location.href =
            "skill-details.html?skillId=" +
            encodeURIComponent(skill.id);
    });

    card.append(heading, description, level, startButton);

    if (!skill.id.startsWith("starter-")) {

        const selectButton = document.createElement("button");

        const alreadySelected =
            selectedSkillIds.includes(skill.id);

        selectButton.textContent = alreadySelected
            ? "Remove from My Skills"
            : "＋ Select Skill";

        selectButton.style.cssText = `
            width:100%;
            padding:11px;
            margin-top:10px;
            border:1px solid #8b5cf6;
            border-radius:10px;
            color:white;
            background:#27324a;
            cursor:pointer;
        `;

        selectButton.addEventListener("click", async function() {

            selectButton.disabled = true;

            try {
                await toggleSkillSelection(skill.id);
                renderAllSkills();

            } catch (error) {
                console.error(error);
                alert("Unable to update skill. Please try again.");
                selectButton.disabled = false;
            }
        });

        card.appendChild(selectButton);
    }

    return card;
}

// =====================================
// LOAD SELECTED SKILLS
// =====================================

async function loadSelectedSkills() {

    const profileRef = doc(
        db,
        "studentProfiles",
        currentUser.uid
    );

    const profileSnapshot = await getDoc(profileRef);

    if (profileSnapshot.exists()) {
        const profile = profileSnapshot.data();

        selectedSkillIds = Array.isArray(profile.selectedSkillIds)
            ? profile.selectedSkillIds
            : [];
    } else {
        selectedSkillIds = [];
    }
}

// =====================================
// SELECT / REMOVE SKILL
// =====================================

async function toggleSkillSelection(skillId) {

    const profileRef = doc(
        db,
        "studentProfiles",
        currentUser.uid
    );

    const profileSnapshot = await getDoc(profileRef);

    if (selectedSkillIds.includes(skillId)) {

        if (profileSnapshot.exists()) {
            await setDoc(profileRef, {
                selectedSkillIds: arrayRemove(skillId)
            }, { merge: true });
        }

        selectedSkillIds = selectedSkillIds.filter(
            id => id !== skillId
        );

    } else {

        await setDoc(profileRef, {
            selectedSkillIds: arrayUnion(skillId)
        }, { merge: true });

        selectedSkillIds.push(skillId);
    }
}

// =====================================
// LOAD STUDENT-ADDED SKILLS
// =====================================

async function loadStudentSkills() {

    try {
        const snapshot = await getDocs(
            collection(db, "skills")
        );

        snapshot.forEach(function(skillDoc) {

            const data = skillDoc.data();

            const name =
                data.skill ||
                data.skillName ||
                data.skillTitle ||
                data.title ||
                data.name;

            if (!name) return;

            const alreadyExists = allSkills.some(
                skill => skill.id === skillDoc.id
            );

            if (alreadyExists) return;

            allSkills.push({
                id: skillDoc.id,
                name: name,
                description: data.description || "Learn from another student.",
                level: data.level || "Beginner",
                icon: "🎯"
            });
        });

    } catch (error) {
        console.error("Student skills loading error:", error);
        // Built-in courses remain visible even if Firestore fails.
    }
}

// =====================================
// DISPLAY SKILLS
// =====================================

function renderAllSkills() {

    learnContainer.innerHTML = "";
    selectedContainer.innerHTML = "";

    // Available skills
    allSkills.forEach(function(skill) {
        learnContainer.appendChild(
            createSkillCard(skill)
        );
    });

    // Selected skills
    const selectedSkills = allSkills.filter(
        skill => selectedSkillIds.includes(skill.id)
    );

    if (selectedSkills.length === 0) {

        selectedContainer.textContent =
            "You have not selected any student-added skills yet.";

    } else {

        selectedSkills.forEach(function(skill) {
            selectedContainer.appendChild(
                createSkillCard(skill, true)
            );
        });
    }
}

// =====================================
// INITIALIZE PAGE
// =====================================

onAuthStateChanged(auth, async function(user) {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    learnContainer.innerHTML = "Loading skills...";
    selectedContainer.innerHTML = "Loading your skills...";

    try {

        await loadSelectedSkills();
        await loadStudentSkills();

        renderAllSkills();

    } catch (error) {

        console.error("Learn page error:", error);

        // Show built-in courses even if profile loading fails.
        selectedSkillIds = [];
        renderAllSkills();
    }
});