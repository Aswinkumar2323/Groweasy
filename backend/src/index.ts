import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import importRoutes from './routes/import.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Base route for when users visit the root URL
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'GrowEasy CSV Importer API is running. Use /api/import to upload data.',
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'groweasy-csv-importer',
    timestamp: new Date().toISOString(),
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
  });
});

// Routes
app.use('/api/import', importRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`GrowEasy CSV Importer API running on port ${PORT}`);
  logger.info(
    `OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured — set OPENAI_API_KEY in .env'}`
  );
});

export default app;
