// Users Service
const bcrypt = require('bcryptjs');
const { AppError } = require('../../middleware/errorHandler');

class UsersService {
    constructor(db) {
        this.db = db;
    }

    async getAll(filters = {}) {
        let query = this.db('users')
            .select('id', 'name', 'email', 'is_active', 'created_at', 'last_login_at');

        if (filters.isActive !== undefined) {
            query = query.where('is_active', filters.isActive);
        }

        const users = await query.orderBy('name');

        // Get department roles for each user
        const userIds = users.map(u => u.id);
        const roles = await this.db('user_department_roles')
            .select('user_department_roles.*', 'departments.code', 'departments.name as department_name')
            .join('departments', 'departments.id', 'user_department_roles.department_id')
            .whereIn('user_id', userIds);

        return users.map(user => ({
            ...user,
            departmentRoles: roles
                .filter(r => r.user_id === user.id)
                .map(r => ({
                    departmentId: r.department_id,
                    departmentCode: r.code,
                    departmentName: r.department_name,
                    role: r.role
                }))
        }));
    }

    async getById(id) {
        const user = await this.db('users')
            .select('id', 'name', 'email', 'is_active', 'created_at', 'last_login_at')
            .where({ id })
            .first();

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const roles = await this.db('user_department_roles')
            .select('user_department_roles.*', 'departments.code', 'departments.name as department_name')
            .join('departments', 'departments.id', 'user_department_roles.department_id')
            .where('user_id', id);

        return {
            ...user,
            departmentRoles: roles.map(r => ({
                departmentId: r.department_id,
                departmentCode: r.code,
                departmentName: r.department_name,
                role: r.role
            }))
        };
    }

    async create(userData) {
        const { name, email, password, departmentRoles } = userData;

        // Check if email already exists
        const existing = await this.db('users').where({ email: email.toLowerCase() }).first();
        if (existing) {
            throw new AppError('Email already in use', 409);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const [user] = await this.db('users')
            .insert({
                name,
                email: email.toLowerCase(),
                password_hash: passwordHash,
                is_active: true
            })
            .returning(['id', 'name', 'email', 'is_active', 'created_at']);

        // Add department roles if provided
        if (departmentRoles && departmentRoles.length > 0) {
            const roleRecords = departmentRoles.map(dr => ({
                user_id: user.id,
                department_id: dr.departmentId,
                role: dr.role
            }));
            await this.db('user_department_roles').insert(roleRecords);
        }

        return this.getById(user.id);
    }

    async update(id, userData) {
        const { name, email, isActive, departmentRoles } = userData;

        const user = await this.db('users').where({ id }).first();
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check email uniqueness if changing
        if (email && email.toLowerCase() !== user.email) {
            const existing = await this.db('users').where({ email: email.toLowerCase() }).first();
            if (existing) {
                throw new AppError('Email already in use', 409);
            }
        }

        // Update user
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email.toLowerCase();
        if (isActive !== undefined) updates.is_active = isActive;
        updates.updated_at = new Date();

        await this.db('users').where({ id }).update(updates);

        // Update department roles if provided
        if (departmentRoles) {
            await this.db('user_department_roles').where({ user_id: id }).del();
            if (departmentRoles.length > 0) {
                const roleRecords = departmentRoles.map(dr => ({
                    user_id: id,
                    department_id: dr.departmentId,
                    role: dr.role
                }));
                await this.db('user_department_roles').insert(roleRecords);
            }
        }

        return this.getById(id);
    }

    async resetPassword(id, newPassword) {
        const user = await this.db('users').where({ id }).first();
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.db('users').where({ id }).update({
            password_hash: passwordHash,
            updated_at: new Date()
        });

        return true;
    }

    async deactivate(id) {
        const user = await this.db('users').where({ id }).first();
        if (!user) {
            throw new AppError('User not found', 404);
        }

        await this.db('users').where({ id }).update({
            is_active: false,
            updated_at: new Date()
        });

        // Revoke all refresh tokens
        await this.db('refresh_tokens').where({ user_id: id }).update({ is_revoked: true });

        return true;
    }

    async delete(id) {
        const user = await this.db('users').where({ id }).first();
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Delete related data
        await this.db('refresh_tokens').where({ user_id: id }).del();
        await this.db('user_department_roles').where({ user_id: id }).del();
        await this.db('users').where({ id }).del();

        return true;
    }
}

module.exports = UsersService;
