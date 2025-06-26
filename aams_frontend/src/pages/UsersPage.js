// src/pages/UsersPage.js

import React, { useEffect, useState } from 'react';
import './UsersPage.css';

function UsersPage() {
    const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State สำหรับการค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // State สำหรับ Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
        setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8000/api/users/', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
        }
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };
        fetchUsers();
    }, []);

  // ฟังก์ชันสำหรับกรองข้อมูล
  useEffect(() => {
    let filtered = users;

    // กรองตามคำค้นหา
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.first_name && user.first_name.toLowerCase().includes(term)) ||
        (user.last_name && user.last_name.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.employee_id && user.employee_id.toLowerCase().includes(term)) ||
        (user.username && user.username.toLowerCase().includes(term))
      );
    }

    // กรองตาม Role
    if (selectedRole) {
      filtered = filtered.filter(user => {
        if (user.user_roles && user.user_roles.length > 0) {
          return user.user_roles.some(role => role.role_name === selectedRole);
        }
        return false;
      });
    }

    // กรองตามสถานะ
    if (selectedStatus) {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const getRole = (user) => {
    if (user.user_roles && user.user_roles.length > 0) {
      return user.user_roles.map(r => r.role_name).join(', ');
    }
    return 'N/A';
  };

  // ดึงรายการ Role ทั้งหมดสำหรับ dropdown
  const getAllRoles = () => {
    const roles = new Set();
    users.forEach(user => {
      if (user.user_roles && user.user_roles.length > 0) {
        user.user_roles.forEach(role => roles.add(role.role_name));
      }
    });
    return Array.from(roles).sort();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedStatus('');
  };

  // ฟังก์ชันสำหรับจัดการ User
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/users/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !user.is_active
        })
      });
      
      if (response.ok) {
        // อัพเดทข้อมูลใน state
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        ));
      } else {
        throw new Error('ไม่สามารถอัพเดทสถานะผู้ใช้ได้');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`คุณต้องการลบผู้ใช้ "${user.username}" ใช่หรือไม่?`)) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:8000/api/users/${user.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          },
        });
        
        if (response.ok) {
          setUsers(users.filter(u => u.id !== user.id));
        } else {
          throw new Error('ไม่สามารถลบผู้ใช้ได้');
        }
      } catch (err) {
        setError(err.message);
            }
        }
    };

    return (
    <div className="users-page-container" style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div className="users-header" style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>👥 จัดการผู้ใช้</h2>
        <p style={{ color: '#666', margin: 0 }}>ดูข้อมูลผู้ใช้ทั้งหมดในระบบ</p>
      </div>

      {/* ปุ่มเพิ่ม User */}
      <div style={{ marginBottom: 24, textAlign: 'right' }}>
        <button
          onClick={handleAddUser}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.3s ease'
          }}
        >
          ➕ เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      {/* แถบค้นหาและกรอง */}
      <div className="search-filter-section" style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          {/* ช่องค้นหา */}
          <div style={{ flex: 1, minWidth: 250 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>
              🔍 ค้นหา
            </label>
            <input
              type="text"
              placeholder="ค้นหาจากชื่อ, นามสกุล, อีเมล, หมายเลขพนักงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: 8,
                fontSize: 14,
                transition: 'border-color 0.3s'
              }}
            />
          </div>

          {/* กรองตาม Role */}
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>
              🎭 Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: '#fff'
              }}
            >
              <option value="">ทุก Role</option>
              {getAllRoles().map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* กรองตามสถานะ */}
          <div style={{ minWidth: 120 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>
              📊 สถานะ
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: '#fff'
              }}
            >
              <option value="">ทุกสถานะ</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* ปุ่มล้างตัวกรอง */}
          <div style={{ alignSelf: 'end' }}>
            <button
              onClick={clearFilters}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'background-color 0.3s'
              }}
            >
              🗑️ ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* แสดงผลลัพธ์การค้นหา */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8f9fa', borderRadius: 8 }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            พบผู้ใช้ {filteredUsers.length} คน จากทั้งหมด {users.length} คน
          </span>
        </div>
            </div>
            
            {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <p>กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      ) : error ? (
        <div style={{ color: 'red', marginBottom: 16, padding: 16, background: '#fff3f3', borderRadius: 8 }}>
          {error}
        </div>
      ) : (
        <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          {filteredUsers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <p>ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา</p>
              <p style={{ color: '#666', fontSize: 14 }}>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user.id} 
                className="user-card"
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: user.is_active ? '3px solid #28a745' : '3px solid #dee2e6',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: user.is_active ? '#e6f9ed' : '#f8f9fa',
                    color: user.is_active ? '#28a745' : '#adb5bd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 'bold',
                    marginRight: 16
                  }}>
                    {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 18 }}>{user.first_name || ''} {user.last_name || ''}</div>
                    <div style={{ color: '#666', fontSize: 14 }}>{user.username}</div>
                  </div>
                </div>
                <div style={{ color: '#555', fontSize: 15, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>อีเมล:</span> {user.email || <span style={{ color: '#bbb' }}>N/A</span>}
                </div>
                {user.employee_id && (
                  <div style={{ color: '#555', fontSize: 15, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>หมายเลขพนักงาน:</span> {user.employee_id}
                  </div>
                )}
                <div style={{ color: '#555', fontSize: 15, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>Role:</span> {getRole(user)}
                </div>
                <div style={{ color: user.is_active ? '#28a745' : '#dc3545', fontWeight: 600, fontSize: 15 }}>
                  {user.is_active ? '🟢 Active' : '🔴 Inactive'}
                </div>

                {/* ปุ่มจัดการ User */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <button
                    onClick={() => handleEditUser(user)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      transition: 'background-color 0.3s'
                    }}
                  >
                    ✏️ แก้ไข
                  </button>
                  
                  <button
                    onClick={() => handleToggleUserStatus(user)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: user.is_active ? '#ffc107' : '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      transition: 'background-color 0.3s'
                    }}
                  >
                    {user.is_active ? '⏸️ ปิดใช้งาน' : '▶️ เปิดใช้งาน'}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteUser(user)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      transition: 'background-color 0.3s'
                    }}
                  >
                    🗑️ ลบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal สำหรับเพิ่ม/แก้ไข User */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            maxWidth: 500,
            width: '90%'
          }}>
            <h3>เพิ่มผู้ใช้ใหม่</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <button onClick={() => setShowAddModal(false)}>ปิด</button>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            maxWidth: 500,
            width: '90%'
          }}>
            <h3>แก้ไขผู้ใช้: {selectedUser?.username}</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <button onClick={() => setShowEditModal(false)}>ปิด</button>
          </div>
        </div>
      )}
        </div>
    );
}

export default UsersPage;