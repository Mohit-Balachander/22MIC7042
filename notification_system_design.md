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

# Stage 4

## Performance Optimization for Notification Fetching

### Problem
Fetching notifications on every page load causes repeated DB hits for the same data, overwhelming the database with 50,000 students.

### Solutions

#### 1. Server-Side Caching (Redis)
Cache the notifications list per student in Redis with a TTL of 60 seconds. On page load, check Redis first. If cache hit, return cached data. If miss, query DB and store in Redis.

Tradeoff: Students may see slightly stale notifications for up to 60 seconds. Write operations must invalidate the cache for that student.

#### 2. Client-Side Caching
Store fetched notifications in localStorage or React state. Only re-fetch when a WebSocket event signals a new notification.

Tradeoff: Reduces server load significantly but requires careful cache invalidation logic on the frontend.

#### 3. Pagination
Never fetch all notifications at once. Fetch 10 or 20 at a time using page and limit query parameters.

Tradeoff: Slightly more complex frontend logic but drastically reduces DB and network load.

#### 4. WebSocket Push Instead of Poll
Instead of fetching on every page load, use WebSockets to push only new notifications to the client in real time.

Tradeoff: Requires maintaining persistent connections on the server which increases memory usage but eliminates unnecessary DB reads entirely.

### Recommended Strategy
Combine Redis caching with WebSocket push and pagination. On first load fetch paginated results from Redis-backed API. New notifications arrive via WebSocket and are prepended to the list without a full reload.

# Stage 5

## Bulk Notification Redesign

### Shortcomings of Current Implementation

- Sequential processing: 50,000 students notified one by one, extremely slow
- No error handling: if send_email fails for 200 students midway, they are skipped silently
- No retry mechanism: failed notifications are lost permanently
- Tight coupling: email and DB operations happen together with no separation
- No progress tracking: if server crashes midway, no way to know who was already notified

### What happens when send_email fails for 200 students?

With the current implementation those 200 students never get the email and there is no record of failure. There is no way to identify and retry only the failed ones.

### Should DB save and email sending happen together?

No. DB insert should always happen first independently of email sending. The notification must be persisted regardless of whether email delivery succeeds. Email sending should be async and separate so failures in email do not affect the DB record.

### Redesigned Approach

Use a message queue. Push all student IDs into the queue at once. Multiple parallel workers pick jobs from the queue and process each student independently with retry logic.

### Revised Pseudocode

function notify_all(student_ids: array, message: string):
for student_id in student_ids:
enqueue_job({ student_id: student_id, message: message, retry_count: 0 })
function worker_process(job):
try:
save_to_db(job.student_id, job.message)
push_to_app(job.student_id, job.message)
send_email(job.student_id, job.message)
mark_job_complete(job)
except error:
if job.retry_count < 3:
job.retry_count += 1
re_enqueue_job(job)
else:
mark_job_failed(job)
log_failure(job.student_id, error)
function start_workers(concurrency: number):
for i in range(concurrency):
spawn_worker(worker_process)

### Benefits

- DB insert always happens first and is guaranteed
- Email failures trigger automatic retry up to 3 times
- Parallel workers process thousands of students simultaneously
- Failed jobs are logged and identifiable for manual review
- System is resumable after crash with no duplicate notifications

