package backend

import (
	"database/sql"
	"encoding/json"
	"fmt"
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

func Initialise() bool {
	InitialiseLinks()
	InitialiseDB()

	return true
}

func InitialiseLinks() {
	content, err := os.ReadFile("./backend/cloudLinks.json")
	if err != nil {
		fmt.Println("fild to read the file page error.json")
		return
	}
	err = json.Unmarshal(content, &CloudLinks)
	if err != nil {
		fmt.Println("error from unmarchal")
		return
	}
}

func InitialiseDB() {
	var err error

	DB, err = sql.Open("sqlite3", "./database/forum.db")
	if err != nil {
		log.Fatal("Failed to open SQLite database:", err)
	}
	DB.SetMaxIdleConns(5)
	DB.SetMaxOpenConns(10)
	DB.SetConnMaxIdleTime(5 * time.Minute)

	constant, err := os.ReadFile("./database/schema.sql")
	if err != nil {
		log.Fatal("faild to get database tables:", err)
	}
	if _, err := DB.Exec(string(constant)); err != nil {
		log.Fatal("faild to create database tables:", err)
	}
}
