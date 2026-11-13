import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const welcomeHeading = document.getElementById("welcomeHeading");
const headerProfileInitials = document.getElementById("headerProfileInitials");

const notificationCount = document.getElementById("notificationCount");
const notificationsPanel = document.getElementById("notificationsPanel");
const notificationsList = document.getElementById("notificationsList");

let stopNotificationsListener = null;
let firstSnapshotLoaded = false;

// Sound setup
let audioContext = null;
let soundEnabled = false;

// Browser sound unlock: user must interact once
function enableNotificationSound() {
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    soundEnabled = true;
}

document.addEventListener("click", enableNotificationSound);
document.addEventListener("touchstart", enableNotificationSound);
document.addEventListener("keydown", enableNotificationSound);

// Bell sound
function playNotificationSound() {
    if (!soundEnabled || !audioContext) return;

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const now = audioContext.currentTime;

    function makeBellTone(frequency, startTime) {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.7);
    }

    makeBellTone(880, now);
    makeBellTone(1175, now + 0.18);
}

// Toggle notification panel
window.toggleNotifications = function() {
    if (!notificationsPanel) return;

    notificationsPanel.hidden = !notificationsPanel.hidden;
};

// Login check
onAuthStateChanged(auth, function(user) {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const studentName =
        user.displayName ||
        (user.email ? user.email.split("@")[0] : "Student");

    if (welcomeHeading) {
        welcomeHeading.textContent =
            "Welcome, " + studentName + "! 👋";
    }

    if (headerProfileInitials) {
        const initials = studentName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(function(part) {
                return part.charAt(0).toUpperCase();
            })
            .join("");

        headerProfileInitials.textContent = initials || "S";
    }

    loadNotifications(user);
});

// Listen for real-time notifications
function loadNotifications(user) {

    if (stopNotificationsListener) {
        stopNotificationsListener();
    }

    firstSnapshotLoaded = false;

    const notificationsQuery = query(
        collection(db, "notifications"),
        where("recipientUid", "==", user.uid)
    );

    stopNotificationsListener = onSnapshot(
        notificationsQuery,
        function(snapshot) {

            // Play sound only for notifications added after initial load
            if (firstSnapshotLoaded) {
                snapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        playNotificationSound();
                    }
                });
            }

            firstSnapshotLoaded = true;

            const notifications = [];

            snapshot.forEach(function(item) {
                notifications.push({
                    id: item.id,
                    ...item.data()
                });
            });

            notifications.sort(function(a, b) {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;

                return timeB - timeA;
            });

            const unreadCount = notifications.filter(function(item) {
                return item.read === false;
            }).length;

            if (notificationCount) {
                notificationCount.textContent =
                    unreadCount > 99 ? "99+" : unreadCount;

                notificationCount.hidden = unreadCount === 0;
            }

            displayNotifications(notifications);

        },
        function(error) {
            console.error("Notification loading error:", error);

            if (notificationsList) {
                notificationsList.textContent =
                    "Unable to load notifications: " + error.message;
            }
        }
    );
}

// Display notification cards
function displayNotifications(notifications) {

    if (!notificationsList) return;

    notificationsList.innerHTML = "";

    if (notifications.length === 0) {
        notificationsList.textContent = "No notifications yet.";
        return;
    }

    notifications.forEach(function(notification) {

        const card = document.createElement("div");
        card.className = "notification-item";

        if (notification.read === false) {
            card.classList.add("unread");
        }

        const heading = document.createElement("strong");
        heading.textContent = notification.senderName || "Student";

        const message = document.createElement("p");
        message.textContent =
            notification.message || "Sent you a message.";

        const status = document.createElement("small");
        status.textContent =
            notification.read === false
                ? "New message · Unread"
                : "Read";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.textContent = "Open Chat";

        openButton.addEventListener("click", async function() {

            openButton.disabled = true;
            openButton.textContent = "Opening...";

            try {
                if (notification.read === false) {
                    await updateDoc(
                        doc(db, "notifications", notification.id),
                        { read: true }
                    );
                }

                window.location.href =
                    "chat.html?chatId=" +
                    encodeURIComponent(notification.chatId);

            } catch (error) {
                console.error("Notification update error:", error);

                alert("Unable to open notification: " + error.message);

                openButton.disabled = false;
                openButton.textContent = "Open Chat";
            }
        });

        card.append(heading, message, status, openButton);
        notificationsList.appendChild(card);
    });
}

// Clean up listener
window.addEventListener("beforeunload", function() {

    if (stopNotificationsListener) {
        stopNotificationsListener();
    }

});