const { Kafka } = require("kafkajs");

const kafka = new Kafka({
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

const consumer = kafka.consumer({ groupId: "user-auth-service-group" });
let isConnected = false;

const startConsumer = async () => {
  try {
    await consumer.connect();
    isConnected = true;
    console.log("✓ Kafka consumer connected");

    // Subscribe to topics
    await consumer.subscribe({
      topics: ["user-registered", "user-logged-in", "user-updated"],
      fromBeginning: false,
    });

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log(`✓ Event received: ${topic}`);

          // Process events based on topic
          switch (topic) {
            case "user-registered":
              console.log(`[user-registered] userId: ${event.userId}`);
              break;
            case "user-logged-in":
              console.log(`[user-logged-in] userId: ${event.userId}`);
              break;
            case "user-updated":
              console.log(`[user-updated] userId: ${event.userId}`);
              break;
            default:
              console.log(`[unknown] ${topic}`);
          }
        } catch (error) {
          console.error("Error processing Kafka message:", error.message);
        }
      },
    });
  } catch (error) {
    isConnected = false;
    console.warn("⚠ Kafka consumer unavailable (service running in degraded mode)");
  }
};

const stopConsumer = async () => {
  try {
    if (isConnected) {
      await consumer.disconnect();
      console.log("Kafka consumer disconnected");
    }
  } catch (error) {
    console.error("Failed to disconnect Kafka consumer:", error.message);
  }
};

module.exports = {
  startConsumer,
  stopConsumer,
};
