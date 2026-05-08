import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // for refresh token cookies
});

// Interceptor cho Request: Gắn Access Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho Response: Xử lý hết hạn token (401)
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Tránh loop vô hạn
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
        originalRequest._retry = true;
        try {
            // Cố gắng lấy token mới
            const res = await axiosClient.post('/auth/refresh');
            const { accessToken } = res;
            
            // Lưu token mới
            localStorage.setItem('accessToken', accessToken);
            
            // Gắn token mới vào request bị lỗi và gọi lại
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return axiosClient(originalRequest);
        } catch (refreshError) {
            // Refresh token hết hạn hoặc lỗi -> Logout cứng
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
        }
    }
    
    // Format error để các hook dễ lấy message
    const customError = new Error(error.response?.data?.message || error.message || 'Lỗi kết nối server');
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

export default axiosClient;
