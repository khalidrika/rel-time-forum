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
    console.log(msg);
    const msgEl = document.createElement("div");
    msgEl.className = "message";
    msgEl.textContent = msg.content;
    const createdAt = document.createElement("span")
    createdAt.className = "created"
    createdAt.textContent = msg.createdat.split('.')[0]
    msgEl.appendChild(createdAt)

    if (msg.from === parseInt(parent.id)) {
        msgEl.classList.add("received");
    } else {
        msgEl.classList.add("sent");
    }

    parent.children[1].appendChild(msgEl);

    const existinNoPostMsg = document.querySelector(".empty-msg")
    if (existinNoPostMsg) {
        existinNoPostMsg.remove();
    }
}
