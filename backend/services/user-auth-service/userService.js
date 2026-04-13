require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("./db/prisma");
const { publishEvent } = require("./kafka/producer");

const JWT_SECRET = process.env.JWT_SECRET;

const registerUser = async (email, password, name) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name,
    },
  });

  // Publish user-registered event
  try {
    await publishEvent("user-registered", {
      userId: user.id,
      email: user.email,
      name: user.name,
      event: "USER_REGISTERED",
    });
  } catch (error) {
    console.error("Failed to publish user-registered event:", error);
    // Don't throw - user was created successfully
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
  return { token, user };
};

const addAdditionalUserInfo = async (
  userId,
  university,
  phone_number,
  academic_year,
) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      university,
      phone_number,
      academic_year,
    },
  });

  return updatedUser;
};

const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Publish user-logged-in event
  try {
    await publishEvent("user-logged-in", {
      userId: user.id,
      email: user.email,
      event: "USER_LOGGED_IN",
    });
  } catch (error) {
    console.error("Failed to publish user-logged-in event:", error);
    // Don't throw - authentication was successful
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
  return { token, user };
};

const getUserProfile = async (userId) => {
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const updateUserProfile = async (userId, email) => {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const updateData = {};
  if (email) updateData.email = email;

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  // Check if new email is already taken
  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Publish user-updated event
  try {
    await publishEvent("user-updated", {
      userId: user.id,
      email: user.email,
      event: "USER_UPDATED",
    });
  } catch (error) {
    console.error("Failed to publish user-updated event:", error);
    // Don't throw - user was updated successfully
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
  addAdditionalUserInfo,
};
