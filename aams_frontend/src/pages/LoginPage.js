// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

function LoginPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // ล้าง error เมื่อผู้ใช้เริ่มพิมพ์
        if (error) setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // ตรวจสอบข้อมูล
        if (!formData.username.trim() || !formData.password.trim()) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Attempting login with:', { username: formData.username });
            
            // ใช้ custom login endpoint ที่ส่งข้อมูลผู้ใช้กลับมาด้วย
            const response = await axios.post('http://localhost:8000/api/auth/login/', {
                username: formData.username,
                password: formData.password
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Login response:', response.data);

            // ตรวจสอบว่ามี token และข้อมูลผู้ใช้หรือไม่
            if (response.data.access && response.data.user) {
                // เก็บ Token
                localStorage.setItem('accessToken', response.data.access);
                localStorage.setItem('refreshToken', response.data.refresh);
                
                // เก็บข้อมูลผู้ใช้
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                console.log('Login successful, redirecting to dashboard...');
                
                // Redirect ไปหน้า dashboard
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error('Invalid response format from server');
            }

        } catch (error) {
            console.error('Login failed:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                request: error.request
            });
            
            if (error.response) {
                // Server ตอบกลับมาแล้ว
                const status = error.response.status;
                const data = error.response.data;
                
                console.error('Response status:', status);
                console.error('Response data:', data);
                
                if (status === 401) {
                    setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
                } else if (status === 400) {
                    if (data.detail) {
                        setError(data.detail);
                    } else if (data.non_field_errors) {
                        setError(data.non_field_errors[0]);
                    } else if (data.username) {
                        setError(data.username[0]);
                    } else if (data.password) {
                        setError(data.password[0]);
                    } else {
                        setError('ข้อมูลไม่ถูกต้อง');
                    }
                } else if (status >= 500) {
                    setError('เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง');
                } else {
                    setError(`เกิดข้อผิดพลาดในการเข้าสู่ระบบ (${status})`);
                }
            } else if (error.request) {
                // ไม่สามารถเชื่อมต่อกับ server ได้
                console.error('Network error:', error.request);
                setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
            } else {
                // ข้อผิดพลาดอื่นๆ
                console.error('Unexpected error:', error.message);
                setError(`เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img src={require('../assets/aconn_logo.png')} alt="aCONNECT Logo" className="company-logo" />
                    <h1>AAMS</h1>
                    <p>ระบบจัดการโครงการและผู้ใช้</p>
                    <div className="version-badge">
                        v0.1.0-alpha
                    </div>
                </div>
                
                <form onSubmit={handleLogin} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="username">ชื่อผู้ใช้</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="กรอกชื่อผู้ใช้"
                            disabled={loading}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">รหัสผ่าน</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="กรอกรหัสผ่าน"
                            disabled={loading}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <p>© 2024 AAMS System</p>
                    <p className="version-text">AAMS v0.1.0-alpha - อยู่ระหว่างการพัฒนา</p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;