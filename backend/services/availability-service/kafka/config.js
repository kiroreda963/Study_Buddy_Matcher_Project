const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Kafka } = require("kafkajs");

const brokerEnv = process.env.KAFKA_BROKERS;

const brokers = brokerEnv
  .split(",")
  .map((item) => item.replace(/^["']|["']$/g, "").trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: "availability-service",
  brokers,
});

const topics = {
  availability: process.env.KAFKA_AVAILABILITY_TOPIC || "availability-events",
};

module.exports = {
  kafka,
  brokers,
  topics,
};
