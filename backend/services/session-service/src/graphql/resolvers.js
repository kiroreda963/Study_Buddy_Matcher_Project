import sessionController from "../session-controller.js";


const resolvers = {
  Query: {
    studySessions: async () => {
      return await sessionController.getAllStudySessions();
    },
    studySession: async (_, { id }) => {
      return await sessionController.getStudySessionById(id);
    },
    invitations: async (_, { sessionId }) => {
      return await sessionController.getInvitationsBySession(sessionId);
    },
    invitationsByUser: async (_, { userId }) => {
      return await sessionController.getInvitationsByUser(userId);
    },
  },
  Mutation: {
    createStudySession: async (_, args) => {

      return await sessionController.createStudySession(args);
    },
    updateStudySession: async (_, { id, ...data }) => {
      return await sessionController.updateStudySession(id, data);
    },
    deleteStudySession: async (_, { id }) => {
      return await sessionController.deleteStudySession(id);
    },
    createInvitation: async (_, args) => {
      return await sessionController.createInvitation(args);
    },
    updateInvitationStatus: async (_, { id, status }) => {
      return await sessionController.updateInvitationStatus(id, status);
    },
    deleteInvitation: async (_, { id }) => {
      return await sessionController.deleteInvitation(id);
    },
    joinStudySession: async (_, { userId, sessionId }) => {
      return await sessionController.joinStudySession(userId, sessionId);
    },
    leaveStudySession: async (_, { userId, sessionId }) => {
      return await sessionController.leaveStudySession(userId, sessionId);
    },
  },
};

export default resolvers;
