package main

import (
	"appointment-app/internal/adapters/postgres"
	"appointment-app/internal/bot"
	"appointment-app/internal/config"
	"appointment-app/internal/server"
	"appointment-app/internal/transport/http"
	"fmt"
	"os"
)

var (
	appCfg config.Application
)

func init() {
	appCfg = config.LoadFromEnv()
}

func main() {
	tgbot, err := bot.NewBot(appCfg.Bot)
	if err != nil {
		fmt.Println("failed to connect to tg bot: ", err.Error())
		os.Exit(1)
	}
	_ = tgbot

	postgresConn, err := postgres.NewConnection(appCfg.Postgres)
	if err != nil {
		fmt.Println("failed to connect to postgres db: ", err.Error())
		os.Exit(1)
	}
	_ = postgresConn

	ginRouter := http.NewRouter()

	if err := server.ListenAndServe(appCfg.Server, ginRouter); err != nil {
		fmt.Println("failed to start server: ", err.Error())
		os.Exit(1)
	}
}
