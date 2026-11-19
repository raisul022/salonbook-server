import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';

export const createApp = (): Application => {
  const app = express();

  // CORS configuration
  const allowedOrigins = [
    ENV.CLIENT_URL,
    'http://localhost:3000',
    'https://localhost:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/testing to prevent CORS issues
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Note: Stripe webhook route requires raw body for signature verification
  // We'll mount it with express.raw before express.json or handle conditionally
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/payments/webhook') {
      express.raw({ type: 'application/json' })(req, res, next);
    } else {
      express.json({ limit: '10mb' })(req, res, next);
    }
  });

  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'SalonBook Server API is healthy',
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
    });
  });

  return app;
};
