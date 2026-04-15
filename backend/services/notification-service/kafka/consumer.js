const { Kafka } = require("kafkajs");
const { prisma } = require("../db/prisma");
require("dotenv").config();

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: process.env.KAFKA_BROKERS.split(","),
  connectionTimeout: 3000,
  requestTimeout: 3000,
  retry: {
    maxRetryTime: 3000,
    initialRetryTime: 100,
    multiplier: 2,
    randomizationFactor: 0.2,
    maxAttempts: 3,
  },
});

const consumer = kafka.consumer({ groupId: "notification-service-group" });
let isConnected = false;

// In-memory cache for sessions to check for reminders
const sessionCache = new Map();

const startConsumer = async () => {
  try {
    await consumer.connect();
    isConnected = true;
    console.log("✓ Kafka consumer connected");

    // Subscribe to topics
    await consumer.subscribe({
      topics: [
        "session-created",
        "session-invitation",
        "buddy-request-sent",
        "match-generated",
      ],
      fromBeginning: false,
    });

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log(`✓ Event received: ${topic}`);

          // Process events based on topic
          switch (topic) {
            case "session-created":
              const formatDate = new Date(event.date).toLocaleString();
              sendNotification(
                event.authorId,
                `Session created Successfully on ${formatDate}`,
                null,
                "SESSION_CREATED",
              );
              // Cache the session for reminder checks
              sessionCache.set(event.id, {
                id: event.id,
                authorId: event.authorId,
                topic: event.topic,
                date: new Date(event.date),
                duration: event.duration,
                participants: event.participants,
              });
              console.log(
                `[session-created] userId: ${event.authorId} + formatDate: ${formatDate}`,
              );
              break;
            case "session-invitation":
              sendNotification(
                event.inviteeId,
                `You have been invited to a session`,
                event.sessionId,
                "SESSION_INVITATION",
                event.sessionId,
              );
              console.log(`[session-invitation] userId: ${event.inviteeId}`);
              break;
            case "buddy-request-sent":
              sendNotification(
                event.receiverId,
                `You have received a buddy request`,
                event.senderId,
                "BUDDY_REQUEST_SENT",
              );
              console.log(
                `[buddy-request-recieved] userId: ${event.receiverId}`,
              );
            case "match-generated":
              sendNotification(
                event.userId,
                `You have a new match!`,
                event.matchedUserId,
                "MATCH_GENERATED",
              );
              console.log(`[match-generated] userId: ${event.userId}`);
              break;
            default:
              console.log(`[unknown] ${topic}`);
          }
        } catch (error) {
          console.error("Error processing Kafka message:", error.message);
        }
      },
    });
  } catch (error) {
    isConnected = false;
    console.warn(
      "⚠ Kafka consumer unavailable (service running in degraded mode)",
    );
  }
};

const sendNotification = async (
  userId,
  message,
  senderId,
  type,
  sessionId = null,
) => {
  try {
    await prisma.notification.create({
      data: {
        userId: userId,
        senderId: senderId,
        message: message,
        type: type,
        sessionId: sessionId,
      },
    });
    console.log(`✓ Notification created for userId: ${userId}`);
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

const stopConsumer = async () => {
  try {
    if (isConnected) {
      await consumer.disconnect();
      console.log("Kafka consumer disconnected");
    }
  } catch (error) {
    console.error("Failed to disconnect Kafka consumer:", error.message);
  }
};

// Scheduled job to send reminders 15 minutes before session starts
const startReminderScheduler = () => {
  const checkInterval = 60 * 1000; // Check every minute
  const reminderWindow = 15 * 60 * 1000; // 15 minutes in milliseconds
  const sentReminders = new Set(); // Track which reminders have been sent

  setInterval(async () => {
    try {
      const now = new Date();
      const in15Minutes = new Date(now.getTime() + reminderWindow);

      // Check all cached sessions
      for (const [sessionId, session] of sessionCache) {
        const timeDiff = session.date.getTime() - now.getTime();

        // If session starts between now and 15 minutes from now
        if (timeDiff > 0 && timeDiff <= reminderWindow) {
          // Check if we've already sent a reminder for this session
          if (!sentReminders.has(sessionId)) {
            const timeInMinutes = Math.round(timeDiff / 60000);
            const message = `Your study session on "${session.topic}" is starting in ${timeInMinutes} minutes!`;

            // Send reminder to session author
            await sendNotification(
              session.authorId,
              message,
              null,
              "SESSION_REMINDER",
              sessionId,
            );

            // Send reminder to all participants
            if (session.participants && session.participants.length > 0) {
              for (const participantId of session.participants) {
                await sendNotification(
                  participantId,
                  message,
                  null,
                  "SESSION_REMINDER",
                  sessionId,
                );
              }
            }

            sentReminders.add(sessionId);
            console.log(
              `[Reminder] Session reminder sent for session: ${sessionId} (${timeInMinutes} minutes until start)`,
            );
          }
        }

        // Clean up sessions that have already started and ended
        const endTime = session.date.getTime() + session.duration * 60 * 1000;
        if (now.getTime() > endTime) {
          sessionCache.delete(sessionId);
          sentReminders.delete(sessionId);
        }
      }
    } catch (error) {
      console.error("Error in reminder scheduler:", error.message);
    }
  }, checkInterval);

  console.log("✓ Session reminder scheduler started (checks every minute)");
};

module.exports = {
  startConsumer,
  stopConsumer,
  startReminderScheduler,
};
