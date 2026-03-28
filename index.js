import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { neon } from "@neondatabase/serverless";
import typeDefs from "./graphql/schema.js";
import resolvers from "./graphql/resolvers.js";

// Database connection check
const sql = neon(process.env.DATABASE_URL);
try {
  const result = await sql`SELECT version()`;
  console.log("Connected to database:", result[0].version);
} catch (error) {
  console.error("Database connection failed:", error);
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
