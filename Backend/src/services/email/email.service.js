// Email Service
// Main interface for sending emails

const transporter = require('./email.provider');
const templates = require('./email.templates');
const emailConfig = require('../../config/email');

/**
 * Send an email using a template
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name (without .hbs)
 * @param {Object} options.data - Data to inject into template
 * @returns {Promise<Object>} - { success, messageId } or { success, error }
 */
const sendEmail = async ({ to, subject, template, data = {} }) => {
    try {
        // Add common data to all templates
        const templateData = {
            ...data,
            appUrl: emailConfig.appUrl,
            year: new Date().getFullYear()
        };

        // Render template
        const html = templates.render(template, templateData);

        // Send email
        const mailOptions = {
            from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
            to,
            subject,
            html,
            text: html.replace(/<[^>]*>/g, '') // Strip HTML for text version
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${info.messageId}`);
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object with name and email
 * @param {string} password - Plain text password
 */
const sendWelcomeEmail = async (user, password) => {
    return sendEmail({
        to: user.email,
        subject: 'Welcome to ezFLM - Your Account Details',
        template: 'welcome',
        data: {
            name: user.name,
            email: user.email,
            password: password
        }
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail
};
