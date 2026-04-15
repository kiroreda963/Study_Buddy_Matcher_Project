require("dotenv").config();
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const jwt = require("jsonwebtoken");
const { connectProducer } = require("./kafka/producer");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const JWT_SECRET = process.env.JWT_SECRET;

async function createContext({ req }) {
  let user = null;
  const authHeader = req.headers.authorization;
  console.log("Auth header received:", authHeader);
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = { userId: decoded.userId };
        console.log("Decoded user:", user);
      }
    } catch (err) {
      console.error("Auth error:", err.message);
    }
  }
  console.log("Context user:", user);
  return { user };
}

async function startServer() {
  await connectProducer();

  const server = new ApolloServer({ typeDefs, resolvers });

  const { url } = await startStandaloneServer(server, {
    listen: { port: process.env.PORT },
    context: createContext,
  });

  console.log(`Profile & Preferences Service running at ${url}`);
}

startServer().catch(console.error);
