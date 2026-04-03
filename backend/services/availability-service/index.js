const dotenv = require("dotenv");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const typeDefs = require("./graphql/type-defs");
const resolvers = require("./graphql/resolvers");
const { shutdownResources } = require("./graphql/context");

dotenv.config();

const PORT = Number(process.env.PORT || 3001);

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startServer = async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
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
