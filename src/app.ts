import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

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
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
    })
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/payments/webhook') {
      express.raw({ type: 'application/json' })(req, res, next);
    } else {
      express.json({ limit: '10mb' })(req, res, next);
    }
  });

  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/stats', statsRoutes);

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

