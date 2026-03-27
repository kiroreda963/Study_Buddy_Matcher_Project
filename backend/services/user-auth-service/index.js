const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const http = require("http");
const cors = require("cors");
const { json } = require("body-parser");

const { typeDefs } = require("./graphql/type-defs");
const { resolvers } = require("./graphql/resolver");
const { createContext } = require("./graphql/context");
const { connectProducer, disconnectProducer } = require("./kafka/producer");
const { startConsumer, stopConsumer } = require("./kafka/consumer");
const { prisma } = require("./db/prisma");

const PORT = process.env.PORT;

async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    "/graphql",
    cors(),
    json(),
    expressMiddleware(server, {
      context: createContext,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "user-service" });
  });

  await connectProducer();
  await startConsumer();

  await new Promise((resolve) => httpServer.listen(PORT, resolve));
  console.log(`User service running on http://localhost:${PORT}/graphql`);
}

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
