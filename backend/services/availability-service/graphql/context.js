const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { publishEvent, disconnectProducer } = require("../kafka/producer");
const { topics } = require("../kafka/config");

const prisma = new PrismaClient();

const getUserIdFromToken = (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId || decoded.id || decoded.sub || null;
  } catch {
    return null;
  }
};

const buildContext = async ({ req }) => {
  const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
  const currentUserId = getUserIdFromToken(authHeader);
  return { currentUserId };
};

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
  buildContext,
  publishAvailabilityEvent,
  shutdownResources,
};
