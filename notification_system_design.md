# Stage 1

## REST API Design for Campus Notification Platform

### Base URL
`/api/v1`

### Authentication
All endpoints require a Bearer token in the Authorization header.

### Endpoints

#### 1. Get All Notifications
GET /api/v1/notifications
Query Parameters:
- page (number)
- limit (number)
- notification_type: "Placement" | "Event" | "Result"

Response 200:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "Placement",
      "message": "string",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### 2. Get Single Notification
GET /api/v1/notifications/:id

Response 200:
```json
{
  "id": "uuid",
  "type": "Result",
  "message": "string",
  "isRead": true,
  "createdAt": "2026-04-22T17:51:30Z"
}
```

#### 3. Mark Notification as Read
PATCH /api/v1/notifications/:id/read

Response 200:
```json
{
  "id": "uuid",
  "isRead": true
}
```

#### 4. Mark All as Read
PATCH /api/v1/notifications/read-all

Response 200:
```json
{
  "message": "all notifications marked as read"
}
```

#### 5. Get Unread Count
GET /api/v1/notifications/unread-count

Response 200:
```json
{
  "count": 42
}
```

### Real-Time Notifications
WebSockets will be used for real-time delivery. When the server has a new notification, it pushes it to all connected clients via a WebSocket connection established at:

`ws://host/ws/notifications`

The client listens on this socket and appends new notifications to the UI without a page reload.