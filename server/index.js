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


    if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
        try {
            const keyPath = process.env.SSL_KEY_PATH;
            const certPath = process.env.SSL_CERT_PATH;
            const caPath = process.env.SSL_CA_PATH;

            if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
                sslOptions = {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath)
                };
                if (caPath && fs.existsSync(caPath)) {
                    sslOptions.ca = fs.readFileSync(caPath);
                }
                
                isHttps = true;
                keysSource = 'Using paths from Env (SSL_KEY_PATH)';
            } else {
                console.warn(`⚠️ Live SSL Keys not found at ${keyPath}. Falling back to HTTP.`);
            }
        } catch (error) {
            console.error('Failed to start HTTPS server (Live Config):', error);
        }
    }
    // 2. DEVELOPMENT/LOCAL SSL (From Environment Variables)
    else if (process.env.DEV_SSL_KEY_PATH && process.env.DEV_SSL_CERT_PATH) {
        try {
            // Resolve relative to CWD (server folder) or use absolute
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
                 console.warn(`⚠️ Local SSL Keys not found at ${keyPath}. Falling back to HTTP.`);
            }
        } catch (error) {
            console.error('Failed to start HTTPS server (Local):', error);
        }
    }
    // 3. Auto-detect fallback (Compatible with previous setup if no Env set)
    else if (config.nodeEnv === 'production') {
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
