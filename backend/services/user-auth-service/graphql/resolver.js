const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  addAdditionalUserInfo,
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
    addAdditionalUserInfo: async (_, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await addAdditionalUserInfo(
        context.user.userId,
        args.university,
        args.phone_number,
        args.academic_year,
      );
    },
    updateUserProfile: async (_, args, context) => {
      if (!context.user) {
        throw new Error("Unauthorized");
      }
      return await updateUserProfile(context.user.userId, args.email);
    },
  },
};

module.exports = { resolvers };
