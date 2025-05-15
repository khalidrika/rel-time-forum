package backend

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Clients map[int][]*Client

type Client struct {
	Id       int
	Nickname string
	Token    string
	Conn     *websocket.Conn
}

type Manager struct {
	Users Clients
	sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		Users: make(Clients),
	}
}

func NewClient(id int, nickname, token string, conn *websocket.Conn) *Client {
	return &Client{
		Id:       id,
		Nickname: nickname,
		Token:    token,
		Conn:     conn,
	}
}
