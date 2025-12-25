// Email Provider
// Creates and exports Nodemailer transporter
// This is the ONLY place where Nodemailer is initialized

const nodemailer = require('nodemailer');
const emailConfig = require('../../config/email');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: emailConfig.smtp.auth
});

// Verify connection on startup
transporter.verify()
    .then(() => console.log('Email server connected'))
    .catch(err => console.error('Email server connection failed:', err.message));

module.exports = transporter;
