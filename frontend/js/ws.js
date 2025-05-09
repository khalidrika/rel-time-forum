let socket = null
export function UpgredConnetion() {
    socket = new WebSocket("ws://localhost:8080/ws")
    socket.onopen = () => {
        console.log("connection is open");
    }
    socket.send(JSON.stringify({
        type: "message",
        content: "heloo zaki"
    }))
}

export function sendmessage() {

}