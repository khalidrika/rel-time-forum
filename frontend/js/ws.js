import { buildMessageElement, currentUserId } from "./chat.js";

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
        if (msg.type === "typing" || msg.type === "stop_typing") {
            const chatBox = document.querySelector(`.chat-box[data-user-id="${msg.from}"]`);
            if (chatBox) {
                let typingIndicator = chatBox.querySelector(".typing-indicator");

                if (msg.type === "typing") {
                    if (!typingIndicator) {
                        typingIndicator = document.createElement("div");
                        typingIndicator.className = "typing-indicator";
                        typingIndicator.textContent = "Typing...";
                        chatBox.querySelector(".messages").appendChild(typingIndicator);
                    }
                } else {
                    if (typingIndicator) typingIndicator.remove();
                }
            }
            const userItem = document.querySelector(`.user-item[data-userid="${msg.from}"]`);
            if (userItem) {
                let typingStatus = userItem.querySelector(".typing-status");
                if (msg.type === "typing") {
                    if (!typingStatus) {
                        typingStatus = document.createElement("span");
                        typingStatus.className = "typing-status";
                        typingStatus.textContent = " • Typing...";
                        typingStatus.style.color = "#888";
                        typingStatus.style.fontSize = "0.8em";
                        typingStatus.style.marginLeft = "6px";
                        userItem.appendChild(typingStatus);
                    }
                } else {
                    if (typingStatus) typingStatus.remove();
                }
            }
            return;
        }

        if (msg.type === "status") {
            updateUserStatus(msg.userId, msg.online);
            return;
        }

        if (msg.type === "message") {
            const isSender = msg.from === currentUserId;
            const isReceiver = msg.to === currentUserId;

            if (!isSender && !isReceiver) {
                return;
            }

            const chatWithUserId = isSender ? msg.to : msg.from;
            const chatBox = document.querySelector(`.chat-box[data-user-id="${chatWithUserId}"]`);

            if (chatBox) {
                writeMessage(msg);
            } else {
                console.log("No active chat window to display the message");
                //4 notification
                if (isReceiver) {
                    const userItem = document.querySelector(`.user-item[data-userid="${msg.from}"]`);
                    if (userItem) {
                        const notifDot = userItem.querySelector(".notification-dot");
                        if (notifDot) notifDot.style.display = "inline-block";
                    }
                }
            }
            const userIdToMove = isSender ? msg.to : msg.from;
            const userItem = document.querySelector(`.user-item[data-userid="${userIdToMove}"]`);
            const usersContainer = document.querySelector(".user-list");

            if (userItem && usersContainer) {
                usersContainer.prepend(userItem);
            }
        }

    }
    socket.onclose = () => {
        socket = null;
    };
}

function writeMessage(msg) {
    const userId = msg.from === currentUserId ? String(msg.to) : String(msg.from);
    console.log(userId);

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
        if (item.dataset.userid == userId) {
            const statusText = item.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = online ? " (Online)" : " (Offline)";
                statusText.style.color = online ? "#4caf50" : "#888";
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