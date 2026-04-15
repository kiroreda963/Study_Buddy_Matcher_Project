const typeDefs = `#graphql
  enum SessionType {
    ONLINE
    IN_PERSON
  }

  enum InvitationStatus {
    PENDING
    ACCEPTED
    DECLINED
  }

  type StudySession {
    id: ID!
    authorId: String!
    topic: String!
    date: String!
    duration: Int!
    sessionType: SessionType!
    contactInfo: [String!]!
    participants: [String!]!
    invitations: [Invitation!]!
  }

  type Invitation {
    id: ID!
    authorId: String!
    inviteeId: String!
    sessionId: String!
    status: InvitationStatus!
    session: StudySession!
  }

  type Query {
    studySessions: [StudySession!]!
    studySession(id: ID!): StudySession
    invitations(sessionId: ID!): [Invitation!]!
    invitationsByUser(userId: String!): [Invitation!]!
  }

  type Mutation {
    createStudySession(
      topic: String!
      date: String!
      duration: Int!
      sessionType: SessionType!
      contactInfo: [String!]!
      participants: [String!]
    ): StudySession!

    updateStudySession(
      id: ID!
      topic: String
      date: String
      duration: Int
      sessionType: SessionType
      contactInfo: [String!]
      participants: [String!]
    ): StudySession!

    deleteStudySession(id: ID!): StudySession!

    createInvitation(inviteeId: String!, sessionId: ID!): Invitation!

    updateInvitationStatus(id: ID!, status: InvitationStatus!): Invitation!

    deleteInvitation(id: ID!): Invitation!

    joinStudySession(userId: String!, sessionId: ID!): StudySession!

    leaveStudySession(userId: String!, sessionId: ID!): StudySession!
  }
`;

export default typeDefs;