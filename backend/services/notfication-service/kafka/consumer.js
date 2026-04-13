const { Kafka } = require("kafkajs");
const { prisma } = require("../db/prisma");

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

const consumer = kafka.consumer({ groupId: "notification-service-group" });
let isConnected = false;

const startConsumer = async () => {
  try {
    await consumer.connect();
    isConnected = true;
    console.log("✓ Kafka consumer connected");

    // Subscribe to topics
    await consumer.subscribe({
      topics: ["session-created", "user-logged-in", "user-updated"],
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
            case "session-created":
              const formatDate = new Date(event.date).toLocaleString();
              sendNotification(
                event.authorId,
                `Session created Successfully on ${formatDate}`,
              );
              console.log(
                `[session-created] userId: ${event.authorId} + formatDate: ${formatDate}`,
              );
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
    console.warn(
      "⚠ Kafka consumer unavailable (service running in degraded mode)",
    );
  }
};

const sendNotification = async (userId, message) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });
    console.log(`✓ Notification created for userId: ${userId}`);
  } catch (error) {
    console.error("Failed to create notification:", error.message);
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
