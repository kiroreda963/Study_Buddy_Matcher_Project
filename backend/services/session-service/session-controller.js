import { prisma } from "./config/prisma.js";
import {
  sendSessionCreatedEvent,
  sendSessionInvitationEvent,
  sendSessionUpdatedEvent,
} from "./kafka/producer.js";

const sessionController = {
  // StudySession CRUD
  async createStudySession(data, authorId) {
    const inviteeIds = Array.from(
      new Set((data.participants || []).map(String).filter((id) => id && id !== authorId)),
    );

    const session = await prisma.studySession.create({
      data: {
        topic: data.topic,
        authorId: authorId,
        date: new Date(data.date),
        duration: data.duration,
        sessionType: data.sessionType,
        contactInfo: data.contactInfo,
        participants: [],
      },
      include: { invitations: true },
    });

    for (const inviteeId of inviteeIds) {
      const invitation = await prisma.invitation.create({
        data: {
          authorId,
          inviteeId,
          sessionId: session.id,
        },
      });
      await sendSessionInvitationEvent(invitation);
    }

    const sessionWithInvitations = await prisma.studySession.findUnique({
      where: { id: session.id },
      include: { invitations: true },
    });

    await sendSessionCreatedEvent(session);
    return sessionWithInvitations;
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
      include: {
        session: true,
      },
    });
  },

  async getInvitationsByUser(userId) {
    return await prisma.invitation.findMany({
      where: { inviteeId: userId, status: "PENDING" },
      include: {
        session: true,
      },
    });
  },

  async updateInvitationStatus(id, status) {
    return await prisma.invitation.update({
      where: { id },
      data: { status },
      include: {
        session: true,
      },
    });
  },

  async acceptInvitation(id) {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await this.joinStudySession(invitation.inviteeId, invitation.sessionId);
    return await prisma.invitation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });
  },

  async rejectInvitation(id) {
    return await prisma.invitation.update({
      where: { id },
      data: { status: "DECLINED" },
    });
  },

  async deleteInvitation(id) {
    return await prisma.invitation.delete({
      where: { id },
    });
  },
};

export default sessionController;
