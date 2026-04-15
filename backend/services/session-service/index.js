import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import typeDefs from "./graphql/type-defs.js";
import resolvers from "./graphql/resolvers.js";
import { createContext } from "./graphql/context.js";
import { connectProducer, disconnectProducer } from "./kafka/producer.js";
import { prisma } from "./config/prisma.js";
import dotenv from "dotenv";
dotenv.config();
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

  console.log(`Session service running on ${url}`);
}

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down...");
  await disconnectProducer();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

bootstrap().catch((err) => {
  console.error("Failed to start service:", err);
  process.exit(1);
});
