#!/usr/bin/env python
"""
สคริปต์ทดสอบ API Projects
"""
import requests
import json

# ตั้งค่า URL และข้อมูล
BASE_URL = 'http://localhost:8000'
LOGIN_URL = f'{BASE_URL}/api/auth/login/'
PROJECTS_URL = f'{BASE_URL}/api/projects/'

def login_and_get_token():
    """เข้าสู่ระบบและรับ token"""
    print("🔐 เข้าสู่ระบบ...")
    
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        response.raise_for_status()
        
        data = response.json()
        access_token = data.get('access')
        
        if access_token:
            print("✅ เข้าสู่ระบบสำเร็จ")
            return access_token
        else:
            print("❌ ไม่พบ access token")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ: {e}")
        return None

def test_get_projects(token):
    """ทดสอบการดึงข้อมูลโครงการ"""
    print("\n📋 ทดสอบการดึงข้อมูลโครงการ...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(PROJECTS_URL, headers=headers)
        response.raise_for_status()
        
        projects = response.json()
        print(f"✅ ดึงข้อมูลโครงการสำเร็จ: {len(projects)} โครงการ")
        
        # แสดงข้อมูลโครงการ
        for i, project in enumerate(projects, 1):
            print(f"\n{i}. {project['name']}")
            print(f"   คำอธิบาย: {project['description']}")
            print(f"   สถานะ: {'🟢 เปิดใช้งาน' if project['is_active'] else '🔴 ปิดใช้งาน'}")
            print(f"   จำนวนผู้ใช้: {project['user_count']} คน")
            print(f"   สร้างเมื่อ: {project['created_at']}")
        
        return projects
        
    except requests.exceptions.RequestException as e:
        print(f"❌ เกิดข้อผิดพลาดในการดึงข้อมูลโครงการ: {e}")
        return None

def test_create_project(token):
    """ทดสอบการสร้างโครงการใหม่"""
    print("\n➕ ทดสอบการสร้างโครงการใหม่...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    new_project_data = {
        'name': 'โครงการทดสอบ API',
        'description': 'โครงการสำหรับทดสอบการทำงานของ API',
        'is_active': True
    }
    
    try:
        response = requests.post(PROJECTS_URL, json=new_project_data, headers=headers)
        response.raise_for_status()
        
        project = response.json()
        print(f"✅ สร้างโครงการสำเร็จ: {project['name']}")
        print(f"   ID: {project['id']}")
        print(f"   จำนวนผู้ใช้: {project['user_count']} คน")
        
        return project
        
    except requests.exceptions.RequestException as e:
        print(f"❌ เกิดข้อผิดพลาดในการสร้างโครงการ: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   รายละเอียด: {e.response.text}")
        return None

def test_update_project(token, project_id):
    """ทดสอบการอัพเดทโครงการ"""
    print(f"\n✏️ ทดสอบการอัพเดทโครงการ ID: {project_id}...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    update_data = {
        'description': 'โครงการที่อัพเดทแล้ว - ทดสอบการแก้ไขข้อมูล'
    }
    
    try:
        response = requests.patch(f'{PROJECTS_URL}{project_id}/', json=update_data, headers=headers)
        response.raise_for_status()
        
        project = response.json()
        print(f"✅ อัพเดทโครงการสำเร็จ: {project['name']}")
        print(f"   คำอธิบายใหม่: {project['description']}")
        
        return project
        
    except requests.exceptions.RequestException as e:
        print(f"❌ เกิดข้อผิดพลาดในการอัพเดทโครงการ: {e}")
        return None

def test_toggle_project_status(token, project_id):
    """ทดสอบการเปิด/ปิดโครงการ"""
    print(f"\n🔄 ทดสอบการเปิด/ปิดโครงการ ID: {project_id}...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # ดึงข้อมูลโครงการปัจจุบัน
        response = requests.get(f'{PROJECTS_URL}{project_id}/', headers=headers)
        response.raise_for_status()
        current_project = response.json()
        
        # สลับสถานะ
        new_status = not current_project['is_active']
        update_data = {'is_active': new_status}
        
        response = requests.patch(f'{PROJECTS_URL}{project_id}/', json=update_data, headers=headers)
        response.raise_for_status()
        
        updated_project = response.json()
        status_text = '🟢 เปิดใช้งาน' if updated_project['is_active'] else '🔴 ปิดใช้งาน'
        print(f"✅ สลับสถานะโครงการสำเร็จ: {updated_project['name']} - {status_text}")
        
        return updated_project
        
    except requests.exceptions.RequestException as e:
        print(f"❌ เกิดข้อผิดพลาดในการสลับสถานะโครงการ: {e}")
        return None

def test_delete_project(token, project_id):
    """ทดสอบการลบโครงการ"""
    print(f"\n🗑️ ทดสอบการลบโครงการ ID: {project_id}...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.delete(f'{PROJECTS_URL}{project_id}/', headers=headers)
        response.raise_for_status()
        
        print(f"✅ ลบโครงการสำเร็จ")
        
        # ตรวจสอบว่าโครงการถูกลบแล้วจริง
        response = requests.get(f'{PROJECTS_URL}{project_id}/', headers=headers)
        if response.status_code == 404:
            print("✅ ยืนยัน: โครงการถูกลบแล้ว")
        else:
            print("⚠️ คำเตือน: โครงการอาจยังไม่ถูกลบ")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ เกิดข้อผิดพลาดในการลบโครงการ: {e}")
        return None

def main():
    """ฟังก์ชันหลัก"""
    print("🚀 เริ่มทดสอบ API Projects...")
    
    # เข้าสู่ระบบ
    token = login_and_get_token()
    if not token:
        print("❌ ไม่สามารถเข้าสู่ระบบได้")
        return
    
    # ทดสอบการดึงข้อมูลโครงการ
    projects = test_get_projects(token)
    if not projects:
        print("❌ ไม่สามารถดึงข้อมูลโครงการได้")
        return
    
    # ทดสอบการสร้างโครงการใหม่
    new_project = test_create_project(token)
    if not new_project:
        print("❌ ไม่สามารถสร้างโครงการใหม่ได้")
        return
    
    # ทดสอบการอัพเดทโครงการ
    updated_project = test_update_project(token, new_project['id'])
    
    # ทดสอบการสลับสถานะโครงการ
    toggled_project = test_toggle_project_status(token, new_project['id'])
    
    # ทดสอบการลบโครงการ
    deleted = test_delete_project(token, new_project['id'])
    
    print("\n" + "="*50)
    print("✅ เสร็จสิ้นการทดสอบ API Projects!")
    print("="*50)

if __name__ == '__main__':
    main() 