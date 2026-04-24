export type CreateUserInput = {
  fullName: string;
  email: string;
};

export type CreateUserOutput = {
  user: {
    email: string;
    userId: string;
    fullName: string;
    createdAt: string;
  };
};
