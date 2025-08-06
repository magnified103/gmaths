# JSON Response Format Specification

This document outlines the standardized JSON response format for the GMATHS Education API. All API endpoints should adhere to these specifications for consistent communication between the backend and clients.

## 1. Successful Responses (HTTP Status Codes: 200 OK, 201 Created, 204 No Content, etc.)

Successful responses will vary based on whether the returned data is a single object or a list of objects.

### 1.1. Single Object Response

When an endpoint returns a single resource or object, the response body will directly contain that object.

**Example: `GET /auth/me` (returns user object)**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "username": "john.doe",
  "email": "john.doe@example.com",
  "emailVerified": true,
  "roles": [
    {
      "slug": "student",
      "name": "Student",
      "description": "Standard student role"
    }
  ],
  "createdAt": "2025-08-06T05:00:00.000Z",
  "updatedAt": "2025-08-06T05:00:00.000Z",
  "lastLoginAt": "2025-08-06T05:00:00.000Z"
}
```

### 1.2. List Response

When an endpoint returns a collection or list of resources, the response body will contain a root attribute named `"items"`, which is an array containing the objects.

**Example: `GET /admin/users` (returns a list of user objects)**

```json
{
  "items": [
    {
      "id": "user-1-uuid",
      "username": "alice",
      "email": "alice@example.com",
      "emailVerified": true,
      "roles": [
        { "slug": "student", "name": "Student" }
      ],
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-01T10:00:00.000Z",
      "lastLoginAt": "2025-08-06T09:00:00.000Z"
    },
    {
      "id": "user-2-uuid",
      "username": "bob",
      "email": "bob@example.com",
      "emailVerified": false,
      "roles": [
        { "slug": "student", "name": "Student" }
      ],
      "createdAt": "2025-08-02T11:00:00.000Z",
      "updatedAt": "2025-08-02T11:00:00.000Z",
      "lastLoginAt": null
    }
  ]
}
```

## 2. Failed Responses (HTTP Status Codes: 4xx Client Errors, 5xx Server Errors)

All failed responses will adhere to a consistent structure to provide clear and machine-readable error information.

**Structure:**

```json
{
  "code": 400, // HTTP status code (e.g., 400, 401, 403, 404, 500)
  "message": "A general, human-readable error message describing the overall problem.",
  "errors": [
    {
      "locationType": "body", // The type of location where the error occurred (e.g., "body", "query", "params", "header", "auth", "resource", "unknown")
      "location": "email",    // The specific field name, parameter name, header name, or identifier related to the error.
      "message": "A specific, detailed error message for this particular issue."
    },
    // ... additional error details if multiple issues exist
  ]
}
```

**Field Descriptions:**

*   `code` (number): The HTTP status code of the error (e.g., 400 for Bad Request, 401 for Unauthorized, 500 for Internal Server Error).
*   `message` (string): A general, user-friendly message summarizing the error. This message should be localized if the API supports multiple languages.
*   `errors` (array of objects): An array containing one or more detailed error objects. This is particularly useful for validation errors where multiple fields might be invalid.
    *   `locationType` (string): Indicates where the error originated.
        *   `"body"`: Error related to the request body (e.g., JSON payload validation).
        *   `"query"`: Error related to query parameters.
        *   `"params"`: Error related to URL path parameters.
        *   `"header"`: Error related to request headers (e.g., missing Authorization).
        *   `"auth"`: General authentication/authorization issues not tied to a specific header.
        *   `"resource"`: Error related to a resource (e.g., resource not found).
        *   `"unknown"`: When the exact location cannot be determined.
    *   `location` (string): The specific identifier of the problematic part (e.g., `"email"` for a body field, `"userId"` for a path parameter, `"Authorization"` for a header).
    *   `message` (string): A precise error message for the specific `location`.

**Example: Validation Error (HTTP 400 Bad Request)**

```json
{
  "code": 400,
  "message": "Dữ liệu đầu vào không hợp lệ.",
  "errors": [
    {
      "locationType": "body",
      "location": "username",
      "message": "Tên đăng nhập phải có ít nhất 3 ký tự."
    },
    {
      "locationType": "body",
      "location": "email",
      "message": "Định dạng email không hợp lệ."
    }
  ]
}
```

**Example: Unauthorized Error (HTTP 401 Unauthorized)**

```json
{
  "code": 401,
  "message": "Không được ủy quyền: Token xác thực không hợp lệ hoặc bị thiếu.",
  "errors": [
    {
      "locationType": "header",
      "location": "Authorization",
      "message": "Token JWT không hợp lệ hoặc đã hết hạn."
    }
  ]
}
```

**Example: Not Found Error (HTTP 404 Not Found)**

```json
{
  "code": 404,
  "message": "Không tìm thấy tài nguyên.",
  "errors": [
    {
      "locationType": "resource",
      "location": "id",
      "message": "Không tìm thấy người dùng với ID đã cung cấp."
    }
  ]
}
