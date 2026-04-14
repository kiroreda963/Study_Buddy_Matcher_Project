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
    getProfile: UserProfile
    getAllProfiles: [UserProfile!]!
  }

  type Mutation {
    createOrUpdateProfile(
      university: String
      academicYear: String
    ): UserProfile!

    addCourse(courseName: String!): UserProfile!
    removeCourse(courseId: String!): UserProfile!

    addTopic(topicName: String!): UserProfile!
    removeTopic(topicId: String!): UserProfile!

    updatePreferences(preferences: StudyPreferenceInput!): UserProfile!
  }
`;

module.exports = typeDefs;