const { gql } = require("graphql-tag");

const typeDefs = gql`
  type UserProfile {
    id: ID!
    userId: String!
    university: String
    academicYear: String
    courses: [Course!]!
    topics: [Topic!]!
    preferences: StudyPreference
    createdAt: String
    updatedAt: String
  }

  type Course {
    id: ID!
    name: String!
  }

  type Topic {
    id: ID!
    name: String!
  }

  type StudyPreference {
    id: ID!
    studyPace: String
    studyMode: String
    groupSize: String
    studyStyle: String
  }

  input StudyPreferenceInput {
    studyPace: String
    studyMode: String
    groupSize: String
    studyStyle: String
  }

  type Query {
    getProfile(userId: String!): UserProfile
    getAllProfiles: [UserProfile!]!
  }

  type Mutation {
    createOrUpdateProfile(
      userId: String!
      university: String
      academicYear: String
    ): UserProfile!

    addCourse(userId: String!, courseName: String!): UserProfile!
    removeCourse(userId: String!, courseId: String!): UserProfile!

    addTopic(userId: String!, topicName: String!): UserProfile!
    removeTopic(userId: String!, topicId: String!): UserProfile!

    updatePreferences(
      userId: String!
      preferences: StudyPreferenceInput!
    ): UserProfile!
  }
`;

module.exports = typeDefs;