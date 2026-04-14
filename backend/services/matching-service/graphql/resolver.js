const {
  generateMatchesForUser,
  getMatches,
  getMatchProfileSnapshot,
  refreshProfileProjection,
  getMatchById,
  getBuddyRequests,
  getConnections,
  sendBuddyRequest,
  acceptBuddyRequest,
  rejectBuddyRequest,
  cancelBuddyRequest,
  ignoreMatch,
  removeConnection,
} = require("../services/matchingService");

const resolvers = {
  Query: {
    getMatches: async (_, args, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return getMatches(contextValue);
    },
    getMatchById: async (_, { matchId }, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return getMatchById(contextValue, matchId);
    },
    getBuddyRequests: async (_, args, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return getBuddyRequests(contextValue);
    },
    getConnections: async (_, args, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return getConnections(contextValue);
    },
    getMatchProfile: async (_, args, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return getMatchProfileSnapshot(contextValue);
    },
  },
  Mutation: {
    generateMatches: async (_, args, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return generateMatchesForUser(contextValue);
    },
    sendBuddyRequest: async (_, { receiverId }, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return sendBuddyRequest(contextValue, receiverId);
    },
    acceptBuddyRequest: async (_, { requestId }, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return acceptBuddyRequest(contextValue, requestId);
    },
    rejectBuddyRequest: async (_, { requestId }, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return rejectBuddyRequest(contextValue, requestId);
    },
    cancelBuddyRequest: async (_, { requestId }, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return cancelBuddyRequest(contextValue, requestId);
    },
    ignoreMatch: async (_, { matchId }, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return ignoreMatch(contextValue, matchId);
    },
    removeConnection: async (_, { connectedUserId }, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return removeConnection(contextValue, connectedUserId);
    },
    refreshUserProjection: async (_, args, contextValue) => {
      if (!contextValue.user?.userId) {
        throw new Error("Unauthorized");
      }
      return refreshProfileProjection(contextValue);
    },
  },
};

module.exports = resolvers;
