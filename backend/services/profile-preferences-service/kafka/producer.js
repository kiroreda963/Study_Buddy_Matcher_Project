const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
  clientId: "profile-preferences-service",
  brokers: process.env.KAFKA_BROKERS.split(","),
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log("[Kafka] Producer connected");
  } catch (err) {
    console.warn(
      "[Kafka] Could not connect to Kafka, continuing without it:",
      err.message,
    );
  }
};

const publishEvent = async (topic, eventPayload) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify({
            eventName: eventPayload.eventName,
            timestamp: new Date().toISOString(),
            producerService: "profile-preferences-service",
            correlationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            payload: eventPayload.payload,
          }),
        },
      ],
    });
    console.log(`[Kafka] Event published to topic: ${topic}`);
  } catch (err) {
    console.warn("[Kafka] Could not publish event:", err.message);
  }
};

module.exports = { connectProducer, publishEvent };
