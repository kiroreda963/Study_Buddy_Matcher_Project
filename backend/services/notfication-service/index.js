const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

const { typeDefs } = require("./graphql/type-defs.js");
const { resolvers } = require("./graphql/resolver");
const { createContext } = require("./graphql/context");
//const { startConsumer, stopConsumer } = require("./kafka/consumer");
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

  // await startConsumer();

  console.log(`User service running on ${url}`);
}

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down...");
  // await stopConsumer();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

bootstrap().catch((err) => {
  console.error("Failed to start service:", err);
  process.exit(1);
});
