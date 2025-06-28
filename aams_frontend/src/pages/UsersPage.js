import React, { useEffect, useState, useCallback } from 'react';
import './UsersPage.css';

function UsersPage() {
    const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(20);

  // Bulk actions states
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchBy, setSearchBy] = useState('all'); // all, name, email, username, employee_id
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateJoinedFilter, setDateJoinedFilter] = useState('');

  // Export states
  const [exporting, setExporting] = useState(false);

  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

    const fetchUsers = async () => {
        setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        console.log('Token:', token ? 'มี token' : 'ไม่มี token'); // Debug log
        
        const response = await fetch('http://localhost:8000/api/users/', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status); // Debug log
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText); // Debug log
          
          // ตรวจสอบว่าเป็น JSON error หรือ HTML error
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.detail || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
          } catch (parseError) {
            // ถ้าไม่ใช่ JSON ให้แสดงข้อความทั่วไป
            throw new Error(`ไม่สามารถดึงข้อมูลผู้ใช้ได้ (Status: ${response.status})`);
          }
        }
        
        const data = await response.json();
        console.log('Users data:', data); // Debug log
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        console.error('Fetch users error:', err); // Debug log
        setError(err.message);
        } finally {
            setLoading(false);
        }
    };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/roles/', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.filter(role => role.is_active));
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchUserRoles = async (userId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/user-roles/?user=${userId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('User roles data:', data); // Debug log
        
        // ตรวจสอบและกรองข้อมูลที่ถูกต้อง
        if (Array.isArray(data)) {
          const validRoles = data.filter(ur => ur && ur.role && ur.role.id);
          setSelectedUserRoles(validRoles.map(ur => ur.role.id));
        } else {
          console.warn('User roles data is not an array:', data);
          setSelectedUserRoles([]);
        }
      } else {
        console.error('Failed to fetch user roles:', response.status);
        // ถ้า API ไม่มี ให้ดึงจากข้อมูล user ที่มีอยู่
        const user = users.find(u => u.id === userId);
        if (user && user.user_roles && user.user_roles.length > 0) {
          const validRoles = user.user_roles.filter(ur => ur && ur.role && ur.role.id);
          setSelectedUserRoles(validRoles.map(ur => ur.role.id));
        } else {
          setSelectedUserRoles([]);
        }
      }
    } catch (err) {
      console.error('Error fetching user roles:', err);
      // ถ้าเกิด error ให้ดึงจากข้อมูล user ที่มีอยู่
      const user = users.find(u => u.id === userId);
      if (user && user.user_roles && user.user_roles.length > 0) {
        const validRoles = user.user_roles.filter(ur => ur && ur.role && ur.role.id);
        setSelectedUserRoles(validRoles.map(ur => ur.role.id));
      } else {
        setSelectedUserRoles([]);
      }
    }
  };

  // Advanced search functions
  const performAdvancedSearch = useCallback((user) => {
      const term = searchTerm.toLowerCase();
    
    if (searchBy === 'all') {
      return (
        (user.first_name && user.first_name.toLowerCase().includes(term)) ||
        (user.last_name && user.last_name.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.username && user.username.toLowerCase().includes(term)) ||
        (user.employee_id && user.employee_id.toLowerCase().includes(term))
      );
    } else if (searchBy === 'name') {
      return (
        (user.first_name && user.first_name.toLowerCase().includes(term)) ||
        (user.last_name && user.last_name.toLowerCase().includes(term))
      );
    } else if (searchBy === 'email') {
      return user.email && user.email.toLowerCase().includes(term);
    } else if (searchBy === 'username') {
      return user.username && user.username.toLowerCase().includes(term);
    } else if (searchBy === 'employee_id') {
      return user.employee_id && user.employee_id.toLowerCase().includes(term);
    }
    
    return true;
  }, [searchTerm, searchBy]);

  useEffect(() => {
    let filtered = users;
    
    // Advanced search
    if (searchTerm) {
      filtered = filtered.filter(performAdvancedSearch);
    }
    
    // Role filter
    if (selectedRole) {
      filtered = filtered.filter(user => {
        if (user.user_roles && user.user_roles.length > 0) {
          const validRoles = user.user_roles.filter(ur => ur && ur.role_name);
          return validRoles.some(role => role.role_name === selectedRole);
        }
        return false;
      });
    }

    // Status filter
    if (selectedStatus) {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }
    
    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter(user => 
        user.department && user.department.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    }
    
    // Date joined filter (basic implementation)
    if (dateJoinedFilter) {
      const filterDate = new Date(dateJoinedFilter);
      filtered = filtered.filter(user => {
        if (user.date_joined) {
          const userDate = new Date(user.date_joined);
          return userDate.toDateString() === filterDate.toDateString();
        }
        return false;
      });
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
    setSelectedUsers([]);
    setSelectAll(false);
  }, [users, searchTerm, selectedRole, selectedStatus, departmentFilter, dateJoinedFilter, searchBy, performAdvancedSearch]);

  const getRole = (user) => {
    if (user.user_roles && user.user_roles.length > 0) {
      // กรองข้อมูลที่ถูกต้อง
      const validRoles = user.user_roles.filter(ur => ur && ur.role_name);
      if (validRoles.length > 0) {
        return validRoles.map(r => r.role_name).join(', ');
      }
    }
    return 'N/A';
  };

  const getAllRoles = () => {
    const roles = new Set();
    users.forEach(user => {
      if (user.user_roles && user.user_roles.length > 0) {
        // กรองข้อมูลที่ถูกต้อง
        const validRoles = user.user_roles.filter(ur => ur && ur.role_name);
        validRoles.forEach(role => roles.add(role.role_name));
      }
    });
    return Array.from(roles).sort();
  };

  // Pagination functions
  const getCurrentUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedUsers([]);
    setSelectAll(false);
  };

  const handleUsersPerPageChange = (perPage) => {
    setUsersPerPage(perPage);
    setCurrentPage(1);
    setSelectedUsers([]);
    setSelectAll(false);
  };

  // Bulk actions functions
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      const currentUserIds = getCurrentUsers().map(user => user.id);
      setSelectedUsers(currentUserIds);
      setSelectAll(true);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      alert('กรุณาเลือกผู้ใช้ที่ต้องการดำเนินการ');
      return;
    }

    const confirmMessage = {
      activate: `คุณต้องการเปิดใช้งานผู้ใช้ ${selectedUsers.length} คนใช่หรือไม่?`,
      deactivate: `คุณต้องการปิดใช้งานผู้ใช้ ${selectedUsers.length} คนใช่หรือไม่?`,
      delete: `คุณต้องการลบผู้ใช้ ${selectedUsers.length} คนใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้!`
    };

    if (!window.confirm(confirmMessage[action])) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      for (const userId of selectedUsers) {
        if (action === 'delete') {
          await fetch(`http://localhost:8000/api/users/${userId}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': token ? `Bearer ${token}` : undefined,
            },
          });
        } else {
          const isActive = action === 'activate';
          await fetch(`http://localhost:8000/api/users/${userId}/`, {
            method: 'PATCH',
            headers: {
              'Authorization': token ? `Bearer ${token}` : undefined,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_active: isActive }),
          });
        }
      }

      // รีเฟรชข้อมูล
      await fetchUsers();
      setSelectedUsers([]);
      setSelectAll(false);
      alert(`ดำเนินการ ${action} สำเร็จ`);
    } catch (err) {
      setError(`เกิดข้อผิดพลาดในการดำเนินการ: ${err.message}`);
    }
  };

  // Export functions
  const exportToCSV = () => {
    setExporting(true);
    
    try {
      const headers = ['Name', 'Username', 'Email', 'Role', 'Status', 'Department', 'Date Joined'];
      const csvData = filteredUsers.map(user => [
        `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        user.username,
        user.email || '',
        getRole(user),
        user.is_active ? 'Active' : 'Inactive',
        user.department || '',
        user.date_joined ? new Date(user.date_joined).toLocaleDateString('th-TH') : ''
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('ส่งออกข้อมูลสำเร็จ');
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    } finally {
      setExporting(false);
    }
  };

  const handleAddUser = async () => {
    setSelectedUser(null);
    setShowAddModal(true);
    await fetchRoles();
  };

  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
    await fetchRoles();
  };

  const handleManageUserRoles = async (user) => {
    setSelectedUser(user);
    setShowRolesModal(true);
    await fetchRoles();
    await fetchUserRoles(user.id);
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      // ลบ roles เก่าทั้งหมด
      const currentRoles = selectedUser.user_roles || [];
      for (const userRole of currentRoles) {
        try {
          const response = await fetch(`http://localhost:8000/api/user-roles/${userRole.id}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': token ? `Bearer ${token}` : undefined,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            console.warn(`Failed to remove role ${userRole.role.id}:`, response.status);
          }
        } catch (err) {
          console.warn(`Error removing role ${userRole.role.id}:`, err);
        }
      }

      // เพิ่ม role ใหม่ (ถ้ามีการเลือก)
      if (selectedUserRoles.length > 0) {
        for (const roleId of selectedUserRoles) {
          try {
            const response = await fetch(`http://localhost:8000/api/user-roles/`, {
              method: 'POST',
              headers: {
                'Authorization': token ? `Bearer ${token}` : undefined,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                user: selectedUser.id,
                role: roleId
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `ไม่สามารถกำหนด role ${roleId} ได้`);
            }
          } catch (err) {
            console.error(`Error assigning role ${roleId}:`, err);
            throw new Error(`ไม่สามารถกำหนด role ได้: ${err.message}`);
          }
        }
      }

      // รีเฟรชข้อมูล users
      await fetchUsers();
      setShowRolesModal(false);
      setSelectedUser(null);
      setSelectedUserRoles([]);
    } catch (err) {
      console.error('Error saving user roles:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก Role');
    }
  };

  const handleSubmitUser = async (formData, isEdit = false, selectedRoleId = null, setFormErrors) => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = isEdit 
        ? `http://localhost:8000/api/users/${selectedUser.id}/`
        : 'http://localhost:8000/api/users/';
      const method = isEdit ? 'PUT' : 'POST';
      
      // เพิ่ม role_id ในข้อมูลที่ส่งไป (เฉพาะการสร้าง user ใหม่)
      const dataToSend = { ...formData };
      if (!isEdit && selectedRoleId) {
        dataToSend.role_id = selectedRoleId;
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      if (response.ok) {
        await fetchUsers();
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        if (typeof errorData === 'object') {
          setFormErrors(errorData);
        } else {
          setError(errorData.detail || 'ไม่สามารถบันทึกข้อมูลได้');
        }
      }
    } catch (err) {
      setError(err.message);
    }
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

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteInput("");
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (deleteInput !== "CONFIRM") {
      setDeleteError("คุณพิมพ์ไม่ถูกต้อง กรุณาพิมพ์ CONFIRM เพื่อยืนยัน");
      return;
    }
      try {
        const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/users/${userToDelete.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          },
        });
        if (response.ok) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setShowDeleteModal(false);
        setUserToDelete(null);
        } else {
          throw new Error('ไม่สามารถลบผู้ใช้ได้');
        }
      } catch (err) {
      setDeleteError(err.message);
        }
    };

    return (
    <div className="users-page-container" style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <div className="users-header" style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>👥 จัดการผู้ใช้</h2>
        <p style={{ color: '#666', margin: 0 }}>ดูและจัดการผู้ใช้ทั้งหมดในระบบ</p>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ 
        background: '#fff', 
        padding: 24, 
        borderRadius: 12, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>
              🔍 ค้นหา
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: 8,
                  fontSize: 14,
                  backgroundColor: '#fff',
                  minWidth: 120
                }}
              >
                <option value="all">ทุกฟิลด์</option>
                <option value="name">ชื่อ</option>
                <option value="email">อีเมล</option>
                <option value="username">Username</option>
                <option value="employee_id">รหัสพนักงาน</option>
              </select>
            <input
              type="text"
                placeholder="พิมพ์เพื่อค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                  flex: 1,
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: 8,
                fontSize: 14,
                  backgroundColor: '#fff'
              }}
            />
            </div>
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setSelectedStatus('');
                setSelectedRole('');
                setDepartmentFilter('');
                setDateJoinedFilter('');
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              🗑️ ล้างฟิลเตอร์
            </button>
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              style={{
                padding: '12px 16px',
                backgroundColor: '#17a2b8',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              {showAdvancedSearch ? '🔽 ซ่อน' : '🔼'} ตัวกรองขั้นสูง
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedSearch && (
          <div style={{ 
            marginTop: 16, 
            padding: '16px 0', 
            borderTop: '1px solid #e9ecef',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}>
            <div>
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

            <div>
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

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>
                🏢 แผนก
              </label>
              <input
                type="text"
                placeholder="พิมพ์ชื่อแผนก..."
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                borderRadius: 8,
                fontSize: 14,
                  backgroundColor: '#fff'
              }}
              />
          </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>
                📅 วันที่เข้าร่วม
              </label>
              <input
                type="date"
                value={dateJoinedFilter}
                onChange={(e) => setDateJoinedFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: 8,
                  fontSize: 14,
                  backgroundColor: '#fff'
                }}
              />
        </div>
          </div>
        )}

        {/* Results Summary */}
        <div style={{ 
          marginTop: 16, 
          padding: '12px 16px', 
          background: '#f8f9fa', 
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            แสดง {((currentPage - 1) * usersPerPage) + 1}-{Math.min(currentPage * usersPerPage, filteredUsers.length)} จาก {filteredUsers.length} คน
          </span>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportToCSV}
              disabled={exporting || filteredUsers.length === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.6 : 1
              }}
            >
              {exporting ? '⏳ ส่งออก...' : '📊 ส่งออก CSV'}
            </button>
            <button
              onClick={handleAddUser}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              ➕ เพิ่มผู้ใช้
            </button>
          </div>
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
        <>
          {/* Bulk Actions Bar */}
          {selectedUsers.length > 0 && (
            <div style={{
              background: '#e3f2fd',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <span style={{ color: '#1976d2', fontWeight: 500 }}>
                เลือกแล้ว {selectedUsers.length} คน
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleBulkAction('activate')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  ✅ เปิดใช้งาน
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffc107',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  ⏸️ ปิดใช้งาน
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ ลบ
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <p>ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 1fr 1fr 120px 100px 150px',
                gap: 16,
                padding: '16px 24px',
                background: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
                fontWeight: 600,
                fontSize: 14,
                color: '#495057'
              }}>
                <div>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    style={{ transform: 'scale(1.2)' }}
                  />
                </div>
                <div>ชื่อ</div>
                <div>อีเมล</div>
                <div>Role</div>
                <div>สถานะ</div>
                <div>แผนก</div>
                <div>การดำเนินการ</div>
              </div>

              {/* Table Body */}
              {getCurrentUsers().map(user => (
              <div 
                key={user.id} 
                style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 1fr 1fr 120px 100px 150px',
                    gap: 16,
                    padding: '16px 24px',
                    borderBottom: '1px solid #f1f3f4',
                    alignItems: 'center',
                    fontSize: 14,
                    backgroundColor: selectedUsers.includes(user.id) ? '#f8f9fa' : '#fff',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                      width: 32,
                      height: 32,
                    borderRadius: '50%',
                    background: user.is_active ? '#e6f9ed' : '#f8f9fa',
                    color: user.is_active ? '#28a745' : '#adb5bd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 'bold'
                  }}>
                    {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {user.first_name || ''} {user.last_name || ''}
                  </div>
                      <div style={{ color: '#666', fontSize: 12 }}>{user.username}</div>
                </div>
                </div>
                  
                  <div style={{ color: '#495057' }}>
                    {user.email || <span style={{ color: '#bbb' }}>N/A</span>}
                  </div>
                  
                  <div style={{ color: '#495057' }}>
                    {getRole(user)}
                </div>
                  
                  <div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: user.is_active ? '#e6f9ed' : '#ffeaea',
                      color: user.is_active ? '#28a745' : '#dc3545'
                    }}>
                      {user.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                </div>

                  <div style={{ color: '#495057' }}>
                    {user.department || <span style={{ color: '#bbb' }}>N/A</span>}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => handleEditUser(user)}
                    style={{
                        padding: '4px 8px',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      border: 'none',
                        borderRadius: 4,
                      fontSize: 12,
                        cursor: 'pointer'
                    }}
                      title="แก้ไข"
                  >
                      ✏️
                  </button>
                    <button
                      onClick={() => handleManageUserRoles(user)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#6f42c1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                      title="จัดการ Role"
                    >
                      🎭
                    </button>
                  <button
                    onClick={() => handleToggleUserStatus(user)}
                    style={{
                        padding: '4px 8px',
                      backgroundColor: user.is_active ? '#ffc107' : '#28a745',
                      color: '#fff',
                      border: 'none',
                        borderRadius: 4,
                      fontSize: 12,
                        cursor: 'pointer'
                    }}
                      title={user.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                      {user.is_active ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    style={{
                        padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                        borderRadius: 4,
                      fontSize: 12,
                        cursor: 'pointer'
                    }}
                      title="ลบ"
                  >
                      🗑️
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 0',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', fontSize: 14 }}>แสดง</span>
                <select
                  value={usersPerPage}
                  onChange={(e) => handleUsersPerPageChange(Number(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span style={{ color: '#666', fontSize: 14 }}>รายการต่อหน้า</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: currentPage === 1 ? '#f8f9fa' : '#007bff',
                    color: currentPage === 1 ? '#adb5bd' : '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← ก่อนหน้า
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: currentPage === pageNum ? '#007bff' : '#fff',
                        color: currentPage === pageNum ? '#fff' : '#007bff',
                        border: '1px solid #007bff',
                        borderRadius: 4,
                        cursor: 'pointer',
                        minWidth: 40
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: currentPage === totalPages ? '#f8f9fa' : '#007bff',
                    color: currentPage === totalPages ? '#adb5bd' : '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  ถัดไป →
                </button>
              </div>
        </div>
          )}
        </>
      )}

      {/* Modal สำหรับเพิ่ม/แก้ไข User */}
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
            maxWidth: 600,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>
                {showAddModal ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขผู้ใช้'}
              </h3>
            </div>
            
            <UserForm 
              user={selectedUser}
              roles={roles}
              rolesLoading={rolesLoading}
              onSubmit={(formData, selectedRoleId, setFormErrors) => handleSubmitUser(formData, showEditModal, selectedRoleId, setFormErrors)}
              onCancel={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setSelectedUser(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal สำหรับจัดการ User Role */}
      {showRolesModal && selectedUser && (
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
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>
                🎭 จัดการ Role - {selectedUser.first_name || selectedUser.username}
              </h3>
            </div>
            
            <div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#666', marginBottom: 16 }}>
                  เลือก Role ที่ต้องการให้กับผู้ใช้ "{selectedUser.first_name || selectedUser.username}"
                </p>
                
                {/* แสดง Role ปัจจุบัน */}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 16 
                }}>
                  <strong>Role ปัจจุบัน: </strong>
                  {(() => {
                    const currentRoles = selectedUser.user_roles || [];
                    if (currentRoles.length > 0) {
                      // กรองข้อมูลที่ถูกต้อง
                      const validRoles = currentRoles.filter(ur => ur && ur.role_name);
                      if (validRoles.length > 0) {
                        return validRoles.map(ur => ur.role_name).join(', ');
                      }
                    }
                    return 'ไม่มี';
                  })()}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                  เลือก Role ใหม่
                </label>
                <select
                  value={selectedUserRoles.length > 0 ? selectedUserRoles[0] : ''}
                  onChange={(e) => {
                    const roleId = parseInt(e.target.value);
                    if (roleId) {
                      setSelectedUserRoles([roleId]);
                    } else {
                      setSelectedUserRoles([]);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: 8,
                    fontSize: 14,
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">-- เลือก Role --</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserRoles.length > 0 && (() => {
                const selectedRole = roles.find(r => r.id === selectedUserRoles[0]);
                if (selectedRole) {
                  return (
                    <div style={{ 
                      background: '#e3f2fd', 
                      padding: 16, 
                      borderRadius: 8, 
                      marginBottom: 20,
                      border: `2px solid ${selectedRole.color || '#2196f3'}`
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: 16, color: selectedRole.color || '#2196f3' }}>
                        {selectedRole.name}
                      </div>
                      <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                        {selectedRole.description}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

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
                    setShowRolesModal(false);
                    setSelectedUser(null);
                    setSelectedUserRoles([]);
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
                  onClick={handleSaveUserRoles}
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
                  บันทึก Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการลบ User */}
      {showDeleteModal && userToDelete && (
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
            padding: 32,
            borderRadius: 12,
            maxWidth: 400,
            width: '90%',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{ margin: 0, color: '#e53e3e' }}>ยืนยันการลบผู้ใช้</h3>
            </div>
            <p style={{ marginBottom: 16 }}>
              การลบผู้ใช้เป็นการกระทำที่ไม่สามารถย้อนกลับได้<br />
              กรุณาพิมพ์คำว่า <b>CONFIRM</b> เพื่อยืนยันการลบผู้ใช้ <b>{userToDelete.username}</b>
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => { setDeleteInput(e.target.value); setDeleteError(""); }}
              placeholder="พิมพ์ CONFIRM ที่นี่"
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginBottom: 12 }}
            />
            {deleteError && <div style={{ color: 'red', marginBottom: 12 }}>{deleteError}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); setDeleteInput(""); setDeleteError(""); }}
                style={{ padding: '8px 18px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteUser}
                style={{ padding: '8px 18px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
    );
}

function UserForm({ user, roles, rolesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    employee_id: user?.employee_id || '',
    position: user?.position || '',
    department: user?.department || '',
    phone: user?.phone || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth || '',
    hire_date: user?.hire_date || '',
    ...(user && { termination_date: user.termination_date || '' }),
    password: '',
    confirm_password: '',
    is_active: user?.is_active ?? true,
    is_staff: user?.is_staff ?? false,
    is_superuser: user?.is_superuser ?? false
  });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [errors, setErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.username) newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    if (!formData.email) newErrors.email = 'กรุณากรอกอีเมล';
    if (!user && !formData.password) newErrors.password = 'กรุณากรอกรหัสผ่าน';
    if (formData.password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'รหัสผ่านไม่ตรงกัน';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormErrors({});
      return;
    }
    setErrors({});
    setFormErrors({});
    const submitData = { ...formData };
    delete submitData.confirm_password;
    
    // ถ้าเป็นการสร้าง User ใหม่ ให้ลบ termination_date ออก
    if (!user) {
      delete submitData.termination_date;
    }
    
    onSubmit(submitData, selectedRoleId, setFormErrors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <>
      <div className="modal-user-form-header">
        <button
          className="floating-close-btn"
          onClick={onCancel}
          title="ปิดฟอร์ม"
          type="button"
        >
          ×
        </button>
      </div>
      <form className="modal-user-form" onSubmit={handleSubmit} style={{position: 'relative'}}>
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>ชื่อผู้ใช้ *</label>
              <div className="input-icon">
                <i className="fa fa-user"></i>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required />
              </div>
              {errors.username && <div className="form-error">{errors.username}</div>}
              {formErrors.username && <div className="form-error">{formErrors.username[0]}</div>}
            </div>
            <div className="form-group">
              <label>อีเมล *</label>
              <div className="input-icon">
                <i className="fa fa-envelope"></i>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              {errors.email && <div className="form-error">{errors.email}</div>}
              {formErrors.email && <div className="form-error">{formErrors.email[0]}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ชื่อ</label>
              <div className="input-icon">
                <i className="fa fa-id-card"></i>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>นามสกุล</label>
              <div className="input-icon">
                <i className="fa fa-id-card"></i>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>รหัสพนักงาน</label>
              <div className="input-icon">
                <i className="fa fa-hashtag"></i>
                <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} />
              </div>
              <div className="form-help">ถ้าระบุรหัสพนักงาน ต้องไม่ซ้ำกับคนอื่นในระบบ</div>
            </div>
            <div className="form-group">
              <label>ตำแหน่ง</label>
              <div className="input-icon">
                <i className="fa fa-briefcase"></i>
                <input type="text" name="position" value={formData.position} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>แผนก</label>
              <div className="input-icon">
                <i className="fa fa-building"></i>
                <input type="text" name="department" value={formData.department} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>เบอร์โทรศัพท์</label>
              <div className="input-icon">
                <i className="fa fa-phone"></i>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ที่อยู่</label>
              <div className="input-icon">
                <i className="fa fa-map-marker-alt"></i>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} />
              </div>
            </div>
            <div className="form-group">
              <label>วันเกิด</label>
              <div className="input-icon">
                <i className="fa fa-calendar"></i>
                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>วันเริ่มงาน</label>
              <div className="input-icon">
                <i className="fa fa-calendar-check"></i>
                <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} />
              </div>
            </div>
            {/* termination_date เฉพาะตอนแก้ไข */}
            {user && (
              <div className="form-group">
                <label>วันลาออก</label>
                <div className="input-icon">
                  <i className="fa fa-calendar-times"></i>
                  <input type="date" name="termination_date" value={formData.termination_date} onChange={handleChange} />
                </div>
                <div className="form-help">💡 ระบุวันลาออกเมื่อผู้ใช้ลาออกจากองค์กร</div>
              </div>
            )}
          </div>
          {/* password เฉพาะตอนสร้าง */}
          {!user && (
            <div className="form-row">
              <div className="form-group">
                <label>รหัสผ่าน *</label>
                <div className="input-icon">
                  <i className="fa fa-lock"></i>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                {errors.password && <div className="form-error">{errors.password}</div>}
                {formErrors.password && <div className="form-error">{formErrors.password[0]}</div>}
              </div>
              <div className="form-group">
                <label>ยืนยันรหัสผ่าน *</label>
                <div className="input-icon">
                  <i className="fa fa-lock"></i>
                  <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
                </div>
                {errors.confirm_password && <div className="form-error">{errors.confirm_password}</div>}
                {formErrors.confirm_password && <div className="form-error">{formErrors.confirm_password[0]}</div>}
              </div>
            </div>
          )}
          {/* เลือก Role เฉพาะตอนสร้าง */}
          {!user && (
            <div className="form-row">
              <div className="form-group" style={{ width: '100%' }}>
                <label>เลือก Role</label>
                <select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
                  <option value="">-- เลือก Role (ถ้าไม่เลือกจะกำหนดเป็น Basic User อัตโนมัติ) --</option>
                  {rolesLoading ? <option>กำลังโหลด...</option> : roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <div className="form-help">💡 ถ้าไม่เลือก Role ระบบจะกำหนด "Basic User" ให้อัตโนมัติ</div>
              </div>
            </div>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>ยกเลิก</button>
          <button type="submit" className="btn-primary">{user ? 'อัปเดต' : 'สร้าง'}</button>
        </div>
      </form>
    </>
    );
}

export default UsersPage;