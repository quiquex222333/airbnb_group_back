import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { authRouter } from './infrastructure/http/routers/auth.routes';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL for local dev
  credentials: true, // Enables cookies to transit securely
}));

app.use(express.json());
app.use(cookieParser());

// Mount the Auth Router
app.use('/api/v1/auth', authRouter);

// Base route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', version: '1.0' });
});

// Run server
app.listen(env.PORT, () => {
  console.log(`🚀 API BFF Server running smoothly on port ${env.PORT}`);
  console.log(`🔐 AWS Cognito linked to Pool`);
});
