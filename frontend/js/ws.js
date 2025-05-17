export let socket = null
export function UpgredConnetion() {
    if (socket !== null){
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
export function socketEvent() {
    socket.onopen = () => {
        console.log("connection is open");
    }

    socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        const activeChat = document.querySelector(".chat-box .messages");
        if (activeChat) {
            const msgEl = document.createElement("p");
            msgEl.textContent = msg.content;
            activeChat.appendChild(msgEl);
        } else {
            console.log("No active chat window to display the message");
        }
    }

    socket.onclose = () => {
        socket = null;
    };
}
