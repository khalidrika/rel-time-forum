package backend

import (
	"fmt"
	"net/http"
)

func ErrorHandler(w http.ResponseWriter, message string, statusCode int) {
	if statusCode != http.StatusOK {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
	}
	fmt.Fprintf(w, `{"error": "%s", "status": %d}`, message, statusCode)
}
