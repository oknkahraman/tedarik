import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects
export const projectsApi = {
  getAll: (status) => api.get('/projects', { params: { status } }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Parts
export const partsApi = {
  getAll: (projectId, status) => api.get('/parts', { params: { project_id: projectId, status } }),
  getOne: (id) => api.get(`/parts/${id}`),
  create: (data) => api.post('/parts', data),
  update: (id, data) => api.put(`/parts/${id}`, data),
  delete: (id) => api.delete(`/parts/${id}`),
};

// Suppliers
export const suppliersApi = {
  getAll: (specialization) => api.get('/suppliers', { params: { specialization } }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Quotes
export const quotesApi = {
  getRequests: (partId, status) => api.get('/quote-requests', { params: { part_id: partId, status } }),
  createRequest: (data) => api.post('/quote-requests', data),
  getResponses: (requestId) => api.get('/quote-responses', { params: { quote_request_id: requestId } }),
  createResponse: (data) => api.post('/quote-responses', data),
  getComparison: (requestId) => api.get(`/quote-comparison/${requestId}`),
  sendEmails: (data) => api.post('/send-quote-emails', data),
  getFormData: (requestId, supplierId, token) => api.get(`/quote-form/${requestId}`, { params: { supplier: supplierId, token } }),
  submitForm: (data) => api.post('/quote-form/submit', data),
};

// Orders
export const ordersApi = {
  getAll: (status, supplierId) => api.get('/orders', { params: { status, supplier_id: supplierId } }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
};

// Notifications
export const notificationsApi = {
  getAll: (isRead) => api.get('/notifications', { params: { is_read: isRead } }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Currency Rates
export const currencyApi = {
  getRates: () => api.get('/currency-rates'),
  updateRates: (data) => api.post('/currency-rates', data),
};

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getGantt: (projectId) => api.get(`/dashboard/gantt/${projectId}`),
};

// Static Data
export const staticDataApi = {
  getMaterials: () => api.get('/materials'),
  getFormTypes: () => api.get('/form-types'),
  getManufacturingMethods: () => api.get('/manufacturing-methods'),
  getStatuses: () => api.get('/statuses'),
  getCurrencies: () => api.get('/currencies'),
};

// Email
export const emailApi = {
  send: (data) => api.post('/send-email', data),
};

// Excel Import/Export
export const excelApi = {
  exportParts: (projectId) => api.get(`/export/parts/${projectId}`, { responseType: 'blob' }),
  exportTemplate: () => api.get('/export/template', { responseType: 'blob' }),
  importParts: (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/import/parts/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// File Upload
export const filesApi = {
  uploadTechnicalDrawing: (partId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/technical-drawing/${partId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadDocument: (partId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/document/${partId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getFileUrl: (filename) => `${API_BASE}/files/${filename}`,
  deleteFile: (partId, filename) => api.delete(`/files/${partId}/${filename}`)
};

export default api;
