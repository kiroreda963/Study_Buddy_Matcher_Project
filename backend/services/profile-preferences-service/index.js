<<<<<<< HEAD
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

const { typeDefs } = require("./graphql/type-defs");
const { resolvers } = require("./graphql/resolver");
const { createContext } = require("./graphql/context");
const { connectProducer, disconnectProducer } = require("./kafka/producer");
const { startConsumer, stopConsumer } = require("./kafka/consumer");
const { prisma } = require("./db/prisma");

const PORT = process.env.PORT;

async function bootstrap() {
  // Create ApolloServer instance
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // plugins: [/* add any plugins here if needed */]
  });

  // Start the server (do NOT call server.start() separately)
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: createContext,
  });

  // Start Kafka producer and consumer after server is running
  await connectProducer();
  await startConsumer();

  console.log(`User service running on ${url}`);
}

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down...");
  await disconnectProducer();
  await stopConsumer();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

bootstrap().catch((err) => {
  console.error("Failed to start service:", err);
  process.exit(1);
});
=======
require("dotenv").config();
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const jwt = require("jsonwebtoken");
const { connectProducer } = require("./kafka/producer");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const JWT_SECRET = process.env.JWT_SECRET;

async function createContext({ req }) {
  let user = null;
  const authHeader = req.headers.authorization;
  console.log("Auth header received:", authHeader);
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = { userId: decoded.userId };
        console.log("Decoded user:", user);
      }
    } catch (err) {
      console.error("Auth error:", err.message);
    }
  }
  console.log("Context user:", user);
  return { user };
}

async function startServer() {
  await connectProducer();

  const server = new ApolloServer({ typeDefs, resolvers });

  const { url } = await startStandaloneServer(server, {
    listen: { port: process.env.PORT || 4002 },
    context: createContext,
  });

  console.log(`Profile & Preferences Service running at ${url}`);
}

startServer().catch(console.error);
>>>>>>> origin/profile-preferences-service
