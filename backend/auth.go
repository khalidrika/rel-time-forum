package backend

import (
	"encoding/json"
	"net/http"

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

	if req.Identifier == "khalid" && req.Password == "123" {
		json.NewEncoder(w).Encode(LoginResponse{Name: "Khalid"})
		return
	}

	ErrorHandler(w, "Invalid credentials", http.StatusUnauthorized)
}

// register

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

	// TODO: Check if user   exists, hash password, insert into DB
	var exists bool
	err := DB.QueryRow("SELECT EXISTS (SELECT 1 FROM users WHERE nickname = ? OR email = ?)", req.Nickname, req.Email).Scan(&exists)
	if err != nil {
		ErrorHandler(w, "Database error", http.StatusInternalServerError)
		return
	}
	if exists {
		ErrorHandler(w, "User alredy", http.StatusConflict)
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		ErrorHandler(w, "password encryption error", http.StatusInternalServerError)
		return
	}
	stmt, err := DB.Prepare(`
	INSERT INTO users (nickname, age, gender, firstname, lastname, email, password)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		ErrorHandler(w, "Database prepare failed", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()
	_, err = stmt.Exec(req.Nickname, req.Age, req.Gender, req.FirstName, req.LastName, req.Email, string(hashedPassword))
	if err != nil {
		ErrorHandler(w, "User registeration failed", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RegisterResponse{
		Nickname: req.Nickname,
	})
}
