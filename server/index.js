// Server entry point
const { app } = require('./src/app');
const config = require('./src/config/environment');

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           FLM Backend Server Started                       ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(43)}║
║  Port:        ${String(PORT).padEnd(43)}║
║  CORS Origin: ${config.corsOrigin.padEnd(43)}║
╚════════════════════════════════════════════════════════════╝
    `);
});
