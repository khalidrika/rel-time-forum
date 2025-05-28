import { buildMessageElement, currentUserId } from "./chat.js";

export let socket = null;
export function UpgredConnetion() {
    if (socket !== null) return;

    const host = window.location.origin.split("//");
    socket = new WebSocket(`ws://${host[1]}/ws`);
}

export function socketEvent() {
    socket.onopen = () => {
        console.log("connection is open");
    };

    socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "status") {
            updateUserStatus(msg.userId, msg.online);
            return;
        }

        const senderchat = document.getElementById(`${msg.to}`);
        const receivechat = document.querySelector(`div[data-user-id="${msg.from}"]`);

        if (senderchat || receivechat) {
            writeMessage(msg);
        } else {
            const userItem = document.querySelector(`.user-item[data-userid="${msg.from}"]`);
            if (userItem && !userItem.classList.contains("unread")) {
                console.log("Adding unread to:", userItem);
                userItem.classList.add("unread");
            }
        }

    };

    socket.onclose = () => {
        socket = null;
    };
}

function writeMessage(msg) {
    const userId = msg.from === currentUserId ? String(msg.to) : String(msg.from);
    const chatBox = document.querySelector(`div[data-user-id="${userId}"]`);
    if (!chatBox) {
        console.log("No active chat window to display the message");
        return;
    }

    const messages = chatBox.querySelector(".messages");
    const msgEl = buildMessageElement(msg);
    if (msgEl) {
        messages.appendChild(msgEl);
        messages.scrollTop = messages.scrollHeight;
    }

    const empty = messages.querySelector(".no-messages");
    if (empty) empty.remove();

    // Remove unread indicator if chat is open
    const userItem = document.querySelector(`.user-item[data-userid="${userId}"]`);
    if (userItem && userItem.classList.contains("unread")) {
        userItem.classList.remove("unread");
    }
}

export function updateUserStatus(userId, online) {
    document.querySelectorAll('.user-item').forEach(item => {
        if (item.userId == userId || item.dataset.userid == userId) {
            const dot = item.querySelector('.status-dot');
            const text = item.querySelector('span:last-child');
            if (dot) dot.style.backgroundColor = online ? "#4caf50" : "#ccc";
            if (text) {
                text.textContent = online ? " (Online)" : " (Offline)";
                text.style.color = online ? "#4caf50" : "#888";
            }
        }
    });

    const chatBox = document.querySelector(`.chat-box[data-user-id="${userId}"]`);
    if (chatBox) {
        const statusDot = chatBox.querySelector(".chat-header .status-dot");
        if (statusDot) {
            statusDot.style.backgroundColor = online ? "#4caf50" : "#ccc";
        }
    }
}
