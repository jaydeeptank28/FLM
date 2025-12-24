// Auth Controller - HTTP request handlers
const AuthService = require('./auth.service');
const ApiResponse = require('../../utils/response');
const { asyncHandler } = require('../../middleware/errorHandler');

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return ApiResponse.badRequest(res, 'Email and password are required');
    }

    const authService = new AuthService(req.db);
    const result = await authService.login(email, password);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return ApiResponse.success(res, {
        user: result.user,
        accessToken: result.accessToken
    }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        return ApiResponse.unauthorized(res, 'Refresh token required');
    }

    const authService = new AuthService(req.db);
    const result = await authService.refreshAccessToken(refreshToken);

    return ApiResponse.success(res, {
        accessToken: result.accessToken
    }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (req.user) {
        const authService = new AuthService(req.db);
        await authService.logout(req.user.id, refreshToken);
    }

    res.clearCookie('refreshToken');
    return ApiResponse.success(res, null, 'Logged out successfully');
});

const getMe = asyncHandler(async (req, res) => {
    const authService = new AuthService(req.db);
    const profile = await authService.getProfile(req.user.id);

    return ApiResponse.success(res, profile);
});

module.exports = {
    login,
    refresh,
    logout,
    getMe
};
