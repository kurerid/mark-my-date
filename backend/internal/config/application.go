package config

import "os"

type Application struct {
	Bot      Bot
	Postgres Postgres
	Server   Server
}

func LoadFromEnv() Application {
	return Application{
		Bot: Bot{
			Token: os.Getenv("TG_BOT_TOKEN"),
		},
		Postgres: Postgres{
			Host:     os.Getenv("PG_HOST"),
			Port:     os.Getenv("PG_PORT"),
			User:     os.Getenv("PG_USER"),
			Database: os.Getenv("PG_DATABASE"),
			SSLMode:  os.Getenv("PG_SSL"),
		},
		Server: Server{
			Port: os.Getenv("HTTP_PORT"),
		},
	}
}
