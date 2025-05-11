// sessions/sessions.go
package backend

import (
	"errors"
	"net/http"
	"strconv"
)

// Mock  store
var sessionStore = map[string]int{
	"session_abc123": 1,
	"session_xyz789": 2,
}

func GetUserIDFromRequest(r *http.Request) (int, error) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return 0, errors.New("missing session_id cookie")
	}

	var userID int
	err = DB.QueryRow(`
		SELECT user_id FROM sessions
		WHERE token = ? AND expires_at > datetime('now')
	`, cookie.Value).Scan(&userID)
	if err != nil {
		return 0, errors.New("invalid or expired session")
	}

	return userID, nil
}

func SetSession(sessionID string, userID int) {
	sessionStore[sessionID] = userID
}

func GetUserIDFromQuery(r *http.Request) (int, error) {
	idStr := r.URL.Query().Get("userId")
	if idStr == "" {
		return 0, errors.New("missing userId query param")
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, errors.New("invalid userId")
	}
	return id, nil
}

func GetNicknameById(id int) (string, error) {
	var nickname string
	err := DB.QueryRow(`
	SELECT nickname FROM users
	WHERE id = ? 
	`, id).Scan(&nickname)
	return nickname, err
}
