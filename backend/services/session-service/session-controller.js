import { prisma } from "./config/prisma.js";
import {
  sendSessionCreatedEvent,
  sendSessionInvitationEvent,
  sendSessionUpdatedEvent,
} from "./kafka/producer.js";

const sessionController = {
  // StudySession CRUD
  async createStudySession(data, authorId, inviteeId) {
    const session = await prisma.studySession.create({
      data: {
        topic: data.topic,
        authorId: authorId,
        inviteeId: inviteeId,
        date: new Date(data.date),
        duration: data.duration,
        sessionType: data.sessionType,
        contactInfo: data.contactInfo,
        participants: data.participants || [],
      },
    });
    await sendSessionCreatedEvent(session);
    return session;
  },

  async getAllStudySessions() {
    return await prisma.studySession.findMany({
      include: { invitations: true },
    });
  },

  async getStudySessionById(id) {
    return await prisma.studySession.findUnique({
      where: { id },
      include: { invitations: true },
    });
  },

  async updateStudySession(id, data, userId) {
    const existingSession = await prisma.studySession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      throw new Error("Session not found");
    }

    if (existingSession.authorId !== userId) {
      throw new Error("Unauthorized");
    }

    const updatedSession = await prisma.studySession.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    await sendSessionUpdatedEvent(updatedSession);
    return updatedSession;
  },

  async joinStudySession(userId, sessionId) {
    return await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        participants: {
          push: userId,
        },
      },
    });
  },

  async leaveStudySession(userId, sessionId) {
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
      select: { participants: true },
    });

    if (!session) throw new Error("Session not found");

    return await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        participants: {
          set: session.participants.filter((id) => id !== userId),
        },
      },
    });
  },

  async deleteStudySession(id) {
    return await prisma.studySession.delete({
      where: { id },
    });
  },

  // Invitation CRUD
  async createInvitation(authorId, inviteeId, sessionId) {
    const invitation = await prisma.invitation.create({
      data: {
        authorId: authorId,
        inviteeId: inviteeId,
        sessionId: sessionId,
      },
    });

    await sendSessionInvitationEvent(invitation);
    return invitation;
  },

  async getInvitationsBySession(sessionId) {
    return await prisma.invitation.findMany({
      where: { sessionId },
    });
  },

  async getInvitationsByUser(userId) {
    return await prisma.invitation.findMany({
      where: { inviteeId: userId },
    });
  },

  async updateInvitationStatus(id, status) {
    return await prisma.invitation.update({
      where: { id },
      data: { status },
    });
  },

  async deleteInvitation(id) {
    return await prisma.invitation.delete({
      where: { id },
    });
  },
};

export default sessionController;
