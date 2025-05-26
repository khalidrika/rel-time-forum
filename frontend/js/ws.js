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

        const senderchat = document.getElementById(`${msg.to}`);
        console.log(msg.to);

        const receivechat = document.querySelector(`div[data-user-id="${msg.from}"]`);
        console.log(receivechat);

        // console.log(activeChat);
        if (senderchat) {
            writeMessage(msg);

        } else if (receivechat) {
            writeMessage(msg);
        } else {
            console.log("No active chat window to display the message");
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