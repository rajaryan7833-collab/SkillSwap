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


// CREATE SKILL CARD
function createSkillCard(skill, skillId, isSelected) {

    const card = document.createElement("div");
    card.className = "card";

    const heading = document.createElement("h3");
    heading.textContent = skill.skill || "Untitled Skill";

    const name = document.createElement("p");
    name.textContent = "By: " + (skill.name || "Student");

    const description = document.createElement("p");
    description.textContent = skill.description || "No description available.";

    const level = document.createElement("p");
    level.textContent = "Level: " + (skill.level || "Not specified");

    card.append(heading, name, description, level);

    return card;
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

        const card = createSkillCard(skill, skillId, false);

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
        selectedSkills.textContent = "You haven't selected any skills yet.";
        return;
    }

    mySelectedSkills.forEach(function(item) {

        const card = createSkillCard(item.data, item.id, true);

        const removeButton = document.createElement("button");

        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function() {
            removeSkill(item.id, removeButton);
        });

        card.appendChild(removeButton);

        selectedSkills.appendChild(card);

    });

}


// SELECT A SKILL
async function selectSkill(skillId, button) {

    if (!currentUser) return;

    button.disabled = true;
    button.textContent = "Saving...";

    try {

        const profileRef = doc(db, "studentProfiles", currentUser.uid);

        await setDoc(profileRef, {
            selectedSkillIds: arrayUnion(skillId)
        }, {
            merge: true
        });

        selectedSkillIds.push(skillId);

        displayAvailableSkills();
        displaySelectedSkills();

    } catch (error) {

        console.error("Skill selection error:", error);

        alert("Unable to select skill: " + error.message);

        button.disabled = false;
        button.textContent = "Select to Learn";

    }

}


// REMOVE A SELECTED SKILL
async function removeSkill(skillId, button) {

    if (!currentUser) return;

    button.disabled = true;
    button.textContent = "Removing...";

    try {

        const profileRef = doc(db, "studentProfiles", currentUser.uid);

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


// LOAD SKILLS AND STUDENT SELECTIONS
async function loadSkills() {

    learnSkills.textContent = "Loading available skills...";
    selectedSkills.textContent = "Loading your selected skills...";

    try {

        const profileRef = doc(db, "studentProfiles", currentUser.uid);

        const profileSnapshot = await getDoc(profileRef);

        if (profileSnapshot.exists()) {

            selectedSkillIds =
                profileSnapshot.data().selectedSkillIds || [];

        } else {

            selectedSkillIds = [];

        }


        const skillsSnapshot = await getDocs(collection(db, "skills"));

        allSkills = [];

        skillsSnapshot.forEach(function(skillDocument) {

            allSkills.push({
                id: skillDocument.id,
                data: skillDocument.data()
            });

        });

        displayAvailableSkills();
        displaySelectedSkills();

    } catch (error) {

        console.error("Skills loading error:", error);

        learnSkills.textContent = "Unable to load skills: " + error.message;

        selectedSkills.textContent = "Unable to load selected skills.";

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