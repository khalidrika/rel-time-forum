package backend

import (
	"bytes"
	"html/template"
	"net/http"
)

func ParseAndExecute(w http.ResponseWriter, data any, filename string) {
	tmpl, err := template.ParseFiles(filename)
	if err != nil {
		ErrorHandler(w, "page not fond", 404)
		return
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		ErrorHandler(w, "Internal Server Error!", 500)
		return
	}
	buf.WriteTo(w)
}

