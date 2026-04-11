const { PrismaClient } = require("@prisma/client");
const { publishEvent } = require("../kafka/producer");

const prisma = new PrismaClient();

const resolvers = {
  Query: {
    getProfile: async (_, { userId }) => {
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
    createOrUpdateProfile: async (_, { userId, university, academicYear }) => {
      const profile = await prisma.userProfile.upsert({
        where: { userId },
        update: { university, academicYear },
        create: { userId, university, academicYear },
        include: { courses: true, topics: true, preferences: true },
      });
      return profile;
    },

    addCourse: async (_, { userId, courseName }) => {
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

    removeCourse: async (_, { userId, courseId }) => {
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

    addTopic: async (_, { userId, topicName }) => {
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

    removeTopic: async (_, { userId, topicId }) => {
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

    updatePreferences: async (_, { userId, preferences }) => {
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