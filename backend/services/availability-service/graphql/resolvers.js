const { DayOfWeek, Prisma } = require("@prisma/client");
const { prisma, publishAvailabilityEvent } = require("./context");

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
  dayOfWeek,
  startTime,
  endTime,
  excludingId,
}) => {
  return tx.availabilitySlot.findFirst({
    where: {
      userId,
      dayOfWeek,
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
    getAvailabilityByUser: async (_, { userId }) => {
      const slots = await prisma.availabilitySlot.findMany({
        where: { userId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
      return slots.map(serializeSlotDates);
    },
    getAvailabilitySlotById: async (_, { id }) => {
      const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
      return serializeSlotDates(slot);
    },
  },

  Mutation: {
    createAvailability: async (_, { input }) => {
      const { userId, dayOfWeek, startTime, endTime } = input;
      ensureValidTimeRange(startTime, endTime);

      if (!DayOfWeek[dayOfWeek]) {
        throw new Error("Invalid dayOfWeek value.");
      }

      const slot = await prisma.$transaction(
        async (tx) => {
          const overlap = await findOverlappingSlot({
            tx,
            userId,
            dayOfWeek,
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
              userId,
              dayOfWeek,
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

    updateAvailability: async (_, { id, input }) => {
      const existing = await prisma.availabilitySlot.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          message: "Availability slot not found.",
          slot: null,
          eventPublished: false,
        };
      }

      const nextDay = input.dayOfWeek || existing.dayOfWeek;
      const nextStart = input.startTime || existing.startTime.toISOString();
      const nextEnd = input.endTime || existing.endTime.toISOString();

      ensureValidTimeRange(nextStart, nextEnd);

      if (!DayOfWeek[nextDay]) {
        throw new Error("Invalid dayOfWeek value.");
      }

      const slot = await prisma.$transaction(
        async (tx) => {
          const overlap = await findOverlappingSlot({
            tx,
            userId: existing.userId,
            dayOfWeek: nextDay,
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
              dayOfWeek: nextDay,
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

    deleteAvailability: async (_, { id }) => {
      const existing = await prisma.availabilitySlot.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          message: "Availability slot not found.",
        };
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
