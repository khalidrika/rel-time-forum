package backend

import "net/http"

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		ErrorHandler(w, "page not fond", 404)
		return
	}
	if r.Method != http.MethodGet {
		ErrorHandler(w, "method not alowd", 405)
		return
	}
	ParseAndExecute(w, "", "frontend/index.html")
}
