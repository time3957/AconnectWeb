#!/usr/bin/env python
"""
สคริปต์ทดสอบ API Roles
"""
import os
import sys
import django
import requests
import json

# เพิ่ม path ของ Django project
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

def test_roles_api():
    """ทดสอบ API roles"""
    print("🔍 ทดสอบ API Roles...")
    
    # URL ของ API
    base_url = "http://localhost:8000"
    roles_url = f"{base_url}/api/roles/"
    
    try:
        # ทดสอบเรียก API โดยไม่ต้อง authentication
        print(f"📡 เรียก API: {roles_url}")
        response = requests.get(roles_url)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            roles_data = response.json()
            print(f"✅ ได้รับข้อมูล Role จำนวน: {len(roles_data)} รายการ")
            
            for i, role in enumerate(roles_data, 1):
                print(f"\n🎭 Role {i}: {role['name']}")
                print(f"   📝 คำอธิบาย: {role.get('description', 'ไม่มี')}")
                print(f"   🎨 สี: {role.get('color', 'ไม่มี')}")
                print(f"   👥 จำนวนผู้ใช้: {role.get('user_count', 0)}")
                print(f"   🔐 จำนวนสิทธิ์: {role.get('permission_count', 0)}")
                print(f"   ✅ สถานะ: {'เปิดใช้งาน' if role.get('is_active') else 'ปิดใช้งาน'}")
                
                # แสดงสิทธิ์
                permissions = role.get('permissions', [])
                if permissions:
                    print(f"   🔑 สิทธิ์:")
                    for perm in permissions[:3]:  # แสดงแค่ 3 อันแรก
                        print(f"      • {perm['name']} ({perm['category']})")
                    if len(permissions) > 3:
                        print(f"      ... และอีก {len(permissions) - 3} สิทธิ์")
                else:
                    print(f"   🔑 สิทธิ์: ไม่มี")
                
                print(f"   📅 สร้างเมื่อ: {role.get('created_at', 'ไม่ระบุ')}")
        else:
            print(f"❌ เกิดข้อผิดพลาด: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ไม่สามารถเชื่อมต่อกับ server ได้")
        print("💡 ตรวจสอบว่า Django server กำลังรันอยู่ที่ http://localhost:8000")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

def test_roles_api_with_auth():
    """ทดสอบ API roles พร้อม authentication"""
    print("\n🔐 ทดสอบ API Roles พร้อม Authentication...")
    
    base_url = "http://localhost:8000"
    login_url = f"{base_url}/api/auth/login/"
    roles_url = f"{base_url}/api/roles/"
    
    # ข้อมูล login
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # Login เพื่อขอ token
        print("🔑 กำลัง login...")
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code == 200:
            tokens = login_response.json()
            access_token = tokens['access']
            print("✅ Login สำเร็จ")
            
            # เรียก API roles พร้อม token
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            print(f"📡 เรียก API Roles พร้อม token...")
            roles_response = requests.get(roles_url, headers=headers)
            
            print(f"📊 Status Code: {roles_response.status_code}")
            
            if roles_response.status_code == 200:
                roles_data = roles_response.json()
                print(f"✅ ได้รับข้อมูล Role จำนวน: {len(roles_data)} รายการ")
                
                # แสดงสรุปข้อมูล
                total_users = sum(role.get('user_count', 0) for role in roles_data)
                total_permissions = sum(role.get('permission_count', 0) for role in roles_data)
                active_roles = sum(1 for role in roles_data if role.get('is_active'))
                
                print(f"\n📊 สรุปข้อมูล:")
                print(f"   🎭 จำนวน Role ทั้งหมด: {len(roles_data)}")
                print(f"   ✅ Role ที่เปิดใช้งาน: {active_roles}")
                print(f"   👥 จำนวนผู้ใช้ทั้งหมด: {total_users}")
                print(f"   🔐 จำนวนสิทธิ์ทั้งหมด: {total_permissions}")
                
            else:
                print(f"❌ เกิดข้อผิดพลาด: {roles_response.status_code}")
                print(f"📄 Response: {roles_response.text}")
        else:
            print(f"❌ Login ล้มเหลว: {login_response.status_code}")
            print(f"📄 Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ไม่สามารถเชื่อมต่อกับ server ได้")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    print("🚀 เริ่มทดสอบ API Roles")
    print("=" * 50)
    
    # ทดสอบโดยไม่ต้อง authentication
    test_roles_api()
    
    # ทดสอบพร้อม authentication
    test_roles_api_with_auth()
    
    print("\n" + "=" * 50)
    print("✅ เสร็จสิ้นการทดสอบ") 