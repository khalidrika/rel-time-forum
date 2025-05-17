export let socket = null
export function UpgradeConnetion() {
    if (socket !== null) {
        return
    }
    const host = window.location.origin.split("//");
    socket = new WebSocket(`ws://${host[1]}/ws`);
}

const input = document.getElementById("inpuut");

// input.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const msg = document.querySelector("#msg")
//     console.log(msg);

//     socket.send(msg.value)
// });

let history = [];

export function socketEvent() {
    socket.onopen = () => {
        console.log("connection is open");
    }
    socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const username = localStorage.getItem("username");
        if (data.to === username) {
            history.push({from: data.from, content: data.content});
            const msgDiv = document.createElement("div");
            msgDiv.className = "chat-message incoming";
            msgDiv.innerHTML = `
            <strong>${data.from}: </strong> ${data.content}
            `;

            if (document.getElementsByClassName(".chat-box")) {
                const chatBox = document.querySelector(".messages");
                chatBox.appendChild(msgDiv);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }
    }
    socket.onclose = () => {
        socket = null
    };
}
