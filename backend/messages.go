package backend

import (
	"encoding/json"
	"log"
	"net/http"
)

func (m *Manager) Messages(w http.ResponseWriter, r *http.Request) {
	log.Println("beast")
	// Check for authentication cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse the JSON body (message data)
	var msg Message
	err = json.NewDecoder(r.Body).Decode(&msg)
	if err != nil {
		ErrorHandler(w, "Invalid message data", http.StatusBadRequest)
		return
	}

	// Validate sender's session token
	var userID int
	err = DB.QueryRow(`
        SELECT u.id
        FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.token = ?
    `, cookie.Value).Scan(&userID)
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Store the message in the database
	var receiverID int
	err = DB.QueryRow("SELECT id FROM users WHERE nickname = ?", msg.To).Scan(&receiverID)
	if err != nil {
		ErrorHandler(w, "Receiver not found", http.StatusBadRequest)
		return
	}

	_, err = DB.Exec(`
        INSERT INTO messages (sender_id, receiver_id, content)
        VALUES (?, ?, ?)
    `, userID, receiverID, msg.Content)
	if err != nil {
		ErrorHandler(w, "Failed to store message", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Message stored successfully"))
}
