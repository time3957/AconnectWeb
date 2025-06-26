#!/usr/bin/env python
"""
Script สำหรับทดสอบ API
"""
import requests
import json

def test_api_health():
    """ทดสอบ API health"""
    try:
        response = requests.get('http://localhost:8000/api/token/', timeout=5)
        print(f"API Health Check: {response.status_code}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ ไม่สามารถเชื่อมต่อกับ Django server ได้")
        print("   กรุณาตรวจสอบว่า Django server กำลังทำงานอยู่หรือไม่")
        return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return False

def test_login_endpoint():
    """ทดสอบ login endpoint"""
    try:
        response = requests.post('http://localhost:8000/api/token/', 
                               json={'username': 'test', 'password': 'test'},
                               timeout=5)
        print(f"Login Endpoint Test: {response.status_code}")
        if response.status_code == 400:
            print("✅ Login endpoint ทำงานได้ (คาดหวัง 400 สำหรับข้อมูลไม่ถูกต้อง)")
            return True
        return response.status_code in [200, 400, 401]
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการทดสอบ login: {e}")
        return False

def test_cors():
    """ทดสอบ CORS"""
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Content-Type': 'application/json'
        }
        response = requests.post('http://localhost:8000/api/token/', 
                               json={'username': 'test', 'password': 'test'},
                               headers=headers,
                               timeout=5)
        print(f"CORS Test: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        return 'Access-Control-Allow-Origin' in response.headers
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการทดสอบ CORS: {e}")
        return False

if __name__ == "__main__":
    print("=== ทดสอบ API ===")
    
    print("\n1. ทดสอบการเชื่อมต่อ API...")
    if test_api_health():
        print("✅ API สามารถเข้าถึงได้")
    else:
        print("❌ ไม่สามารถเข้าถึง API ได้")
        exit(1)
    
    print("\n2. ทดสอบ Login Endpoint...")
    if test_login_endpoint():
        print("✅ Login endpoint ทำงานได้")
    else:
        print("❌ Login endpoint มีปัญหา")
    
    print("\n3. ทดสอบ CORS...")
    if test_cors():
        print("✅ CORS ตั้งค่าถูกต้อง")
    else:
        print("❌ CORS มีปัญหา")
    
    print("\n=== เสร็จสิ้นการทดสอบ ===") 