import prismaData from "./config/prisma.js";
const { prisma } = prismaData;
import { sendSessionCreatedEvent, sendSessionInvitationEvent, sendSessionUpdatedEvent } from "./kafka/producer.js";

const sessionController = {
    // StudySession CRUD
    async createStudySession(data) {
        const session = await prisma.studySession.create({
            data: {
                topic: data.topic,
                date: new Date(data.date),
                time: data.time,
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

    async updateStudySession(id, data) {
        const session = await prisma.studySession.update({
            where: { id },
            data: {
                ...data,
                date: data.date ? new Date(data.date) : undefined,
            },
        });
        await sendSessionUpdatedEvent(session);
        return session;
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
    async createInvitation(data) {
        const invitation = await prisma.invitation.create({
            data: {
                userId: data.userId,
                sessionId: data.sessionId,
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
            where: { userId },
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
