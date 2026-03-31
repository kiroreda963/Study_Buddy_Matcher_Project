import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "session-service",
    brokers: ["localhost:9092"],
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
}
