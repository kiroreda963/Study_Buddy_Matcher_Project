import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req) => {
  try {
    // Authorization header format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Return user info to be used in resolvers
    return { userId: decoded.userId };
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return null;
  }
};

module.exports = authMiddleware;
