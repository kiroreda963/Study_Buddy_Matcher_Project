const { Kafka } = require("kafkajs");
const {
  upsertAvailabilityProjection,
  upsertProfileProjectionFromProfileService,
  generateMatchesForUser,
} = require("../services/matchingService");

const kafka = new Kafka({
  clientId: "matching-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  connectionTimeout: 3000,
  requestTimeout: 3000,
});

const consumer = kafka.consumer({ groupId: "matching-service-group" });
let isConnected = false;

function tryParseMessage(message) {
  try {
    return JSON.parse(message.value.toString());
  } catch {
    return null;
  }
}

async function handleUserPreferenceEvent(event) {
  const userId = event?.payload?.userId;
  if (!userId) {
    return;
  }

  await upsertProfileProjectionFromProfileService(String(userId));
  await generateMatchesForUser(String(userId));
}

async function handleAvailabilityEvent(event) {
  const slot = event?.payload;
  if (!slot?.userId || !slot?.id) {
    return;
  }

  await upsertAvailabilityProjection(slot);
  await generateMatchesForUser(String(slot.userId));
}

async function startConsumer() {
  try {
    await consumer.connect();
    isConnected = true;
    console.log("Matching Kafka consumer connected");

    await consumer.subscribe({
      topics: [
        process.env.KAFKA_PROFILE_TOPIC || "UserPreferencesUpdated",
        process.env.KAFKA_AVAILABILITY_TOPIC || "availability-events",
      ],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const event = tryParseMessage(message);
        if (!event) {
          return;
        }

        try {
          if (
            topic ===
            (process.env.KAFKA_PROFILE_TOPIC || "UserPreferencesUpdated")
          ) {
            await handleUserPreferenceEvent(event);
            return;
          }

          if (
            topic ===
            (process.env.KAFKA_AVAILABILITY_TOPIC || "availability-events")
          ) {
            await handleAvailabilityEvent(event);
          }
        } catch (error) {
          console.warn(
            `Matching event handler failed for topic ${topic}:`,
            error.message,
          );
        }
      },
    });
  } catch (error) {
    isConnected = false;
    console.warn("Matching Kafka consumer unavailable:", error.message);
  }
}

async function stopConsumer() {
  try {
    if (isConnected) {
      await consumer.disconnect();
      isConnected = false;
    }
  } catch (error) {
    console.warn(
      "Failed to disconnect matching Kafka consumer:",
      error.message,
    );
  }
}

module.exports = {
  startConsumer,
  stopConsumer,
};
