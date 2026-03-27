# User Authentication Service - API Documentation

## Overview
This is a GraphQL-based user authentication service built with Apollo Server, Express, and Prisma. It provides secure user registration, login, profile management, and JWT-based authentication.

## Features Implemented

### Functional Requirements ✅
- **User Registration**: Register new accounts with email, password, and optional name
- **User Login**: Authenticate with email and password, receive JWT token
- **JWT Token Generation**: Secure tokens with 24-hour expiration
- **Profile Retrieval**: Authenticated users can retrieve their profile information
- **Profile Updates**: Users can update their email and name

### Non-Functional Requirements ✅
- **Password Hashing**: bcryptjs with salt rounds of 10
- **JWT Authentication**: Tokens protect all authenticated endpoints
- **Data Privacy**: Unauthorized access prevention through token validation
- **Error Handling**: Clear, descriptive error messages

## GraphQL API Endpoints

### Queries

#### `me` - Get Current User Profile
```graphql
query {
  me {
    id
    email
    name
    createdAt
    updatedAt
  }
}
```
**Authentication**: Required (Bearer token in Authorization header)
**Response**: User object

---

### Mutations

#### `register` - Create New User Account
```graphql
mutation {
  register(email: "user@example.com", password: "securePassword123", name: "John Doe") {
    token
    user {
      id
      email
      name
      createdAt
      updatedAt
    }
  }
}
```
**Authentication**: Not required
**Parameters**:
- `email` (String!, required): Unique email address
- `password` (String!, required): Password (hashed with bcryptjs)
- `name` (String, optional): User's display name

**Response**: AuthPayload with JWT token and user object

---

#### `login` - Authenticate User
```graphql
mutation {
  login(email: "user@example.com", password: "securePassword123") {
    token
    user {
      id
      email
      name
      createdAt
      updatedAt
    }
  }
}
```
**Authentication**: Not required
**Parameters**:
- `email` (String!, required): User's email
- `password` (String!, required): User's password

**Response**: AuthPayload with JWT token and user object
**Token Expiration**: 24 hours

---

#### `updateProfile` - Update User Information
```graphql
mutation {
  updateProfile(email: "newemail@example.com", name: "Jane Doe") {
    id
    email
    name
    createdAt
    updatedAt
  }
}
```
**Authentication**: Required (Bearer token in Authorization header)
**Parameters**:
- `email` (String, optional): New email address (must be unique)
- `name` (String, optional): New display name

**Response**: Updated user object
**Note**: At least one field must be provided to update

---

## Authentication

### Bearer Token Format
All authenticated requests must include an Authorization header:

```
Authorization: Bearer <jwt_token>
```

### JWT Token Structure
```json
{
  "userId": "uuid-v4-user-id",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Token Verification
- Tokens are verified using JWT_SECRET from environment
- Token expiration: 24 hours
- Invalid or expired tokens return "Unauthorized" error

---

## Data Model

### User Schema (Prisma)
```prisma
model User {
  id String @id @default(uuid())
  email String @unique
  password String (hashed)
  name String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `User already exists` | Email already registered | Use different email or login |
| `Invalid email or password` | Wrong credentials | Verify email and password |
| `Unauthorized` | Missing or invalid token | Include valid JWT token in header |
| `Email already in use` | Email taken by another user | Choose different email |
| `User not found` | User ID not in database | Verify user exists |
| `No fields to update` | updateProfile called without parameters | Provide email or name to update |

---

## Security Features

1. **Password Hashing**: bcryptjs with 10 salt rounds
2. **JWT Tokens**: HS256 algorithm with 24-hour expiration
3. **Authorization**: All protected queries/mutations verify JWT
4. **Email Uniqueness**: Prevents duplicate email registrations
5. **Input Validation**: GraphQL schema enforces required fields
6. **SQL Injection Prevention**: Prisma ORM parameterizes queries

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
PORT=3006
JWT_SECRET=Secret123
```

---

## Setup & Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Generate Prisma Client**
```bash
npx prisma generate
```

3. **Run Database Migrations** (if needed)
```bash
npx prisma migrate deploy
```

4. **Start Service**
```bash
node index.js
```

Service runs on `http://localhost:3006/graphql`

---

## Testing Examples

### 1. Register User
```graphql
mutation {
  register(
    email: "john@example.com"
    password: "SecurePass123"
    name: "John Doe"
  ) {
    token
    user {
      id
      email
      name
    }
  }
}
```

### 2. Login User
```graphql
mutation {
  login(
    email: "john@example.com"
    password: "SecurePass123"
  ) {
    token
    user {
      id
      email
      name
    }
  }
}
```

### 3. Get Profile (with token)
```graphql
query {
  me {
    id
    email
    name
    createdAt
    updatedAt
  }
}
```
*Include in header: `Authorization: Bearer <token_from_login>`*

### 4. Update Profile (with token)
```graphql
mutation {
  updateProfile(name: "Jane Doe", email: "jane@example.com") {
    id
    email
    name
    updatedAt
  }
}
```
*Include in header: `Authorization: Bearer <token>`*

---

## Health Check

```bash
curl http://localhost:3006/health
```
**Response**:
```json
{
  "status": "ok",
  "service": "user-service"
}
```

---

## Technology Stack

- **Framework**: Express.js, Apollo Server
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Password Security**: bcryptjs
- **API**: GraphQL
- **Message Queue**: Kafka (integrated)
- **Runtime**: Node.js

---

## Notes

- All timestamps are ISO 8601 format
- Error messages are user-friendly but informative
- Service includes Kafka integration for event publishing
- Graceful shutdown handles SIGINT and SIGTERM signals
