package bot

import (
	"appointment-app/internal/config"
	"context"

	tgbotapi "github.com/go-telegram/bot"
)

type Bot struct {
	api *tgbotapi.Bot
}

func NewBot(cfg config.Bot) (*Bot, error) {
	api, err := tgbotapi.New(cfg.Token)
	if err != nil {
		return nil, err
	}

	return &Bot{api: api}, nil
}

func (b *Bot) SendMessage(ctx context.Context, chatID, m string) error {
	_, err := b.api.SendMessage(ctx, &tgbotapi.SendMessageParams{
		ChatID: chatID,
		Text:   m,
	})
	if err != nil {
		return err
	}
	return nil
}
