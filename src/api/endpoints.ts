import { apiClient } from './client';

export const dashboardApi = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getCharts: () => apiClient.get('/dashboard/charts'),
  getActivities: (limit?: number) => apiClient.get('/dashboard/activities', { params: { limit } }),
};

export const ngosApi = {
  list: (params?: any) => apiClient.get('/ngos', { params }),
  getById: (id: string) => apiClient.get(`/ngos/${id}`),
  create: (data: any) => apiClient.post('/ngos', data),
  update: (id: string, data: any) => apiClient.put(`/ngos/${id}`, data),
  setStatus: (id: string, status: string) => apiClient.patch(`/ngos/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/ngos/${id}`),
  getBoreholes: (id: string) => apiClient.get(`/ngos/${id}/boreholes`),
  sendKyc: (id: string) => apiClient.patch(`/ngos/${id}/send-kyc`),
  signKyc: (id: string) => apiClient.patch(`/ngos/${id}/sign-kyc`),
  approveKyc: (id: string) => apiClient.patch(`/ngos/${id}/approve-kyc`),
  rejectKyc: (id: string) => apiClient.patch(`/ngos/${id}/reject-kyc`),
};

// Legacy only: contractor screens are no longer routed in the NGO-led flow.
export const contractorsApi = {
  list: (params?: any) => apiClient.get('/contractors', { params }),
  getById: (id: string) => apiClient.get(`/contractors/${id}`),
  create: (data: any) => apiClient.post('/contractors', data),
  update: (id: string, data: any) => apiClient.put(`/contractors/${id}`, data),
  setStatus: (id: string, status: string) => apiClient.patch(`/contractors/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/contractors/${id}`),
};

export const usersApi = {
  list: (params?: any) => apiClient.get('/users', { params }),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: any) => apiClient.post('/users', data),
  update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  setStatus: (id: string, status: string) => apiClient.patch(`/users/${id}/status`, { status }),
  resetPassword: (id: string, password: string) => apiClient.post(`/users/${id}/reset-password`, { password }),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  getMyKyc: () => apiClient.get('/users/me/kyc'),
  submitMyKyc: (kycData: any) => apiClient.put('/users/me/kyc', { kycData }),
};

export const rolesApi = {
  list: () => apiClient.get('/roles'),
  getById: (id: string) => apiClient.get(`/roles/${id}`),
  listPermissions: () => apiClient.get('/roles/permissions'),
  updatePermissions: (id: string, permissionIds: string[]) => apiClient.put(`/roles/${id}/permissions`, { permissionIds }),
};

export const boreholesApi = {
  list: (params?: any) => apiClient.get('/boreholes', { params }),
  getById: (id: string) => apiClient.get(`/boreholes/${id}`),
  create: (data: any) => apiClient.post('/boreholes', data),
  update: (id: string, data: any) => apiClient.put(`/boreholes/${id}`, data),
  assignNgo: (id: string, ngoId: string, reason?: string) => apiClient.post(`/boreholes/${id}/assign-ngo`, { ngoId, reason }),
  assignUser: (id: string, data: { userId: string; module?: string; modules?: string[]; reason?: string }) =>
    apiClient.post(`/boreholes/${id}/assign-user`, data),
  reassign: (id: string, data: any) => apiClient.post(`/boreholes/${id}/reassign`, data),
  getTimeline: (id: string) => apiClient.get(`/boreholes/${id}/timeline`),
  getAssignments: (id: string) => apiClient.get(`/boreholes/${id}/assignments`),
  getMapData: (params?: any) => apiClient.get('/boreholes/map', { params }),
  getMatrix: (params?: any) => apiClient.get('/boreholes/matrix', { params }),
  getSurveys: (id: string) => apiClient.get(`/boreholes/${id}/surveys`),
  getRehabilitation: (id: string) => apiClient.get(`/boreholes/${id}/rehabilitation`),
  delete: (id: string) => apiClient.delete(`/boreholes/${id}`),
};

export const formsApi = {
  listModules: () => apiClient.get('/forms/modules'),
  getModule: (id: string) => apiClient.get(`/forms/modules/${id}`),
  createModule: (data: any) => apiClient.post('/forms/modules', data),
  updateModule: (id: string, data: any) => apiClient.put(`/forms/modules/${id}`, data),
  addSection: (moduleId: string, data: any) => apiClient.post(`/forms/modules/${moduleId}/sections`, data),
  updateSection: (id: string, data: any) => apiClient.put(`/forms/sections/${id}`, data),
  deleteSection: (id: string) => apiClient.delete(`/forms/sections/${id}`),
  addField: (sectionId: string, data: any) => apiClient.post(`/forms/sections/${sectionId}/fields`, data),
  updateField: (id: string, data: any) => apiClient.put(`/forms/fields/${id}`, data),
  deleteField: (id: string) => apiClient.delete(`/forms/fields/${id}`),
  reorderFields: (sectionId: string, fieldOrders: any) => apiClient.patch(`/forms/sections/${sectionId}/reorder`, { fieldOrders }),
  addFieldOption: (fieldId: string, data: any) => apiClient.post(`/forms/fields/${fieldId}/options`, data),
  addFieldValidation: (fieldId: string, data: any) => apiClient.post(`/forms/fields/${fieldId}/validations`, data),
  addFieldCondition: (fieldId: string, data: any) => apiClient.post(`/forms/fields/${fieldId}/conditions`, data),
};

export const surveysApi = {
  list: (params?: any) => apiClient.get('/surveys', { params }),
  getById: (id: string) => apiClient.get(`/surveys/${id}`),
  approve: (id: string, notes?: string) => apiClient.patch(`/surveys/${id}/approve`, { notes }),
  reject: (id: string, notes: string) => apiClient.patch(`/surveys/${id}/reject`, { notes }),
  reopen: (id: string, notes?: string) => apiClient.patch(`/surveys/${id}/reopen`, { notes }),
};

export const rehabilitationApi = {
  list: (params?: any) => apiClient.get('/rehabilitation', { params }),
  getById: (id: string) => apiClient.get(`/rehabilitation/${id}`),
  approve: (id: string, notes?: string) => apiClient.patch(`/rehabilitation/${id}/approve`, { notes }),
  reject: (id: string, notes: string) => apiClient.patch(`/rehabilitation/${id}/reject`, { notes }),
  reopen: (id: string, notes?: string) => apiClient.patch(`/rehabilitation/${id}/reopen`, { notes }),
};

export const waterTestingApi = {
  list: (params?: any) => apiClient.get('/water-testing', { params }),
  getById: (id: string) => apiClient.get(`/water-testing/${id}`),
  create: (data: any) => apiClient.post('/water-testing', data),
  uploadReport: (id: string, fileUrl: string) => apiClient.patch(`/water-testing/${id}/upload`, { fileUrl }),
  publish: (id: string) => apiClient.patch(`/water-testing/${id}/publish`),
  reopen: (id: string, notes?: string) => apiClient.patch(`/water-testing/${id}/reopen`, { notes }),
};

export const grievancesApi = {
  list: (params?: any) => apiClient.get('/grievances', { params }),
  getById: (id: string) => apiClient.get(`/grievances/${id}`),
  assign: (id: string, assignedTo: string) => apiClient.patch(`/grievances/${id}/assign`, { assignedTo }),
  updateStatus: (id: string, status: string, notes?: string) => apiClient.patch(`/grievances/${id}/status`, { status, notes }),
  addComment: (id: string, comment: string, isInternal?: boolean) => apiClient.post(`/grievances/${id}/comments`, { comment, isInternal }),
};

export const notificationsApi = {
  list: (params?: any) => apiClient.get('/notifications', { params }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
};

export const reportsApi = {
  get: (type: string, params?: any) => apiClient.get(`/reports/${type}`, { params }),
};

export const auditApi = {
  list: (params?: any) => apiClient.get('/audit', { params }),
};

export const filesApi = {
  upload: (formData: FormData) => apiClient.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getByEntity: (entityType: string, entityId: string) => apiClient.get(`/files/${entityType}/${entityId}`),
  delete: (id: string) => apiClient.delete(`/files/${id}`),
};

export const assignmentsApi = {
  list: (params?: any) => apiClient.get('/assignments', { params }),
};
