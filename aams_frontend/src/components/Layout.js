// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import './Layout.css';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/users/me/');
            setUser(response.data);
        } catch (error) {
            console.error('Error loading user data:', error);
            // ถ้าไม่สามารถดึงข้อมูลผู้ใช้ได้ ให้ใช้ข้อมูลจาก localStorage แทน
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (parseError) {
                    console.error('Error parsing user data from localStorage:', parseError);
                    // ถ้า parse ไม่ได้จริงๆ ค่อย logout
                    handleLogout();
                }
            } else {
                // ถ้าไม่มีข้อมูลใน localStorage ค่อย logout
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;
        
        setIsLoggingOut(true);
        
        try {
            // Blacklist token
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await apiClient.post('/api/token/blacklist/', {
                    refresh: refreshToken
                });
            }
        } catch (error) {
            console.error('Error blacklisting token:', error);
        } finally {
            // ล้างข้อมูลใน localStorage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // ล้าง headers
            delete apiClient.defaults.headers.common['Authorization'];
            
            // Redirect ไปหน้า login
            navigate('/login', { replace: true });
        }
    };

    const getUserRole = () => {
        if (user?.is_superuser) return 'Superuser';
        if (user?.is_staff) return 'Admin';
        return 'User';
    };

    if (loading) {
        return (
            <div className="layout-loading">
                <div className="loading-spinner"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    return (
        <div className="layout">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <img src={require('../assets/aconn_logo.png')} alt="aCONNECT Logo" className="company-logo" />
                    <h2>AAMS</h2>
                    <p>ระบบจัดการโครงการ</p>
                </div>
                
                <div className="user-info">
                    {/* <div className="user-avatar">
                        {(user?.first_name || user?.username || 'U').charAt(0).toUpperCase()}
                    </div> */}
                    <div className="user-details">
                        <div className="user-name">
                            {user?.first_name && user?.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user?.username
                            }
                        </div>
                        <div className="user-role">{getUserRole()}</div>
                    </div>
                    <div className="user-notification">
                        <span className="notification-bell" title="การแจ้งเตือน (เร็วๆ นี้)">🔔</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <Link 
                        to="/dashboard" 
                        className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                    >
                        📊 Dashboard
                    </Link>
                    
                    <Link 
                        to="/users" 
                        className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}
                    >
                        👥 จัดการผู้ใช้
                    </Link>
                    
                    {/* เมนู Role Management สำหรับ Admin/Superuser */}
                    {(user?.is_superuser || user?.is_staff) && (
                        <Link 
                            to="/roles" 
                            className={`nav-link ${location.pathname === '/roles' ? 'active' : ''}`}
                        >
                            🎭 จัดการ Role
                        </Link>
                    )}
                    
                    <Link 
                        to="/projects" 
                        className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}
                    >
                        📋 โครงการ
                    </Link>
                    
                    <Link 
                        to="/kpi" 
                        className={`nav-link ${location.pathname === '/kpi' ? 'active' : ''}`}
                    >
                        📈 คะแนน KPI
                    </Link>
                    
                    <Link 
                        to="/qa" 
                        className={`nav-link ${location.pathname === '/qa' ? 'active' : ''}`}
                    >
                        🧪 คะแนน QA
                    </Link>
                    
                    <Link 
                        to="/reports" 
                        className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}
                    >
                        📊 รายงาน
                    </Link>
                    
                    <Link 
                        to="/training" 
                        className={`nav-link ${location.pathname === '/training' ? 'active' : ''}`}
                    >
                        🎓 การอบรม
                    </Link>
                    
                    <Link 
                        to="/profile" 
                        className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                    >
                        👤 โปรไฟล์
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button 
                        onClick={handleLogout} 
                        className="logout-button"
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? 'กำลังออกจากระบบ...' : '🚪 ออกจากระบบ'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;