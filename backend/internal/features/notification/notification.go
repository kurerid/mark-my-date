package notification

type Notifier interface {
	Notify(m string, chatID string) error
}
