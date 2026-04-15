const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "user-auth-service",
  brokers: process.env.KAFKA_BROKERS.split(","),
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

const connectProducer = async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log("✓ Kafka producer connected");
  } catch (error) {
    isConnected = false;
    console.warn(
      "⚠ Kafka producer unavailable (service running in degraded mode)",
    );
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

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: event.userId || event.id,
          value: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
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
