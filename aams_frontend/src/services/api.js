// src/services/api.js
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: baseURL,
    timeout: 10000, // 10 วินาที
});

// 1. Interceptor สำหรับ "ส่ง" Request
//    ทำหน้าที่แนบ accessToken ไปกับทุก request ที่จะส่งออกไป
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);


// 2. Interceptor สำหรับ "รับ" Response
//    ทำหน้าที่ดักจับ Error ที่ตอบกลับมาจาก Server, โดยเฉพาะ Error 401 (Token หมดอายุ)
apiClient.interceptors.response.use(
    // ถ้า Response สำเร็จ (status 2xx) ก็ให้ผ่านไปเลย
    (response) => {
        return response;
    },
    // ถ้า Response ล้มเหลว (error)
    async (error) => {
        const originalRequest = error.config;
        
        // เช็คว่าเป็น Error 401 และยังไม่ได้พยายามลองใหม่
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // พยายามขอ accessToken ใหม่ โดยใช้ refreshToken
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    // ถ้าไม่มี refreshToken ก็ทำอะไรต่อไม่ได้, ส่งไปหน้า login
                    handleLogout();
                    return Promise.reject(error);
                }

                const response = await axios.post(`${baseURL}/api/token/refresh/`, {
                    refresh: refreshToken,
                });
                
                // ได้ accessToken ใหม่มาแล้ว
                const newAccessToken = response.data.access;
                
                // เก็บ Token ใหม่ลง localStorage
                localStorage.setItem('accessToken', newAccessToken);
                
                // อัปเดต Header ของ request เดิมให้ใช้ Token ใหม่
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                
                // ยิง request เดิมซ้ำอีกครั้งด้วย Token ใหม่
                return apiClient(originalRequest);

            } catch (refreshError) {
                // ถ้าการขอ Token ใหม่ล้มเหลว (อาจเป็นเพราะ token ถูก blacklist)
                console.error("Refresh token failed:", refreshError);
                handleLogout();
                return Promise.reject(refreshError);
            }
        }
        
        // จัดการ error อื่นๆ
        handleApiError(error);
        return Promise.reject(error);
    }
);

// ฟังก์ชันสำหรับจัดการ logout
const handleLogout = () => {
    // ล้าง localStorage ทั้งหมด
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // ล้าง headers ของ axios
    delete apiClient.defaults.headers.common['Authorization'];
    
    // ถ้าอยู่ในหน้า login อยู่แล้ว ไม่ต้อง redirect
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

// ฟังก์ชันสำหรับจัดการ API error
const handleApiError = (error) => {
    if (error.response) {
        // Server ตอบกลับมาแล้ว
        const status = error.response.status;
        const data = error.response.data;
        
        console.error(`API Error ${status}:`, data);
        
        // จัดการ error ตาม status code
        switch (status) {
            case 400:
                console.error('Bad Request:', data);
                break;
            case 401:
                console.error('Unauthorized');
                break;
            case 403:
                console.error('Forbidden - ไม่มีสิทธิ์เข้าถึง');
                break;
            case 404:
                console.error('Not Found - ไม่พบข้อมูลที่ต้องการ');
                break;
            case 500:
                console.error('Internal Server Error - เกิดข้อผิดพลาดในระบบ');
                break;
            default:
                console.error(`Unexpected error: ${status}`);
        }
    } else if (error.request) {
        // ไม่สามารถเชื่อมต่อกับ server ได้
        console.error('Network Error - ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } else {
        // ข้อผิดพลาดอื่นๆ
        console.error('Unexpected error:', error.message);
    }
};

// ฟังก์ชันสำหรับตรวจสอบสถานะการเชื่อมต่อ
export const checkApiHealth = async () => {
    try {
        const response = await apiClient.get('/api/health/');
        return response.status === 200;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
};

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ปัจจุบัน
export const getCurrentUser = async () => {
    try {
        const response = await apiClient.get('/api/users/me/');
        return response.data;
    } catch (error) {
        console.error('Failed to get current user:', error);
        return null;
    }
};

export default apiClient;