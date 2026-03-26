const express = require("express");
const dotenv = require("dotenv");
//const { PrismaClient } = require("@prisma/client");
dotenv.config();
const PORT = process.env.PORT;
const app = express();
//const prisma = new PrismaClient();

app.use(express.json());

app.listen(PORT, () => {
  console.log("User Service running on port " + PORT);
});
