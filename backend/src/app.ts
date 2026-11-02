import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import departmentRoutes from './routes/department.routes.js';
import teamRoutes from './routes/team.routes.js';
import categoryRoutes from './routes/category.routes.js';
import requestRoutes from './routes/request.routes.js';
import slaRoutes from './routes/sla.routes.js';
import taskRoutes from './routes/task.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import auditRoutes from './routes/audit.routes.js';

const app: Application = express();

// Security and utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const configuredOrigins = config.corsOrigin
  ? config.corsOrigin.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)
  : ['http://localhost:5173'];

const isOriginAllowed = (origin: string): boolean => {
  const normalizedOrigin = origin.replace(/\/+$/, '');

  // 1. Allow wildcard if specified
  if (configuredOrigins.includes('*')) return true;

  // 2. Allow explicitly configured origins
  if (configuredOrigins.includes(normalizedOrigin)) return true;

  // 3. Allow local development origins
  if (normalizedOrigin.startsWith('http://localhost') || normalizedOrigin.startsWith('http://127.0.0.1')) {
    return true;
  }

  // 4. Automatically allow Vercel production and preview domains (*.vercel.app)
  if (/\.vercel\.app$/.test(normalizedOrigin) || normalizedOrigin.endsWith('.vercel.app')) {
    return true;
  }

  // 5. Automatically allow Render domains (*.onrender.com)
  if (/\.onrender\.com$/.test(normalizedOrigin) || normalizedOrigin.endsWith('.onrender.com')) {
    return true;
  }

  return false;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, server-to-server, curl, Postman)
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check and root probe endpoints for Render / container health checks
app.get(['/', '/health', '/api/health'], (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'WorkSphere Backend API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
  });
});

// Mount modular REST APIs
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);

// Catch-all 404 handler for undefined API routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
