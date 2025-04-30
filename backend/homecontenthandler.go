package backend

import (
	"encoding/json"
	"net/http"
)

func HomeContentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		ErrorHandler(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Replace with dynamic or template-based HTML later
	response := map[string]string{
		"name": "Khalid",
		"fa":   "anouar",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
