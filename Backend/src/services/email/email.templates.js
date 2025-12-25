// Email Templates
// Auto-wraps content templates with layout

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Template directory
const TEMPLATE_DIR = path.join(__dirname, '../../templates/email');

// Cache
let layoutTemplate = null;
const templates = {};

/**
 * Load layout template
 */
const getLayout = () => {
    if (!layoutTemplate) {
        const layoutPath = path.join(TEMPLATE_DIR, 'layout.hbs');
        const source = fs.readFileSync(layoutPath, 'utf8');
        layoutTemplate = Handlebars.compile(source);
    }
    return layoutTemplate;
};

/**
 * Load content template
 */
const getTemplate = (templateName) => {
    if (!templates[templateName]) {
        const templatePath = path.join(TEMPLATE_DIR, `${templateName}.hbs`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Email template not found: ${templateName}`);
        }
        const source = fs.readFileSync(templatePath, 'utf8');
        templates[templateName] = Handlebars.compile(source);
    }
    return templates[templateName];
};

/**
 * Render a template with data (auto-wrapped in layout)
 * @param {string} templateName - Name of template (without .hbs)
 * @param {Object} data - Data to inject
 * @returns {string} Rendered HTML with layout
 */
const render = (templateName, data) => {
    // First render the content template
    const contentTemplate = getTemplate(templateName);
    const body = contentTemplate(data);
    
    // Then wrap it in layout
    const layout = getLayout();
    return layout({ ...data, body });
};

/**
 * Clear cache
 */
const clearCache = () => {
    layoutTemplate = null;
    Object.keys(templates).forEach(key => delete templates[key]);
};

module.exports = { render, clearCache };
