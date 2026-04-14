const { kafka, brokers } = require("./config");

const producer = kafka.producer();
const admin = kafka.admin();

let producerConnected = false;
const readyTopics = new Set();

const connectProducer = async () => {
  if (producerConnected) {
    return;
  }

  await producer.connect();
  producerConnected = true;
};

const ensureTopic = async (topic) => {
  if (readyTopics.has(topic)) {
    return;
  }

  await admin.connect();
  await admin.createTopics({
    waitForLeaders: true,
    topics: [{ topic, numPartitions: 1, replicationFactor: 1 }],
  });
  await admin.disconnect();
  readyTopics.add(topic);
};

const publishEvent = async ({ topic, key, value, retries = 3 }) => {
  try {
    await connectProducer();
    await ensureTopic(topic);

    let remainingRetries = retries;
    while (remainingRetries > 0) {
      try {
        await producer.send({
          topic,
          messages: [{ key, value: JSON.stringify(value) }],
        });
        return true;
      } catch (sendError) {
        remainingRetries -= 1;
        if (remainingRetries === 0) {
          throw sendError;
        }
        producerConnected = false;
        await connectProducer();
      }
    }

    return false;
  } catch (error) {
    console.error(
      `Kafka producer failed for topic "${topic}" with brokers [${brokers.join(", ")}]:`,
      error.message,
    );
    return false;
  }
};

const disconnectProducer = async () => {
  if (!producerConnected) {
    return;
  }
  await producer.disconnect();
  producerConnected = false;
};

module.exports = {
  publishEvent,
  disconnectProducer,
};
