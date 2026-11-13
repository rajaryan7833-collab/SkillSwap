import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const studentList = document.getElementById("studentList");
const studentSearch = document.getElementById("studentSearch");
const requestsBox = document.getElementById("connectionRequests");

let currentUser = null;
let allStudents = [];

// SINGLE COLUMN LAYOUT
function applySingleColumnLayout(container) {
    if (!container) return;

    container.style.display = "grid";
    container.style.gridTemplateColumns = "minmax(0, 1fr)";
    container.style.width = "100%";
    container.style.gap = "20px";
    container.style.alignItems = "stretch";
}

applySingleColumnLayout(studentList);
applySingleColumnLayout(requestsBox);

// CHECK LOGIN
onAuthStateChanged(auth, async function(user) {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadStudents();
    await loadRequests();
});

// LOAD STUDENTS
async function loadStudents() {
    studentList.textContent = "Loading students...";

    try {
        const [profileSnapshot, skillsSnapshot] = await Promise.all([
            getDocs(collection(db, "publicProfiles")),
            getDocs(collection(db, "skills"))
        ]);

        allStudents = [];

        profileSnapshot.forEach(function(item) {
            const profile = item.data();

            if (profile.uid === currentUser.uid) return;

            const studentSkills = [];

            skillsSnapshot.forEach(function(skillDoc) {
                const skill = skillDoc.data();

                if (skill.uid === profile.uid && skill.skill) {
                    studentSkills.push(skill.skill);
                }
            });

            allStudents.push({
                uid: profile.uid,
                name: profile.name || "Student",
                college: profile.college || "Not provided",
                course: profile.course || "Not provided",
                year: profile.year || "Not provided",
                about: profile.about || "No introduction available.",
                teach: profile.teach || "",
                learn: profile.learn || "",
                skills: studentSkills
            });
        });

        displayStudents(allStudents);

    } catch (error) {
        console.error("Student loading error:", error);
        studentList.textContent =
            "Unable to load students: " + error.message;
    }
}

// DISPLAY STUDENTS
function displayStudents(students) {
    studentList.innerHTML = "";
    applySingleColumnLayout(studentList);

    if (students.length === 0) {
        studentList.textContent = "No matching students found.";
        return;
    }

    students.forEach(function(student) {
        const card = document.createElement("div");

        card.className = "card";
        card.style.width = "100%";
        card.style.maxWidth = "100%";
        card.style.boxSizing = "border-box";
        card.style.margin = "0";

        const heading = document.createElement("h3");
        heading.textContent = "👤 " + student.name;

        const college = document.createElement("p");
        college.textContent = "College: " + student.college;

        const course = document.createElement("p");
        course.textContent = "Course: " + student.course;

        const year = document.createElement("p");
        year.textContent = "Study Year: " + student.year;

        const about = document.createElement("p");
        about.textContent = "About: " + student.about;

        const teach = document.createElement("p");
        teach.textContent =
            "Can Teach: " +
            (student.skills.join(", ") ||
            formatValue(student.teach) ||
            "Not provided");

        const learn = document.createElement("p");
        learn.textContent =
            "Wants to Learn: " +
            (formatValue(student.learn) || "Not provided");

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Connect";

        button.addEventListener("click", function() {
            sendRequest(student, button);
        });

        card.append(
            heading,
            college,
            course,
            year,
            about,
            teach,
            learn,
            button
        );

        studentList.appendChild(card);
    });
}

// HANDLE TEXT OR ARRAY VALUES
function formatValue(value) {
    if (Array.isArray(value)) {
        return value.join(", ");
    }

    return String(value || "").trim();
}

// SEARCH STUDENTS
if (studentSearch) {
    studentSearch.addEventListener("input", function() {
        const search = studentSearch.value.trim().toLowerCase();

        const filtered = allStudents.filter(function(student) {
            return (
                student.name.toLowerCase().includes(search) ||
                student.college.toLowerCase().includes(search) ||
                student.course.toLowerCase().includes(search) ||
                student.skills.join(" ").toLowerCase().includes(search) ||
                formatValue(student.teach).toLowerCase().includes(search) ||
                formatValue(student.learn).toLowerCase().includes(search)
            );
        });

        displayStudents(filtered);
    });
}

// SEND CONNECTION REQUEST
async function sendRequest(student, button) {
    button.disabled = true;
    button.textContent = "Checking...";

    try {
        const requestsRef = collection(db, "connectionRequests");

        const sentQuery = query(
            requestsRef,
            where("senderUid", "==", currentUser.uid),
            where("recipientUid", "==", student.uid)
        );

        const receivedQuery = query(
            requestsRef,
            where("senderUid", "==", student.uid),
            where("recipientUid", "==", currentUser.uid)
        );

        const [sent, received] = await Promise.all([
            getDocs(sentQuery),
            getDocs(receivedQuery)
        ]);

        if (!sent.empty || !received.empty) {
            alert("A connection request already exists between you.");
            button.textContent = "Request Exists";
            await loadRequests();
            return;
        }

        await addDoc(requestsRef, {
            senderUid: currentUser.uid,
            senderName:
                currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "Student",
            recipientUid: student.uid,
            recipientName: student.name,
            skill: student.skills.join(", ") ||
                formatValue(student.teach),
            status: "Pending",
            createdAt: serverTimestamp()
        });

        alert("Connection request sent successfully!");
        button.textContent = "Request Sent";

        await loadRequests();

    } catch (error) {
        console.error("Connection request error:", error);
        alert("Request failed: " + error.message);

        button.disabled = false;
        button.textContent = "Connect";
    }
}

// LOAD CONNECTION REQUESTS
async function loadRequests() {
    requestsBox.textContent = "Loading requests...";
    applySingleColumnLayout(requestsBox);

    try {
        const requestsRef = collection(db, "connectionRequests");

        const sentQuery = query(
            requestsRef,
            where("senderUid", "==", currentUser.uid)
        );

        const receivedQuery = query(
            requestsRef,
            where("recipientUid", "==", currentUser.uid)
        );

        const [sent, received] = await Promise.all([
            getDocs(sentQuery),
            getDocs(receivedQuery)
        ]);

        requestsBox.innerHTML = "";
        applySingleColumnLayout(requestsBox);

        if (sent.empty && received.empty) {
            requestsBox.textContent = "No connection requests yet.";
            return;
        }

        received.forEach(function(item) {
            showRequest(item, "Received");
        });

        sent.forEach(function(item) {
            showRequest(item, "Sent");
        });

    } catch (error) {
        console.error("Request loading error:", error);
        requestsBox.textContent =
            "Request loading failed: " + error.message;
    }
}

// DISPLAY REQUEST CARD
function showRequest(item, type) {
    const request = item.data();

    const card = document.createElement("div");
    card.className = "card";
    card.style.width = "100%";
    card.style.maxWidth = "100%";
    card.style.boxSizing = "border-box";
    card.style.margin = "0";

    const heading = document.createElement("h3");

    heading.textContent = type === "Received"
        ? request.senderName || "Student"
        : request.recipientName || "Student";

    const direction = document.createElement("p");

    direction.textContent = type === "Received"
        ? "Received Connection Request"
        : "Request Sent";

    const skill = document.createElement("p");
    skill.textContent = "Skill: " + (request.skill || "Not specified");

    const status = document.createElement("p");
    status.textContent = "Status: " + (request.status || "Pending");

    card.append(heading, direction, skill, status);

    // ACCEPT REQUEST
    if (type === "Received" && request.status === "Pending") {
        const acceptButton = document.createElement("button");
        acceptButton.type = "button";
        acceptButton.textContent = "Accept Request";

        acceptButton.addEventListener("click", async function() {
            acceptButton.disabled = true;
            acceptButton.textContent = "Accepting...";

            try {
                await updateDoc(
                    doc(db, "connectionRequests", item.id),
                    { status: "Accepted" }
                );

                alert("Connection request accepted!");
                await loadRequests();

            } catch (error) {
                console.error("Accept request error:", error);
                alert("Accept failed: " + error.message);

                acceptButton.disabled = false;
                acceptButton.textContent = "Accept Request";
            }
        });

        card.appendChild(acceptButton);
    }

    // OPEN CHAT AFTER ACCEPTANCE
    if (request.status === "Accepted") {
        const messageButton = document.createElement("button");
        messageButton.type = "button";
        messageButton.textContent = "💬 Message";

        messageButton.addEventListener("click", function() {
            openChat(item.id, request, messageButton);
        });

        card.appendChild(messageButton);
    }

    requestsBox.appendChild(card);
}

// CREATE OR OPEN CHAT
async function openChat(requestId, request, button) {
    button.disabled = true;
    button.textContent = "Opening Chat...";

    try {
        const chatRef = doc(db, "chats", requestId);
        const participants = [
            request.senderUid,
            request.recipientUid
        ];

        const chatSnapshot = await getDoc(chatRef);

        if (!chatSnapshot.exists()) {
            await setDoc(chatRef, {
                connectionRequestId: requestId,
                participants: participants,
                lastMessage: "",
                lastMessageAt: serverTimestamp()
            });
        }

        window.location.href =
            "chat.html?chatId=" + encodeURIComponent(requestId);

    } catch (error) {
        console.error("Chat opening error:", error);
        alert("Unable to open chat: " + error.message);

        button.disabled = false;
        button.textContent = "💬 Message";
    }
}