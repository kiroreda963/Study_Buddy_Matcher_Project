import sessionController from "../session-controller.js";

const resolvers = {
  Query: {
    studySessions: async (parent, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.getAllStudySessions();
    },
    studySession: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.getStudySessionById(id);
    },
    invitations: async (_, { sessionId }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.getInvitationsBySession(sessionId);
    },
    invitationsByUser: async (_, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.getInvitationsByUser(context.user.userId);
    },
  },
  Mutation: {
    createStudySession: async (_, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.createStudySession(
        args,
        context.user.userId,
      );
    },
    updateStudySession: async (_, { id, ...data }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.updateStudySession(
        id,
        data,
        context.user.userId,
      );
    },
    deleteStudySession: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.deleteStudySession(id);
    },
    createInvitation: async (_, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.createInvitation(args);
    },
    updateInvitationStatus: async (_, { id, status }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.updateInvitationStatus(id, status);
    },
    deleteInvitation: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.deleteInvitation(id);
    },
    joinStudySession: async (_, { sessionId }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.joinStudySession(
        context.user.userId,
        sessionId,
      );
    },
    leaveStudySession: async (_, { sessionId }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await sessionController.leaveStudySession(
        context.user.userId,
        sessionId,
      );
    },
  },
};

export default resolvers;
