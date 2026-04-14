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
=======
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const typeDefs = require("./graphql/type-defs");
const resolvers = require("./graphql/resolvers");
const { buildContext, shutdownResources } = require("./graphql/context");

const PORT = Number(process.env.PORT || 3001);

const server = new ApolloServer({
  typeDefs,
  resolvers,
>>>>>>> availability-service
});

const startServer = async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: buildContext,
  });
  console.log(`Availability Service running at ${url}`);
};

startServer();

const gracefulShutdown = async () => {
  await shutdownResources();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
