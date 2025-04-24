package backend

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

type LoginResponse struct {
	Name string `json:"name"`
}

type RegisterResponse struct {
	Nickname string `json:"nickname"`
}

type RegisterRequest struct {
	Nickname  string `json:"nickname"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorHandler(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var (
		id       int
		first    string
		password string
	)

	row := DB.QueryRow("SELECT id, nickname, password FROM users WHERE nickname = ? OR email = ?", req.Identifier, req.Identifier)
	err := row.Scan(&id, &first, &password)
	if err != nil {
		if err == sql.ErrNoRows {
			ErrorHandler(w, "User not found", http.StatusUnauthorized)
			return
		}
		ErrorHandler(w, "Database error", http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(password), []byte(req.Password)); err != nil {
		ErrorHandler(w, "Incorrect password", http.StatusUnauthorized)
		return
	}

	token := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err = DB.Exec("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)", id, token, expiresAt)
	if err != nil {
		ErrorHandler(w, "Failed to create session", http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Expires:  expiresAt,
		HttpOnly: true,
		Path:     "/",
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{Name: first})
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorHandler(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var exists bool
	err := DB.QueryRow("SELECT EXISTS (SELECT 1 FROM users WHERE nickname = ? OR email = ?)", req.Nickname, req.Email).Scan(&exists)
	if err != nil {
		ErrorHandler(w, "Database error", http.StatusInternalServerError)
		log.Println("db check error:", err)
		return
	}
	if exists {
		ErrorHandler(w, "User already exists", http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		ErrorHandler(w, "Password encryption error", http.StatusInternalServerError)
		return
	}

	stmt, err := DB.Prepare(`
		INSERT INTO users (nickname, email, password, first_name, last_name, age, gender)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		ErrorHandler(w, "Database prepare failed", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(req.Nickname, req.Email, string(hashedPassword), req.FirstName, req.LastName, req.Age, req.Gender)
	if err != nil {
		ErrorHandler(w, "User registration failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RegisterResponse{Nickname: req.Nickname})
}
