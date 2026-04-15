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
      if (
        !args.notificationId ||
        !context.prismanotification.findUnique({
          where: { id: args.notificationId },
        })
      ) {
        throw new Error("Notification not found");
      }
      try {
        return await context.prisma.notification.update({
          where: { id: args.notificationId },
          data: { isRead: true },
        });
      } catch (error) {
        throw new Error("Failed to mark notification as read");
      }
    },
  },
};
module.exports = { resolvers };
