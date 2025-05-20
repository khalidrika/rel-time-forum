package backend

import (
	"sync"
	"time"
)

type RateLimiter struct {
	visitors map[string]time.Time
	Mutex    sync.Mutex
	interval time.Duration
}

func NewRatLimiter(interval time.Duration) *RateLimiter {
	return &RateLimiter{
		visitors: make(map[string]time.Time),
		interval: interval,
	}
}
