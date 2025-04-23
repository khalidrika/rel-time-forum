package backend

import (
	"sync"
	"time"
)

type RateLimiter struct {
	visitors map[string]time.Time
	Mutex    sync.Mutex
	intirval time.Duration
}

func NewRetLimiter(intirval time.Duration) *RateLimiter {
	return &RateLimiter{
		visitors: make(map[string]time.Time),
		intirval: intirval,
	}
}
