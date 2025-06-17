import { buildMessageElement, currentUserId } from "./chat.js";

export let socket = null
export function UpgredConnetion() {
    if (socket !== null) {
        return
    }
    const host = window.location.origin.split("//");
    socket = new WebSocket(`ws://${host[1]}/ws`);
}

// const input = document.getElementById("inpuut");

export function socketEvent() {
    socket.onopen = () => {
        console.log("connection is open");
    }

    socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        //  console.log("Message:\n", msg);
        if (msg.type === "status") {
            // Real-time status update
            updateUserStatus(msg.userId, msg.online);
            return;
        }

        /////////////////////////

        const senderchat = document.getElementById(`${msg.to}`);
        console.log(msg.to);
        console.log(msg.from);

        const receivechat = document.querySelector(`div[data-user-id="${msg.from}"]`);
        console.log(receivechat, senderchat);

        if (senderchat) {
            writeMessage(msg);


        } else if (receivechat) {
            writeMessage(msg);
        } else {
            const users_box = document.querySelector(`.user-item[data-userid="${msg.from}"]`);
            const X = document.querySelector(`.users-box`);

            if (users_box && !users_box.querySelector(".notification-dot")) {
                const notif = document.createElement("div");
                notif.className = "notification-dot";
                notif.textContent = `New message`
                X.insertBefore(notif, X.firstChild)

                setInterval(() => {
                    notif.remove();
                }, 3000);

            }
        }

    }
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
}


export function updateUserStatus(userId, online) {
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

    // Update chat window status dot
    const chatBox = document.querySelector(`.chat-box[data-user-id="${userId}"]`);
    if (chatBox) {
        const statusDot = chatBox.querySelector(".chat-header .status-dot");
        if (statusDot) {
            statusDot.style.backgroundColor = online ? "#4caf50" : "#ccc";
        }
    }
}