import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  AWS_REGION: process.env.AWS_REGION,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  JWT_SECRET_MOCK: process.env.JWT_SECRET_MOCK || 'super_secret', // Usado solo si se hace mock de JWKS local
};
