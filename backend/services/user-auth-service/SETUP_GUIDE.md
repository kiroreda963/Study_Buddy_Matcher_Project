# User Auth Service - Setup & Testing Guide

## Quick Start

### Prerequisites

- Node.js 16+ installed
- PostgreSQL database (configured in `.env`)
- Apache Kafka running (optional, service will gracefully fail if not available)

### Installation

1. **Install dependencies**:

```bash
cd backend/services/user-auth-service
npm install
```

2. **Setup environment variables** (already configured in `.env`):

```env
DATABASE_URL=postgresql://...
PORT=3006
JWT_SECRET=Secret123
KAFKA_BROKERS=localhost:9092
```

3. **Generate Prisma Client**:

```bash
npx prisma generate
```

4. **Run database migrations** (if creating fresh):

```bash
npx prisma migrate deploy
```

5. **Start the service**:

```bash
node index.js
```

Service will be available at: `http://localhost:3006/graphql`

---

## Testing the Service

### 1. Check Health Endpoint

```bash
curl http://localhost:3006/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "user-service"
}
```

---

### 2. Test Registration

**GraphQL Query**:

```graphql
mutation {
  register(
    email: "testuser@example.com"
    password: "SecurePassword123"
    name: "Test User"
  ) {
    token
    user {
      id
      email
      name
      createdAt
    }
  }
}
```

**Expected Response**:

```json
{
  "data": {
    "register": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "testuser@example.com",
        "name": "Test User",
        "createdAt": "2024-03-27T10:30:00.000Z"
      }
    }
  }
}
```

---

### 3. Test Login

**GraphQL Query**:

```graphql
mutation {
  login(email: "testuser@example.com", password: "SecurePassword123") {
    token
    user {
      id
      email
      name
    }
  }
}
```

**Save the token** for authenticated requests.

---

### 4. Test Profile Retrieval (Authenticated)

**Setup**: Include Authorization header in request:

```
Authorization: Bearer <token_from_login>
```

**GraphQL Query**:

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

**Expected Response**:

```json
{
  "data": {
    "me": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "testuser@example.com",
      "name": "Test User",
      "createdAt": "2024-03-27T10:30:00.000Z",
      "updatedAt": "2024-03-27T10:30:00.000Z"
    }
  }
}
```

---

### 5. Test Profile Update (Authenticated)

**GraphQL Query**:

```graphql
mutation {
  updateProfile(name: "Updated Name", email: "newemail@example.com") {
    id
    email
    name
    updatedAt
  }
}
```

**Authorization**: Required (Bearer token)

**Expected Response**:

```json
{
  "data": {
    "updateProfile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "newemail@example.com",
      "name": "Updated Name",
      "updatedAt": "2024-03-27T10:35:00.000Z"
    }
  }
}
```

---

## Using GraphQL Apollo Sandbox

1. Open **Apollo Sandbox**: `http://localhost:3006/graphql`
2. Click on **Headers** at bottom-left
3. Add header for authenticated requests:

```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

4. Write and execute queries

---

## Error Testing

### Test Duplicate Email Registration

```graphql
mutation {
  register(
    email: "testuser@example.com"
    password: "AnotherPassword"
    name: "Another User"
  ) {
    token
    user {
      email
    }
  }
}
```

**Expected Error**:

```json
{
  "errors": [
    {
      "message": "User already exists"
    }
  ]
}
```

---

### Test Invalid Password

```graphql
mutation {
  login(email: "testuser@example.com", password: "WrongPassword") {
    token
  }
}
```

**Expected Error**:

```json
{
  "errors": [
    {
      "message": "Invalid email or password"
    }
  ]
}
```

---

### Test Unauthorized Access

Make request to `me` query WITHOUT Authorization header:

**Expected Error**:

```json
{
  "errors": [
    {
      "message": "Unauthorized"
    }
  ]
}
```

---

## Kafka Event Testing

### Prerequisites

- Kafka brokers running on `localhost:9092`
- Kafka CLI tools installed

### Monitor user-registered Events

```bash
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic user-registered \
  --from-beginning
```

Then register a user and observe the event:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "name": "New User",
  "event": "USER_REGISTERED",
  "timestamp": "2024-03-27T10:40:00.000Z"
}
```

### View All Event Topics

```bash
kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

Should show:

- `user-registered`
- `user-logged-in`
- `user-updated`

---

## Database Inspection

### View Users in Database

```bash
psql -d neondb -c "SELECT * FROM \"User\";"
```

### Clear Database (Development Only)

```bash
npx prisma migrate reset
```

---

## Troubleshooting

### Service won't start

- Check DATABASE_URL is correct
- Verify PORT 3006 is not in use
- Check .env file is present

### Kafka connection fails

- Verify Kafka brokers are running
- Check KAFKA_BROKERS environment variable
- Service continues if Kafka unavailable (non-blocking)

### Authentication fails

- Verify JWT_SECRET in .env matches token generation
- Check token format: `Authorization: Bearer <token>`
- Ensure token hasn't expired (24-hour expiration)

### Prisma client errors

- Run: `npx prisma generate`
- Clear: `rm -rf dist/generated`
- Regenerate: `npx prisma generate`

---

## Docker Deployment (Optional)

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npx prisma generate

EXPOSE 3006

CMD ["node", "index.js"]
```

### Build and Run

```bash
docker build -t user-auth-service .
docker run -p 3006:3006 --env-file .env user-auth-service
```

---

## Performance Considerations

- **Password Hashing**: bcrypt with 10 rounds (adjustable in userService.js)
- **Token Expiration**: 24 hours (adjustable in userService.js)
- **Kafka Partitioning**: Events are keyed by userId for ordered consumption
- **Database Indices**: Email has unique constraint for fast lookup

---

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use HTTPS in production
- [ ] Implement rate limiting on auth endpoints
- [ ] Enable CORS appropriately
- [ ] Use environment variables for sensitive data
- [ ] Implement audit logging
- [ ] Monitor failed login attempts
- [ ] Use strong password requirements
- [ ] Implement token refresh mechanism

---

## API Documentation

See `API_DOCUMENTATION.md` for complete GraphQL API reference.

See `KAFKA_EVENTS.md` for Kafka event schema and publishing details.
