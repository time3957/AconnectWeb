import React, { useState, useEffect } from 'react';
import './TrainingPage.css';

function TrainingPage() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State สำหรับ Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        
        // ดึงข้อมูลผู้ใช้
        const usersResponse = await fetch('http://localhost:8000/api/users/', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
          },
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        }
        
        // สร้างข้อมูลจำลอง
        const mockCourses = generateMockCourses();
        const mockTrainings = generateMockTrainings();
        
        setCourses(mockCourses);
        setTrainings(mockTrainings);
        
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // สร้างข้อมูลหลักสูตรจำลอง
  const generateMockCourses = () => {
    return [
      {
        id: 1,
        name: 'การจัดการโครงการขั้นสูง',
        description: 'เรียนรู้เทคนิคการจัดการโครงการแบบมืออาชีพ',
        category: 'การจัดการ',
        duration: '16 ชั่วโมง',
        level: 'ขั้นสูง',
        instructor: 'ดร. สมชาย ใจดี',
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        name: 'การเขียนโค้ด Python',
        description: 'พื้นฐานการเขียนโปรแกรมด้วย Python',
        category: 'การพัฒนา',
        duration: '24 ชั่วโมง',
        level: 'พื้นฐาน',
        instructor: 'อ. วิชัย เก่งดี',
        is_active: true,
        created_at: '2024-01-10T14:30:00Z'
      },
      {
        id: 3,
        name: 'การตลาดดิจิทัล',
        description: 'กลยุทธ์การตลาดในยุคดิจิทัล',
        category: 'การตลาด',
        duration: '12 ชั่วโมง',
        level: 'ปานกลาง',
        instructor: 'อ. สุภาพ ใจเย็น',
        is_active: false,
        created_at: '2024-01-05T09:15:00Z'
      }
    ];
  };

  // สร้างข้อมูลการอบรมจำลอง
  const generateMockTrainings = () => {
    return [
      {
        id: 1,
        course_id: 1,
        course_name: 'การจัดการโครงการขั้นสูง',
        user_id: 1,
        user_name: 'admin User',
        start_date: '2024-01-20',
        end_date: '2024-01-22',
        status: 'completed',
        result: 'ผ่าน',
        score: 85,
        certificate: 'CERT-001',
        notes: 'ทำได้ดีมาก มีความเข้าใจในเนื้อหา'
      },
      {
        id: 2,
        course_id: 2,
        course_name: 'การเขียนโค้ด Python',
        user_id: 2,
        user_name: 'manager User',
        start_date: '2024-01-25',
        end_date: '2024-01-28',
        status: 'in_progress',
        result: 'กำลังเรียน',
        score: null,
        certificate: null,
        notes: 'กำลังเรียนอยู่'
      },
      {
        id: 3,
        course_id: 1,
        course_name: 'การจัดการโครงการขั้นสูง',
        user_id: 3,
        user_name: 'user1 User',
        start_date: '2024-02-01',
        end_date: '2024-02-03',
        status: 'scheduled',
        result: 'รอเรียน',
        score: null,
        certificate: null,
        notes: 'รอเริ่มเรียน'
      }
    ];
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { text: 'เปิดใช้งาน', color: '#28a745', icon: '✅' },
      'inactive': { text: 'ปิดใช้งาน', color: '#dc3545', icon: '❌' },
      'completed': { text: 'เสร็จสิ้น', color: '#28a745', icon: '✅' },
      'in_progress': { text: 'กำลังเรียน', color: '#ffc107', icon: '⏳' },
      'scheduled': { text: 'รอเรียน', color: '#17a2b8', icon: '📅' },
      'failed': { text: 'ไม่ผ่าน', color: '#dc3545', icon: '❌' }
    };
    
    const config = statusConfig[status] || statusConfig['active'];
    return (
      <span style={{ 
        backgroundColor: config.color, 
        color: 'white', 
        padding: '4px 8px', 
        borderRadius: '12px', 
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {config.icon} {config.text}
      </span>
    );
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'พื้นฐาน': return '#28a745';
      case 'ปานกลาง': return '#ffc107';
      case 'ขั้นสูง': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setShowCourseModal(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const handleDeleteCourse = (course) => {
    if (window.confirm(`คุณต้องการลบหลักสูตร "${course.name}" ใช่หรือไม่?`)) {
      setCourses(courses.filter(c => c.id !== course.id));
    }
  };

  const handleAddTraining = () => {
    setSelectedTraining(null);
    setShowTrainingModal(true);
  };

  const handleEditTraining = (training) => {
    setSelectedTraining(training);
    setShowTrainingModal(true);
  };

  const handleDeleteTraining = (training) => {
    if (window.confirm(`คุณต้องการลบประวัติการอบรมนี้ ใช่หรือไม่?`)) {
      setTrainings(trainings.filter(t => t.id !== training.id));
    }
  };

  return (
    <div className="training-page-container">
      <div className="training-header">
        <h2>🎓 การอบรม</h2>
        <p>จัดการหลักสูตรและประวัติการอบรมของพนักงาน</p>
      </div>

      {/* Tab Navigation */}
      <div className="training-tabs">
        <button 
          className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 หลักสูตร
        </button>
        <button 
          className={`tab-button ${activeTab === 'trainings' ? 'active' : ''}`}
          onClick={() => setActiveTab('trainings')}
        >
          📋 ประวัติการอบรม
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div>⏳</div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          {error}
        </div>
      ) : (
        <div className="training-content">
          {/* หลักสูตร */}
          {activeTab === 'courses' && (
            <div className="courses-section">
              <div className="section-header">
                <h3>📚 จัดการหลักสูตร</h3>
                <button onClick={handleAddCourse} className="btn-add">
                  ➕ เพิ่มหลักสูตรใหม่
                </button>
              </div>

              <div className="courses-grid">
                {courses.length === 0 ? (
                  <div className="empty-state">
                    <div>📚</div>
                    <p>ไม่พบข้อมูลหลักสูตร</p>
                  </div>
                ) : (
                  courses.map(course => (
                    <div key={course.id} className="course-card">
                      <div className="course-header">
                        <div className="course-icon">
                          {course.category === 'การจัดการ' ? '📊' :
                           course.category === 'การพัฒนา' ? '💻' :
                           course.category === 'การตลาด' ? '📈' : '📚'}
                        </div>
                        <div className="course-info">
                          <h4>{course.name}</h4>
                          <p>{course.description}</p>
                        </div>
                        <div className="course-status">
                          {getStatusBadge(course.is_active ? 'active' : 'inactive')}
                        </div>
                      </div>

                      <div className="course-details">
                        <div className="detail-item">
                          <span className="label">หมวดหมู่:</span>
                          <span className="value">{course.category}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">ระยะเวลา:</span>
                          <span className="value">{course.duration}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">ระดับ:</span>
                          <span className="value" style={{ color: getLevelColor(course.level) }}>
                            {course.level}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">ผู้สอน:</span>
                          <span className="value">{course.instructor}</span>
                        </div>
                      </div>

                      <div className="course-footer">
                        <div className="course-meta">
                          สร้างเมื่อ: {new Date(course.created_at).toLocaleDateString('th-TH')}
                        </div>
                        
                        <div className="course-actions">
                          <button 
                            onClick={() => handleEditCourse(course)}
                            className="btn-edit"
                          >
                            ✏️ แก้ไข
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course)}
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
            </div>
          )}

          {/* ประวัติการอบรม */}
          {activeTab === 'trainings' && (
            <div className="trainings-section">
              <div className="section-header">
                <h3>📋 ประวัติการอบรม</h3>
                <button onClick={handleAddTraining} className="btn-add">
                  ➕ เพิ่มประวัติการอบรม
                </button>
              </div>

              <div className="trainings-grid">
                {trainings.length === 0 ? (
                  <div className="empty-state">
                    <div>📋</div>
                    <p>ไม่พบข้อมูลประวัติการอบรม</p>
                  </div>
                ) : (
                  trainings.map(training => (
                    <div key={training.id} className="training-card">
                      <div className="training-header">
                        <div className="training-user">
                          <div className="user-avatar">
                            {training.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4>{training.user_name}</h4>
                            <p>{training.course_name}</p>
                          </div>
                        </div>
                        <div className="training-status">
                          {getStatusBadge(training.status)}
                        </div>
                      </div>

                      <div className="training-details">
                        <div className="detail-row">
                          <div className="detail-item">
                            <span className="label">วันที่เริ่ม:</span>
                            <span className="value">{training.start_date}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">วันที่สิ้นสุด:</span>
                            <span className="value">{training.end_date}</span>
                          </div>
                        </div>
                        
                        <div className="detail-row">
                          <div className="detail-item">
                            <span className="label">ผลการอบรม:</span>
                            <span className="value">{training.result}</span>
                          </div>
                          {training.score && (
                            <div className="detail-item">
                              <span className="label">คะแนน:</span>
                              <span className="value">{training.score}/100</span>
                            </div>
                          )}
                        </div>

                        {training.certificate && (
                          <div className="detail-item">
                            <span className="label">ใบรับรอง:</span>
                            <span className="value certificate">{training.certificate}</span>
                          </div>
                        )}
                      </div>

                      {training.notes && (
                        <div className="training-notes">
                          <strong>หมายเหตุ:</strong> {training.notes}
                        </div>
                      )}

                      <div className="training-footer">
                        <div className="training-actions">
                          <button 
                            onClick={() => handleEditTraining(training)}
                            className="btn-edit"
                          >
                            ✏️ แก้ไข
                          </button>
                          <button 
                            onClick={() => handleDeleteTraining(training)}
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
            </div>
          )}
        </div>
      )}

      {/* Modal สำหรับหลักสูตร */}
      {showCourseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedCourse ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตรใหม่'}</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <div style={{ marginTop: 16 }}>
              <ul>
                <li>ชื่อหลักสูตรและคำอธิบาย</li>
                <li>หมวดหมู่และระดับความยาก</li>
                <li>ระยะเวลาและผู้สอน</li>
                <li>สถานะการเปิดใช้งาน</li>
              </ul>
            </div>
            <button onClick={() => setShowCourseModal(false)}>ปิด</button>
          </div>
        </div>
      )}

      {/* Modal สำหรับประวัติการอบรม */}
      {showTrainingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedTraining ? 'แก้ไขประวัติการอบรม' : 'เพิ่มประวัติการอบรม'}</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <div style={{ marginTop: 16 }}>
              <ul>
                <li>เลือกหลักสูตรและผู้เรียน</li>
                <li>วันที่เริ่มและสิ้นสุดการอบรม</li>
                <li>ผลการอบรมและคะแนน</li>
                <li>ใบรับรองและหมายเหตุ</li>
              </ul>
            </div>
            <button onClick={() => setShowTrainingModal(false)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingPage; 