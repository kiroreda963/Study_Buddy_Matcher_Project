const typeDefs = `#graphql

enum NotificationType {
  SESSION_CREATED
  SESSION_INVITATION
  BUDDY_REQUEST_SENT
  MATCH_GENERATED
}

type Notification {
id: ID!
userId: String!
senderId: String
type: NotificationType!
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
