import React, { useState, useEffect } from 'react';
import './ReportsPage.css';

function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('kpi');
  const [fileFormat, setFileFormat] = useState('excel');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeComments, setIncludeComments] = useState(true);
  const [reportStatus, setReportStatus] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8000/api/users/', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    setSelectedUsers(users.map(user => user.id));
  };

  const handleDeselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const generateReport = async () => {
    if (selectedUsers.length === 0) {
      alert('กรุณาเลือกผู้ใช้อย่างน้อย 1 คน');
      return;
    }

    setLoading(true);
    setReportStatus('กำลังสร้างรายงาน...');

    try {
      // จำลองการสร้างรายงาน
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // สร้างข้อมูลจำลองสำหรับรายงาน
      const reportData = {
        type: reportType,
        format: fileFormat,
        period: selectedPeriod,
        users: selectedUsers,
        includeCharts,
        includeComments,
        timestamp: new Date().toISOString()
      };

      // จำลองการดาวน์โหลดไฟล์
      const fileName = `${reportType.toUpperCase()}_Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
      
      // สร้างไฟล์จำลอง
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: fileFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              fileFormat === 'csv' ? 'text/csv' : 'application/pdf'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setReportStatus(`ดาวน์โหลดรายงาน ${fileName} สำเร็จ!`);
    } catch (error) {
      setReportStatus('เกิดข้อผิดพลาดในการสร้างรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'kpi': return '📈';
      case 'qa': return '🧪';
      case 'combined': return '📊';
      default: return '📄';
    }
  };

  const getFileFormatIcon = (format) => {
    switch (format) {
      case 'excel': return '📊';
      case 'csv': return '📋';
      case 'pdf': return '📄';
      default: return '📁';
    }
  };

  return (
    <div className="reports-page-container">
      <div className="reports-header">
        <h2>📊 รายงาน</h2>
        <p>สร้างและดาวน์โหลดรายงานคะแนน KPI และ QA</p>
      </div>

      <div className="reports-content">
        {/* เลือกประเภทรายงาน */}
        <div className="report-section">
          <h3>📋 เลือกประเภทรายงาน</h3>
          <div className="report-type-grid">
            <div 
              className={`report-type-card ${reportType === 'kpi' ? 'active' : ''}`}
              onClick={() => setReportType('kpi')}
            >
              <div className="report-type-icon">📈</div>
              <div className="report-type-info">
                <h4>รายงาน KPI</h4>
                <p>คะแนน Key Performance Indicators</p>
              </div>
            </div>
            
            <div 
              className={`report-type-card ${reportType === 'qa' ? 'active' : ''}`}
              onClick={() => setReportType('qa')}
            >
              <div className="report-type-icon">🧪</div>
              <div className="report-type-info">
                <h4>รายงาน QA</h4>
                <p>คะแนน Quality Assurance</p>
              </div>
            </div>
            
            <div 
              className={`report-type-card ${reportType === 'combined' ? 'active' : ''}`}
              onClick={() => setReportType('combined')}
            >
              <div className="report-type-icon">📊</div>
              <div className="report-type-info">
                <h4>รายงานรวม</h4>
                <p>KPI และ QA รวมกัน</p>
              </div>
            </div>
          </div>
        </div>

        {/* เลือกรูปแบบไฟล์ */}
        <div className="report-section">
          <h3>📁 เลือกรูปแบบไฟล์</h3>
          <div className="file-format-grid">
            <div 
              className={`file-format-card ${fileFormat === 'excel' ? 'active' : ''}`}
              onClick={() => setFileFormat('excel')}
            >
              <div className="file-format-icon">📊</div>
              <div className="file-format-info">
                <h4>Excel (.xlsx)</h4>
                <p>ไฟล์ Excel พร้อมกราฟและตาราง</p>
              </div>
            </div>
            
            <div 
              className={`file-format-card ${fileFormat === 'csv' ? 'active' : ''}`}
              onClick={() => setFileFormat('csv')}
            >
              <div className="file-format-icon">📋</div>
              <div className="file-format-info">
                <h4>CSV (.csv)</h4>
                <p>ไฟล์ CSV สำหรับนำเข้าข้อมูล</p>
              </div>
            </div>
            
            <div 
              className={`file-format-card ${fileFormat === 'pdf' ? 'active' : ''}`}
              onClick={() => setFileFormat('pdf')}
            >
              <div className="file-format-icon">📄</div>
              <div className="file-format-info">
                <h4>PDF (.pdf)</h4>
                <p>ไฟล์ PDF พร้อมรายงานสวยงาม</p>
              </div>
            </div>
          </div>
        </div>

        {/* ตั้งค่ารายงาน */}
        <div className="report-section">
          <h3>⚙️ ตั้งค่ารายงาน</h3>
          <div className="report-settings">
            <div className="setting-group">
              <label>ช่วงเวลา:</label>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="setting-select"
              >
                <option value="current">เดือนปัจจุบัน</option>
                <option value="2024-01">มกราคม 2024</option>
                <option value="2023-12">ธันวาคม 2023</option>
                <option value="2023-11">พฤศจิกายน 2023</option>
                <option value="all">ทุกเดือน</option>
              </select>
            </div>

            <div className="setting-group">
              <label>ตัวเลือกเพิ่มเติม:</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={includeCharts} 
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                  />
                  รวมกราฟและแผนภูมิ
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={includeComments} 
                    onChange={(e) => setIncludeComments(e.target.checked)}
                  />
                  รวมความคิดเห็น
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* เลือกผู้ใช้ */}
        <div className="report-section">
          <h3>👥 เลือกผู้ใช้</h3>
          <div className="user-selection-controls">
            <button onClick={handleSelectAllUsers} className="btn-select-all">
              เลือกทั้งหมด
            </button>
            <button onClick={handleDeselectAllUsers} className="btn-deselect-all">
              ยกเลิกเลือกทั้งหมด
            </button>
            <span className="selected-count">
              เลือกแล้ว: {selectedUsers.length} คน
            </span>
          </div>
          
          <div className="users-grid">
            {users.map(user => (
              <div 
                key={user.id} 
                className={`user-card ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                onClick={() => handleUserSelection(user.id)}
              >
                <div className="user-avatar">
                  {(user.first_name || user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h4>
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.username
                    }
                  </h4>
                  <p>@{user.username}</p>
                </div>
                <div className="user-checkbox">
                  {selectedUsers.includes(user.id) ? '✅' : '⭕'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* สร้างรายงาน */}
        <div className="report-section">
          <div className="report-actions">
            <button 
              onClick={generateReport} 
              disabled={loading || selectedUsers.length === 0}
              className="btn-generate-report"
            >
              {loading ? '⏳ กำลังสร้างรายงาน...' : '🚀 สร้างรายงาน'}
            </button>
            
            {reportStatus && (
              <div className={`report-status ${reportStatus.includes('สำเร็จ') ? 'success' : 'error'}`}>
                {reportStatus}
              </div>
            )}
          </div>
        </div>

        {/* ตัวอย่างรายงาน */}
        <div className="report-section">
          <h3>📋 ตัวอย่างรายงาน</h3>
          <div className="report-preview">
            <div className="preview-header">
              <h4>รายงาน {reportType.toUpperCase()} - {selectedPeriod}</h4>
              <p>รูปแบบ: {fileFormat.toUpperCase()}</p>
            </div>
            
            <div className="preview-content">
              <div className="preview-item">
                <span className="preview-label">ประเภทรายงาน:</span>
                <span className="preview-value">{getReportTypeIcon(reportType)} {reportType.toUpperCase()}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">รูปแบบไฟล์:</span>
                <span className="preview-value">{getFileFormatIcon(fileFormat)} {fileFormat.toUpperCase()}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">ช่วงเวลา:</span>
                <span className="preview-value">📅 {selectedPeriod}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">จำนวนผู้ใช้:</span>
                <span className="preview-value">👥 {selectedUsers.length} คน</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">รวมกราฟ:</span>
                <span className="preview-value">{includeCharts ? '✅ ใช่' : '❌ ไม่'}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">รวมความคิดเห็น:</span>
                <span className="preview-value">{includeComments ? '✅ ใช่' : '❌ ไม่'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage; 