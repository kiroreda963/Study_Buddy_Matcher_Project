import dotenv from "dotenv";
import pkg from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const { PrismaClient } = pkg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_gr3G8centPVi@ep-square-scene-ag1fu3aj-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
export default prisma;

console.log("✅ Prisma Client initialized with Neon adapter");
