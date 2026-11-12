import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const teachForm = document.getElementById("teachForm");
const studentNameInput = document.getElementById("studentName");
const addSkillButton = document.getElementById("addSkillButton");

const materialForm = document.getElementById("materialForm");
const materialSkill = document.getElementById("materialSkill");
const shareMaterialButton = document.getElementById("shareMaterialButton");

let currentUser = null;
let currentStudentName = "Student";


// LOAD USER PROFILE
async function loadUserProfile(user) {
    try {
        const profileRef = doc(db, "studentProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
            currentStudentName =
                profileSnap.data().name || user.displayName || "Student";
        } else {
            currentStudentName = user.displayName || "Student";
        }

        if (studentNameInput) {
            studentNameInput.value = currentStudentName;
        }

    } catch (error) {
        console.error("Profile loading error:", error);
    }
}


// LOAD TEACHER'S OWN SKILLS
async function loadTeacherSkills() {
    if (!materialSkill || !currentUser) return;

    materialSkill.innerHTML =
        '<option value="">Loading your skills...</option>';

    try {
        const skillsQuery = query(
            collection(db, "skills"),
            where("uid", "==", currentUser.uid)
        );

        const snapshot = await getDocs(skillsQuery);

        materialSkill.innerHTML =
            '<option value="">Select your skill</option>';

        if (snapshot.empty) {
            materialSkill.innerHTML =
                '<option value="">No skills added yet</option>';

            return;
        }

        snapshot.forEach(function(skillDoc) {
            const data = skillDoc.data();

            if (!data.skill || !data.skill.trim()) return;

            const option = document.createElement("option");

            option.value = skillDoc.id;
            option.textContent = data.skill;

            materialSkill.appendChild(option);
        });

        if (materialSkill.options.length === 1) {
            materialSkill.innerHTML =
                '<option value="">No valid skills found</option>';
        }

    } catch (error) {
        console.error("Skill dropdown error:", error);

        materialSkill.innerHTML =
            '<option value="">Unable to load skills</option>';

        alert("Unable to load your skills: " + error.message);
    }
}


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
        const description =
            document.getElementById("skillDescription").value.trim();
        const level = document.getElementById("skillLevel").value;

        if (!name || !skill || !description || !level) {
            alert("Please fill all required fields.");
            return;
        }

        if (name.length > 80 || skill.length > 80 ||
            description.length > 500) {
            alert("Please check the maximum allowed text length.");
            return;
        }

        addSkillButton.disabled = true;
        addSkillButton.textContent = "Saving Skill...";

        try {
            const skillData = {
                uid: currentUser.uid,
                name: name,
                skill: skill,
                description: description,
                level: level,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "skills"), skillData);

            alert("Your skill has been added successfully!");

            teachForm.reset();
            studentNameInput.value = currentStudentName;

            await loadTeacherSkills();

        } catch (error) {
            console.error("Skill save error:", error);
            alert("Skill save failed: " + error.message);

        } finally {
            addSkillButton.disabled = false;
            addSkillButton.textContent = "Add My Skill";
        }
    });
}


// SHARE STUDY MATERIAL
if (materialForm) {
    materialForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (!currentUser) {
            alert("Please wait. Your account is loading.");
            return;
        }

        const skillId = materialSkill.value;
        const title =
            document.getElementById("materialTitle").value.trim();
        const resourceType =
            document.getElementById("materialType").value;
        const resourceUrl =
            document.getElementById("resourceUrl").value.trim();
        const description =
            document.getElementById("materialDescription").value.trim();

        if (!skillId || !title || !resourceType ||
            !resourceUrl || !description) {
            alert("Please fill all material details.");
            return;
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(resourceUrl);
        } catch {
            alert("Please enter a valid resource link.");
            return;
        }

        if (parsedUrl.protocol !== "https:") {
            alert("Please use a secure HTTPS link.");
            return;
        }

        if (title.length > 100 || description.length > 500) {
            alert("Please check the maximum text length.");
            return;
        }

        const selectedOption =
            materialSkill.options[materialSkill.selectedIndex];

        const skillName = selectedOption.textContent;

        shareMaterialButton.disabled = true;
        shareMaterialButton.textContent = "Sharing Material...";

        try {
            const skillRef = doc(db, "skills", skillId);
            const skillSnapshot = await getDoc(skillRef);

            if (!skillSnapshot.exists() ||
                skillSnapshot.data().uid !== currentUser.uid) {
                throw new Error("You can only share material for your own skills.");
            }

            const materialData = {
                skillId: skillId,
                skillName: skillName,
                teacherUid: currentUser.uid,
                teacherName: currentStudentName,
                title: title,
                resourceType: resourceType,
                resourceUrl: resourceUrl,
                description: description,
                createdAt: serverTimestamp()
            };

            await addDoc(
                collection(db, "learningMaterials"),
                materialData
            );

            alert("Study material shared successfully!");

            materialForm.reset();
            await loadTeacherSkills();

        } catch (error) {
            console.error("Material sharing error:", error);

            alert("Unable to share material: " + error.message);

        } finally {
            shareMaterialButton.disabled = false;
            shareMaterialButton.textContent = "Share Material";
        }
    });
}


// CHECK LOGIN
onAuthStateChanged(auth, async function(user) {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadUserProfile(user);
    await loadTeacherSkills();
});