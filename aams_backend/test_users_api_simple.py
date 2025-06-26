#!/usr/bin/env python
"""
ทดสอบ API /api/users/ แบบง่าย
"""
import requests
import json

def test_users_api():
    """ทดสอบ API /api/users/"""
    print("🧪 ทดสอบ API /api/users/")
    
    try:
        # ทดสอบ GET /api/users/
        url = "http://localhost:8000/api/users/"
        print(f"📡 เรียก API: {url}")
        
        response = requests.get(url)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ สำเร็จ! พบผู้ใช้ {len(data)} คน")
            
            for user in data:
                print(f"   👤 {user.get('username', 'N/A')} - {user.get('email', 'N/A')}")
                print(f"      Staff: {user.get('is_staff', False)}, Superuser: {user.get('is_superuser', False)}")
        else:
            print(f"❌ ล้มเหลว: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ไม่สามารถเชื่อมต่อกับ server ได้")
        print("💡 ตรวจสอบว่า backend server กำลังทำงานที่ http://localhost:8000")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

def test_health_check():
    """ทดสอบ Health Check API"""
    print("\n🏥 ทดสอบ Health Check API")
    
    try:
        url = "http://localhost:8000/api/health/"
        print(f"📡 เรียก API: {url}")
        
        response = requests.get(url)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health Check สำเร็จ: {data}")
        else:
            print(f"❌ Health Check ล้มเหลว: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ไม่สามารถเชื่อมต่อกับ server ได้")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    print("🚀 เริ่มต้นทดสอบ API")
    
    # ทดสอบ Health Check ก่อน
    test_health_check()
    
    # ทดสอบ Users API
    test_users_api()
    
    print("\n✅ เสร็จสิ้นการทดสอบ") 