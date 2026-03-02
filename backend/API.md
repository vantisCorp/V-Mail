# Vantis Mail Backend API Documentation

## Overview
Vantis Mail is a secure email system with military-grade encryption (Zero Trust architecture). This document describes the REST API endpoints for the backend service.

**Base URL**: `http://localhost:8080`

**Authentication**: JWT Bearer Token (required for protected endpoints)

---

## Health Check

### GET /health
Check if the API is running.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-01T12:00:00Z"
}
```

**Status Codes**:
- `200 OK` - API is running

---

## Authentication

### POST /api/auth/register
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "display_name": "John Doe"
}
```

**Response**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "display_name": "John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Status Codes**:
- `201 Created` - User registered successfully
- `400 Bad Request` - Invalid input
- `409 Conflict` - User already exists
- `500 Internal Server Error` - Server error

### POST /api/auth/login
Authenticate a user and receive a JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "two_factor_code": "123456"
}
```

**Response**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "display_name": "John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Status Codes**:
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Server error

### POST /api/auth/logout
Logout a user (invalidate JWT token).

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes**:
- `200 OK` - Logout successful
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

---

## Emails

### GET /api/emails
List all emails for the authenticated user.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `folder` (optional) - Filter by folder ID
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Response**:
```json
{
  "emails": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "from_email": "sender@example.com",
      "to_email": "user@example.com",
      "subject": "Test Email",
      "body": "Email content",
      "is_encrypted": true,
      "has_attachments": false,
      "is_read": false,
      "is_starred": false,
      "created_at": "2026-03-01T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**Status Codes**:
- `200 OK` - Emails retrieved successfully
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

### POST /api/emails
Create a new email.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "to_email": "recipient@example.com",
  "cc_email": "cc@example.com",
  "bcc_email": "bcc@example.com",
  "subject": "Test Email",
  "body": "Email content",
  "body_html": "<p>Email content</p>",
  "encrypt": true,
  "phantom_alias": "alias@vantis-mail.com",
  "self_destruct_minutes": 60
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "to_email": "recipient@example.com",
  "subject": "Test Email",
  "created_at": "2026-03-01T12:00:00Z"
}
```

**Status Codes**:
- `201 Created` - Email created successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

### GET /api/emails/{id}
Get a specific email by ID.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "from_email": "sender@example.com",
  "to_email": "user@example.com",
  "cc_email": "cc@example.com",
  "bcc_email": "bcc@example.com",
  "subject": "Test Email",
  "body": "Email content",
  "body_html": "<p>Email content</p>",
  "is_encrypted": true,
  "has_attachments": false,
  "is_read": false,
  "is_starred": false,
  "phantom_alias": "alias@vantis-mail.com",
  "self_destruct_at": "2026-03-01T13:00:00Z",
  "created_at": "2026-03-01T12:00:00Z",
  "updated_at": "2026-03-01T12:00:00Z"
}
```

**Status Codes**:
- `200 OK` - Email retrieved successfully
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Email not found
- `500 Internal Server Error` - Server error

### PATCH /api/emails/{id}
Update an email.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "is_read": true,
  "is_starred": false,
  "folder_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "is_read": true,
  "is_starred": false,
  "updated_at": "2026-03-01T12:05:00Z"
}
```

**Status Codes**:
- `200 OK` - Email updated successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Email not found
- `500 Internal Server Error` - Server error

### DELETE /api/emails/{id}
Delete an email.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Email deleted successfully"
}
```

**Status Codes**:
- `200 OK` - Email deleted successfully
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Email not found
- `500 Internal Server Error` - Server error

---

## Phantom Aliases

### GET /api/aliases
List all Phantom aliases for the authenticated user.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "aliases": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "alias_email": "shadowghost123@vantis-mail.com",
      "original_email": "user@example.com",
      "expires_at": "2026-03-08T12:00:00Z",
      "created_at": "2026-03-01T12:00:00Z"
    }
  ]
}
```

**Status Codes**:
- `200 OK` - Aliases retrieved successfully
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

### POST /api/aliases
Create a new Phantom alias.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "alias_email": "shadowghost123@vantis-mail.com",
  "domain": "vantis-mail.com",
  "expires_at": "2026-03-08T12:00:00Z"
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "alias_email": "shadowghost123@vantis-mail.com",
  "original_email": "user@example.com",
  "expires_at": "2026-03-08T12:00:00Z",
  "created_at": "2026-03-01T12:00:00Z"
}
```

**Status Codes**:
- `201 Created` - Alias created successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

### DELETE /api/aliases/{id}
Delete a Phantom alias.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Alias deleted successfully"
}
```

**Status Codes**:
- `200 OK` - Alias deleted successfully
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Alias not found
- `500 Internal Server Error` - Server error

---

## Folders

### GET /api/folders
List all folders for the authenticated user.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "folders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Inbox",
      "icon": "inbox",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-03-01T12:00:00Z"
    }
  ]
}
```

**Status Codes**:
- `200 OK` - Folders retrieved successfully
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

### POST /api/folders
Create a new folder.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Work",
  "icon": "folder",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Work",
  "icon": "folder",
  "created_at": "2026-03-01T12:00:00Z"
}
```

**Status Codes**:
- `201 Created` - Folder created successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes**:
- `INVALID_INPUT` - Invalid request parameters
- `UNAUTHORIZED` - Invalid or missing authentication
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1614556800
```

---

## Security

### Authentication
All protected endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Encryption
- All emails are encrypted using AES-256-GCM
- Key exchange uses X25519 (ECC)
- Post-quantum security with Kyber-1024 (planned)

### Phantom Aliases
- Disposable email addresses for privacy
- Time-limited aliases with automatic expiration
- Reverse aliasing for secure replies

---

## WebSocket API

Real-time notifications are available via WebSocket:

**Endpoint**: `ws://localhost:8080/ws`

**Authentication**: JWT token in query parameter: `ws://localhost:8080/ws?token=<token>`

**Message Format**:
```json
{
  "type": "new_email",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "subject": "New Email",
    "from_email": "sender@example.com"
  }
}
```

**Message Types**:
- `new_email` - New email received
- `email_updated` - Email status changed
- `alias_expired` - Phantom alias expired
- `panic_mode` - Panic mode activated

---

## Testing

Run the test suite:
```bash
cargo test
```

Run specific test:
```bash
cargo test --test api_test
```

Run with coverage:
```bash
cargo tarpaulin --out Html
```

---

## License

MIT License - See LICENSE file for details