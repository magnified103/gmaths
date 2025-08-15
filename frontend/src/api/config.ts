import axios from 'axios';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    // In production, we expect Nginx to proxy /api requests
    return '/api';
  }
  // In development, we point directly to the backend server
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies (e.g., session tokens)
});
