package shedule

import (
	"appointment-app/internal/features/customer"
	"time"
)

type SlotStatus string

const (
	SLOT_BOOKED       SlotStatus = "booked"
	SLOT_NEED_CONFIRM SlotStatus = "need_confirmation"
	SLOT_FREE         SlotStatus = "free"
)

type Slot struct {
	// Дата
	Date time.Time
	// Продолжительность слота
	Timing time.Time
	// Статус
	Status SlotStatus
	// Клиент
	Customer customer.Customer
	// Услуга
	ProductID   string
	ProductName string
}

func NewSlot(
	date time.Time,
	timing time.Time,
	status SlotStatus,
	customer customer.Customer,
	productID string,
) Slot {
	return Slot{
		Date:      date,
		Timing:    timing,
		Status:    status,
		Customer:  customer,
		ProductID: productID,
		// из бд получить сходить название услуги
		ProductName: "product-name-here",
	}
}
