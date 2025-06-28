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
        department: '',
        phone: '',
        address: '',
        date_of_birth: '',
        hire_date: '',
        termination_date: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        setLoading(true);
        setError('');
        
        try {
            // ดึงข้อมูลผู้ใช้จาก localStorage ก่อน
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                } catch (parseError) {
                    console.error('Error parsing user data:', parseError);
                }
            }
            
            // ถ้าไม่มี user ID ให้ใช้ /api/users/me/ แทน
            let response;
            if (user?.id) {
                response = await apiClient.get(`/api/users/${user.id}/`);
            } else {
                response = await apiClient.get('/api/users/me/');
                setUser(response.data);
            }
            
            setFormData({
                first_name: response.data.first_name || '',
                last_name: response.data.last_name || '',
                email: response.data.email || '',
                employee_id: response.data.employee_id || '',
                position: response.data.position || '',
                department: response.data.department || '',
                phone: response.data.phone || '',
                address: response.data.address || '',
                date_of_birth: response.data.date_of_birth || '',
                hire_date: response.data.hire_date || '',
                termination_date: response.data.termination_date || ''
            });
        } catch (error) {
            console.error('Error loading user data:', error);
            setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
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
            // ตรวจสอบฟิลด์ที่จำเป็น
            const requiredFields = {
                first_name: 'ชื่อ',
                last_name: 'นามสกุล', 
                email: 'อีเมล'
            };

            const missingFields = [];
            for (const [field, label] of Object.entries(requiredFields)) {
                if (!formData[field] || formData[field].trim() === '') {
                    missingFields.push(label);
                }
            }

            if (missingFields.length > 0) {
                setError(`กรุณากรอกฟิลด์ที่จำเป็น: ${missingFields.join(', ')}`);
                setSaving(false);
                return;
            }

            // จัดการข้อมูลที่ว่างเปล่าให้เป็น null
            const dataToSend = { ...formData };
            const optionalFields = ['employee_id', 'position', 'department', 'phone', 'address', 'date_of_birth', 'hire_date', 'termination_date'];
            
            for (const field of optionalFields) {
                if (!dataToSend[field] || dataToSend[field].trim() === '') {
                    dataToSend[field] = null;
                }
            }

            // อัปเดตข้อมูลผู้ใช้
            const response = await apiClient.patch(`/api/users/${user.id}/`, dataToSend);
            
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
                    // แปลง field names เป็นภาษาไทย
                    const fieldLabels = {
                        first_name: 'ชื่อ',
                        last_name: 'นามสกุล',
                        email: 'อีเมล',
                        employee_id: 'รหัสพนักงาน',
                        position: 'ตำแหน่ง',
                        department: 'แผนก',
                        phone: 'เบอร์โทรศัพท์',
                        address: 'ที่อยู่',
                        date_of_birth: 'วันเกิด',
                        hire_date: 'วันเริ่มงาน',
                        termination_date: 'วันลาออก'
                    };

                    const errorMessages = [];
                    for (const [field, errors] of Object.entries(data)) {
                        const fieldLabel = fieldLabels[field] || field;
                        if (Array.isArray(errors)) {
                            errorMessages.push(`${fieldLabel}: ${errors.join(', ')}`);
                        } else {
                            errorMessages.push(`${fieldLabel}: ${errors}`);
                        }
                    }
                    setError(`เกิดข้อผิดพลาด: ${errorMessages.join('; ')}`);
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
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                            ฟิลด์ที่มีเครื่องหมาย * เป็นฟิลด์ที่จำเป็นต้องกรอก
                        </p>
                        
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
                                    required
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
                                    required
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
                                required
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
                                placeholder="กรอกรหัสพนักงาน (ไม่ซ้ำกับคนอื่น)"
                            />
                            <small style={{ color: '#666', fontSize: '12px' }}>
                                ถ้าระบุรหัสพนักงาน ต้องไม่ซ้ำกับคนอื่นในระบบ
                            </small>
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

                        <div className="form-group">
                            <label htmlFor="phone">เบอร์โทรศัพท์</label>
                            <input
                                type="text"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="กรอกเบอร์โทรศัพท์"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">ที่อยู่</label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="กรอกที่อยู่"
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="date_of_birth">วันเกิด</label>
                                <input
                                    type="date"
                                    id="date_of_birth"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="hire_date">วันเริ่มงาน</label>
                                <input
                                    type="date"
                                    id="hire_date"
                                    name="hire_date"
                                    value={formData.hire_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="termination_date">วันลาออก</label>
                                <input
                                    type="date"
                                    id="termination_date"
                                    name="termination_date"
                                    value={formData.termination_date}
                                    onChange={handleInputChange}
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