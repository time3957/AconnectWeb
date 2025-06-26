import React, { useState, useEffect } from 'react';
import './ProjectsPage.css';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State สำหรับ Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [showManagePositionsModal, setShowManagePositionsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8000/api/projects/', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลโครงการได้ กรุณาลองใหม่อีกครั้ง');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const getProjectIcon = (projectName) => {
    const icons = ['📋', '🚀', '💼', '🎯', '🔧', '📊', '🌟', '⚡'];
    const index = projectName.length % icons.length;
    return icons[index];
  };

  const getProjectColor = (projectName) => {
    const colors = [
      '#007bff', '#28a745', '#ffc107', '#dc3545', 
      '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'
    ];
    const index = projectName.length % colors.length;
    return colors[index];
  };

  // ฟังก์ชันสำหรับจัดการโครงการ
  const handleAddProject = () => {
    setSelectedProject(null);
    setShowAddModal(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleToggleProjectStatus = async (project) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/projects/${project.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !project.is_active
        })
      });
      
      if (response.ok) {
        setProjects(projects.map(p => 
          p.id === project.id ? { ...p, is_active: !p.is_active } : p
        ));
      } else {
        throw new Error('ไม่สามารถอัพเดทสถานะโครงการได้');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (project) => {
    if (window.confirm(`คุณต้องการลบโครงการ "${project.name}" ใช่หรือไม่?`)) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:8000/api/projects/${project.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          },
        });
        
        if (response.ok) {
          setProjects(projects.filter(p => p.id !== project.id));
        } else {
          throw new Error('ไม่สามารถลบโครงการได้');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleManageUsers = (project) => {
    setSelectedProject(project);
    setShowManageUsersModal(true);
  };

  const handleManagePositions = (project) => {
    setSelectedProject(project);
    setShowManagePositionsModal(true);
  };

  return (
    <div className="projects-page-container">
      <div className="projects-header">
        <h2>📋 จัดการโครงการ</h2>
        <p>ดูและจัดการโครงการทั้งหมดในระบบ</p>
      </div>

      {/* ปุ่มเพิ่มโครงการ */}
      <div style={{ marginBottom: 24, textAlign: 'right' }}>
        <button
          onClick={handleAddProject}
          className="btn-add-project"
        >
          ➕ เพิ่มโครงการใหม่
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div>⏳</div>
          <p>กำลังโหลดข้อมูลโครงการ...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          {error}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.length === 0 ? (
            <div className="empty-state">
              <div>📭</div>
              <p>ไม่พบข้อมูลโครงการ</p>
            </div>
          ) : (
            projects.map(project => (
              <div 
                key={project.id} 
                className="project-card"
                style={{
                  '--project-color': getProjectColor(project.name),
                  '--project-color-light': getProjectColor(project.name) + '80'
                }}
              >
                <div className="project-header">
                  <div className="project-icon">
                    {getProjectIcon(project.name)}
                  </div>
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.description || 'ไม่มีคำอธิบาย'}</p>
                  </div>
                </div>

                <div className="project-stats">
                  <div className="stat-item">
                    <div>{project.user_count || 0}</div>
                    <div>ผู้ใช้</div>
                  </div>
                  <div className="stat-item">
                    <div>{project.is_active ? '✅' : '❌'}</div>
                    <div>สถานะ</div>
                  </div>
                  <div className="stat-item">
                    <div>📅</div>
                    <div>วันที่สร้าง</div>
                  </div>
                </div>

                <div className="project-footer">
                  <div>
                    สร้างเมื่อ: {new Date(project.created_at).toLocaleDateString('th-TH')}
                  </div>
                  
                  {/* ปุ่มจัดการโครงการ */}
                  <div className="project-actions">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="btn-edit"
                    >
                      ✏️ แก้ไข
                    </button>
                    
                    <button
                      onClick={() => handleToggleProjectStatus(project)}
                      className={`btn-toggle ${project.is_active ? 'active' : ''}`}
                    >
                      {project.is_active ? '⏸️ ปิดโครงการ' : '▶️ เปิดโครงการ'}
                    </button>
                    
                    <button
                      onClick={() => handleManageUsers(project)}
                      className="btn-manage-users"
                    >
                      👥 จัดการผู้ใช้
                    </button>
                    
                    <button
                      onClick={() => handleManagePositions(project)}
                      className="btn-manage-positions"
                    >
                      🎯 จัดการตำแหน่ง
                    </button>
                    
                    <button
                      onClick={() => handleDeleteProject(project)}
                      className="btn-delete"
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

      {/* Modal สำหรับเพิ่ม/แก้ไขโครงการ */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>เพิ่มโครงการใหม่</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <button onClick={() => setShowAddModal(false)}>ปิด</button>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>แก้ไขโครงการ: {selectedProject?.name}</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <button onClick={() => setShowEditModal(false)}>ปิด</button>
          </div>
        </div>
      )}

      {/* Modal สำหรับจัดการผู้ใช้ในโครงการ */}
      {showManageUsersModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>จัดการผู้ใช้ในโครงการ: {selectedProject?.name}</h3>
            <p>ดูและจัดการผู้ใช้ที่อยู่ในโครงการนี้</p>
            <div style={{ marginTop: 16 }}>
              <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
              <ul>
                <li>ดูรายชื่อผู้ใช้ทั้งหมดในโครงการ</li>
                <li>เพิ่ม/ลบผู้ใช้ออกจากโครงการ</li>
                <li>กำหนดตำแหน่งในโครงการ</li>
                <li>จัดการสิทธิ์ในโครงการ</li>
              </ul>
            </div>
            <button onClick={() => setShowManageUsersModal(false)}>ปิด</button>
          </div>
        </div>
      )}

      {/* Modal สำหรับจัดการตำแหน่งในโครงการ */}
      {showManagePositionsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>จัดการตำแหน่งในโครงการ: {selectedProject?.name}</h3>
            <p>กำหนดและจัดการตำแหน่งต่างๆ ในโครงการ</p>
            <div style={{ marginTop: 16 }}>
              <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
              <ul>
                <li>สร้างตำแหน่งใหม่ในโครงการ</li>
                <li>แก้ไขรายละเอียดตำแหน่ง</li>
                <li>กำหนดสิทธิ์ของแต่ละตำแหน่ง</li>
                <li>มอบหมายผู้ใช้ให้ตำแหน่งต่างๆ</li>
              </ul>
            </div>
            <button onClick={() => setShowManagePositionsModal(false)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage; 