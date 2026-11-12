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


const learnSkills = document.getElementById("learnSkills");
const selectedSkills = document.getElementById("selectedSkills");

let currentUser = null;
let allSkills = [];
let selectedSkillIds = [];


// GET SKILL NAME
function getSkillTitle(data) {
    const title =
        data.skill ||
        data.skillName ||
        data.title ||
        "";

    return typeof title === "string" ? title.trim() : "";
}


// GET TEACHER NAME
function getTeacherName(skill) {
    return (
        skill.name ||
        skill.teacherName ||
        skill.displayName ||
        "Student"
    );
}


// CREATE SKILL CARD
function createSkillCard(skill) {

    const card = document.createElement("div");
    card.className = "card";

    const heading = document.createElement("h3");
    heading.textContent = getSkillTitle(skill);

    const name = document.createElement("p");

    if (skill.uid === currentUser.uid) {
        name.textContent = "You are teaching this skill";

    } else if (skill.uid === "system") {
        name.textContent = "Teacher not assigned yet";

    } else {
        name.textContent = "By: " + getTeacherName(skill);
    }

    const description = document.createElement("p");
    description.textContent =
        skill.description || "No description available.";

    const level = document.createElement("p");
    level.textContent =
        "Level: " + (skill.level || "Not specified");

    card.append(heading, name, description, level);

    return card;
}


// OPEN LEARNING PAGE
function openLearningPage(skillId) {

    window.location.href =
        "skill-details.html?skillId=" +
        encodeURIComponent(skillId);
}


// SHOW AVAILABLE SKILLS
function displayAvailableSkills() {

    learnSkills.innerHTML = "";

    if (allSkills.length === 0) {
        learnSkills.textContent = "No skills available yet.";
        return;
    }

    allSkills.forEach(function(item) {

        const skill = item.data;
        const skillId = item.id;

        const card = createSkillCard(skill);
        const button = document.createElement("button");

        if (skill.uid === currentUser.uid) {

            button.textContent = "Your Skill";
            button.disabled = true;

        } else if (selectedSkillIds.includes(skillId)) {

            button.textContent = "Already Selected";
            button.disabled = true;

        } else {

            button.textContent = "Select to Learn";

            button.addEventListener("click", function() {
                selectSkill(skillId, button);
            });
        }

        card.appendChild(button);
        learnSkills.appendChild(card);

    });
}


// SHOW SELECTED SKILLS
function displaySelectedSkills() {

    selectedSkills.innerHTML = "";

    const mySelectedSkills = allSkills.filter(function(item) {
        return selectedSkillIds.includes(item.id);
    });

    if (mySelectedSkills.length === 0) {

        selectedSkills.textContent =
            "You haven't selected any skills yet.";

        return;
    }

    mySelectedSkills.forEach(function(item) {

        const card = createSkillCard(item.data);

        const openButton = document.createElement("button");
        openButton.textContent = "Open Learning";

        openButton.addEventListener("click", function() {
            openLearningPage(item.id);
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function() {
            removeSkill(item.id, removeButton);
        });

        card.append(openButton, removeButton);
        selectedSkills.appendChild(card);

    });
}


// SELECT A SKILL
async function selectSkill(skillId, button) {

    if (!currentUser) return;

    button.disabled = true;
    button.textContent = "Saving...";

    try {

        const profileRef = doc(
            db,
            "studentProfiles",
            currentUser.uid
        );

        await setDoc(profileRef, {
            selectedSkillIds: arrayUnion(skillId)
        }, {
            merge: true
        });

        if (!selectedSkillIds.includes(skillId)) {
            selectedSkillIds.push(skillId);
        }

        displayAvailableSkills();
        displaySelectedSkills();

    } catch (error) {

        console.error("Skill selection error:", error);

        alert("Unable to select skill: " + error.message);

        button.disabled = false;
        button.textContent = "Select to Learn";
    }
}


// REMOVE SELECTED SKILL
async function removeSkill(skillId, button) {

    if (!currentUser) return;

    button.disabled = true;
    button.textContent = "Removing...";

    try {

        const profileRef = doc(
            db,
            "studentProfiles",
            currentUser.uid
        );

        await setDoc(profileRef, {
            selectedSkillIds: arrayRemove(skillId)
        }, {
            merge: true
        });

        selectedSkillIds = selectedSkillIds.filter(function(id) {
            return id !== skillId;
        });

        displayAvailableSkills();
        displaySelectedSkills();

    } catch (error) {

        console.error("Skill removal error:", error);

        alert("Unable to remove skill: " + error.message);

        button.disabled = false;
        button.textContent = "Remove";
    }
}


// LOAD SKILLS
async function loadSkills() {

    learnSkills.textContent = "Loading available skills...";
    selectedSkills.textContent = "Loading your selected skills...";

    try {

        const profileRef = doc(
            db,
            "studentProfiles",
            currentUser.uid
        );

        const profileSnapshot = await getDoc(profileRef);

        if (profileSnapshot.exists()) {

            const profileData = profileSnapshot.data();

            selectedSkillIds = Array.isArray(
                profileData.selectedSkillIds
            ) ? profileData.selectedSkillIds : [];

        } else {

            selectedSkillIds = [];
        }


        const skillsSnapshot = await getDocs(
            collection(db, "skills")
        );

        allSkills = [];

        skillsSnapshot.forEach(function(skillDocument) {

            const data = skillDocument.data();
            const title = getSkillTitle(data);

            if (!title) {
                console.warn(
                    "Skipped incomplete skill:",
                    skillDocument.id
                );
                return;
            }

            data.skill = title;

            allSkills.push({
                id: skillDocument.id,
                data: data
            });

        });


        displayAvailableSkills();
        displaySelectedSkills();

    } catch (error) {

        console.error("Skills loading error:", error);

        learnSkills.textContent =
            "Unable to load skills: " + error.message;

        selectedSkills.textContent =
            "Unable to load selected skills.";
    }
}


// CHECK LOGIN
onAuthStateChanged(auth, async function(user) {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadSkills();

});