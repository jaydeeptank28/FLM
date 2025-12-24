// Auth Service - Business logic for authentication
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config/environment');
const { AppError } = require('../../middleware/errorHandler');

class AuthService {
    constructor(db) {
        this.db = db;
    }

    async login(email, password) {
        // Find user by email
        const user = await this.db('users')
            .where({ email: email.toLowerCase(), is_active: true })
            .first();

        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new AppError('Invalid email or password', 401);
        }

        // Get user's department roles
        const departmentRoles = await this.db('user_department_roles')
            .select('user_department_roles.*', 'departments.code as department_code', 'departments.name as department_name')
            .join('departments', 'departments.id', 'user_department_roles.department_id')
            .where('user_department_roles.user_id', user.id);

        // Generate tokens
        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = await this.generateRefreshToken(user.id);

        // Update last login
        await this.db('users')
            .where({ id: user.id })
            .update({ last_login_at: new Date() });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                departmentRoles: departmentRoles.map(dr => ({
                    departmentId: dr.department_id,
                    departmentCode: dr.department_code,
                    departmentName: dr.department_name,
                    role: dr.role
                }))
            },
            accessToken,
            refreshToken
        };
    }

    generateAccessToken(userId) {
        return jwt.sign(
            { userId },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
    }

    async generateRefreshToken(userId) {
        const token = crypto.randomBytes(64).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Calculate expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Store in database
        await this.db('refresh_tokens').insert({
            user_id: userId,
            token_hash: tokenHash,
            expires_at: expiresAt
        });

        return token;
    }

    async refreshAccessToken(refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Find valid token
        const storedToken = await this.db('refresh_tokens')
            .where({
                token_hash: tokenHash,
                is_revoked: false
            })
            .where('expires_at', '>', new Date())
            .first();

        if (!storedToken) {
            throw new AppError('Invalid or expired refresh token', 401);
        }

        // Get user
        const user = await this.db('users')
            .where({ id: storedToken.user_id, is_active: true })
            .first();

        if (!user) {
            throw new AppError('User not found or inactive', 401);
        }

        // Generate new access token
        const accessToken = this.generateAccessToken(user.id);

        return { accessToken };
    }

    async logout(userId, refreshToken) {
        if (refreshToken) {
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            await this.db('refresh_tokens')
                .where({ token_hash: tokenHash })
                .update({ is_revoked: true });
        }

        // Optionally revoke all refresh tokens for user
        // await this.db('refresh_tokens')
        //     .where({ user_id: userId })
        //     .update({ is_revoked: true });

        return true;
    }

    async getProfile(userId) {
        const user = await this.db('users')
            .where({ id: userId })
            .first();

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const departmentRoles = await this.db('user_department_roles')
            .select('user_department_roles.*', 'departments.code as department_code', 'departments.name as department_name')
            .join('departments', 'departments.id', 'user_department_roles.department_id')
            .where('user_department_roles.user_id', user.id);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at,
            departmentRoles: departmentRoles.map(dr => ({
                departmentId: dr.department_id,
                departmentCode: dr.department_code,
                departmentName: dr.department_name,
                role: dr.role
            }))
        };
    }
}

module.exports = AuthService;
