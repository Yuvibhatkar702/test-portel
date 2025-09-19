import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Tests API
export const testsAPI = {
  getAllTests: () => api.get('/tests'),
  getTest: (id) => api.get(`/tests/${id}`),
  createTest: (testData) => api.post('/tests', testData),
  updateTest: (id, testData) => api.put(`/tests/${id}`, testData),
  deleteTest: (id) => api.delete(`/tests/${id}`),
  submitTest: (id, submissionData) => api.post(`/tests/${id}/submit`, submissionData),
};

// Users API
export const usersAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getUsers: () => api.get('/users/me'),
};

// Results API
export const resultsAPI = {
  getAllResults: () => api.get('/results'),
  getTestResults: (testId) => api.get(`/results/test/${testId}`),
  getUserResults: (userId) => api.get(`/results/user/${userId}`),
  getResult: (id) => api.get(`/results/${id}`),
  deleteResult: (id) => api.delete(`/results/${id}`),
};

export default api;