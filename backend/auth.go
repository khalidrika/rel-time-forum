package backend

import (
	"database/sql"
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

	var (
		id       int
		first    string
		password string
	)

	// البحث عن المستخدم حسب البريد أو الاسم المستعار
	row := DB.QueryRow("SELECT id, first_name, password FROM users WHERE email = ? OR nickname = ?", req.Identifier, req.Identifier)
	err := row.Scan(&id, &first, &password)
	if err != nil {
		if err == sql.ErrNoRows {
			ErrorHandler(w, "User not found", http.StatusUnauthorized)
			return
		}
		ErrorHandler(w, "Database error", http.StatusInternalServerError)
		return
	}

	// التحقق من كلمة المرور
	if err := bcrypt.CompareHashAndPassword([]byte(password), []byte(req.Password)); err != nil {
		ErrorHandler(w, "Incorrect password", http.StatusUnauthorized)
		return
	}

	// النجاح
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{Name: first})
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
