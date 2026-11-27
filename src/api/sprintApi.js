import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

export const getSprints = (projectId, config = {}) => {
  return apiClient.get(API_ENDPOINTS.SPRINTS.BASE, {
    ...config,
    params: {
      ...(config.params || {}),
      ...(projectId ? { project: projectId } : {}),
    },
  });
};

export const createSprint = (data, config = {}) => {
  return apiClient.post(API_ENDPOINTS.SPRINTS.BASE, data, config);
};

export const syncHealth = (id, config = {}) => {
  return apiClient.post(`/sprints/${id}/sync`, null, config);
};

export const getSprintStats = (id, config = {}) => {
  return apiClient.get(API_ENDPOINTS.SPRINTS.STATS(id), config);
};

export const finalizeSprint = (id, config = {}) => {
  return apiClient.get(API_ENDPOINTS.SPRINTS.FINALIZE(id), config);
};

export const getSprintReport = (id, config = {}) => {
  return apiClient.get(API_ENDPOINTS.SPRINTS.REPORT(id), config);
};

export const updateSprint = (id, data, config = {}) => {
  return apiClient.patch(API_ENDPOINTS.SPRINTS.DETAIL(id), data, config);
};

export const deleteSprint = (id, config = {}) => {
  return apiClient.delete(API_ENDPOINTS.SPRINTS.DETAIL(id), config);
};

export const startSprint = (id, config = {}) => {
  return apiClient.post(`/sprints/${id}/start`, null, config);
};

export const completeSprint = (id, data = {}, config = {}) => {
  return apiClient.post(`/sprints/${id}/complete`, data, config);
};

export const getSprintTasks = (id, params = {}, config = {}) => {
  return apiClient.get(`/sprints/${id}/tasks`, {
    ...config,
    params: {
      ...(config.params || {}),
      ...params,
    },
  });
};

export const addTasksToSprint = (id, taskIds, config = {}) => {
  return apiClient.post(`/sprints/${id}/tasks`, { taskIds }, config);
};

export const removeTaskFromSprint = (id, taskId, config = {}) => {
  return apiClient.delete(`/sprints/${id}/tasks/${taskId}`, config);
};

export const getSprintBurndown = (id, config = {}) => {
  return apiClient.get(`/sprints/${id}/burndown`, config);
};

export const getAiSprintPlan = (id, config = {}) => {
  return apiClient.post(`/sprints/${id}/ai-plan`, null, config);
};

export const getAiSprintHealth = (id, config = {}) => {
  return apiClient.get(`/sprints/${id}/ai-health`, config);
};

export default {
  getSprints,
  createSprint,
  syncHealth,
  getSprintStats,
  finalizeSprint,
  getSprintReport,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  getSprintTasks,
  addTasksToSprint,
  removeTaskFromSprint,
  getSprintBurndown,
  getAiSprintPlan,
  getAiSprintHealth,
};
