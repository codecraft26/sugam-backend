import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import healthRoutes from "./api/v1/health.routes";
import platformRoutes from "./core/platform/platform.routes";
import adminAuthRoutes from "./core/admin/adminAuth.routes";
import adminRoutes from "./core/admin/admin.routes";
import authRoutes from "./core/auth/auth.routes";
import announcementRoutes from "./core/announcements/announcement.routes";
import requestRoutes from "./core/requests/request.routes";
import stationeryRoutes from "./modules/sangrah/routes/stationery.routes";
import freshServeRoutes from "./modules/fresh-serve/routes/freshServe.routes";
import { ApiResponseUtil } from "./utils/apiResponse";

const app = express();

// Middlewares
// Body parser middleware - must be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log request body (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Request Body:', req.body);
      console.log('Content-Type:', req.headers['content-type']);
    }
    next();
  });
}

app.use(morgan('tiny'));

// Swagger/OpenAPI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sugam Backend API Documentation',
  customfavIcon: '/favicon.ico',
}));

// API Documentation JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint (accessible at /health)
app.use('/health', healthRoutes);

// API routes
app.use('/api/v1/health', healthRoutes);

// Platform admin routes
app.use('/api/v1/platform', platformRoutes);

// Admin/Superadmin authentication routes (unified - works for both)
app.use('/api/v1/admin', adminAuthRoutes);

// Admin management routes (protected - requires superadmin)
app.use('/api/v1/admin', adminRoutes);

// User authentication routes
app.use('/api/v1/auth', authRoutes);

// Announcement routes (unified - works for both users and superadmins)
app.use('/api/v1/announcements', announcementRoutes);

// Request routes (unified - works for both users and superadmins)
app.use('/api/v1/requests', requestRoutes);

// SANGRAH - Stationery Management routes
app.use('/api/v1/sangrah', stationeryRoutes);

// FRESH SERVE - Food Ordering and Management routes
app.use('/api/v1/fresh-serve', freshServeRoutes);

// Root route
app.get('/', (req, res) => {
  ApiResponseUtil.success(res, {
    message: 'Sugam Backend API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
  }, 'API is running');
});

export default app;
