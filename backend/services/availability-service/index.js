const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const typeDefs = require("./graphql/type-defs");
const resolvers = require("./graphql/resolvers");
const { buildContext, shutdownResources } = require("./graphql/context");

const PORT = Number(process.env.PORT);

const server = new ApolloServer({
  typeDefs,
  resolvers,
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
