package backend

import (
	"database/sql"
	"encoding/json"
	"log"
	"os"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var (
	CloudLinks *Links
	DB         *sql.DB
)

type Links struct {
	ErrorPage string `json:"error"`
}

func Initialise(){
	InitialiseLinks()
	InitialiseDB()
}

func InitialiseLinks() {
	content, err := os.ReadFile("./backend/cloudLinks.json")
	if err != nil {
		log.Fatalf("Failed to read the file cloudLinks.json: %v", err)
		return
	}
	if err = json.Unmarshal(content, &CloudLinks); err != nil {
		log.Fatalf("Error unmarshalling JSON: %v", err)
		return
	}
}

func InitialiseDB() {
	var err error

	DB, err = sql.Open("sqlite3", "./database/forum.db")
	if err != nil {
		log.Fatalf("Failed to open SQLite database: %v", err)
	}
	DB.SetMaxIdleConns(5)
	DB.SetMaxOpenConns(10)
	DB.SetConnMaxIdleTime(5 * time.Minute)

	constant, err := os.ReadFile("./database/schema.sql")
	if err != nil {
		log.Fatalf("failed to get database tables: %v", err)
	}
	if _, err := DB.Exec(string(constant)); err != nil {
		log.Fatalf("failed to create database tables: %v", err)
	}
}
