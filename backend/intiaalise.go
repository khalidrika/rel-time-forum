package backend

import (
	"database/sql"
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

func Initialise() {
	InitialiseDB()
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

	schema, err := os.ReadFile("./database/schema.sql")
	if err != nil {
		log.Fatalf("failed to get database tables: %v", err)
	}
	if _, err := DB.Exec(string(schema)); err != nil {
		log.Fatalf("failed to create database tables: %v", err)
	}
}
