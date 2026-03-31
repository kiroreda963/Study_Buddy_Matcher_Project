# Kafka Events Documentation

## Overview

The user-auth service publishes and consumes events via Apache Kafka to enable inter-service communication and event-driven architecture.

## Published Events

### 1. user-registered

**Triggered**: When a new user successfully registers

**Topic**: `user-registered`

**Event Structure**:

```json
{
  "userId": "uuid-v4-user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "event": "USER_REGISTERED",
  "timestamp": "2024-03-27T10:30:00.000Z"
}
```

**Use Cases**:

- Send welcome email
- Create user preferences
- Initialize analytics tracking
- Sync with other services

---

### 2. user-logged-in

**Triggered**: When a user successfully logs in

**Topic**: `user-logged-in`

**Event Structure**:

```json
{
  "userId": "uuid-v4-user-id",
  "email": "user@example.com",
  "event": "USER_LOGGED_IN",
  "timestamp": "2024-03-27T10:30:00.000Z"
}
```

**Use Cases**:

- Track login activity/analytics
- Update user last-seen timestamp
- Trigger notifications
- Audit logging

---

### 3. user-updated

**Triggered**: When a user updates their profile (name or email)

**Topic**: `user-updated`

**Event Structure**:

```json
{
  "userId": "uuid-v4-user-id",
  "email": "newemail@example.com",
  "name": "Jane Doe",
  "event": "USER_UPDATED",
  "timestamp": "2024-03-27T10:30:00.000Z"
}
```

**Use Cases**:

- Update user data in other services
- Sync email changes across systems
- Update search indices
- Audit logging

---

## Consumed Events

### Subscribed Topics

Currently subscribes to:

- `user-registered`
- `user-logged-in`
- `user-updated`

Services can publish events on these topics for the user-auth service to consume and act upon if needed.

---

## Kafka Configuration

### Environment Variables

```env
KAFKA_BROKERS=localhost:9092,localhost:9093,localhost:9094
```

If not set, defaults to: `localhost:9092`

### Consumer Group

- **Group ID**: `user-auth-service-group`
- **From Beginning**: `false` (only processes new messages after consumer starts)

---

## Event Publishing Example

When a user registers:

```javascript
await publishEvent("user-registered", {
  userId: user.id,
  email: user.email,
  name: user.name,
  event: "USER_REGISTERED",
});
```

## Error Handling

- **Producer Not Connected**: Events are logged and not thrown (user creates successfully)
- **Consumer Error**: Individual messages are logged; service continues consuming
- **Connection Failures**: Logged to console; service attempts graceful shutdown

## Best Practices

1. **Idempotency**: Services consuming events should handle duplicate events
2. **Event Versions**: Include version field for future schema changes
3. **Ordering**: Events from same user are keyed by `userId` for ordering within partition
4. **Monitoring**: Monitor lag and consumer group status in production
5. **Topic Creation**: Pre-create topics with appropriate replication factor and partitions

---

## Testing Events Locally

### Using Kafka CLI tools:

**Consume events**:

```bash
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic user-registered --from-beginning
```

**Produce test event**:

```bash
kafka-console-producer.sh --bootstrap-server localhost:9092 \
  --topic user-registered
```

Then paste:

```json
{
  "userId": "test-123",
  "email": "test@example.com",
  "name": "Test User",
  "event": "USER_REGISTERED",
  "timestamp": "2024-03-27T10:30:00.000Z"
}
```

---

## Troubleshooting

| Issue                         | Solution                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| Consumer not receiving events | Check broker connection, topic exists, consumer group hasn't caught up |
| Producer connection error     | Verify Kafka broker is running on specified KAFKA_BROKERS              |
| Events not persisted          | Check topic retention policy and disk space                            |
| Duplicate events              | Implement idempotency in consuming services                            |

---

## Future Enhancements

- Add schema registry for event validation
- Implement event versioning
- Add dead-letter topic for failed messages
- Implement event replay capability
- Add metrics/monitoring for event latency
