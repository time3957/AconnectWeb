// src/App.js
import React, { useState, useEffect } from 'react';
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

// สร้าง Component สำหรับป้องกันการเข้าถึงหน้าที่ต้อง Login
const PrivateRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            const user = localStorage.getItem('user');
            
            if (token && user) {
                try {
                    // ตรวจสอบว่า token ยังใช้งานได้หรือไม่
                    const tokenData = JSON.parse(atob(token.split('.')[1]));
                    const currentTime = Date.now() / 1000;
                    
                    if (tokenData.exp > currentTime) {
                        setIsAuthenticated(true);
                    } else {
                        // Token หมดอายุแล้ว
                        console.log('Token expired, clearing storage');
                        localStorage.clear();
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('Error parsing token:', error);
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

    return isAuthenticated ? children : <Navigate to="/login" replace />;
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
                    // ตรวจสอบว่า token ยังใช้งานได้หรือไม่
                    const tokenData = JSON.parse(atob(token.split('.')[1]));
                    const currentTime = Date.now() / 1000;
                    
                    if (tokenData.exp > currentTime) {
                        setIsAuthenticated(true);
                    } else {
                        // Token หมดอายุแล้ว
                        localStorage.clear();
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('Error parsing token:', error);
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