const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../userService");

const resolvers = {
  Query: {
    me: async (_, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await getUserProfile(context.user.userId);
    },
  },
  Mutation: {
    register: async (_, args) => {
      const result = await registerUser(args.email, args.password, args.name);
      return result;
    },
    login: async (_, args) => {
      const result = await loginUser(args.email, args.password);
      return result;
    },
  },
};

module.exports = { resolvers };
