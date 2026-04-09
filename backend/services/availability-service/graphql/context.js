const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { publishEvent, disconnectProducer } = require("../kafka/producer");
const { topics } = require("../kafka/config");

const prisma = new PrismaClient();
let cachedUserAuthJwtSecret;

const readUserAuthServiceJwtSecret = () => {
  if (cachedUserAuthJwtSecret !== undefined) {
    return cachedUserAuthJwtSecret;
  }

  const userAuthEnvPath = path.join(
    __dirname,
    "..",
    "..",
    "user-auth-service",
    ".env"
  );

  try {
    const envContents = fs.readFileSync(userAuthEnvPath, "utf8");
    const jwtSecretLine = envContents
      .split(/\r?\n/)
      .find((line) => line.trim().startsWith("JWT_SECRET="));

    if (!jwtSecretLine) {
      cachedUserAuthJwtSecret = null;
      return null;
    }

    const rawValue = jwtSecretLine.slice("JWT_SECRET=".length).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "").trim();

    cachedUserAuthJwtSecret = normalizedValue || null;
    return cachedUserAuthJwtSecret;
  } catch {
    cachedUserAuthJwtSecret = null;
    return null;
  }
};

const getJwtSecret = () => {
  return (
    process.env.USER_AUTH_JWT_SECRET ||
    process.env.AUTH_JWT_SECRET ||
    readUserAuthServiceJwtSecret() ||
    process.env.JWT_SECRET ||
    null
  );
};

const getUserIdFromPayload = (decoded) => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }

  const directUserId =
    decoded.userId ?? decoded.user_id ?? decoded.id ?? decoded.sub ?? null;
  if (directUserId !== null && directUserId !== undefined && directUserId !== "") {
    return String(directUserId);
  }

  const nestedUserId = decoded.user?.id ?? decoded.user?.userId ?? null;
  if (nestedUserId !== null && nestedUserId !== undefined && nestedUserId !== "") {
    return String(nestedUserId);
  }

  return null;
};

const getUserIdFromToken = (authorizationHeader) => {
  const normalizedAuthHeader = Array.isArray(authorizationHeader)
    ? authorizationHeader.find(Boolean) || ""
    : authorizationHeader;

  if (!normalizedAuthHeader || typeof normalizedAuthHeader !== "string") {
    return null;
  }

  // Be tolerant: clients may send quoted values, or even `Bearer "<jwt>"`.
  // Also, some tools may accidentally double-quote the entire header value.
  const cleanedAuthHeader = normalizedAuthHeader.trim();

  // First try to extract a JWT-like substring anywhere in the header.
  const jwtLikeMatch = cleanedAuthHeader.match(
    /([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/
  );
  const tokenFromAnywhere = jwtLikeMatch ? jwtLikeMatch[1] : null;

  // Fallback: strip wrapping quotes and parse `Bearer ...`.
  const unquoted = cleanedAuthHeader.replace(/^["']+|["']+$/g, "").trim();
  const tokenMatch = unquoted.match(/^Bearer\s+(.+)$/i);
  const tokenFromBearer = tokenMatch ? tokenMatch[1].trim() : null;

  let token = tokenFromAnywhere || tokenFromBearer || unquoted;
  if (typeof token === "string") {
    // Strip wrapping quotes again, and trim.
    token = token.trim().replace(/^["']+|["']+$/g, "").trim();

    // If token still has spaces or is still prefixed with Bearer, try extracting JWT again.
    const tokenJwtMatch = token.match(
      /([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/
    );
    if (tokenJwtMatch) {
      token = tokenJwtMatch[1];
    }

    // Remove any accidental non-base64url characters (keeps dots).
    token = token.replace(/[^A-Za-z0-9_.-]/g, "");
  }
  if (!token) {
    return null;
  }

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return getUserIdFromPayload(decoded);
  } catch (err) {
    if (process.env.DEBUG_AUTH === "true") {
      const segments =
        typeof token === "string" ? token.split(".").filter(Boolean).length : 0;
      console.warn(
        "[availability-service] JWT verification failed:",
        err?.message || err
      );
      console.warn("[availability-service] token debug:", {
        tokenLength: typeof token === "string" ? token.length : null,
        segmentCount: segments,
        tokenPreview:
          typeof token === "string"
            ? token.slice(0, 12) + "..." + token.slice(-12)
            : null,
      });
    }
    return null;
  }
};

const buildContext = async ({ req }) => {
  const headers = req?.headers || {};
  const authHeader =
    headers.authorization ||
    headers.Authorization ||
    headers["x-access-token"] ||
    headers["x-auth-token"];
  if (process.env.DEBUG_AUTH === "true") {
    const preview =
      typeof authHeader === "string"
        ? authHeader.slice(0, 20) + (authHeader.length > 20 ? "..." : "")
        : authHeader;
    console.warn("[availability-service] auth header:", preview || "(missing)");
  }
  const currentUserId = getUserIdFromToken(authHeader);
  return { currentUserId };
};

const publishAvailabilityEvent = async (eventName, payload) => {
  return publishEvent({
    topic: topics.availability,
    key: payload.userId,
    value: {
      eventName,
      timestamp: new Date().toISOString(),
      producerService: "availability-service",
      correlationId: payload.id,
      payload,
    },
  });
};

const shutdownResources = async () => {
  await disconnectProducer();
  await prisma.$disconnect();
};

module.exports = {
  prisma,
  buildContext,
  publishAvailabilityEvent,
  shutdownResources,
};
