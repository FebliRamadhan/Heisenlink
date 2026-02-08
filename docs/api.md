# LinkHub API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

### Login
`POST /auth/login`

**Body:**
```json
{
  "username": "user",
  "password": "password"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "user": { ... }
  }
}
```

### Refresh Token
`POST /auth/refresh`

**Body:**
```json
{
  "refreshToken": "jwt..."
}
```

## Links

### Create Link
`POST /links`
Auth Required: Yes

**Body:**
```json
{
  "url": "https://google.com",
  "alias": "google", // Optional
  "title": "Google", // Optional
  "password": "pass", // Optional
  "expiresAt": "2024-12-31" // Optional
}
```

### Get All Links
`GET /links`
Auth Required: Yes

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term

## Bio Page

### Get Bio Page
`GET /bio`
Auth Required: Yes

Returns the current user's bio page configuration.

### Update Bio Page
`PATCH /bio`
Auth Required: Yes

**Body:**
```json
{
  "title": "My Links",
  "bio": "Check out my stuff",
  "theme": "dark",
  "isPublished": true
}
```

### Add Link to Bio
`POST /bio/links`
Auth Required: Yes

**Body:**
```json
{
  "title": "Portfolio",
  "url": "https://portfolio.com",
  "icon": "globe"
}
```

## Analytics

### Overview Stats
`GET /analytics/overview`
Auth Required: Yes

**Parameters:**
- `from`: Start date (ISO)
- `to`: End date (ISO)

## Admin (Role=ADMIN)

### Get All Users
`GET /admin/users`

### Get System Stats
`GET /admin/analytics`
