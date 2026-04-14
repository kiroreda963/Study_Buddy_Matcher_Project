const { PrismaClient } = require("@prisma/client");
const { publishEvent } = require("../kafka/producer");

const prisma = new PrismaClient();

const resolvers = {
  Query: {
    getProfile: async (_, __, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const { userId } = context.user;
      return prisma.userProfile.findUnique({
        where: { userId },
        include: { courses: true, topics: true, preferences: true },
      });
    },
    getAllProfiles: async () => {
      return prisma.userProfile.findMany({
        include: { courses: true, topics: true, preferences: true },
      });
    },
  },

  Mutation: {
    createOrUpdateProfile: async (_, { university, academicYear }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const { userId } = context.user;
      return prisma.userProfile.upsert({
        where: { userId },
        update: { university, academicYear },
        create: { userId, university, academicYear },
        include: { courses: true, topics: true, preferences: true },
      });
    },

    addCourse: async (_, { courseName }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const { userId } = context.user;

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await prisma.course.create({
        data: { name: courseName, profileId: profile.id },
      });

      const updated = await prisma.userProfile.findUnique({
        where: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await publishEvent("UserPreferencesUpdated", {
        eventName: "UserPreferencesUpdated",
        payload: { userId, type: "course_added", courseName },
      });

      return updated;
    },

    removeCourse: async (_, { courseId }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const { userId } = context.user;

      await prisma.course.delete({ where: { id: courseId } });

      const updated = await prisma.userProfile.findUnique({
        where: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await publishEvent("UserPreferencesUpdated", {
        eventName: "UserPreferencesUpdated",
        payload: { userId, type: "course_removed", courseId },
      });

      return updated;
    },

    addTopic: async (_, { topicName }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const { userId } = context.user;

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await prisma.topic.create({
        data: { name: topicName, profileId: profile.id },
      });

      const updated = await prisma.userProfile.findUnique({
        where: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await publishEvent("UserPreferencesUpdated", {
        eventName: "UserPreferencesUpdated",
        payload: { userId, type: "topic_added", topicName },
      });

      return updated;
    },

    removeTopic: async (_, { topicId }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const { userId } = context.user;

      await prisma.topic.delete({ where: { id: topicId } });

      const updated = await prisma.userProfile.findUnique({
        where: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await publishEvent("UserPreferencesUpdated", {
        eventName: "UserPreferencesUpdated",
        payload: { userId, type: "topic_removed", topicId },
      });

      return updated;
    },

    updatePreferences: async (_, { preferences }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const { userId } = context.user;

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await prisma.studyPreference.upsert({
        where: { profileId: profile.id },
        update: { ...preferences },
        create: { profileId: profile.id, ...preferences },
      });

      const updated = await prisma.userProfile.findUnique({
        where: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await publishEvent("UserPreferencesUpdated", {
        eventName: "UserPreferencesUpdated",
        payload: { userId, type: "preferences_updated", preferences },
      });

      return updated;
    },
  },
};

module.exports = resolvers;