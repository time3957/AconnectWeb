import React, { useState, useEffect } from 'react';
import './KPIPage.css';

function QAQAPage() {
  const [qaData, setQaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedUser, setSelectedUser] = useState('all');
  const [users, setUsers] = useState([]);
  
  // State สำหรับ Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQA, setSelectedQA] = useState(null);

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
        // ดึงข้อมูล QA (จำลอง)
        const mockQAData = generateMockQAData();
        setQaData(mockQAData);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ฟังก์ชันสร้างข้อมูล QA จำลอง
  const generateMockQAData = () => {
    const qaCategories = [
      'ความถูกต้อง', 'ความครบถ้วน', 'การทดสอบ', 'การรายงาน', 'การสื่อสาร', 'การปรับปรุง'
    ];
    const mockData = [];
    const users = ['admin', 'manager', 'user1', 'user2', 'user3'];
    users.forEach((username, index) => {
      const userQA = {
        id: index + 1,
        user_id: index + 1,
        username: username,
        full_name: `${username} User`,
        period: '2024-01',
        total_score: Math.floor(Math.random() * 40) + 60, // 60-100
        max_score: 100,
        categories: qaCategories.map(category => ({
          name: category,
          score: Math.floor(Math.random() * 20) + 10, // 10-30
          max_score: 30,
          weight: 16.67
        })),
        status: Math.random() > 0.3 ? 'completed' : 'pending',
        evaluated_by: 'QA Manager',
        evaluated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        comments: 'คุณภาพงานดี มีข้อเสนอแนะเล็กน้อย'
      };
      mockData.push(userQA);
    });
    return mockData;
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '#28a745';
    if (percentage >= 80) return '#17a2b8';
    if (percentage >= 70) return '#ffc107';
    if (percentage >= 60) return '#fd7e14';
    return '#dc3545';
  };
  const getScoreIcon = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '⭐';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '⚠️';
    return '❌';
  };
  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { text: 'เสร็จสิ้น', color: '#28a745', icon: '✅' },
      'pending': { text: 'รอประเมิน', color: '#ffc107', icon: '⏳' },
      'draft': { text: 'ร่าง', color: '#6c757d', icon: '📝' }
    };
    const config = statusConfig[status] || statusConfig['pending'];
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
  const handleAddQA = () => {
    setSelectedQA(null);
    setShowAddModal(true);
  };
  const handleEditQA = (qa) => {
    setSelectedQA(qa);
    setShowEditModal(true);
  };
  const handleViewDetail = (qa) => {
    setSelectedQA(qa);
    setShowDetailModal(true);
  };
  const filteredQaData = qaData.filter(qa => {
    if (selectedUser !== 'all' && qa.username !== selectedUser) return false;
    if (selectedPeriod !== 'all' && qa.period !== selectedPeriod) return false;
    return true;
  });
  return (
    <div className="kpi-page-container">
      <div className="kpi-header">
        <h2>🧪 คะแนน QA</h2>
        <p>ดูและจัดการคะแนน Quality Assurance ของผู้ใช้</p>
      </div>
      <div className="kpi-controls">
        <div className="filters">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="filter-select"
          >
            <option value="current">เดือนปัจจุบัน</option>
            <option value="2024-01">มกราคม 2024</option>
            <option value="2023-12">ธันวาคม 2023</option>
            <option value="all">ทุกเดือน</option>
          </select>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="filter-select"
          >
            <option value="all">ผู้ใช้ทั้งหมด</option>
            {users.map(user => (
              <option key={user.id} value={user.username}>
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user.username
                }
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleAddQA} className="btn-add-kpi">
          ➕ เพิ่ม QA ใหม่
        </button>
      </div>
      {loading ? (
        <div className="loading-container">
          <div>⏳</div>
          <p>กำลังโหลดข้อมูล QA...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          {error}
        </div>
      ) : (
        <div className="kpi-grid">
          {filteredQaData.length === 0 ? (
            <div className="empty-state">
              <div>🧪</div>
              <p>ไม่พบข้อมูล QA</p>
            </div>
          ) : (
            filteredQaData.map(qa => (
              <div key={qa.id} className="kpi-card">
                <div className="kpi-header-card">
                  <div className="kpi-user-info">
                    <div className="user-avatar">
                      {qa.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{qa.full_name}</h3>
                      <p>@{qa.username}</p>
                    </div>
                  </div>
                  <div className="kpi-status">
                    {getStatusBadge(qa.status)}
                  </div>
                </div>
                <div className="kpi-score-section">
                  <div className="main-score">
                    <div className="score-circle" style={{
                      borderColor: getScoreColor(qa.total_score, qa.max_score)
                    }}>
                      <div className="score-number" style={{
                        color: getScoreColor(qa.total_score, qa.max_score)
                      }}>
                        {qa.total_score}
                      </div>
                      <div className="score-max">/ {qa.max_score}</div>
                    </div>
                    <div className="score-icon">
                      {getScoreIcon(qa.total_score, qa.max_score)}
                    </div>
                  </div>
                  <div className="score-details">
                    <div className="score-label">คะแนนรวม</div>
                    <div className="score-percentage">
                      {Math.round((qa.total_score / qa.max_score) * 100)}%
                    </div>
                  </div>
                </div>
                <div className="kpi-categories">
                  <h4>หมวดหมู่ QA</h4>
                  <div className="category-list">
                    {qa.categories.slice(0, 3).map((category, index) => (
                      <div key={index} className="category-item">
                        <span className="category-name">{category.name}</span>
                        <span className="category-score" style={{
                          color: getScoreColor(category.score, category.max_score)
                        }}>
                          {category.score}/{category.max_score}
                        </span>
                      </div>
                    ))}
                    {qa.categories.length > 3 && (
                      <div className="more-categories">
                        +{qa.categories.length - 3} หมวดหมู่เพิ่มเติม
                      </div>
                    )}
                  </div>
                </div>
                <div className="kpi-footer">
                  <div className="kpi-meta">
                    <span>📅 {qa.period}</span>
                    <span>👤 {qa.evaluated_by}</span>
                  </div>
                  <div className="kpi-actions">
                    <button 
                      onClick={() => handleViewDetail(qa)}
                      className="btn-view-detail"
                    >
                      👁️ ดูรายละเอียด
                    </button>
                    <button 
                      onClick={() => handleEditQA(qa)}
                      className="btn-edit-kpi"
                    >
                      ✏️ แก้ไข
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Modal สำหรับเพิ่ม QA */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>เพิ่ม QA ใหม่</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <div style={{ marginTop: 16 }}>
              <ul>
                <li>เลือกผู้ใช้ที่ต้องการประเมิน</li>
                <li>กำหนดหมวดหมู่และคะแนน</li>
                <li>เพิ่มความคิดเห็นและข้อเสนอแนะ</li>
                <li>บันทึกและส่งการประเมิน</li>
              </ul>
            </div>
            <button onClick={() => setShowAddModal(false)}>ปิด</button>
          </div>
        </div>
      )}
      {/* Modal สำหรับแก้ไข QA */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>แก้ไข QA: {selectedQA?.full_name}</h3>
            <p>ฟีเจอร์นี้จะเพิ่มในภายหลัง</p>
            <div style={{ marginTop: 16 }}>
              <ul>
                <li>แก้ไขคะแนนในแต่ละหมวดหมู่</li>
                <li>ปรับปรุงความคิดเห็น</li>
                <li>อัพเดทสถานะการประเมิน</li>
                <li>บันทึกการเปลี่ยนแปลง</li>
              </ul>
            </div>
            <button onClick={() => setShowEditModal(false)}>ปิด</button>
          </div>
        </div>
      )}
      {/* Modal สำหรับดูรายละเอียด QA */}
      {showDetailModal && selectedQA && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h3>รายละเอียด QA: {selectedQA.full_name}</h3>
            <div className="kpi-detail-content">
              <div className="detail-section">
                <h4>ข้อมูลทั่วไป</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">ผู้ใช้:</span>
                    <span className="value">{selectedQA.full_name} (@{selectedQA.username})</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">ช่วงเวลา:</span>
                    <span className="value">{selectedQA.period}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">ผู้ประเมิน:</span>
                    <span className="value">{selectedQA.evaluated_by}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">วันที่ประเมิน:</span>
                    <span className="value">{new Date(selectedQA.evaluated_at).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>
              <div className="detail-section">
                <h4>คะแนนรวม</h4>
                <div className="total-score-display">
                  <div className="big-score-circle" style={{
                    borderColor: getScoreColor(selectedQA.total_score, selectedQA.max_score)
                  }}>
                    <div className="big-score-number" style={{
                      color: getScoreColor(selectedQA.total_score, selectedQA.max_score)
                    }}>
                      {selectedQA.total_score}
                    </div>
                    <div className="big-score-max">/ {selectedQA.max_score}</div>
                  </div>
                  <div className="score-breakdown">
                    <div className="score-percentage-big">
                      {Math.round((selectedQA.total_score / selectedQA.max_score) * 100)}%
                    </div>
                    <div className="score-icon-big">
                      {getScoreIcon(selectedQA.total_score, selectedQA.max_score)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="detail-section">
                <h4>คะแนนรายหมวดหมู่</h4>
                <div className="categories-detail">
                  {selectedQA.categories.map((category, index) => (
                    <div key={index} className="category-detail-item">
                      <div className="category-info">
                        <span className="category-name">{category.name}</span>
                        <span className="category-weight">น้ำหนัก: {category.weight}%</span>
                      </div>
                      <div className="category-score-bar">
                        <div 
                          className="score-fill" 
                          style={{
                            width: `${(category.score / category.max_score) * 100}%`,
                            backgroundColor: getScoreColor(category.score, category.max_score)
                          }}
                        ></div>
                      </div>
                      <div className="category-score-text">
                        {category.score}/{category.max_score} 
                        ({Math.round((category.score / category.max_score) * 100)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <h4>ความคิดเห็น</h4>
                <div className="comments-section">
                  <p>{selectedQA.comments}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowDetailModal(false)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QAQAPage; 