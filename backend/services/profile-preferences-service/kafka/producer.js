const { Kafka } = require("kafkajs");

const kafka = new Kafka({
<<<<<<< HEAD
  clientId: "user-auth-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  connectionTimeout: 3000,
  requestTimeout: 3000,
  retry: {
    maxRetryTime: 3000,
    initialRetryTime: 100,
    multiplier: 2,
    randomizationFactor: 0.2,
    maxAttempts: 3,
  },
});

const producer = kafka.producer();
let isConnected = false;
=======
  clientId: "profile-preferences-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer();
>>>>>>> origin/profile-preferences-service

const connectProducer = async () => {
  try {
    await producer.connect();
<<<<<<< HEAD
    isConnected = true;
    console.log("✓ Kafka producer connected");
  } catch (error) {
    isConnected = false;
    console.warn("⚠ Kafka producer unavailable (service running in degraded mode)");
    // Don't throw - allow service to run without Kafka
  }
};

const disconnectProducer = async () => {
  try {
    if (isConnected) {
      await producer.disconnect();
      console.log("Kafka producer disconnected");
    }
  } catch (error) {
    console.error("Failed to disconnect Kafka producer:", error.message);
  }
};

const publishEvent = async (topic, event) => {
  if (!isConnected) {
    console.debug(`ℹ Kafka unavailable - event not published: ${topic}`);
    return;
  }

=======
    console.log("[Kafka] Producer connected");
  } catch (err) {
    console.warn("[Kafka] Could not connect to Kafka, continuing without it:", err.message);
  }
};

const publishEvent = async (topic, eventPayload) => {
>>>>>>> origin/profile-preferences-service
  try {
    await producer.send({
      topic,
      messages: [
        {
<<<<<<< HEAD
          key: event.userId || event.id,
          value: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
=======
          value: JSON.stringify({
            eventName: eventPayload.eventName,
            timestamp: new Date().toISOString(),
            producerService: "profile-preferences-service",
            correlationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            payload: eventPayload.payload,
>>>>>>> origin/profile-preferences-service
          }),
        },
      ],
    });
<<<<<<< HEAD
    console.log(`✓ Event published: ${topic}`);
  } catch (error) {
    console.warn(`⚠ Failed to publish event to ${topic}:`, error.message);
  }
};

module.exports = {
  connectProducer,
  disconnectProducer,
  publishEvent,
};
=======
    console.log(`[Kafka] Event published to topic: ${topic}`);
  } catch (err) {
    console.warn("[Kafka] Could not publish event:", err.message);
  }
};

module.exports = { connectProducer, publishEvent };
>>>>>>> origin/profile-preferences-service
