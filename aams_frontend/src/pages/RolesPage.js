import React, { useEffect, useState } from 'react';
import './RolesPage.css';

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8000/api/roles/', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูล Role ได้ กรุณาลองใหม่อีกครั้ง');
        }
        const data = await response.json();
        setRoles(data);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const getRoleIcon = (roleName) => {
    const icons = {
      'System Administrator': '👑',
      'Project Manager': '📊',
      'Team Lead': '👨‍💼',
      'Senior Agent': '👨‍💻',
      'Agent': '👤',
      'Trainee': '🎓',
      'HR': '👥'
    };
    return icons[roleName] || '🎭';
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'System Administrator': '#dc3545',
      'Project Manager': '#007bff',
      'Team Lead': '#28a745',
      'Senior Agent': '#ffc107',
      'Agent': '#6c757d',
      'Trainee': '#17a2b8',
      'HR': '#e83e8c'
    };
    return colors[roleName] || '#6c757d';
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowAddModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleToggleRoleStatus = async (role) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/roles/${role.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !role.is_active
        })
      });
      
      if (response.ok) {
        // อัพเดทข้อมูลใน state
        setRoles(roles.map(r => 
          r.id === role.id ? { ...r, is_active: !r.is_active } : r
        ));
      } else {
        throw new Error('ไม่สามารถอัพเดทสถานะ Role ได้');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRole = async (role) => {
    if (window.confirm(`คุณต้องการลบ Role "${role.name}" ใช่หรือไม่?`)) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:8000/api/roles/${role.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          },
        });
        
        if (response.ok) {
          setRoles(roles.filter(r => r.id !== role.id));
        } else {
          throw new Error('ไม่สามารถลบ Role ได้');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="roles-page-container" style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div className="roles-header" style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>🎭 จัดการ Role</h2>
        <p style={{ color: '#666', margin: 0 }}>ดูรายละเอียด Role ทั้งหมดในระบบ</p>
      </div>

      {/* ปุ่มเพิ่ม Role */}
      <div style={{ marginBottom: 24, textAlign: 'right' }}>
        <button
          onClick={handleAddRole}
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
          ➕ เพิ่ม Role ใหม่
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <p>กำลังโหลดข้อมูล Role...</p>
        </div>
      ) : error ? (
        <div style={{ color: 'red', marginBottom: 16, padding: 16, background: '#fff3f3', borderRadius: 8 }}>
          {error}
        </div>
      ) : (
        <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          {roles.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p>ไม่พบข้อมูล Role</p>
            </div>
          ) : (
            roles.map(role => (
              <div 
                key={role.id} 
                className="role-card"
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `3px solid ${getRoleColor(role.name)}`,
                  position: 'relative'
                }}
              >
                <div className="role-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <div 
                    className="role-icon"
                    style={{
                      fontSize: 32,
                      marginRight: 12,
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${getRoleColor(role.name)}20`,
                      borderRadius: '50%'
                    }}
                  >
                    {getRoleIcon(role.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: getRoleColor(role.name), fontWeight: 'bold' }}>
                      {role.name}
                    </h3>
                    <p style={{ margin: 4, color: '#666', fontSize: 14 }}>
                      {role.description || 'ไม่มีคำอธิบาย'}
                    </p>
                  </div>
                </div>

                <div className="role-stats" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  <div className="stat-item" style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: getRoleColor(role.name) }}>
                      {role.user_count || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>ผู้ใช้</div>
                  </div>
                  <div className="stat-item" style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: getRoleColor(role.name) }}>
                      {role.permission_count || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>สิทธิ์</div>
                  </div>
                  <div className="stat-item" style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: getRoleColor(role.name) }}>
                      {role.is_active ? '✅' : '❌'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>สถานะ</div>
                  </div>
                </div>

                {role.permissions && role.permissions.length > 0 && (
                  <div className="role-permissions">
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#333' }}>
                      สิทธิ์ที่ได้รับ:
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {role.permissions.slice(0, 5).map((permission, index) => (
                        <span 
                          key={index}
                          style={{
                            background: `${getRoleColor(role.name)}20`,
                            color: getRoleColor(role.name),
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: '500'
                          }}
                        >
                          {permission.name}
                        </span>
                      ))}
                      {role.permissions.length > 5 && (
                        <span style={{ color: '#666', fontSize: 11, alignSelf: 'center' }}>
                          +{role.permissions.length - 5} อื่นๆ
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="role-footer" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                    สร้างเมื่อ: {new Date(role.created_at).toLocaleDateString('th-TH')}
                  </div>
                  
                  {/* ปุ่มจัดการ Role */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleEditRole(role)}
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
                      onClick={() => handleToggleRoleStatus(role)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: role.is_active ? '#ffc107' : '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        transition: 'background-color 0.3s'
                      }}
                    >
                      {role.is_active ? '⏸️ ปิดใช้งาน' : '▶️ เปิดใช้งาน'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteRole(role)}
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
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal สำหรับเพิ่ม/แก้ไข Role (จะเพิ่มในภายหลัง) */}
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
            <h3>เพิ่ม Role ใหม่</h3>
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
            <h3>แก้ไข Role: {selectedRole?.name}</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <button onClick={() => setShowEditModal(false)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesPage; 