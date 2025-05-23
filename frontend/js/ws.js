import { currentUserId } from "./chat.js";
export let socket = null
export function UpgredConnetion() {
    if (socket !== null) {
        return
    }
    const host = window.location.origin.split("//");
    socket = new WebSocket(`ws://${host[1]}/ws`);
}

const input = document.getElementById("inpuut");

export function socketEvent() {
    socket.onopen = () => {
        console.log("connection is open");
    }

    socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "status") {
            // Real-time status update
            updateUserStatus(msg.userId, msg.online);
            return;
        }

        const senderchat = document.getElementById(`${msg.to}`);
        const receivechat = document.getElementById(`${msg.from}`);
        // console.log(activeChat);
        if (senderchat) {
            writeMessage(senderchat, msg);

        } else if (receivechat) {
            writeMessage(receivechat, msg);
        } else {
            console.log("No active chat window to display the message");
        }
    }
    socket.onclose = () => {
        socket = null;
    };
}
function writeMessage(parent, msg) {
    const msgEl = document.createElement("div");
    msgEl.className = "message";

    // السطر العلوي: الاسم + التاريخ
    const header = document.createElement("div");
    header.className = "message-header";

    const sender = document.createElement("strong");
    sender.textContent = msg.from_name || msg.nickname;

    const createdAt = document.createElement("span");
    createdAt.className = "created";
    const timestamp = msg.createdAt || msg.createdat || new Date().toISOString();
    createdAt.textContent = new Date(timestamp).toLocaleString();

    header.appendChild(sender);
    header.appendChild(createdAt);

    // المحتوى
    const content = document.createElement("div");
    content.textContent = msg.content;

    msgEl.appendChild(header);
    msgEl.appendChild(content);

    if (msg.from === currentUserId) {
        msgEl.classList.add("sent");
    } else {
        msgEl.classList.add("received");
    }

    parent.children[1].appendChild(msgEl);

    const existingNoPostMsg = document.querySelector(".empty-msg");
    if (existingNoPostMsg) {
        existingNoPostMsg.remove();
    }
}

function updateUserStatus(userId, online) {
    // Update user list
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
    // Update chat window
    const chatBox = document.getElementById(userId);
    if (chatBox) {
        const header = chatBox.querySelector('.chat-header');
        if (header) {
            const dot = header.querySelector('.status-dot');
            const text = header.querySelector('span:last-child');
            if (dot) dot.style.backgroundColor = online ? "#4caf50" : "#ccc";
            if (text) {
                text.textContent = online ? " (Online)" : " (Offline)";
                text.style.color = online ? "#4caf50" : "#888";
            }
        }
    }
}