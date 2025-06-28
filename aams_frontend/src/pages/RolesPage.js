import React, { useEffect, useState } from 'react';
import './RolesPage.css';

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // State สำหรับจัดการ Permissions
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

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

  // ฟังก์ชันสำหรับดึง Permissions ทั้งหมด
  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/permissions/', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับดึง Permissions ของ Role
  const fetchRolePermissions = async (roleId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/roles/${roleId}/permissions/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedPermissions(data.map(p => p.id));
      }
    } catch (err) {
      console.error('Error fetching role permissions:', err);
    }
  };

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

  const handleManagePermissions = async (role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
    await fetchPermissions();
    await fetchRolePermissions(role.id);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      // ลบ permissions เก่าทั้งหมด
      const currentPermissions = selectedRole.permissions || [];
      for (const perm of currentPermissions) {
        await fetch(`http://localhost:8000/api/roles/${selectedRole.id}/remove_permission/`, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permission_id: perm.id }),
        });
      }

      // เพิ่ม permissions ใหม่
      for (const permId of selectedPermissions) {
        await fetch(`http://localhost:8000/api/roles/${selectedRole.id}/assign_permission/`, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permission_id: permId }),
        });
      }

      // รีเฟรชข้อมูล roles
      const response = await fetch('http://localhost:8000/api/roles/', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }

      setShowPermissionsModal(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('เกิดข้อผิดพลาดในการบันทึกสิทธิ์');
    }
  };

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
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
    // ตรวจสอบว่าเป็น System Role หรือไม่
    const systemRoles = ['System Administrator', 'Basic User'];
    if (systemRoles.includes(role.name)) {
      alert(`ไม่สามารถลบ System Role "${role.name}" ได้ เนื่องจากเป็น role สำคัญของระบบ`);
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      
      // ตรวจสอบว่ามี user ใช้ role นี้อยู่หรือไม่
      const usersResponse = await fetch(`http://localhost:8000/api/roles/${role.id}/users/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
      });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        
        if (users.length > 0) {
          const userNames = users.map(u => u.username).join(', ');
          const confirmMessage = 
            `Role "${role.name}" มีผู้ใช้ใช้งานอยู่:\n${userNames}\n\n` +
            `หากลบจะทำการเปลี่ยน Role ของผู้ใช้เหล่านี้เป็น "Basic User" อัตโนมัติ\n\n` +
            `ต้องการดำเนินการหรือไม่?`;
          
          if (!window.confirm(confirmMessage)) {
            return;
          }
        }
      }
      
      // ยืนยันการลบ
      if (window.confirm(`คุณต้องการลบ Role "${role.name}" ใช่หรือไม่?`)) {
        const response = await fetch(`http://localhost:8000/api/roles/${role.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          },
        });
        
        if (response.ok) {
          setRoles(roles.filter(r => r.id !== role.id));
          alert('ลบ Role สำเร็จ');
        } else {
          const errorData = await response.json();
          if (errorData.success) {
            // กรณีลบสำเร็จและมี user ถูกเปลี่ยน role
            setRoles(roles.filter(r => r.id !== role.id));
            alert(errorData.message);
          } else if (errorData.error) {
            alert(errorData.error);
          } else {
            throw new Error('ไม่สามารถลบ Role ได้');
          }
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // ฟังก์ชันสำหรับจัดการฟอร์ม
  const handleSubmitRole = async (formData, isEdit = false) => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = isEdit 
        ? `http://localhost:8000/api/roles/${selectedRole.id}/`
        : 'http://localhost:8000/api/roles/';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const newRole = await response.json();
        
        if (isEdit) {
          setRoles(roles.map(r => r.id === selectedRole.id ? newRole : r));
        } else {
          setRoles([...roles, newRole]);
        }
        
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedRole(null);
      } else {
        throw new Error('ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // จัดกลุ่ม Permissions ตาม Category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {});

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
                      onClick={() => handleManagePermissions(role)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6f42c1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        transition: 'background-color 0.3s'
                      }}
                    >
                      🔐 สิทธิ์
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

      {/* Modal สำหรับเพิ่ม/แก้ไข Role */}
      {(showAddModal || showEditModal) && (
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
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 20 }}>
              {showAddModal ? '➕ เพิ่ม Role ใหม่' : '✏️ แก้ไข Role'}
            </h3>
            
            <RoleForm 
              role={selectedRole}
              onSubmit={(formData) => handleSubmitRole(formData, showEditModal)}
              onCancel={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setSelectedRole(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal สำหรับจัดการ Permissions */}
      {showPermissionsModal && selectedRole && (
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
            maxWidth: 800,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 20 }}>
              🔐 จัดการสิทธิ์ - {selectedRole.name}
            </h3>
            
            {permissionsLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
                <p>กำลังโหลดข้อมูลสิทธิ์...</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ color: '#666', marginBottom: 16 }}>
                    เลือกสิทธิ์ที่ต้องการให้กับ Role "{selectedRole.name}"
                  </p>
                  
                  {/* แสดงจำนวนสิทธิ์ที่เลือก */}
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: 12, 
                    borderRadius: 8, 
                    marginBottom: 16 
                  }}>
                    <strong>สิทธิ์ที่เลือก: {selectedPermissions.length} รายการ</strong>
                  </div>
                </div>

                {/* แสดง Permissions ตาม Category */}
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} style={{ marginBottom: 24 }}>
                    <h4 style={{ 
                      marginBottom: 12, 
                      padding: '8px 12px', 
                      background: '#e9ecef', 
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {category}
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
                      {perms.map(permission => (
                        <label 
                          key={permission.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: selectedPermissions.includes(permission.id) ? '#e3f2fd' : '#fff',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handleTogglePermission(permission.id)}
                            style={{ marginRight: 8 }}
                          />
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: 14 }}>
                              {permission.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {permission.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* ปุ่มบันทึกและยกเลิก */}
                <div style={{ 
                  display: 'flex', 
                  gap: 12, 
                  justifyContent: 'flex-end',
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid #eee'
                }}>
                  <button
                    onClick={() => {
                      setShowPermissionsModal(false);
                      setSelectedRole(null);
                      setSelectedPermissions([]);
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    ยกเลิก
                  </button>
                  
                  <button
                    onClick={handleSavePermissions}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    บันทึกสิทธิ์
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Component สำหรับฟอร์ม Role
function RoleForm({ role, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    color: role?.color || '#007bff',
    is_active: role?.is_active ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const colors = [
    '#007bff', '#28a745', '#ffc107', '#dc3545',
    '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'
  ];

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          ชื่อ Role *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 14
          }}
          placeholder="กรอกชื่อ Role"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          คำอธิบาย
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 14,
            resize: 'vertical'
          }}
          placeholder="กรอกคำอธิบาย Role"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          สี
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {colors.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, color }))}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: formData.color === color ? '3px solid #333' : '2px solid #ddd',
                backgroundColor: color,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            style={{ marginRight: 8 }}
          />
          <span>เปิดใช้งาน</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          ยกเลิก
        </button>
        
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          {role ? 'อัปเดต' : 'สร้าง'}
        </button>
      </div>
    </form>
  );
}

export default RolesPage; 