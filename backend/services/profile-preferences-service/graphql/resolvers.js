const { PrismaClient } = require("@prisma/client");
const { publishEvent } = require("../kafka/producer");

const prisma = new PrismaClient();

function profileEventPayload(userId, type, profile) {
  return {
    userId,
    type,
    courses: profile.courses.map((course) => ({ name: course.name })),
    topics: profile.topics.map((topic) => ({ name: topic.name })),
    preferences: profile.preferences
      ? {
          studyPace: profile.preferences.studyPace,
          studyMode: profile.preferences.studyMode,
          groupSize: profile.preferences.groupSize,
          studyStyle: profile.preferences.studyStyle,
        }
      : null,
  };
}

async function publishProfileUpdated(userId, type, profile) {
  await publishEvent("UserPreferencesUpdated", {
    eventName: "UserPreferencesUpdated",
    payload: profileEventPayload(userId, type, profile),
  });
}

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
    getProfileById: async (_, { userId }, context) => {
      if (!context.user) throw new Error("Unauthorized");
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
      const updated = await prisma.userProfile.upsert({
        where: { userId },
        update: { university, academicYear },
        create: { userId, university, academicYear },
        include: { courses: true, topics: true, preferences: true },
      });

      await publishProfileUpdated(userId, "profile_updated", updated);

      return updated;
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

      await publishProfileUpdated(userId, "course_added", updated);

      return updated;
    },

      removeCourse: async (_, { courseId }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const { userId } = context.user;

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { profile: true },
      });

      if (!course) {
        throw new Error("Course not found");
      }

      if (!course.profile || course.profile.userId !== userId) {
        throw new Error("You can only remove your own courses");
      }

      await prisma.course.delete({ where: { id: courseId } });

      const updated = await prisma.userProfile.findUnique({
        where: { userId },
        include: { courses: true, topics: true, preferences: true },
      });

      await publishProfileUpdated(userId, "course_removed", updated);

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

      await publishProfileUpdated(userId, "topic_added", updated);

      return updated;
    },

      removeTopic: async (_, { topicId }, context) => {
    if (!context.user) throw new Error("Unauthorized");
    const { userId } = context.user;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { profile: true },
    });

    if (!topic) {
      throw new Error("Topic not found");
    }

    if (!topic.profile || topic.profile.userId !== userId) {
      throw new Error("You can only remove your own topics");
    }

    await prisma.topic.delete({ where: { id: topicId } });

    const updated = await prisma.userProfile.findUnique({
      where: { userId },
      include: { courses: true, topics: true, preferences: true },
    });

    await publishProfileUpdated(userId, "topic_removed", updated);

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

      await publishProfileUpdated(userId, "preferences_updated", updated);

      return updated;
    },
  },
};

module.exports = resolvers;