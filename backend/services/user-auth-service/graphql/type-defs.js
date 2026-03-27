const typeDefs = `
  type User {
    id: ID!
    email: String!
    name: String
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
    register(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProfile(name: String, email: String): User!
  }
`;

module.exports = { typeDefs };
