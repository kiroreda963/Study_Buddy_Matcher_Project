const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const typeDefs = require("./graphql/type-defs");
const resolvers = require("./graphql/resolver");
const { createContext } = require("./graphql/context");
const { connectProducer, disconnectProducer } = require("./kafka/producer");
const { startConsumer, stopConsumer } = require("./kafka/consumer");
const { prisma } = require("./db/prisma");

const PORT = Number(process.env.PORT);

async function startServer() {
  await connectProducer();
  await startConsumer();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: createContext,
  });

  console.log(`Matching Service running at ${url}`);
}

async function gracefulShutdown() {
  await stopConsumer();
  await disconnectProducer();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

startServer().catch(async (error) => {
  console.error("Failed to start matching service:", error);
  await gracefulShutdown();
});
