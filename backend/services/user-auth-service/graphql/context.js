// graphql/context.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { prisma } = require("../db/prisma");

const JWT_SECRET = process.env.JWT_SECRET;

async function createContext({ req }) {
  let user = null;

  // Extract and verify JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = { userId: decoded.userId };
      }
    } catch (err) {
      console.error("Auth error:", err.message);
    }
  }

  return {
    prisma,
    user,
  };
}

module.exports = { createContext };
