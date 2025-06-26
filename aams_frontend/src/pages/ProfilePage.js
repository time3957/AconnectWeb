import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './ProfilePage.css';

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        employee_id: '',
        position: '',
        department: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            
            // ดึงข้อมูลผู้ใช้จาก API
            const userResponse = await apiClient.get('/api/users/me/');
            const userData = userResponse.data;
            setUser(userData);
            
            // เติมข้อมูลในฟอร์ม
            setFormData({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                email: userData.email || '',
                employee_id: userData.employee_id || '',
                position: userData.position || '',
                department: userData.department || ''
            });

        } catch (error) {
            console.error('Error loading user data:', error);
            // ถ้า API error ให้ใช้ข้อมูลจาก localStorage แทน
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    setFormData({
                        first_name: parsedUser.first_name || '',
                        last_name: parsedUser.last_name || '',
                        email: parsedUser.email || '',
                        employee_id: parsedUser.employee_id || '',
                        position: parsedUser.position || '',
                        department: parsedUser.department || ''
                    });
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // ล้าง error และ success เมื่อผู้ใช้เริ่มแก้ไข
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // อัปเดตข้อมูลผู้ใช้
            const response = await apiClient.patch(`/api/users/${user.id}/`, formData);
            
            // อัปเดตข้อมูลใน localStorage
            const updatedUser = { ...user, ...response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            setSuccess('อัปเดตข้อมูลเรียบร้อยแล้ว');
            
        } catch (error) {
            console.error('Error updating user data:', error);
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'object') {
                    const errorMessages = Object.values(data).flat();
                    setError(errorMessages.join(', '));
                } else {
                    setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
                }
            } else {
                setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            }
        } finally {
            setSaving(false);
        }
    };

    const getUserRole = () => {
        if (user?.is_superuser) return 'ผู้ดูแลระบบ (Superuser)';
        if (user?.is_staff) return 'ผู้ดูแลระบบ (Admin)';
        return 'ผู้ใช้ทั่วไป';
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="profile-error">
                <div className="error-message">{error}</div>
                <button onClick={loadUserData} className="btn btn-primary">
                    ลองใหม่
                </button>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>โปรไฟล์ผู้ใช้</h1>
                <p>แก้ไขข้อมูลส่วนตัวของคุณ</p>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            <div className="profile-content">
                <div className="profile-info">
                    <div className="user-avatar-large">
                        {(user?.first_name || user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="user-basic-info">
                        <h2>{user?.username}</h2>
                        <p className="user-role">{getUserRole()}</p>
                        <p className="join-date">
                            เข้าร่วมเมื่อ: {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('th-TH') : 'N/A'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-section">
                        <h3>ข้อมูลส่วนตัว</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="first_name">ชื่อ *</label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    placeholder="กรอกชื่อ"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="last_name">นามสกุล *</label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    placeholder="กรอกนามสกุล"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">อีเมล *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="กรอกอีเมล"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>ข้อมูลการทำงาน</h3>
                        
                        <div className="form-group">
                            <label htmlFor="employee_id">รหัสพนักงาน</label>
                            <input
                                type="text"
                                id="employee_id"
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleInputChange}
                                placeholder="กรอกรหัสพนักงาน"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="position">ตำแหน่ง</label>
                                <input
                                    type="text"
                                    id="position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    placeholder="กรอกตำแหน่ง"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="department">แผนก</label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    placeholder="กรอกแผนก"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                        
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={loadUserData}
                            disabled={saving}
                        >
                            ยกเลิก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfilePage; 