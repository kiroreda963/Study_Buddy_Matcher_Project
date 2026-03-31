import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
const connectionString = process.env.DATABASE_URL.trim();

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

console.log("Prisma Client initialized with Neon adapter");

export default { prisma };