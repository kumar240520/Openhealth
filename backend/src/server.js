const app = require('./app');
const config = require('./config/env');

const PORT = config.port || 5000;

const server = app.listen(PORT, () => {
  console.log(`
=====================================================
  🏥 OpenHealth Healthcare API Backend Running
=====================================================
  🚀 Server URL:     http://localhost:${PORT}
  📡 API Base:       http://localhost:${PORT}/api/v1
  🩺 Health Check:   http://localhost:${PORT}/api/health
  🌍 Environment:    ${config.nodeEnv}
=====================================================
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already occupied by another running process.`);
    console.error(`👉 Check if another terminal is running the backend or run 'taskkill /F /IM node.exe'.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Automated 60-Second Stale Bed Hold Sweeper (Enforces Rules 17.1, 17.2, 17.3)
// Automatically restores expired 30-minute bed reservations to vacant inventory
const bedService = require('./services/beds/bedService');
const sweeperInterval = setInterval(async () => {
  try {
    const sweep = await bedService.cleanupExpiredHolds();
    if (sweep.cleanedCount > 0) {
      console.log(`[BED SWEEPER] ⏱️ Swept ${sweep.cleanedCount} expired 30-min bed hold(s) -> restored to vacant inventory in hospital_beds.`);
    }
  } catch (err) {
    console.warn('[BED SWEEPER ERROR]', err.message);
  }
}, 60 * 1000);

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = server;
