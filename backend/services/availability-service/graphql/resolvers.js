const { Prisma } = require("@prisma/client");
const { prisma, publishAvailabilityEvent } = require("./context");

const requireAuth = (contextValue) => {
  if (!contextValue?.currentUserId) {
    throw new Error("Unauthorized. Missing or invalid token.");
  }
  return contextValue.currentUserId;
};

const ensureValidTimeRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid datetime format. Use ISO datetime strings.");
  }

  if (start >= end) {
    throw new Error("startTime must be earlier than endTime.");
  }
};

const serializeSlotDates = (slot) => {
  if (!slot) {
    return slot;
  }

  return {
    ...slot,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    createdAt: slot.createdAt.toISOString(),
    updatedAt: slot.updatedAt.toISOString(),
  };
};

const findOverlappingSlot = async ({
  tx,
  userId,
  startTime,
  endTime,
  excludingId,
}) => {
  return tx.availabilitySlot.findFirst({
    where: {
      userId,
      id: excludingId ? { not: excludingId } : undefined,
      AND: [
        { startTime: { lt: new Date(endTime) } },
        { endTime: { gt: new Date(startTime) } },
      ],
    },
  });
};

const resolvers = {
  Query: {
    getAvailabilityByUser: async (_, { userId }, contextValue) => {
      const currentUserId = requireAuth(contextValue);
      if (userId !== currentUserId) {
        throw new Error("Forbidden. You can only access your own availability.");
      }

      const slots = await prisma.availabilitySlot.findMany({
        where: { userId },
        orderBy: [{ startTime: "asc" }],
      });
      return slots.map(serializeSlotDates);
    },
    getAvailabilitySlotById: async (_, { id }, contextValue) => {
      const currentUserId = requireAuth(contextValue);
      const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
      if (!slot) {
        return null;
      }
      if (slot.userId !== currentUserId) {
        throw new Error("Forbidden. You can only access your own availability.");
      }
      return serializeSlotDates(slot);
    },
  },

  Mutation: {
    createAvailability: async (_, { input }, contextValue) => {
      const currentUserId = requireAuth(contextValue);
      const { startTime, endTime } = input;
      ensureValidTimeRange(startTime, endTime);

      const slot = await prisma.$transaction(
        async (tx) => {
          const overlap = await findOverlappingSlot({
            tx,
            userId: currentUserId,
            startTime,
            endTime,
          });

          if (overlap) {
            throw new Error(
              "This availability overlaps an existing slot for the same user/day."
            );
          }

          return tx.availabilitySlot.create({
            data: {
              userId: currentUserId,
              startTime: new Date(startTime),
              endTime: new Date(endTime),
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      const eventPublished = await publishAvailabilityEvent(
        "AvailabilityUpdated",
        slot
      );

      return {
        success: true,
        message: eventPublished
          ? "Availability created successfully."
          : "Availability created, but event publishing failed.",
        slot: serializeSlotDates(slot),
        eventPublished,
      };
    },

    updateAvailability: async (_, { id, input }, contextValue) => {
      const currentUserId = requireAuth(contextValue);
      const existing = await prisma.availabilitySlot.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          message: "Availability slot not found.",
          slot: null,
          eventPublished: false,
        };
      }
      if (existing.userId !== currentUserId) {
        throw new Error("Forbidden. You can only update your own availability.");
      }

      const nextStart = input.startTime || existing.startTime.toISOString();
      const nextEnd = input.endTime || existing.endTime.toISOString();

      ensureValidTimeRange(nextStart, nextEnd);

      const slot = await prisma.$transaction(
        async (tx) => {
          const overlap = await findOverlappingSlot({
            tx,
            userId: existing.userId,
            startTime: nextStart,
            endTime: nextEnd,
            excludingId: id,
          });

          if (overlap) {
            throw new Error(
              "Updated availability overlaps an existing slot for the same user/day."
            );
          }

          return tx.availabilitySlot.update({
            where: { id },
            data: {
              startTime: new Date(nextStart),
              endTime: new Date(nextEnd),
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      const eventPublished = await publishAvailabilityEvent(
        "AvailabilityUpdated",
        slot
      );

      return {
        success: true,
        message: eventPublished
          ? "Availability updated successfully."
          : "Availability updated, but event publishing failed.",
        slot: serializeSlotDates(slot),
        eventPublished,
      };
    },

    deleteAvailability: async (_, { id }, contextValue) => {
      const currentUserId = requireAuth(contextValue);
      const existing = await prisma.availabilitySlot.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          message: "Availability slot not found.",
        };
      }
      if (existing.userId !== currentUserId) {
        throw new Error("Forbidden. You can only delete your own availability.");
      }

      await prisma.availabilitySlot.delete({ where: { id } });
      return {
        success: true,
        message: "Availability slot deleted successfully.",
      };
    },
  },
};

module.exports = resolvers;
