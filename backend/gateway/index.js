const ApolloServer = require("@apollo/server");
const startStandaloneServer = require("@apollo/server/standalone");
const typeDefs = require("./graphql/schema.js");
const resolvers = require("./graphql/resolvers.js");
const dotenv = require("dotenv");

dotenv.config();

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: process.env.PORT },
});

console.log(`🚀 Gateway running at ${url}`);
