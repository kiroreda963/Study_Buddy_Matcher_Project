const resolvers = {
  Query: {
    getNotifications: async (parent, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      try {
        return await context.prisma.notification.findMany({
          where: { userId: context.user.userId },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        throw new Error(
          "Failed to fetch notifications or no notifications found",
        );
      }
    },
  },
  Mutation: {
    markAsRead: async (_, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      const { notificationId } = args;
      if (!notificationId) {
        throw new Error("Notification ID required");
      }

      const existing = await context.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: context.user.userId,
        },
      });
      if (!existing) {
        throw new Error("Notification not found");
      }

      try {
        return await context.prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
      } catch (error) {
        throw new Error(error?.message || "Failed to mark notification as read");
      }
    },
    deleteNotification: async (_, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      const { notificationId } = args;
      if (!notificationId) {
        throw new Error("Notification ID required");
      }

      const existing = await context.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: context.user.userId,
        },
      });
      if (!existing) {
        throw new Error("Notification not found");
      }

      try {
        return await context.prisma.notification.delete({
          where: { id: notificationId },
        });
      } catch (error) {
        throw new Error(error?.message || "Failed to delete notification");
      }
    },
  },
};
module.exports = { resolvers };
