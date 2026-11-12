import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
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
const sendButton = messageForm.querySelector('button[type="submit"]');

const chatId = new URLSearchParams(window.location.search).get("chatId");

let currentUser = null;
let otherStudentUid = null;
let otherStudentName = "Student";
let stopMessagesListener = null;

function showError(message) {
    messagesBox.textContent = message;
    messageForm.style.display = "none";
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
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    if (!chatId) {
        showError("Chat ID missing. Please open chat from Students page.");
        return;
    }

    try {
        const chatRef = doc(db, "chats", chatId);
        const chatSnapshot = await getDoc(chatRef);

        if (!chatSnapshot.exists()) {
            showError("Chat not found.");
            return;
        }

        const chat = chatSnapshot.data();

        if (
            !Array.isArray(chat.participants) ||
            !chat.participants.includes(user.uid)
        ) {
            showError("You are not allowed to access this chat.");
            return;
        }

        const requestSnapshot = await getDoc(
            doc(db, "connectionRequests", chatId)
        );

        if (!requestSnapshot.exists()) {
            showError("Connection request not found.");
            return;
        }

        const request = requestSnapshot.data();

        if (
            request.status !== "Accepted" ||
            ![request.senderUid, request.recipientUid].includes(user.uid)
        ) {
            showError("This connection is not accepted.");
            return;
        }

        if (user.uid === request.senderUid) {
            otherStudentUid = request.recipientUid;
            otherStudentName = request.recipientName || "Student";
        } else {
            otherStudentUid = request.senderUid;
            otherStudentName = request.senderName || "Student";
        }

        chatStudentName.textContent = "Chat with " + otherStudentName;

        loadMessages();

    } catch (error) {
        console.error("Chat loading error:", error);
        showError("Unable to load chat. Please try again.");
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

                const messageCard = document.createElement("div");

                messageCard.className =
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

                messageCard.append(sender, text, time);
                messagesBox.appendChild(messageCard);
            });

            messagesBox.scrollTop = messagesBox.scrollHeight;
        },
        function(error) {
            console.error("Message listener error:", error);
            messagesBox.textContent = "Unable to load messages. Please refresh.";
        }
    );
}

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
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";

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

        try {
            await updateDoc(doc(db, "chats", chatId), {
                lastMessage: message,
                lastMessageAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Chat preview update error:", error);
        }

        try {
            await addDoc(collection(db, "notifications"), {
                senderUid: currentUser.uid,
                senderName: currentUser.displayName || "Student",
                recipientUid: otherStudentUid,
                chatId: chatId,
                message: message.slice(0, 100),
                createdAt: serverTimestamp(),
                read: false
            });
        } catch (error) {
            console.error("Notification creation error:", error);
            alert("Message sent, but notification could not be created.");
        }

    } catch (error) {
        console.error("Message sending error:", error);
        alert("Message failed. Please check your internet and try again.");
    }

    messageInput.disabled = false;
    sendButton.disabled = false;
    sendButton.textContent = "Send";
    messageInput.focus();
});

window.addEventListener("beforeunload", function() {
    if (stopMessagesListener) {
        stopMessagesListener();
    }
});