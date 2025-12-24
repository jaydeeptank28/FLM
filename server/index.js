// Server entry point
const https = require('https');
const fs = require('fs');
const path = require('path');
const { app } = require('./src/app');
const config = require('./src/config/environment');

const PORT = config.port;

const startServer = () => {
    let sslOptions = null;
    let isHttps = false;
    let keysSource = '';

    // 1. Production Mode: Auto-detect keys in root keys/ folder
    if (config.nodeEnv === 'production') {
        try {
            const keyPath = path.join(__dirname, '..', 'keys', 'key.pem');
            const certPath = path.join(__dirname, '..', 'keys', 'cert.pem');

            if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
                sslOptions = {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath)
                };
                isHttps = true;
                keysSource = 'Found in ../keys (Production Auto-detect)';
            } else {
                console.warn('SSL Keys not found at ' + keyPath + '. Falling back to HTTP.');
            }
        } catch (error) {
            console.error('Failed to start HTTPS server (Production):', error);
        }
    } 
    // 2. Development Mode: Use paths from .env if provided
    else if (process.env.DEV_SSL_KEY_PATH && process.env.DEV_SSL_CERT_PATH) {
        try {
            // Resolve relative to CWD (server folder)
            const keyPath = path.resolve(process.env.DEV_SSL_KEY_PATH);
            const certPath = path.resolve(process.env.DEV_SSL_CERT_PATH);

            if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
                sslOptions = {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath)
                };
                isHttps = true;
                keysSource = 'Using paths from .env (Local Dev)';
            } else {
                 console.warn(`⚠️ Local SSL Keys not found at ${keyPath} or ${certPath}. Falling back to HTTP.`);
            }
        } catch (error) {
            console.error('Failed to start HTTPS server (Local):', error);
        }
    }

    // Start Server
    if (isHttps && sslOptions) {
        https.createServer(sslOptions, app).listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║           FLM SECURE Server Started (HTTPS)                ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(43)}║
║  Port:        ${String(PORT).padEnd(43)}║
║  CORS Origin: ${config.corsOrigin.padEnd(43)}║
║  Keys:        ${keysSource.padEnd(43)}║
╚════════════════════════════════════════════════════════════╝
            `);
        });
    } else {
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║           FLM Server Started (HTTP)                        ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(43)}║
║  Port:        ${String(PORT).padEnd(43)}║
║  CORS Origin: ${config.corsOrigin.padEnd(43)}║
╚════════════════════════════════════════════════════════════╝
            `);
        });
    }
};

startServer();
