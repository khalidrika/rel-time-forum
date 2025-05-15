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
        console.log("dd", e.data);

    }
    socket.onclose = () => {
        socket = null
    };
}
