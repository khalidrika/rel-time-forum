// sessions/sessions.go
package backend

import (
	"errors"
	"net/http"
)

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

func GetNicknameById(id int) (string, error) {
	var nickname string
	err := DB.QueryRow(`
	SELECT nickname FROM users
	WHERE id = ? 
	`, id).Scan(&nickname)
	return nickname, err
}
