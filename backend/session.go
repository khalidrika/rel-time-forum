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
	cookie, err := r.Cookie("session_id")
	if err != nil {
		return 0, errors.New("missing session_id cookie")
	}
	userID, ok := sessionStore[cookie.Value]
	if !ok {
		return 0, errors.New("invalid session")
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
