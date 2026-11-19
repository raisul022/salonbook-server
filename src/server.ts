import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();
    const app = createApp();

    app.listen(ENV.PORT, () => {
      console.log(`🚀 SalonBook Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
      console.log(`🌐 Allowed Client URL: ${ENV.CLIENT_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

