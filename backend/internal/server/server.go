package server

import (
	"appointment-app/internal/config"
	"net/http"
)

func ListenAndServe(cfg config.Server, router http.Handler) error {
	server := &http.Server{
		Addr:    "0.0.0.0:" + cfg.Port,
		Handler: router,
	}
	return server.ListenAndServe()
}
