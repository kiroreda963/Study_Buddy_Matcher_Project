const { kafka, topics } = require("./config");

const groupId =
  process.env.KAFKA_AVAILABILITY_CONSUMER_GROUP || "availability-service-group";

const consumer = kafka.consumer({ groupId });

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: topics.availability,
    fromBeginning: false,
  });

  console.log(
    `Kafka consumer is listening on topic "${topics.availability}" with group "${groupId}".`
  );

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString() || "{}";
      let parsed = {};

      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { rawMessage: raw };
      }

      console.log(
        `[availability-consumer] topic=${topic} partition=${partition} key=${message.key?.toString() || ""}`,
        parsed
      );
    },
  });
};

const shutdown = async () => {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error("Failed to disconnect Kafka consumer:", error.message);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startConsumer().catch((error) => {
  console.error("Kafka consumer failed to start:", error.message);
  if (String(error.message).toLowerCase().includes("connection error")) {
    console.error(
      "Kafka broker is unreachable. Check KAFKA_BROKERS in .env and start your Kafka server before running the consumer."
    );
  }
  process.exit(1);
});
