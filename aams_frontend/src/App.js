// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import RolesPage from './pages/RolesPage';
import KPIPage from './pages/KPIPage';
import QAQAPage from './pages/QAQAPage';
import ReportsPage from './pages/ReportsPage';
import TrainingPage from './pages/TrainingPage';
import Layout from './components/Layout';
import './App.css';

const SESSION_TIMEOUT_MINUTES = 15;

// Component สำหรับป้องกันการเข้าถึงหน้าที่ต้อง Login
const PrivateRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showSessionExpired, setShowSessionExpired] = useState(false);
    const sessionTimeoutRef = useRef();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            const user = localStorage.getItem('user');
            if (token && user) {
                try {
                    const tokenData = JSON.parse(atob(token.split('.')[1]));
                    const currentTime = Date.now() / 1000;
                    if (tokenData.exp > currentTime) {
                        setIsAuthenticated(true);
                    } else {
                        localStorage.clear();
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    localStorage.clear();
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    // Session timeout logic
    useEffect(() => {
        if (!isAuthenticated) return;
        const resetTimeout = () => {
            if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = setTimeout(() => {
                setShowSessionExpired(true);
            }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
        };
        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimeout));
        resetTimeout();
        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimeout));
            if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
        };
    }, [isAuthenticated]);

    const handleSessionExpired = () => {
        localStorage.clear();
        setShowSessionExpired(false);
        window.location.href = '/login';
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>กำลังตรวจสอบการเข้าสู่ระบบ...</p>
            </div>
        );
    }

    return (
        <>
            {showSessionExpired && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
                        <h2 style={{ color: '#dc3545', marginBottom: 16 }}>หมดเวลาใช้งาน</h2>
                        <p style={{ marginBottom: 24 }}>คุณไม่ได้ใช้งานระบบเกิน {SESSION_TIMEOUT_MINUTES} นาที กรุณาเข้าสู่ระบบใหม่</p>
                        <button onClick={handleSessionExpired} style={{ padding: '10px 32px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>ตกลง</button>
                    </div>
                </div>
            )}
            {isAuthenticated ? children : <Navigate to="/login" replace />}
        </>
    );
};

// Component สำหรับ redirect ไปหน้า login ถ้า login แล้ว
const PublicRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            const user = localStorage.getItem('user');
            
            if (token && user) {
                try {
                    const tokenData = JSON.parse(atob(token.split('.')[1]));
                    const currentTime = Date.now() / 1000;
                    
                    if (tokenData.exp > currentTime) {
                        setIsAuthenticated(true);
                    } else {
                        localStorage.clear();
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    localStorage.clear();
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>กำลังตรวจสอบการเข้าสู่ระบบ...</p>
            </div>
        );
    }

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* หน้า Login - ถ้า login แล้วจะ redirect ไปหน้า dashboard */}
                    <Route 
                        path="/login" 
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        } 
                    />
                    
                    {/* หน้าแรก - redirect ไปหน้า dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    {/* ส่วนของหน้าที่ต้อง Login */}
                    <Route 
                        element={
                            <PrivateRoute>
                                <Layout />
                            </PrivateRoute>
                        }
                    >
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/roles" element={<RolesPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/kpi" element={<KPIPage />} />
                        <Route path="/qa" element={<QAQAPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/training" element={<TrainingPage />} />
                        {/* เพิ่ม Route อื่นๆ ที่ต้อง Login ที่นี่ */}
                    </Route>
                    
                    {/* 404 - หน้าไม่พบ */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;