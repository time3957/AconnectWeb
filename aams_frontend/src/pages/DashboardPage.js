import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import './DashboardPage.css';

function DashboardPage() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProjects: 0,
        activeProjects: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // ดึงข้อมูลผู้ใช้จาก API
            const userResponse = await apiClient.get('/api/users/me/');
            setUser(userResponse.data);

            // ดึงข้อมูลสถิติ
            await loadStats(userResponse.data);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // ถ้า API error ให้ใช้ข้อมูลจาก localStorage แทน
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    // ดึงข้อมูลสถิติด้วยข้อมูลจาก localStorage
                    await loadStats(parsedUser);
                } catch (parseError) {
                    console.error('Error parsing user data:', parseError);
                    setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
                }
            } else {
                setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async (userData) => {
        try {
            // ดึงจำนวนผู้ใช้ (สำหรับ Admin/Superuser เท่านั้น)
            if (userData?.is_superuser || userData?.is_staff) {
                const usersResponse = await apiClient.get('/api/users/');
                setStats(prev => ({
                    ...prev,
                    totalUsers: usersResponse.data.length
                }));
            }

            // ดึงจำนวนโครงการ
            const projectsResponse = await apiClient.get('/api/projects/');
            const allProjects = projectsResponse.data;
            const activeProjects = allProjects.filter(project => project.is_active);

            setStats(prev => ({
                ...prev,
                totalProjects: allProjects.length,
                activeProjects: activeProjects.length
            }));

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const getUserRole = () => {
        if (user?.is_superuser) return 'ผู้ดูแลระบบ (Superuser)';
        if (user?.is_staff) return 'ผู้ดูแลระบบ (Admin)';
        if (user?.groups && user.groups.length > 0) {
            return user.groups.join(', ');
        }
        return 'ผู้ใช้ทั่วไป';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'สวัสดีตอนเช้า';
        if (hour < 17) return 'สวัสดีตอนบ่าย';
        return 'สวัสดีตอนเย็น';
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <div className="error-message">{error}</div>
                <button onClick={loadDashboardData} className="btn btn-primary">
                    ลองใหม่
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>{getGreeting()}, {user?.first_name || user?.username}!</h1>
                    <p className="user-role">บทบาท: {getUserRole()}</p>
                    <p className="login-time">
                        เข้าสู่ระบบเมื่อ: {new Date().toLocaleString('th-TH')}
                    </p>
                </div>
            </div>

            <div className="dashboard-content">
                {/* สถิติสำหรับ Admin/Superuser */}
                {(user?.is_superuser || user?.is_staff) && (
                    <div className="stats-section">
                        <h2>สถิติระบบ</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">👥</div>
                                <div className="stat-info">
                                    <h3>{stats.totalUsers}</h3>
                                    <p>ผู้ใช้ทั้งหมด</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📋</div>
                                <div className="stat-info">
                                    <h3>{stats.totalProjects}</h3>
                                    <p>โครงการทั้งหมด</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <h3>{stats.activeProjects}</h3>
                                    <p>โครงการที่ใช้งาน</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ข้อมูลสำหรับผู้ใช้ทั่วไป */}
                {!user?.is_superuser && !user?.is_staff && (
                    <div className="user-info-section">
                        <h2>ข้อมูลผู้ใช้</h2>
                        <div className="user-details-card">
                            <div className="detail-item">
                                <span className="label">ชื่อผู้ใช้:</span>
                                <span className="value">{user?.username || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">ชื่อ-นามสกุล:</span>
                                <span className="value">
                                    {user?.first_name && user?.last_name 
                                        ? `${user.first_name} ${user.last_name}`
                                        : 'N/A'
                                    }
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="label">อีเมล:</span>
                                <span className="value">{user?.email || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">รหัสพนักงาน:</span>
                                <span className="value">{user?.employee_id || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">ตำแหน่ง:</span>
                                <span className="value">{user?.position || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">แผนก:</span>
                                <span className="value">{user?.department || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h2>การดำเนินการด่วน</h2>
                    <div className="actions-grid">
                        <Link to="/projects" className="action-card">
                            <div className="action-icon">📋</div>
                            <h3>ดูโครงการ</h3>
                            <p>ดูรายการโครงการทั้งหมด</p>
                        </Link>
                        <Link to="/profile" className="action-card">
                            <div className="action-icon">👤</div>
                            <h3>แก้ไขโปรไฟล์</h3>
                            <p>แก้ไขข้อมูลส่วนตัว</p>
                        </Link>
                        {(user?.is_superuser || user?.is_staff) && (
                            <Link to="/users" className="action-card">
                                <div className="action-icon">👥</div>
                                <h3>จัดการผู้ใช้</h3>
                                <p>จัดการผู้ใช้ในระบบ</p>
                            </Link>
                        )}
                        <div className="action-card">
                            <div className="action-icon">⚙️</div>
                            <h3>ตั้งค่า</h3>
                            <p>จัดการการตั้งค่าบัญชี</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage; 