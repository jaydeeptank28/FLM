// Departments Service
const { AppError } = require('../../middleware/errorHandler');

class DepartmentsService {
    constructor(db) {
        this.db = db;
    }

    async getAll(filters = {}) {
        let query = this.db('departments').select('*');

        if (filters.isActive !== undefined) {
            query = query.where('is_active', filters.isActive);
        }

        return query.orderBy('name');
    }

    async getById(id) {
        const department = await this.db('departments').where({ id }).first();
        if (!department) {
            throw new AppError('Department not found', 404);
        }
        return department;
    }

    async getByCode(code) {
        const department = await this.db('departments').where({ code }).first();
        if (!department) {
            throw new AppError('Department not found', 404);
        }
        return department;
    }

    async create(data) {
        const { code, name, filePrefix, description } = data;

        // Check if code already exists
        const existing = await this.db('departments').where({ code: code.toUpperCase() }).first();
        if (existing) {
            throw new AppError('Department code already exists', 409);
        }

        const [department] = await this.db('departments')
            .insert({
                code: code.toUpperCase(),
                name,
                file_prefix: filePrefix || code.toUpperCase(),
                description,
                is_active: true
            })
            .returning('*');

        return department;
    }

    async update(id, data) {
        const { name, filePrefix, description, isActive } = data;

        const department = await this.db('departments').where({ id }).first();
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        const updates = {};
        if (name) updates.name = name;
        if (filePrefix) updates.file_prefix = filePrefix;
        if (description !== undefined) updates.description = description;
        if (isActive !== undefined) updates.is_active = isActive;
        updates.updated_at = new Date();

        await this.db('departments').where({ id }).update(updates);

        return this.getById(id);
    }

    async getUsersInDepartment(departmentId) {
        return this.db('user_department_roles')
            .select('users.id', 'users.name', 'users.email', 'user_department_roles.role')
            .join('users', 'users.id', 'user_department_roles.user_id')
            .where({
                'user_department_roles.department_id': departmentId,
                'users.is_active': true
            })
            .orderBy('users.name');
    }

    async delete(id) {
        const department = await this.db('departments').where({ id }).first();
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        // Delete related data
        await this.db('user_department_roles').where({ department_id: id }).del();
        await this.db('workflow_templates').where({ department_id: id }).update({ department_id: null });
        await this.db('departments').where({ id }).del();

        return true;
    }
}

module.exports = DepartmentsService;
