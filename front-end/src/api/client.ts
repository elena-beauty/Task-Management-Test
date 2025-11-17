import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  } else {
    delete apiClient.defaults.headers.common.Authorization;
    localStorage.removeItem('accessToken');
  }
};

const storedToken = localStorage.getItem('accessToken');
if (storedToken) {
  setAuthToken(storedToken);
}

