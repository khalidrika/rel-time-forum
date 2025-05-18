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
	From    string `json:"from"`
	To      string `json:"to"`
	Content string `json:"content"`
	Token   string `json:"token"`
}

type Err struct {
	Error string `json:"error"`
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

	conn, err := upgrade.Upgrade(w, r, nil)
	if err != nil {
		ErrorHandler(w, "Internal server Error", http.StatusInternalServerError)
		return
	}
	var msg Message
	client := NewClient(id, nickname, cookie.Value, conn)
	m.addclient(client)
	for {
		_, pyload, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if err := json.Unmarshal(pyload, &msg); err != nil {
			log.Println("unmarshal err:", err)
		}
		fmt.Println("user id", msg.To)
		if client.Token != msg.Token {
			var errr Err
			errr.Error = "Unauthorized"
			m.broadcast(client.Nickname, errr)
			return
		}
		m.broadcast(msg.To, msg)
		m.broadcast(client.Nickname, msg)
	}
}

func (m Manager) broadcast(nickname string, message any) {
	fmt.Println("ton:", message)
	for _, Clientcoon := range m.Users[nickname] {
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
