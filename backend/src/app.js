const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const apiV1Router = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Security & Headers Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 2. Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/localhost:[0-9]+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:[0-9]+$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());

// 3. Request Logging & Body Parsing
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Root Welcome & Platform Status Endpoint
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>OpenHealth REST API Gateway</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
            .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 1.75rem; padding: 2.5rem; max-width: 540px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
            .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #064e3b; color: #34d399; font-weight: 800; font-size: 0.75rem; padding: 0.35rem 0.85rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem; }
            .pulse { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
            h1 { font-size: 1.85rem; font-weight: 900; margin: 0 0 0.5rem; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin: 0 0 1.75rem; }
            .links { display: flex; flex-direction: column; gap: 0.85rem; }
            .btn-primary { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 1rem; font-weight: 700; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 4px 14px 0 rgba(37,99,235,0.39); }
            .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
            .btn-secondary { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; background: #1e293b; color: #cbd5e1; text-decoration: none; border-radius: 1rem; font-weight: 600; font-size: 0.85rem; border: 1px solid #334155; transition: all 0.2s; }
            .btn-secondary:hover { background: #334155; color: #ffffff; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge"><span class="pulse"></span> Operational • Port 5000</div>
            <h1>🏥 OpenHealth API Server</h1>
            <p>You have reached the backend API server. If you were looking for the patient or hospital web portal, click the button below to visit the frontend:</p>
            <div class="links">
              <a class="btn-primary" href="http://localhost:3000" target="_blank">
                <span>🌐 Open Web Application</span>
                <span>http://localhost:3000 →</span>
              </a>
              <a class="btn-secondary" href="/api/health" target="_blank">
                <span>🩺 Platform Health Check</span>
                <span>/api/health</span>
              </a>
              <a class="btn-secondary" href="/api/v1/hospitals" target="_blank">
                <span>🏥 Hospitals Marketplace REST API</span>
                <span>/api/v1/hospitals</span>
              </a>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  res.status(200).json({
    success: true,
    service: 'OpenHealth REST API Backend',
    version: '1.0.0',
    status: 'operational',
    environment: config.nodeEnv,
    frontendUrl: 'http://localhost:3000',
    endpoints: {
      health: '/api/health',
      apiV1: '/api/v1',
      hospitals: '/api/v1/hospitals'
    }
  });
});

// 5. Platform Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'OpenHealth REST API Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv
  });
});

// 5. Mount API v1 Routes
app.use('/api/v1', apiV1Router);

// 6. Handle 404 Unmatched Routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint '${req.method} ${req.originalUrl}' not found on OpenHealth API server.`,
      code: 'RESOURCE_NOT_FOUND'
    }
  });
});

// 7. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
