import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const messagesBox = document.getElementById("messagesBox");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const chatStudentName = document.getElementById("chatStudentName");

const sendButton = messageForm
    ? messageForm.querySelector('button[type="submit"]')
    : null;

const chatId = new URLSearchParams(location.search).get("chatId");

let currentUser = null;
let otherStudentUid = null;
let otherStudentName = "Student";
let stopMessagesListener = null;

function showError(message) {
    if (messagesBox) messagesBox.textContent = message;
    if (messageForm) messageForm.style.display = "none";
}

function formatTime(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") {
        return "Just now";
    }

    return timestamp.toDate().toLocaleString([], {
        dateStyle: "short",
        timeStyle: "short"
    });
}

onAuthStateChanged(auth, async function(user) {
    if (!user) {
        location.href = "login.html";
        return;
    }

    currentUser = user;

    if (!chatId) {
        showError("Chat ID missing. Open chat from Students page.");
        return;
    }

    try {
        const requestRef = doc(db, "connectionRequests", chatId);
        const requestSnapshot = await getDoc(requestRef);

        if (!requestSnapshot.exists()) {
            showError("Connection request not found.");
            return;
        }

        const request = requestSnapshot.data();

        if (
            request.status !== "Accepted" ||
            ![request.senderUid, request.recipientUid].includes(user.uid)
        ) {
            showError("Connection is not accepted or access is denied.");
            return;
        }

        otherStudentUid =
            user.uid === request.senderUid
                ? request.recipientUid
                : request.senderUid;

        otherStudentName =
            user.uid === request.senderUid
                ? request.recipientName || "Student"
                : request.senderName || "Student";

        const chatRef = doc(db, "chats", chatId);
        let chatSnapshot = await getDoc(chatRef);

        if (!chatSnapshot.exists()) {
            await setDoc(chatRef, {
                connectionRequestId: chatId,
                participants: [
                    request.senderUid,
                    request.recipientUid
                ],
                lastMessage: "",
                lastMessageAt: serverTimestamp()
            });

            chatSnapshot = await getDoc(chatRef);
        }

        if (!chatSnapshot.exists()) {
            showError("Chat could not be created. Please try again.");
            return;
        }

        const chat = chatSnapshot.data();

        if (
            !Array.isArray(chat.participants) ||
            !chat.participants.includes(user.uid) ||
            !chat.participants.includes(otherStudentUid)
        ) {
            showError("Chat participants do not match this connection.");
            return;
        }

        if (chatStudentName) {
            chatStudentName.textContent = "Chat with " + otherStudentName;
        }

        if (messageForm) messageForm.style.display = "";

        loadMessages();

    } catch (error) {
        console.error("Chat loading error:", error);
        showError("Chat access failed: " + error.message);
    }
});

function loadMessages() {
    const messagesRef = collection(db, "chats", chatId, "messages");

    const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc")
    );

    stopMessagesListener = onSnapshot(
        messagesQuery,
        function(snapshot) {
            messagesBox.innerHTML = "";

            if (snapshot.empty) {
                messagesBox.textContent = "No messages yet. Say hello!";
                return;
            }

            snapshot.forEach(function(item) {
                const message = item.data();

                const card = document.createElement("div");
                card.className =
                    message.senderUid === currentUser.uid
                        ? "my-message"
                        : "other-message";

                const sender = document.createElement("strong");
                sender.textContent =
                    message.senderUid === currentUser.uid
                        ? "You"
                        : otherStudentName;

                const text = document.createElement("p");
                text.textContent = message.text || "";

                const time = document.createElement("small");
                time.className = "message-time";
                time.textContent = formatTime(message.createdAt);

                card.append(sender, text, time);
                messagesBox.appendChild(card);
            });

            messagesBox.scrollTop = messagesBox.scrollHeight;
        },
        function(error) {
            console.error("Message listener error:", error);
            messagesBox.textContent =
                "Unable to load messages: " + error.message;
        }
    );
}

if (messageForm) {
    messageForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const message = messageInput.value.trim();

        if (!message || !currentUser || !chatId || !otherStudentUid) {
            return;
        }

        if (message.length > 2000) {
            alert("Message cannot exceed 2000 characters.");
            return;
        }

        messageInput.disabled = true;

        if (sendButton) {
            sendButton.disabled = true;
            sendButton.textContent = "Sending...";
        }

        try {
            await addDoc(
                collection(db, "chats", chatId, "messages"),
                {
                    senderUid: currentUser.uid,
                    text: message,
                    createdAt: serverTimestamp()
                }
            );

            messageInput.value = "";

            await updateDoc(doc(db, "chats", chatId), {
                lastMessage: message,
                lastMessageAt: serverTimestamp()
            });

            try {
                await addDoc(collection(db, "notifications"), {
                    senderUid: currentUser.uid,
                    senderName:
                        currentUser.displayName ||
                        currentUser.email?.split("@")[0] ||
                        "Student",
                    recipientUid: otherStudentUid,
                    chatId: chatId,
                    message: message.slice(0, 100),
                    createdAt: serverTimestamp(),
                    read: false
                });
            } catch (error) {
                console.error("Notification error:", error);
                alert("Message sent, but notification could not be created.");
            }

        } catch (error) {
            console.error("Message sending error:", error);
            alert("Message failed: " + error.message);
        }

        messageInput.disabled = false;

        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = "Send";
        }

        messageInput.focus();
    });
}

window.addEventListener("beforeunload", function() {
    if (stopMessagesListener) {
        stopMessagesListener();
    }
});