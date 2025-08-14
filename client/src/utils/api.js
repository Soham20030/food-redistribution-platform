// API configuration using fetch 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Set auth token to localStorage
const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token);
};

// Remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

// Generic fetch wrapper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API methods
export const api = {
  // Auth methods
  login: (credentials) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData) => 
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Health check
  healthCheck: () => apiRequest('/health'),

  // Generic GET request
  get: (endpoint) => apiRequest(endpoint),

  // Generic POST request
  post: (endpoint, data) => 
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generic PUT request
  put: (endpoint, data) => 
    apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Generic DELETE request
  delete: (endpoint) => 
    apiRequest(endpoint, {
      method: 'DELETE',
    }),
};

// Export auth utilities
export { getAuthToken, setAuthToken, removeAuthToken };
