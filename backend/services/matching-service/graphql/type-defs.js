const { gql } = require("graphql-tag");

const typeDefs = gql`
  type Match {
    id: ID!
    userId: String!
    matchedUserId: String!
    score: Float!
    reasons: [String!]!
    ignored: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type MatchProfileSnapshot {
    userId: String!
    preferredPace: String
    preferredMode: String
    preferredGroupSize: Int
    preferredStyle: String
    courses: [String!]!
    topics: [String!]!
    availabilitySlots: [AvailabilitySlotSnapshot!]!
  }

  type AvailabilitySlotSnapshot {
    id: ID!
    userId: String!
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  type BuddyRequest {
    id: ID!
    senderId: String!
    receiverId: String!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type Connection {
    id: ID!
    userId1: String!
    userId2: String!
    connectedAt: String!
  }

  type RemoveConnectionResponse {
    success: Boolean!
    message: String!
  }


  type Query {
    getMatches: [Match!]!
    getMatchById(matchId: ID!): Match
    getBuddyRequests: [BuddyRequest!]!
    getConnections: [Connection!]!
    getMatchProfile: MatchProfileSnapshot
  }

  type Mutation {
    generateMatches: [Match!]!
    sendBuddyRequest(receiverId: String!): BuddyRequest!
    acceptBuddyRequest(requestId: ID!): BuddyRequest!
    rejectBuddyRequest(requestId: ID!): BuddyRequest!
    cancelBuddyRequest(requestId: ID!): BuddyRequest!
    ignoreMatch(matchId: ID!): Match!
    removeConnection(connectedUserId: String!): RemoveConnectionResponse!
    refreshUserProjection: MatchProfileSnapshot
  }
`;

module.exports = typeDefs;
