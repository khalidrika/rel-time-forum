package backend

import (
	"fmt"
	"net/http"
)

func ErrorHandler(w http.ResponseWriter, message string, statusCode int) {
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"error": "%s", "status": %d}`, message, statusCode)
}
