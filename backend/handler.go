package backend

import (
	"net/http"
)

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		ErrorHandler(w, "method not alowd", 405)
		return
	}
	ParseAndExecute(w, "", "frontend/html/index.html")
}
