import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import jwt from "jsonwebtoken";
import prismaData from "../config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;

export async function createContext({ req }) {
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
