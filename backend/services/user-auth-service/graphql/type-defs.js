const typeDefs = `
  type User {
    id: ID!
    email: String!
    name: String!
    university: String
    phone_number: String
    academic_year: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
  }

  type Mutation {
    register(email: String!, password: String!, name: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    addAdditionalUserInfo(
      university: String
      phone_number: String
      academic_year: String
    ): User!
    updateUserProfile(email: String): User!
  }
`;

module.exports = { typeDefs };
