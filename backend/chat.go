package backend

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrade = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func ChatHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrade.Upgrade(w, r, nil)
	if err != nil {
		ErrorHandler(w, "Internal server Error", http.StatusInternalServerError)
		return
	}
	for {
		message_type, pyload, err := conn.ReadMessage()
		if err != nil {
			break
		}
		fmt.Println(message_type, string(pyload))

	}
}
