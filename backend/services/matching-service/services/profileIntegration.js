const { prisma } = require("../db/prisma");

async function fetchProfileByUserId(userId, authToken = null) {
  // Query local database instead of making HTTP call
  const profile = await prisma.matchProfile.findUnique({
    where: { userId: String(userId) },
    include: {
      courses: true,
      topics: true,
    },
  });

  if (!profile) {
    return null;
  }

  // Transform to match the expected GraphQL response structure
  return {
    userId: profile.userId,
    courses: profile.courses.map(course => ({ name: course.name })),
    topics: profile.topics.map(topic => ({ name: topic.name })),
    preferences: {
      studyPace: profile.preferredPace,
      studyMode: profile.preferredMode,
      groupSize: profile.preferredGroupSize,
      studyStyle: profile.preferredStyle,
    }
  };
}

module.exports = {
  fetchProfileByUserId,
};
