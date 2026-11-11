# Общее

## Авторизация

Каждый запрос из мини-аппа передаёт подписанные данные Telegram. Бэкенд проверяет подпись и по `user.id` из `initData` находит продавца.

```http
Authorization: tma <initDataRaw>
```

## Форматы

- `date` — дата в формате `YYYY-MM-DD`, например `2026-11-11`.
- `timing` — интервал `HH:mm-HH:mm` в часовом поясе продавца, например `10:00-11:30`.
- `chatId` — Telegram chat id строкой.
- Все ключи в `camelCase`.

## Статусы слота

| status | Что значит | Что видит продавец |
|---|---|---|
| `free` | Окно открыто для записи | «Свободно» |
| `need_confirmation` | Клиент записался, ждёт подтверждения | «Ждёт подтверждения» |
| `confirmed` | Продавец подтвердил запись | «Занято» |

## Ошибки

Любая ошибка возвращается с HTTP-кодом 4xx или 5xx и телом:

```json
{
  "error": {
    "code": "",
    "message": ""
  }
}
```

| HTTP | code | Когда |
|---|---|---|
| 400 | `validation_error` | Неверные параметры или тело |
| 401 | `unauthorized` | Нет `initData` или подпись не сошлась |
| 404 | `not_found` | Сущность не найдена |
| 409 | `slot_conflict` | Действие невозможно в текущем статусе слота или время пересекается с другим слотом |

````
# Merchant

## Default Schema

```json
{
  "ownerChatId": "",
  "title": "",
  "description": "",
  "address": "",
  "publicLink": ""
}
```

`publicLink` формирует сервер (`https://t.me/<bot>?startapp=<merchantSlug>`), продавец его не редактирует.

## GET Получить информацию о продавце для страницы "Профиль"

**Запрос**

```http
GET /api/merchant/self HTTP/1.1
```

**Ответ**

```json
{
  "ownerChatId": "",
  "title": "",
  "description": "",
  "address": "",
  "publicLink": ""
}
```

## PATCH Изменить информацию о продавце (кнопка "Изменить" на странице "Профиль")

Передаются только изменённые поля.

**Запрос**

```http
PATCH /api/merchant/self HTTP/1.1
```

```json
{
  "title": "",
  "description": "",
  "address": ""
}
```

**Ответ**

```json
{
  "ownerChatId": "",
  "title": "",
  "description": "",
  "address": "",
  "publicLink": ""
}
```

## GET Настройки аккаунта продавца

**Запрос**

```http
GET /api/merchant/settings HTTP/1.1
```

**Ответ**

```json
{
  "schedule": {
    "workDays": [1, 2, 3, 4, 5, 6],
    "workHours": {
      "from": "10:00",
      "to": "20:00"
    },
    "breakMinutes": 15,
    "bookingHorizonDays": 14
  },
  "slotConfirmation": {
    "autoConfirm": false,
    "deadlineHours": 24
  },
  "customerNotification": {
    "onConfirm": true,
    "dayBefore": {
      "enabled": true,
      "time": "18:00"
    },
    "sameDay": {
      "enabled": true,
      "hoursBefore": 2
    }
  },
  "personalNotification": {
    "newBooking": true
  },
  "language": "ru",
  "timezone": "Asia/Yekaterinburg"
}
```

`workDays`: 1 — понедельник … 7 — воскресенье. `timezone` — часовой пояс продавца в формате IANA. В нём интерпретируются все `date` и `timing`.

## PATCH Изменить настройки (страница "Настройки")

Передаются только изменённые блоки или поля, сервер делает глубокое слияние.

**Запрос**

```http
PATCH /api/merchant/settings HTTP/1.1
```

```json
{
  "slotConfirmation": {
    "autoConfirm": true
  }
}
```

**Ответ**

Полный объект настроек, как в `GET /api/merchant/settings`.

````
# Product

Услуги продавца: блок «Услуги» на странице «Профиль».

## Default Schema

```json
{
  "id": "",
  "name": "",
  "durationMinutes": 0,
  "price": 0
}
```

`price` в рублях, `null` — цена не указана.

## GET Получить список услуг

**Запрос**

```http
GET /api/products HTTP/1.1
```

**Ответ**

```json
{
  "products": [
    {
      "id": "",
      "name": "",
      "durationMinutes": 0,
      "price": 0
    }
  ]
}
```

## POST Добавить услугу

**Запрос**

```http
POST /api/products HTTP/1.1
```

```json
{
  "name": "",
  "durationMinutes": 0,
  "price": 0
}
```

**Ответ**

```json
{
  "id": "",
  "name": "",
  "durationMinutes": 0,
  "price": 0
}
```

## PATCH Изменить услугу

Передаются только изменённые поля.

**Запрос**

```http
PATCH /api/products/{id} HTTP/1.1
```

```json
{
  "name": "",
  "durationMinutes": 0,
  "price": 0
}
```

**Ответ**

```json
{
  "id": "",
  "name": "",
  "durationMinutes": 0,
  "price": 0
}
```

## DELETE Удалить услугу

Уже существующие записи на эту услугу не затрагиваются.

**Запрос**

```http
DELETE /api/products/{id} HTTP/1.1
```

**Ответ**

`204 No Content`

````
# Slot

## Default Schema

```json
{
  "id": "",
  "date": "",
  "timing": "",
  "status": "",
  "customer": {
    "chatId": "",
    "name": "",
    "username": ""
  },
  "product": {
    "id": "",
    "name": ""
  }
}
```

У слота со статусом `free` поля `customer` и `product` равны `null`. `username` — ник в Telegram без `@`, может быть `null`.

## GET Получить слоты для страницы "Календарь"

Возвращает все слоты продавца за период (`free`, `need_confirmation`, `confirmed`), отсортированные по `date` и `timing`. Фронт запрашивает неделю, которая сейчас на экране.

**Запрос**

```http
GET /api/slots?periodFrom=2026-11-09&periodTo=2026-11-15 HTTP/1.1
```

**Ответ**

```json
{
  "slots": [
    {
      "id": "",
      "date": "",
      "timing": "",
      "status": "",
      "customer": {
        "chatId": "",
        "name": "",
        "username": ""
      },
      "product": {
        "id": "",
        "name": ""
      }
    }
  ]
}
```

## GET Получить слоты для страницы "Записи"

Вкладки страницы:
- «Ожидают» — `status=need_confirmation`;
- «Подтверждены» — `status=confirmed&periodFrom=<сегодня>`;
- «Прошедшие» — `status=confirmed&periodTo=<вчера>&order=desc`.

`periodFrom`, `periodTo` и `order` (`asc` по умолчанию / `desc`) необязательные.

**Запрос**

```http
GET /api/slots/merchant?status=need_confirmation HTTP/1.1
```

**Ответ**

```json
{
  "slots": [
    {
      "id": "",
      "date": "",
      "timing": "",
      "status": "",
      "customer": {
        "chatId": "",
        "name": "",
        "username": ""
      },
      "product": {
        "id": "",
        "name": ""
      }
    }
  ]
}
```

## GET Счётчики для навбара

Число заявок, которые ждут подтверждения: бейдж на вкладке «Записи» и в заголовке вкладки «Ожидают · N».

**Запрос**

```http
GET /api/slots/merchant/counters HTTP/1.1
```

**Ответ**

```json
{
  "needConfirmation": 0
}
```

## POST Добавить окно (кнопка "Добавить окно" на странице "Календарь")

Создаёт слот со статусом `free`. Если время пересекается с существующим слотом, возвращается `409 slot_conflict`.

**Запрос**

```http
POST /api/slots HTTP/1.1
```

```json
{
  "date": "2026-11-11",
  "timing": "14:00-15:30"
}
```

**Ответ**

```json
{
  "id": "",
  "date": "",
  "timing": "",
  "status": "free",
  "customer": null,
  "product": null
}
```

## PATCH Изменить время окна

Только для слота со статусом `free`, иначе `409 slot_conflict`. Передаются только изменённые поля.

**Запрос**

```http
PATCH /api/slots/{id} HTTP/1.1
```

```json
{
  "date": "",
  "timing": ""
}
```

**Ответ**

Обновлённый слот по Default Schema.

## DELETE Удалить окно

Только для слота со статусом `free`, иначе `409 slot_conflict`.

**Запрос**

```http
DELETE /api/slots/{id} HTTP/1.1
```

**Ответ**

`204 No Content`

## POST Подтвердить запись

Только для слота со статусом `need_confirmation`. Слот переходит в `confirmed`, бот отправляет клиенту уведомление, если в настройках включено `customerNotification.onConfirm`.

**Запрос**

```http
POST /api/slots/{id}/confirm HTTP/1.1
```

**Ответ**

Обновлённый слот по Default Schema со статусом `confirmed`.

## POST Отклонить запись

Только для слота со статусом `need_confirmation`. Слот возвращается в `free` (поля `customer` и `product` становятся `null`), бот сообщает клиенту об отказе.

**Запрос**

```http
POST /api/slots/{id}/reject HTTP/1.1
```

```json
{
  "reason": ""
}
```

`reason` необязательный, его увидит клиент. В MVP фронт тело не отправляет.

**Ответ**

Обновлённый слот по Default Schema со статусом `free`.
