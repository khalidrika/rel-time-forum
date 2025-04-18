package backend

import (
	"encoding/json"
	"net/http"
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

	json.NewEncoder(w).Encode(RegisterResponse{
		Nickname: req.Nickname,
	})
}