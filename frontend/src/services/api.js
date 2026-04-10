import axios from 'axios';

/**
 * Instance Axios utama untuk komunikasi dengan Laravel API.
 * Auto-attach token dari localStorage ke setiap request.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Jika ini request ke endpoint admin, pakai admin_token. Jika bukan, pakai token user biasa.
  const isAdminRoute = config.url?.includes('/admin');
  const token = isAdminRoute ? localStorage.getItem('admin_token') : localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRoute = error.config?.url?.includes('/admin');
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin');
      
      if (isAdminRoute) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
