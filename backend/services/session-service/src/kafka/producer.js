import { Kafka } from "kafkajs";

import dotenv from "dotenv";
dotenv.config();

const kafka = new Kafka({
    clientId: "session-service",
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

const producer = kafka.producer();

export const sendSessionCreatedEvent = async (session) => {
    await producer.connect();
    await producer.send({
        topic: "session-created",
        messages: [{ value: JSON.stringify(session) }],
        producer: "session-service",
    });
};

export const sendSessionInvitationEvent = async (invitation) => {
    await producer.connect();
    await producer.send({
        topic: "session-invitation",
        messages: [{ value: JSON.stringify(invitation) }],
        producer: "session-service",
    });
};

export const sendSessionUpdatedEvent = async (session) => {
    await producer.connect();
    await producer.send({
        topic: "session-updated",
        messages: [{ value: JSON.stringify(session) }],
        producer: "session-service",
    });
};

export const connectProducer = async () => {
    await producer.connect();
};

export const disconnectProducer = async () => {
    await producer.disconnect();
};