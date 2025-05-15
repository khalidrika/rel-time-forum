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

type Message struct {
	To      int    `json:"to"`
	Content string `json:"content"`
}

func (m *Manager) ChatHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	id := 0
	nickname := ""
	err = DB.QueryRow(`
	SELECT u.id, u.nickname
	FROM users u 
	JOIN sessions s ON u.id = s.user_id 
	WHERE s.token = ? 
	`, cookie.Value).Scan(&id, &nickname)

	log.Println("---------------------88", id, nickname)

	conn, err := upgrade.Upgrade(w, r, nil)
	if err != nil {
		ErrorHandler(w, "Internal server Error", http.StatusInternalServerError)
		return
	}
	var msg Message
	client := NewClient(id, nickname, cookie.Value, conn)
	m.addclient(client)
	log.Println(len(m.Users[id]))
	for {
		_, pyload, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if err := json.Unmarshal(pyload, &msg); err != nil {
			log.Println("unmarshal err:", err)
		}
		fmt.Println("user id", msg.To)
		m.broadcast(msg.To, msg)
		m.broadcast(client.Id, msg)
	}
}

func (m Manager) broadcast(id int, message Message) {
	for _, Clientcoon := range m.Users[id] {
		Clientcoon.Conn.WriteJSON(message)
	}
}

func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetUserIDFromRequest(r)
	if err != nil {
		log.Println("failed to get user id from seesion:", err)
		return
	}
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
