import React, { useState, useEffect } from 'react';
import './ProjectsPage.css';
import { getProjects, createProject, updateProject, deleteProject, toggleProjectStatus } from '../services/api';

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

  // State สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // State สำหรับการลบ
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

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
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      is_active: project.is_active
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleToggleProjectStatus = async (project) => {
    try {
      await toggleProjectStatus(project.id, !project.is_active);
      setProjects(projects.map(p => 
        p.id === project.id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'ไม่สามารถอัพเดทสถานะโครงการได้');
    }
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setDeleteInput("");
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (deleteInput !== "CONFIRM") {
      setDeleteError("คุณพิมพ์ไม่ถูกต้อง กรุณาพิมพ์ CONFIRM เพื่อยืนยัน");
      return;
    }
    
    try {
      await deleteProject(projectToDelete.id);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.detail || err.message || 'ไม่สามารถลบโครงการได้');
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

  // ฟังก์ชันสำหรับจัดการฟอร์ม
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // ล้าง error ของฟิลด์นี้
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'กรุณากรอกชื่อโครงการ';
    }
    if (formData.name.trim().length < 3) {
      errors.name = 'ชื่อโครงการต้องมีอย่างน้อย 3 ตัวอักษร';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (selectedProject) {
        // แก้ไขโครงการ
        const updatedProject = await updateProject(selectedProject.id, formData);
        setProjects(projects.map(p => 
          p.id === selectedProject.id ? updatedProject : p
        ));
        setShowEditModal(false);
      } else {
        // สร้างโครงการใหม่
        const newProject = await createProject(formData);
        setProjects([newProject, ...projects]);
        setShowAddModal(false);
      }
      
      // รีเซ็ตฟอร์ม
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
      setFormErrors({});
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        // แสดง error จาก backend
        const backendErrors = {};
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            backendErrors[key] = errorData[key][0];
          } else {
            backendErrors[key] = errorData[key];
          }
        });
        setFormErrors(backendErrors);
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowManageUsersModal(false);
    setShowManagePositionsModal(false);
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
    setFormErrors({});
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
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedProject ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">ชื่อโครงการ *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? 'error' : ''}
                  placeholder="กรอกชื่อโครงการ"
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">คำอธิบาย</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="กรอกคำอธิบายโครงการ (ไม่บังคับ)"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>เปิดใช้งานโครงการ</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-cancel"
                  disabled={submitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'กำลังบันทึก...' : (selectedProject ? 'อัปเดต' : 'สร้าง')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal สำหรับจัดการผู้ใช้ในโครงการ */}
      {showManageUsersModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>จัดการผู้ใช้ในโครงการ: {selectedProject?.name}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
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
            <div className="modal-actions">
              <button onClick={closeModal} className="btn-cancel">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal สำหรับจัดการตำแหน่งในโครงการ */}
      {showManagePositionsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>จัดการตำแหน่งในโครงการ: {selectedProject?.name}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
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
            <div className="modal-actions">
              <button onClick={closeModal} className="btn-cancel">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการลบโครงการ */}
      {showDeleteModal && projectToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: '#e53e3e' }}>ยืนยันการลบโครงการ</h3>
              <button 
                onClick={() => { 
                  setShowDeleteModal(false); 
                  setProjectToDelete(null); 
                  setDeleteInput(""); 
                  setDeleteError(""); 
                }} 
                className="modal-close"
              >
                ×
              </button>
            </div>
            <p style={{ marginBottom: 16 }}>
              การลบโครงการเป็นการกระทำที่ไม่สามารถย้อนกลับได้<br />
              กรุณาพิมพ์คำว่า <b>CONFIRM</b> เพื่อยืนยันการลบโครงการ <b>{projectToDelete.name}</b>
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => { setDeleteInput(e.target.value); setDeleteError(""); }}
              placeholder="พิมพ์ CONFIRM ที่นี่"
              style={{ 
                width: '100%', 
                padding: 12, 
                borderRadius: 8, 
                border: '2px solid #e9ecef', 
                marginBottom: 12,
                fontSize: 14
              }}
            />
            {deleteError && <div style={{ color: '#dc3545', marginBottom: 12, fontSize: 12 }}>{deleteError}</div>}
            <div className="modal-actions">
              <button
                onClick={() => { 
                  setShowDeleteModal(false); 
                  setProjectToDelete(null); 
                  setDeleteInput(""); 
                  setDeleteError(""); 
                }}
                className="btn-cancel"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteProject}
                style={{ 
                  padding: '10px 20px', 
                  background: '#e53e3e', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
                }}
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

export default ProjectsPage; 