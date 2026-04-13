const typeDefs = `#graphql
type Notification {
id: ID!
userId: String!
message: String!
isRead: Boolean!
createdAt: String!
}

type Query {
getNotifications: [Notification!]!
}
type Mutation {
markAsRead(notificationId: ID!): Notification!
}
`;
module.exports = { typeDefs };
