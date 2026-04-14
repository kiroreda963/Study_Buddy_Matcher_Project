const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "matching-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  connectionTimeout: 3000,
  requestTimeout: 3000,
});

const producer = kafka.producer();
let isConnected = false;

async function connectProducer() {
  try {
    await producer.connect();
    isConnected = true;
    console.log("Matching Kafka producer connected");
  } catch (error) {
    isConnected = false;
    console.warn("Matching Kafka producer unavailable:", error.message);
  }
}

async function disconnectProducer() {
  try {
    if (isConnected) {
      await producer.disconnect();
      isConnected = false;
    }
  } catch (error) {
    console.warn("Failed to disconnect matching Kafka producer:", error.message);
  }
}

async function publishEvent(topic, event) {
  if (!isConnected) {
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: String(event?.payload?.userId || event?.userId || "matching"),
          value: JSON.stringify(event),
        },
      ],
    });
  } catch (error) {
    console.warn(`Failed to publish to ${topic}:`, error.message);
  }
}

module.exports = {
  connectProducer,
  disconnectProducer,
  publishEvent,
};
