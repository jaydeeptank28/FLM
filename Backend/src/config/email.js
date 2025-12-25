// Email Configuration
// Loads SMTP configuration from environment variables

const emailConfig = {
    smtp: {
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
        }
    },
    from: {
        // Use SMTP_USER as sender by default (must be verified in Brevo)
        email: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.SMTP_USERNAME,
        name: process.env.EMAIL_FROM_NAME || 'ezFLM System'
    },
    // App URL for links in emails
    appUrl: process.env.APP_URL || 'https://ezflm.docusafe.ai'
};

module.exports = emailConfig;
