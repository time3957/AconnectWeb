// src/components/UserFormModal.js

import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import Modal from 'react-modal';

// Style สำหรับ Modal (สามารถปรับแต่งได้)
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px', // กำหนดความกว้างสูงสุด
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '2rem',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000, // ทำให้ Modal อยู่เหนือทุกอย่าง
  },
};

// State เริ่มต้นที่ว่างเปล่าสำหรับฟอร์ม
const initialState = {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    employee_id: '',
    position: '',
    department: '',
    is_active: true,
    groups: [],
};

function UserFormModal({ user, isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState(initialState);
    const [allGroups, setAllGroups] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect สำหรับดึงข้อมูล Role/Group ทั้งหมด
    useEffect(() => {
        if (isOpen) {
            const fetchGroups = async () => {
                try {
                    const response = await apiClient.get('/api/groups/'); 
                    setAllGroups(response.data);
                } catch (error) {
                    console.error("Failed to fetch groups", error);
                }
            };
            fetchGroups();
        }
    }, [isOpen]); // ดึงข้อมูลใหม่ทุกครั้งที่ Modal เปิด

    // Effect สำหรับตั้งค่าข้อมูลในฟอร์มเมื่อ user prop หรือสถานะ isOpen เปลี่ยน
    useEffect(() => {
        setErrors({}); // รีเซ็ต Error ทุกครั้งที่เปิด
        if (isOpen && user) {
            // โหมด Edit: นำข้อมูล user มาใส่ในฟอร์ม
            setFormData({
                username: user.username,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email,
                password: '', // ไม่แสดงรหัสผ่านเก่า
                employee_id: user.employee_id || '',
                position: user.position || '',
                department: user.department || '',
                is_active: user.is_active,
                groups: user.groups || [],
            });
        } else if (isOpen) {
            // โหมด Add: ใช้ค่าเริ่มต้น
            setFormData(initialState);
        }
    }, [user, isOpen]);

    // Handler สำหรับการเปลี่ยนแปลงค่าใน input ทั่วไปและ checkbox
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };
    
    // Handler สำหรับการเลือก Role/Group (multiple select)
    const handleGroupsChange = (e) => {
        const selectedOptions = [...e.target.selectedOptions].map(o => o.value);
        setFormData(prev => ({ ...prev, groups: selectedOptions }));
    };

    // Handler สำหรับการ Submit ฟอร์ม
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        
        // เตรียมข้อมูลที่จะส่ง โดยไม่ส่ง password ถ้ามันว่าง
        const dataToSave = { ...formData };
        if (!dataToSave.password) {
            delete dataToSave.password;
        }

        try {
            if (user) {
                // โหมด Edit (PUT request)
                await apiClient.put(`/api/users/${user.id}/`, dataToSave);
            } else {
                // โหมด Add (POST request)
                await apiClient.post('/api/users/', dataToSave);
            }
            alert(user ? 'User updated successfully!' : 'User created successfully!');
            onSave(); // เรียกฟังก์ชัน onSave ที่ส่งมาจาก UsersPage เพื่อปิด Modal และโหลดข้อมูลใหม่
        } catch (error) {
            if (error.response && error.response.status === 400) {
                // ถ้าเป็น Validation Error จาก Django
                console.error("Validation errors:", error.response.data);
                setErrors(error.response.data); // เก็บ Object ของ Error ไว้ใน State
            } else {
                // Error อื่นๆ ที่ไม่คาดคิด
                console.error("An unexpected error occurred:", error);
                alert("An unexpected error occurred. Please check the console for details.");
            }
        } finally {
            setIsSubmitting(false); // ปลดล็อกปุ่ม Save
        }
    };
    
    //ฟังก์ชันเล็กๆ สำหรับแสดง Error ใต้ Input field
    const getError = (fieldName) => {
        return errors[fieldName] ? <div style={{ color: '#d9534f', fontSize: '0.8rem', marginTop: '4px' }}>{errors[fieldName][0]}</div> : null;
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={customStyles}
            contentLabel={user ? "Edit User" : "Add New User"}
            shouldCloseOnOverlayClick={!isSubmitting} // ไม่ให้ปิดตอนกำลัง save
        >
            <h2>{user ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div>
                    <input name="username" value={formData.username} onChange={handleChange} placeholder="Username *" required />
                    {getError('username')}
                </div>
                
                <div>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={user ? "New Password (leave blank to keep old)" : "Password *"} required={!user} autoComplete="new-password" />
                    {getError('password')}
                </div>
                
                <div style={{display: 'flex', gap: '1rem'}}>
                    <div style={{flex: 1}}><input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" /></div>
                    <div style={{flex: 1}}><input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" /></div>
                </div>

                <div>
                    <input name="employee_id" value={formData.employee_id} onChange={handleChange} placeholder="Employee ID" />
                    {getError('employee_id')}
                </div>
                
                <div>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email *" required />
                    {getError('email')}
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                    <div style={{flex: 1}}><input name="position" value={formData.position} onChange={handleChange} placeholder="Position" /></div>
                    <div style={{flex: 1}}><input name="department" value={formData.department} onChange={handleChange} placeholder="Department" /></div>
                </div>

                <div>
                    <label>Roles (Hold Ctrl/Cmd to select multiple):</label>
                    <select multiple name="groups" value={formData.groups} onChange={handleGroupsChange} style={{ height: '120px', width: '100%' }}>
                        {allGroups.map(group => (
                            <option key={group.id} value={group.name}>{group.name}</option>
                        ))}
                    </select>
                    {getError('groups')}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} style={{width: 'auto'}} />
                    <label htmlFor="is_active" style={{ marginLeft: '0.5rem' }}>User is Active</label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default UserFormModal;