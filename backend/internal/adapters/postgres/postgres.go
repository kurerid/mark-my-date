package postgres

import (
	"appointment-app/internal/config"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type PostgresDB struct {
	db *sqlx.DB
}

func NewConnection(cfg config.Postgres) (*PostgresDB, error) {
	db, err := sqlx.Connect("postgres", connectionString(cfg))
	if err != nil {
		fmt.Println("failed to connect postgres: ", err.Error())
		return nil, err
	}
	return &PostgresDB{db: db}, nil
}

func connectionString(cfg config.Postgres) string {
	return fmt.Sprintf(
		"postgresql://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.User,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Database,
		cfg.SSLMode,
	)
}
