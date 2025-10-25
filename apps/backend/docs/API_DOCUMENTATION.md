# Meeting Management API Documentation

## Base URL

```
http://localhost:3333/api
```

## Authentication

All endpoints except authentication endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "hr",
  "positionId": 1
}
```

**Response:** `201 Created`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "hr",
    "positionId": 1
  }
}
```

**Validation:**

- `name`: Required, max 255 characters
- `email`: Required, valid email format, max 255 characters
- `password`: Required, minimum 8 characters
- `role`: Required, one of: `hr`, `manager`, `staff`
- `positionId`: Optional, positive integer

---

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "hr",
    "positionId": 1
  }
}
```

---

### Logout

Logout endpoint (token invalidation handled client-side).

**Endpoint:** `POST /api/auth/logout`

**Response:** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

---

## Meeting Endpoints

### List Meetings

Get paginated list of meetings.

**Endpoint:** `GET /api/meetings`

**Query Parameters:**

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 100)

**Response:** `200 OK`

```json
{
  "meetings": [
    {
      "id": 1,
      "title": "Interview with Alice",
      "startTime": "2025-11-01T10:00:00.000Z",
      "endTime": "2025-11-01T11:00:00.000Z",
      "location": "Room 302",
      "meetingType": "onsite",
      "notes": "Technical interview",
      "status": "confirmed",
      "userId": 1,
      "candidateId": 5,
      "createdAt": "2025-10-26T08:00:00.000Z",
      "updatedAt": "2025-10-26T08:00:00.000Z",
      "deletedAt": null,
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "candidate": {
        "id": 5,
        "name": "Alice Smith",
        "email": "alice@example.com"
      },
      "participants": [
        {
          "id": 2,
          "name": "Jane Manager",
          "email": "jane@example.com"
        }
      ]
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pageSize": 10,
    "totalPages": 3
  }
}
```

---

### Create Meeting

Create a new meeting.

**Endpoint:** `POST /api/meetings`

**Request Body:**

```json
{
  "title": "Interview with Alice",
  "startTime": "2025-11-01T10:00:00Z",
  "endTime": "2025-11-01T11:00:00Z",
  "location": "Room 302",
  "meetingType": "onsite",
  "notes": "Technical interview",
  "status": "confirmed",
  "candidateId": 5,
  "participantIds": [2, 3]
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "title": "Interview with Alice",
  "startTime": "2025-11-01T10:00:00.000Z",
  "endTime": "2025-11-01T11:00:00.000Z",
  "location": "Room 302",
  "meetingType": "onsite",
  "notes": "Technical interview",
  "status": "confirmed",
  "userId": 1,
  "candidateId": 5,
  "createdAt": "2025-10-26T08:00:00.000Z",
  "updatedAt": "2025-10-26T08:00:00.000Z",
  "deletedAt": null
}
```

**Validation:**

- `title`: Required, max 255 characters
- `startTime`: Required, ISO 8601 datetime
- `endTime`: Required, ISO 8601 datetime
- `meetingType`: Required, one of: `onsite`, `zoom`, `google_meet`
- `status`: Required, one of: `confirmed`, `pending`
- `location`: Optional, max 255 characters
- `notes`: Optional, text
- `candidateId`: Optional, positive integer
- `participantIds`: Optional, array of positive integers

---

### Get Meeting

Get a specific meeting by ID.

**Endpoint:** `GET /api/meetings/:id`

**Response:** `200 OK`

```json
{
  "id": 1,
  "title": "Interview with Alice",
  "startTime": "2025-11-01T10:00:00.000Z",
  "endTime": "2025-11-01T11:00:00.000Z",
  "location": "Room 302",
  "meetingType": "onsite",
  "notes": "Technical interview",
  "status": "confirmed",
  "userId": 1,
  "candidateId": 5,
  "createdAt": "2025-10-26T08:00:00.000Z",
  "updatedAt": "2025-10-26T08:00:00.000Z",
  "deletedAt": null,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "candidate": {
    "id": 5,
    "name": "Alice Smith",
    "email": "alice@example.com"
  },
  "participants": [
    {
      "id": 2,
      "name": "Jane Manager",
      "email": "jane@example.com"
    }
  ]
}
```

---

### Update Meeting

Update an existing meeting.

**Endpoint:** `PUT /api/meetings/:id`

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Interview Title",
  "status": "pending"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "title": "Updated Interview Title",
  "startTime": "2025-11-01T10:00:00.000Z",
  "endTime": "2025-11-01T11:00:00.000Z",
  "location": "Room 302",
  "meetingType": "onsite",
  "notes": "Technical interview",
  "status": "pending",
  "userId": 1,
  "candidateId": 5,
  "createdAt": "2025-10-26T08:00:00.000Z",
  "updatedAt": "2025-10-26T09:00:00.000Z",
  "deletedAt": null
}
```

---

### Delete Meeting

Soft delete a meeting.

**Endpoint:** `DELETE /api/meetings/:id`

**Response:** `200 OK`

```json
{
  "message": "Meeting deleted successfully"
}
```

---

## Candidate Endpoints

### List Candidates

Get all candidates.

**Endpoint:** `GET /api/candidates`

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "appliedPositionId": 1,
    "status": "interview",
    "interviewNotes": "Strong technical skills",
    "createdAt": "2025-10-20T08:00:00.000Z",
    "updatedAt": "2025-10-26T08:00:00.000Z",
    "appliedPosition": {
      "id": 1,
      "name": "Software Engineer"
    }
  }
]
```

---

### Create Candidate

Create a new candidate.

**Endpoint:** `POST /api/candidates`

**Request Body:**

```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "appliedPositionId": 1,
  "status": "applied",
  "interviewNotes": "Initial screening"
}
```

**Response:** `201 Created`

**Validation:**

- `name`: Required, max 255 characters
- `email`: Required, valid email, max 255 characters, unique
- `appliedPositionId`: Required, positive integer
- `status`: Required, one of: `applied`, `screening`, `interview`, `offer`, `rejected`, `hired`
- `interviewNotes`: Optional, text

---

### Get Candidate

Get a specific candidate by ID.

**Endpoint:** `GET /api/candidates/:id`

**Response:** `200 OK`

---

### Update Candidate

Update an existing candidate.

**Endpoint:** `PUT /api/candidates/:id`

**Request Body:** (all fields optional)

```json
{
  "status": "offer",
  "interviewNotes": "Excellent candidate, ready for offer"
}
```

**Response:** `200 OK`

---

### Delete Candidate

Delete a candidate.

**Endpoint:** `DELETE /api/candidates/:id`

**Response:** `200 OK`

```json
{
  "message": "Candidate deleted successfully"
}
```

---

## Position Endpoints

### List Positions

Get all employee positions.

**Endpoint:** `GET /api/positions`

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "HR Manager"
  },
  {
    "id": 2,
    "name": "Engineering Manager"
  }
]
```

---

### List Applied Positions

Get all positions that candidates can apply for.

**Endpoint:** `GET /api/positions/applied`

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Software Engineer"
  },
  {
    "id": 2,
    "name": "Frontend Developer"
  }
]
```

---

## Interview Participant Endpoints

### Add Participant

Add a user as a participant to a meeting.

**Endpoint:** `POST /api/meetings/:id/participants`

**Request Body:**

```json
{
  "userId": 2
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "meetingId": 1,
  "user": {
    "id": 2,
    "name": "Jane Manager",
    "email": "jane@example.com"
  }
}
```

---

### Remove Participant

Remove a participant from a meeting.

**Endpoint:** `DELETE /api/meetings/:meetingId/participants/:userId`

**Response:** `200 OK`

```json
{
  "message": "Participant removed successfully"
}
```

---

## Candidate History Endpoints

### Get Candidate History

Get interview history and feedback for a candidate.

**Endpoint:** `GET /api/candidates/:id/history`

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "candidateId": 5,
    "meetingId": 1,
    "feedback": "Strong technical skills, good communication",
    "recordedAt": "2025-11-01T12:00:00.000Z",
    "meeting": {
      "id": 1,
      "title": "Technical Interview",
      "startTime": "2025-11-01T10:00:00.000Z"
    }
  }
]
```

---

### Add Candidate History

Add feedback/notes to candidate history.

**Endpoint:** `POST /api/candidates/:id/history`

**Request Body:**

```json
{
  "meetingId": 1,
  "feedback": "Strong technical skills, good communication"
}
```

**Response:** `201 Created`

**Validation:**

- `meetingId`: Optional, positive integer
- `feedback`: Required, text

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "ValidationError",
  "message": "Invalid input data",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

### 404 Not Found

```json
{
  "error": "NotFound",
  "message": "Meeting not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "InternalServerError",
  "message": "Failed to create meeting"
}
```

---

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 requests per IP
- **Response when exceeded:**

```json
{
  "message": "Too many requests from this IP, please try again later."
}
```
