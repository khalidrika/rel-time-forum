export let socket = null
export function UpgredConnetion() {
    socket = new WebSocket("ws://127.0.0.1:8080/ws")
}

const input = document.getElementById("inpuut");

input.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.querySelector("#msg")
    console.log(msg);

    socket.send(msg.value)
});


export function socketEvent() {
    socket.onopen = () => {
        console.log("connection is open");
    }
    socket.onmessage = (e) => {
        console.log("dd", e.data);

    }
    socket.onclose = () => {
        socket = null
    };
}