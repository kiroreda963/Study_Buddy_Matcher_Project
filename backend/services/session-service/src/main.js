import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import typeDefs from "./graphql/schema.js";
import resolvers from "./graphql/resolvers.js";
import { createContext } from "./graphql/context.js";


const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: createContext,
});

console.log(`🚀  Server ready at: ${url}`);
