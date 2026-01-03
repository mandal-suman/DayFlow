require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Dayflow HRMS API',
    version: '0.1.0',
    status: 'running',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && { error: err.message }),
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║        🚀 Dayflow HRMS API Server          ║
╠════════════════════════════════════════════╣
║  Status:      Running                      ║
║  Port:        ${PORT}                          ║
║  Environment: ${config.nodeEnv.padEnd(26)}║
║  URL:         http://localhost:${PORT}         ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
