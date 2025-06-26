#!/usr/bin/env python
"""
ทดสอบ Login API
"""
import requests
import json

def test_login_api():
    """ทดสอบ Login API"""
    print("🧪 ทดสอบ Login API")
    
    # ทดสอบ login ด้วย admin
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        url = "http://localhost:8000/api/auth/login/"
        print(f"📡 เรียก API: {url}")
        print(f"📤 ข้อมูล: {login_data}")
        
        response = requests.post(url, json=login_data)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login สำเร็จ!")
            print(f"   Access Token: {data.get('access', 'N/A')[:50]}...")
            print(f"   Refresh Token: {data.get('refresh', 'N/A')[:50]}...")
            if 'user' in data:
                user = data['user']
                print(f"   User: {user.get('username', 'N/A')} - {user.get('email', 'N/A')}")
                print(f"   Role: {user.get('is_superuser', False)} (Superuser)")
        else:
            print(f"❌ Login ล้มเหลว: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ไม่สามารถเชื่อมต่อกับ server ได้")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

def test_default_token_api():
    """ทดสอบ Default Token API"""
    print("\n🧪 ทดสอบ Default Token API")
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        url = "http://localhost:8000/api/token/"
        print(f"📡 เรียก API: {url}")
        
        response = requests.post(url, json=login_data)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Default Token API สำเร็จ!")
            print(f"   Access Token: {data.get('access', 'N/A')[:50]}...")
            print(f"   Refresh Token: {data.get('refresh', 'N/A')[:50]}...")
        else:
            print(f"❌ Default Token API ล้มเหลว: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ไม่สามารถเชื่อมต่อกับ server ได้")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    print("🚀 เริ่มต้นทดสอบ Login API")
    
    # ทดสอบ Custom Login API
    test_login_api()
    
    # ทดสอบ Default Token API
    test_default_token_api()
    
    print("\n✅ เสร็จสิ้นการทดสอบ") 