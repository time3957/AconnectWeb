// src/services/api.js
import axios from 'axios';

// ตรวจสอบและกำหนด baseURL ที่ถูกต้อง
let baseURL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

// ตรวจสอบว่า URL ถูกต้องหรือไม่
try {
    new URL(baseURL);
} catch (error) {
    console.error('Invalid baseURL:', baseURL);
    baseURL = 'http://127.0.0.1:8000'; // fallback URL
}

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

// ===== PROJECT API FUNCTIONS =====

// ดึงรายการโครงการทั้งหมด
export const getProjects = async () => {
    try {
        const response = await apiClient.get('/api/projects/');
        return response.data;
    } catch (error) {
        console.error('Failed to get projects:', error);
        throw error;
    }
};

// ดึงข้อมูลโครงการเดียว
export const getProject = async (projectId) => {
    try {
        const response = await apiClient.get(`/api/projects/${projectId}/`);
        return response.data;
    } catch (error) {
        console.error('Failed to get project:', error);
        throw error;
    }
};

// สร้างโครงการใหม่
export const createProject = async (projectData) => {
    try {
        const response = await apiClient.post('/api/projects/', projectData);
        return response.data;
    } catch (error) {
        console.error('Failed to create project:', error);
        throw error;
    }
};

// อัปเดตข้อมูลโครงการ
export const updateProject = async (projectId, projectData) => {
    try {
        const response = await apiClient.patch(`/api/projects/${projectId}/`, projectData);
        return response.data;
    } catch (error) {
        console.error('Failed to update project:', error);
        throw error;
    }
};

// ลบโครงการ
export const deleteProject = async (projectId) => {
    try {
        const response = await apiClient.delete(`/api/projects/${projectId}/`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete project:', error);
        throw error;
    }
};

// เปิด/ปิดสถานะโครงการ
export const toggleProjectStatus = async (projectId, isActive) => {
    try {
        const response = await apiClient.patch(`/api/projects/${projectId}/`, {
            is_active: isActive
        });
        return response.data;
    } catch (error) {
        console.error('Failed to toggle project status:', error);
        throw error;
    }
};

// ===== USER API FUNCTIONS =====

// ดึงรายการผู้ใช้ทั้งหมด
export const getUsers = async () => {
    try {
        const response = await apiClient.get('/api/users/');
        return response.data;
    } catch (error) {
        console.error('Failed to get users:', error);
        throw error;
    }
};

// สร้างผู้ใช้ใหม่
export const createUser = async (userData) => {
    try {
        const response = await apiClient.post('/api/users/', userData);
        return response.data;
    } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
    }
};

// อัปเดตข้อมูลผู้ใช้
export const updateUser = async (userId, userData) => {
    try {
        const response = await apiClient.patch(`/api/users/${userId}/`, userData);
        return response.data;
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
};

// ลบผู้ใช้
export const deleteUser = async (userId) => {
    try {
        const response = await apiClient.delete(`/api/users/${userId}/`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
};

// ===== ROLE API FUNCTIONS =====

// ดึงรายการ roles ทั้งหมด
export const getRoles = async () => {
    try {
        const response = await apiClient.get('/api/roles/');
        return response.data;
    } catch (error) {
        console.error('Failed to get roles:', error);
        throw error;
    }
};

// สร้าง role ใหม่
export const createRole = async (roleData) => {
    try {
        const response = await apiClient.post('/api/roles/', roleData);
        return response.data;
    } catch (error) {
        console.error('Failed to create role:', error);
        throw error;
    }
};

// อัปเดตข้อมูล role
export const updateRole = async (roleId, roleData) => {
    try {
        const response = await apiClient.patch(`/api/roles/${roleId}/`, roleData);
        return response.data;
    } catch (error) {
        console.error('Failed to update role:', error);
        throw error;
    }
};

// ลบ role
export const deleteRole = async (roleId) => {
    try {
        const response = await apiClient.delete(`/api/roles/${roleId}/`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete role:', error);
        throw error;
    }
};

export default apiClient;