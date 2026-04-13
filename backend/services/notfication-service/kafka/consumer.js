const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "notfication-service",
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
