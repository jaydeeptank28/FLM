// Centralized API Service
// Replaces all localStorage and demo data access with real API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.accessToken = null;
    }

    // Token management
    setAccessToken(token) {
        this.accessToken = token;
        if (token) {
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('accessToken');
        }
    }

    getAccessToken() {
        if (!this.accessToken) {
            this.accessToken = localStorage.getItem('accessToken');
        }
        return this.accessToken;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
            credentials: 'include' // For cookies (refresh token)
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        let response;
        try {
            response = await fetch(url, config);
        } catch (error) {
            throw new Error('Network error. Please check your connection.');
        }

        // Handle 401 - try to refresh token
        if (response.status === 401 && !options._isRetry) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
                return this.request(endpoint, { ...options, _isRetry: true });
            }
            // Refresh failed, clear auth
            this.setAccessToken(null);
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw new Error('Session expired. Please login again.');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }

        return data;
    }

    // Refresh token
    async refreshToken() {
        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                this.setAccessToken(data.data.accessToken);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // ============ HTTP HELPER METHODS ============
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    }

    async patch(endpoint, body) {
        return this.request(endpoint, { method: 'PATCH', body });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ============ WORKFLOW PREVIEW ============
    async getWorkflowPreview(departmentId, fileType) {
        const params = new URLSearchParams({ departmentId });
        if (fileType) params.append('fileType', fileType);
        return this.request(`/files/workflow-preview?${params}`);
    }

    // ============ AUTH ============
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        if (response.data.accessToken) {
            this.setAccessToken(response.data.accessToken);
        }
        return response.data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.setAccessToken(null);
        }
    }

    async getMe() {
        const response = await this.request('/auth/me');
        return response.data;
    }

    // ============ DEPARTMENTS ============
    async getDepartments() {
        const response = await this.request('/departments');
        return response.data;
    }

    async getDepartmentById(id) {
        const response = await this.request(`/departments/${id}`);
        return response.data;
    }

    async getDepartmentUsers(id) {
        const response = await this.request(`/departments/${id}/users`);
        return response.data;
    }

    // ============ FILES ============
    async getFilesByFolder(departmentId, folder) {
        const response = await this.request(`/files/folder/${folder}?departmentId=${departmentId}`);
        return response.data;
    }

    async getFileById(id) {
        const response = await this.request(`/files/${id}`);
        return response.data;
    }

    async createFile(data) {
        const response = await this.request('/files', {
            method: 'POST',
            body: data
        });
        return response.data;
    }

    async updateFile(id, data) {
        const response = await this.request(`/files/${id}`, {
            method: 'PATCH',
            body: data
        });
        return response.data;
    }

    async addNoting(fileId, content, type = 'NOTING') {
        const response = await this.request(`/files/${fileId}/notings`, {
            method: 'POST',
            body: { content, type }
        });
        return response.data;
    }

    async addDocument(fileId, documentData) {
        const response = await this.request(`/files/${fileId}/documents`, {
            method: 'POST',
            body: documentData
        });
        return response.data;
    }

    async performWorkflowAction(fileId, action, remarks = '') {
        const response = await this.request(`/files/${fileId}/workflow-action`, {
            method: 'POST',
            body: { action, remarks }
        });
        return response.data;
    }

    async shareFile(fileId, userId) {
        const response = await this.request(`/files/${fileId}/share`, {
            method: 'POST',
            body: { userId }
        });
        return response.data;
    }

    async toggleTrackFile(fileId) {
        const response = await this.request(`/files/${fileId}/track`, {
            method: 'POST'
        });
        return response.data;
    }

    async searchFiles(params) {
        const queryString = new URLSearchParams(params).toString();
        const response = await this.request(`/files/search?${queryString}`);
        return response.data;
    }

    async getFolderCounts(departmentId) {
        const response = await this.request(`/files/counts?departmentId=${departmentId}`);
        return response.data;
    }

    // ============ DAAK ============
    async getDaakList(departmentId, type = null) {
        let url = `/daak?departmentId=${departmentId}`;
        if (type) url += `&type=${type}`;
        const response = await this.request(url);
        return response.data;
    }

    async getDaakById(id) {
        const response = await this.request(`/daak/${id}`);
        return response.data;
    }

    async createDaak(data) {
        const response = await this.request('/daak', {
            method: 'POST',
            body: data
        });
        return response.data;
    }

    async updateDaak(id, data) {
        const response = await this.request(`/daak/${id}`, {
            method: 'PATCH',
            body: data
        });
        return response.data;
    }

    async linkDaakToFile(daakId, fileId) {
        const response = await this.request(`/daak/${daakId}/link-file`, {
            method: 'POST',
            body: { fileId }
        });
        return response.data;
    }

    async changeDaakState(daakId, state, remarks = '') {
        const response = await this.request(`/daak/${daakId}/state`, {
            method: 'POST',
            body: { state, remarks }
        });
        return response.data;
    }

    async searchDaak(params) {
        const queryString = new URLSearchParams(params).toString();
        const response = await this.request(`/daak/search?${queryString}`);
        return response.data;
    }

    // ============ USERS (Admin) ============
    async getUsers() {
        const response = await this.request('/users');
        return response.data;
    }

    async getUserById(id) {
        const response = await this.request(`/users/${id}`);
        return response.data;
    }

    async createUser(data) {
        const response = await this.request('/users', {
            method: 'POST',
            body: data
        });
        return response.data;
    }

    async updateUser(id, data) {
        const response = await this.request(`/users/${id}`, {
            method: 'PATCH',
            body: data
        });
        return response.data;
    }

    async resetUserPassword(id, newPassword) {
        const response = await this.request(`/users/${id}/reset-password`, {
            method: 'POST',
            body: { newPassword }
        });
        return response.data;
    }

    async deactivateUser(id) {
        const response = await this.request(`/users/${id}/deactivate`, {
            method: 'POST'
        });
        return response.data;
    }

    // ============ ADMIN ============
    async getWorkflowTemplates() {
        const response = await this.request('/admin/workflow-templates');
        return response.data;
    }

    async getWorkflowTemplateById(id) {
        const response = await this.request(`/admin/workflow-templates/${id}`);
        return response.data;
    }

    async createWorkflowTemplate(data) {
        const response = await this.request('/admin/workflow-templates', {
            method: 'POST',
            body: data
        });
        return response.data;
    }

    async updateWorkflowTemplate(id, data) {
        const response = await this.request(`/admin/workflow-templates/${id}`, {
            method: 'PATCH',
            body: data
        });
        return response.data;
    }

    async getSystemAuditLog(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await this.request(`/admin/audit?${queryString}`);
        return response.data;
    }

    async getAdminDashboard() {
        const response = await this.request('/admin/dashboard');
        return response.data;
    }

    // Additional Department Methods
    async createDepartment(data) {
        const response = await this.request('/departments', {
            method: 'POST',
            body: data
        });
        return response.data;
    }

    async updateDepartment(id, data) {
        const response = await this.request(`/departments/${id}`, {
            method: 'PATCH',
            body: data
        });
        return response.data;
    }

    async deleteDepartment(id) {
        const response = await this.request(`/departments/${id}`, {
            method: 'DELETE'
        });
        return response.data;
    }

    // Additional User Methods
    async deleteUser(id) {
        const response = await this.request(`/users/${id}`, {
            method: 'DELETE'
        });
        return response.data;
    }

    // Additional Workflow Methods
    async getWorkflowTemplate(id) {
        const response = await this.request(`/admin/workflow-templates/${id}`);
        return response.data;
    }

    async deleteWorkflowTemplate(id) {
        const response = await this.request(`/admin/workflow-templates/${id}`, {
            method: 'DELETE'
        });
        return response.data;
    }
}

// Singleton instance
const api = new ApiService();
export default api;
