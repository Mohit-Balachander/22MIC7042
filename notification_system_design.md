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

# Stage 2

## Database Design

### Chosen Database: PostgreSQL

PostgreSQL is chosen because notifications have a consistent structure making relational storage ideal, it supports indexing for fast filtered queries, and handles complex queries like sorting by type and time efficiently.

### Schema

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentID UUID REFERENCES students(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('Placement', 'Event', 'Result')),
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Problems at Scale (50,000 students, 5,000,000 notifications)

- Full table scans become slow without indexes
- High write load during bulk notifications
- Read queries slow down as unread notifications pile up

### Solutions

- Add indexes on studentID, isRead, createdAt, type
- Use pagination for all list queries
- Archive old read notifications to a separate table
- Use caching for unread counts

### Queries

Get all notifications for a student:
```sql
SELECT * FROM notifications
WHERE studentID = $1
ORDER BY createdAt DESC
LIMIT 10 OFFSET 0;
```

Get unread notifications:
```sql
SELECT * FROM notifications
WHERE studentID = $1 AND isRead = FALSE
ORDER BY createdAt DESC;
```

Mark as read:
```sql
UPDATE notifications
SET isRead = TRUE
WHERE id = $1;
```

Get notifications by type:
```sql
SELECT * FROM notifications
WHERE studentID = $1 AND type = $2
ORDER BY createdAt DESC;
```

# Stage 3

## Query Analysis

### Is this query accurate?
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

The query is functionally correct but has issues. studentID should be a UUID not an integer. isRead should be compared as a boolean. ORDER BY ASC shows oldest first which is not ideal for a notification inbox.

### Why is it slow?

With 5,000,000 rows and no indexes, PostgreSQL does a full table scan on every request. Filtering by studentID and isRead without indexes means every row is checked. With 50,000 students this becomes extremely slow.

### What to change?

```sql
CREATE INDEX idx_notifications_student_read ON notifications(studentID, isRead, createdAt DESC);

SELECT id, type, message, isRead, createdAt FROM notifications
WHERE studentID = '1042' AND isRead = FALSE
ORDER BY createdAt DESC
LIMIT 20;
```

Changes made:
- Composite index on studentID, isRead, createdAt
- SELECT specific columns instead of SELECT *
- ORDER BY DESC to show newest first
- Added LIMIT to avoid fetching all rows

### Computation Cost

With the composite index, the query uses an index scan instead of a sequential scan. Cost drops from O(n) where n is 5,000,000 to O(log n + k) where k is the result set size.

### Adding indexes on every column — is it good advice?

No. Indexes speed up reads but slow down writes. Every INSERT or UPDATE must also update all indexes. With 50,000 students receiving bulk notifications, write performance would degrade significantly. Only index columns that are actually used in WHERE, ORDER BY, or JOIN clauses.

### Query for placement notifications in last 7 days

```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
JOIN notifications n ON s.id = n.studentID
WHERE n.type = 'Placement'
AND n.createdAt >= NOW() - INTERVAL '7 days';
```

