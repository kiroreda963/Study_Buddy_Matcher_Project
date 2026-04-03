const { PrismaClient } = require("@prisma/client");
const { publishEvent, disconnectProducer } = require("../kafka/producer");
const { topics } = require("../kafka/config");

const prisma = new PrismaClient();

const publishAvailabilityEvent = async (eventName, payload) => {
  return publishEvent({
    topic: topics.availability,
    key: payload.userId,
    value: {
      eventName,
      timestamp: new Date().toISOString(),
      producerService: "availability-service",
      correlationId: payload.id,
      payload,
    },
  });
};

const shutdownResources = async () => {
  await disconnectProducer();
  await prisma.$disconnect();
};

module.exports = {
  prisma,
  publishAvailabilityEvent,
  shutdownResources,
};
