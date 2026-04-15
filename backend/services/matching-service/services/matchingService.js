const { prisma } = require("../db/prisma");
const { calculateScore } = require("../utils/matchingUtils");
const { publishEvent } = require("../kafka/producer");

async function upsertProfileProjectionFromProfileService(contextOrUserId, profilePayload = null) {
  const userId =
    typeof contextOrUserId === "string"
      ? contextOrUserId
      : contextOrUserId?.user?.userId;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const existingProfile = await prisma.matchProfile.findUnique({
    where: { userId: String(userId) },
  });

  if (!profilePayload && !existingProfile) {
    // Do not create an empty projection when no profile payload is available.
    return null;
  }

  const profile = await prisma.matchProfile.upsert({
    where: { userId: String(userId) },
    update: {
      preferredPace: profilePayload?.preferences?.studyPace ?? undefined,
      preferredMode: profilePayload?.preferences?.studyMode ?? undefined,
      preferredGroupSize: profilePayload?.preferences?.groupSize ? parseInt(profilePayload.preferences.groupSize) : undefined,
      preferredStyle: profilePayload?.preferences?.studyStyle ?? undefined,
    },
    create: {
      userId: String(userId),
      preferredPace: profilePayload?.preferences?.studyPace ?? null,
      preferredMode: profilePayload?.preferences?.studyMode ?? null,
      preferredGroupSize: profilePayload?.preferences?.groupSize ? parseInt(profilePayload.preferences.groupSize) : null,
      preferredStyle: profilePayload?.preferences?.studyStyle ?? null,
    },
  });

  if (profilePayload?.courses) {
    await prisma.course.deleteMany({
      where: { matchProfileId: profile.id }
    });

    if (profilePayload.courses.length > 0) {
      await prisma.course.createMany({
        data: profilePayload.courses.map((course) => ({
          name: course.name,
          matchProfileId: profile.id,
        })),
      });
    }
  }

  if (profilePayload?.topics) {
    await prisma.topic.deleteMany({
      where: { matchProfileId: profile.id }
    });

    if (profilePayload.topics.length > 0) {
      await prisma.topic.createMany({
        data: profilePayload.topics.map((topic) => ({
          name: topic.name,
          matchProfileId: profile.id,
        })),
      });
    }
  }

  return prisma.matchProfile.findUnique({
    where: { userId: String(userId) },
    include: {
      courses: true,
      topics: true,
      availabilitySlots: true,
    },
  });
}
async function generateMatchesForUser(context) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const currentUser = await prisma.matchProfile.findUnique({
    where: { userId },
    include: {
      courses: true,
      topics: true,
      availabilitySlots: true
    }
  });

  if (!currentUser) {
    throw new Error("User matching profile not found");
  }

  const others = await prisma.matchProfile.findMany({
    where: {
      userId: { not: userId }
    },
    include: {
      courses: true,
      topics: true,
      availabilitySlots: true
    }
  });

  const savedMatches = [];

  for (const other of others) {
    const { score, reasons } = calculateScore(currentUser, other);

    if (score > 0) {
      const match = await prisma.match.upsert({
        where: {
          userId_matchedUserId: {
            userId,
            matchedUserId: other.userId
          }
        },
        update: {
          score,
          reasons
        },
        create: {
          userId,
          matchedUserId: other.userId,
          score,
          reasons
        }
      });

      savedMatches.push(match);

      // Publish Kafka event for match generation
      await publishEvent("match-generated", {
        eventName: "MatchGenerated",
        timestamp: new Date().toISOString(),
        producerService: "matching-service",
        correlationId: `${userId}-${other.userId}-${Date.now()}`,
        payload: {
          userId,
          matchedUserId: other.userId,
          score,
          reasons
        },
      });
    }
  }

  return savedMatches.sort((a, b) => b.score - a.score);
}

async function getMatchProfileSnapshot(context) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const profile = await prisma.matchProfile.findUnique({
    where: { userId: String(userId) },
    include: {
      courses: true,
      topics: true,
      availabilitySlots: true,
    },
  });

  if (!profile) {
    return null;
  }

  return {
    userId: profile.userId,
    preferredPace: profile.preferredPace,
    preferredMode: profile.preferredMode,
    preferredGroupSize: profile.preferredGroupSize ? parseInt(profile.preferredGroupSize) : null,
    preferredStyle: profile.preferredStyle,
    courses: profile.courses.map((course) => course.name),
    topics: profile.topics.map((topic) => topic.name),
    availabilitySlots: profile.availabilitySlots,
  };
}
async function getMatchById(context, matchId) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [
        { userId: userId },
        { matchedUserId: userId }
      ]
    }
  });
  
  if (!match) {
    throw new Error("Match not found or access denied");
  }
  
  return match;
}

async function getUserMatches(context) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  return prisma.match.findMany({
    where: {
      OR: [
        { userId: userId },
        { matchedUserId: userId }
      ]
    },
    orderBy: { score: "desc" }
  });
}

async function recalculateMatches(context) {
  return generateMatchesForUser(context);
}

async function getBuddyRequests(context) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  return prisma.buddyRequest.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING'
    },
    orderBy: { createdAt: "desc" }
  });
}

async function getConnections(context) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  return prisma.connection.findMany({
    where: {
      OR: [
        { userId1: userId },
        { userId2: userId }
      ]
    },
    orderBy: { connectedAt: "desc" }
  });
}

async function sendBuddyRequest(context, receiverId) {
  const senderId = context.user?.userId;
  if (!senderId) {
    throw new Error("User not authenticated");
  }
  
  if (senderId === receiverId) {
    throw new Error("Cannot send buddy request to yourself");
  }
  
  const existingRequest = await prisma.buddyRequest.findFirst({
    where: {
      senderId: senderId,
      receiverId: receiverId,
      status: { in: ['PENDING', 'ACCEPTED'] }
    }
  });
  
  if (existingRequest) {
    throw new Error("Buddy request already exists or has been accepted");
  }
  
  const existingConnection = await prisma.connection.findFirst({
    where: {
      OR: [
        { userId1: senderId, userId2: receiverId },
        { userId1: receiverId, userId2: senderId }
      ]
    }
  });
  
  if (existingConnection) {
    throw new Error("Already connected with this user");
  }
  
  const buddyRequest = await prisma.buddyRequest.create({
    data: {
      senderId,
      receiverId,
      status: 'PENDING'
    }
  });

  // Publish Kafka event for buddy request creation
  await publishEvent("buddy-request-sent", {
    eventName: "BuddyRequestSent",
    timestamp: new Date().toISOString(),
    producerService: "matching-service",
    correlationId: `${senderId}-${receiverId}-${Date.now()}`,
    payload: {
      requestId: buddyRequest.id,
      senderId,
      receiverId,
      status: 'PENDING'
    }
  });

  return buddyRequest;
}

async function acceptBuddyRequest(context, requestId) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const request = await prisma.buddyRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!request) {
    throw new Error("Buddy request not found");
  }
  
  if (request.receiverId !== userId) {
    throw new Error("Only the receiver can accept this request");
  }
  
  if (request.status !== 'PENDING') {
    throw new Error("Request is no longer pending");
  }
  
  const [connection, updatedRequest] = await prisma.$transaction([
    // Create connection between users with normalized ordering
    prisma.connection.create({
      data: {
        userId1: request.senderId < request.receiverId ? request.senderId : request.receiverId,
        userId2: request.senderId < request.receiverId ? request.receiverId : request.senderId
      }
    }),
 prisma.buddyRequest.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' }})
  ]);

  // Publish Kafka event for buddy request acceptance
  await publishEvent("buddy-request-sent", {
    eventName: "BuddyRequestAccepted",
    timestamp: new Date().toISOString(),
    producerService: "matching-service",
    correlationId: `${request.senderId}-${request.receiverId}-${Date.now()}`,
    payload: {
      requestId: request.id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      connectionId: connection.id,
      action: 'accepted'
    }
  });
  
return updatedRequest;}

async function rejectBuddyRequest(context, requestId) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const request = await prisma.buddyRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!request) {
    throw new Error("Buddy request not found");
  }
  
  if (request.receiverId !== userId) {
    throw new Error("Only the receiver can reject this request");
  }
  
  if (request.status !== 'PENDING') {
    throw new Error("Request is no longer pending");
  }
  
  const updatedRequest = await prisma.buddyRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED' }
  });

  // Publish Kafka event for buddy request rejection
  await publishEvent("buddy-request-sent", {
    eventName: "BuddyRequestRejected",
    timestamp: new Date().toISOString(),
    producerService: "matching-service",
    correlationId: `${request.senderId}-${request.receiverId}-${Date.now()}`,
    payload: {
      requestId: request.id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      action: 'rejected'
    }
  });

  return updatedRequest;
}

async function cancelBuddyRequest(context, requestId) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const request = await prisma.buddyRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!request) {
    throw new Error("Buddy request not found");
  }
  
  if (request.senderId !== userId) {
    throw new Error("Only the sender can cancel this request");
  }
  
  if (request.status !== 'PENDING') {
    throw new Error("Only pending requests can be cancelled");
  }
  
  return prisma.buddyRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' }
  });
}

async function ignoreMatch(context, matchId) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      userId: userId
    }
  });
  
  if (!match) {
    throw new Error("Match not found or access denied");
  }
  
  return prisma.match.update({
    where: { id: matchId },
    data: { ignored: true }
  });
}

async function removeConnection(context, connectedUserId) {
  const userId = context.user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { userId1: userId, userId2: connectedUserId },
        { userId1: connectedUserId, userId2: userId }
      ]
    }
  });
  
  if (!connection) {
    return {
      success: false,
      message: "Connection not found"
    };
  }
  
  await prisma.connection.delete({
    where: { id: connection.id }
  });
  
  return {
    success: true,
    message: "Connection removed successfully"
  };
}
async function upsertAvailabilityProjection(slot) {
  if (!slot?.userId || !slot?.id) {
    throw new Error("Invalid availability slot payload");
  }

  const userId = String(slot.userId);

  // Derive dayOfWeek from startTime if not provided
  const dayOfWeek = slot.dayOfWeek || new Date(slot.startTime).toLocaleDateString("en-US", { weekday: "long" });

  const profile = await prisma.matchProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      preferredPace: null,
      preferredMode: null,
      preferredGroupSize: null,
      preferredStyle: null,
    },
  });

  await prisma.availabilitySlot.upsert({
    where: { id: String(slot.id) },
    update: {
      dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      userId,
      matchProfileId: profile.id,
    },
    create: {
      id: String(slot.id),
      dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      userId,
      matchProfileId: profile.id,
    },
  });

  return prisma.matchProfile.findUnique({
    where: { userId },
    include: {
      courses: true,
      topics: true,
      availabilitySlots: true,
    },
  });
}



module.exports = {
  generateMatchesForUser,
  getMatchProfileSnapshot,
  upsertAvailabilityProjection,
  upsertProfileProjectionFromProfileService,
  getMatchById,
  getBuddyRequests,
  getConnections,
  sendBuddyRequest,
  acceptBuddyRequest,
  rejectBuddyRequest,
  cancelBuddyRequest,
  ignoreMatch,
  removeConnection,
};