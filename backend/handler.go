package backend

import (
	"encoding/json"
	"net/http"
)

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	// if r.URL.Path != "/" {
	// 	// ErrorHandler(w, "page not fond", 404)
	// 	return
	// }
	if r.Method != http.MethodGet {
		ErrorHandler(w, "method not alowd", 405)
		return
	}
	ParseAndExecute(w, "", "frontend/html/index.html")
}

func HomeContentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		ErrorHandler(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Replace with dynamic or template-based HTML later
	response := map[string]string{
		"name": "khalidSS hi ",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

//§eee
