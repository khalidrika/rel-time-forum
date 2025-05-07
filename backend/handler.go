package backend

import (
	"net/http"
	"github.com/gorilla/websocket"
)

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		ErrorHandler(w, "method not alowd", 405)
		return
	}
	ParseAndExecute(w, "", "frontend/html/index.html")
}

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

func HandleConnections(w http.ResponseWriter, r *http.Request) {
    // Authenticate user from session cookie
    userID, _ := GetUserIDFromRequest(r) // Implement your auth logic
    
    ws, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer ws.Close()

    client := &Client{conn: ws, userID: userID}
    register <- client

    for {
        var msg Message
        err := ws.ReadJSON(&msg)
        if err != nil {
            unregister <- client
            break
        }
        broadcast <- msg
    }
}

