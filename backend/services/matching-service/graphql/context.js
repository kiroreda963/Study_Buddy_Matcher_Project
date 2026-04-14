// graphql/context.js
const path = require("path");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { prisma } = require("../db/prisma");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== "string") {
    return null;
  }
  const cleaned = authorizationHeader.trim().replace(/^["']+|["']+$/g, "").trim();
  const jwtMatch = cleaned.match(
    /([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/
  );
  if (jwtMatch) {
    return jwtMatch[1];
  }
  const bearerMatch = cleaned.match(/^Bearer\s+(.+)$/i);
  return bearerMatch ? bearerMatch[1].trim() : null;
}

async function createContext({ req }) {
  let user = null;

  const headers = req?.headers || {};
  const authHeader =
    headers.authorization ||
    headers.Authorization ||
    headers["x-access-token"] ||
    headers["x-auth-token"];

  const jwtSecret = process.env.JWT_SECRET;
  const token = getBearerToken(
    Array.isArray(authHeader) ? authHeader.find(Boolean) : authHeader
  );

  if (token && jwtSecret) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      user = {
        userId:
          decoded.userId ??
          decoded.user_id ??
          decoded.id ??
          decoded.sub ??
          decoded?.user?.id ??
          null,
      };
    } catch (err) {
      console.error("Auth error:", err.message);
    }
  } else if (token && !jwtSecret) {
    console.error("Auth error: JWT_SECRET is not set in matching-service .env");
  }

  return {
    prisma,
    user,
  };
}

module.exports = { createContext };
