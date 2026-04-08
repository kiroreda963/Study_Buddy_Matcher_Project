const { gql } = require("graphql-tag");

const typeDefs = gql`
  type AvailabilitySlot {
    id: ID!
    userId: String!
    startTime: String!
    endTime: String!
    createdAt: String!
    updatedAt: String!
  }

  input AvailabilityInput {
    startTime: String!
    endTime: String!
  }

  input UpdateAvailabilityInput {
    startTime: String
    endTime: String
  }

  type AvailabilityMutationResponse {
    success: Boolean!
    message: String!
    slot: AvailabilitySlot
    eventPublished: Boolean!
  }

  type DeleteAvailabilityResponse {
    success: Boolean!
    message: String!
  }

  type Query {
    getAvailabilityByUser(userId: String!): [AvailabilitySlot!]!
    getAvailabilitySlotById(id: ID!): AvailabilitySlot
  }

  type Mutation {
    createAvailability(input: AvailabilityInput!): AvailabilityMutationResponse!
    updateAvailability(
      id: ID!
      input: UpdateAvailabilityInput!
    ): AvailabilityMutationResponse!
    deleteAvailability(id: ID!): DeleteAvailabilityResponse!
  }
`;

module.exports = typeDefs;
