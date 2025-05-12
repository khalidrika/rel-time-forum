package backend

import (
	"encoding/json"
	"fmt"
	"log"
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
		conn.WriteMessage(message_type, pyload)
	}
}

func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetUserIDFromRequest(r)
	if err != nil {
		log.Println("failed to get user id from seesion:", err)
		return
	}
	log.Println(id)
	rows, err := DB.Query("SELECT id, nickname FROM users WHERE id <> ?", id)
	if err != nil {
		ErrorHandler(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var nickname string
		if err := rows.Scan(&id, &nickname); err != nil {
			continue
		}
		users = append(users, map[string]interface{}{
			"id":       id,
			"nickname": nickname,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}