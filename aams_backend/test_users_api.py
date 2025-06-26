#!/usr/bin/env python
"""
Script สำหรับทดสอบ API Users
"""
import requests
import json

def test_users_api():
    """ทดสอบ API users"""
    print("=== ทดสอบ API Users ===")
    
    # 1. ทดสอบ login เพื่อได้ token
    print("\n1. ทดสอบ Login เพื่อได้ Token")
    try:
        login_response = requests.post('http://localhost:8000/api/auth/login/', {
            'username': 'admin',
            'password': 'admin123'
        })
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            access_token = login_data['access']
            print("✅ Login สำเร็จ")
            print(f"   Access Token: {access_token[:50]}...")
        else:
            print(f"❌ Login ล้มเหลว: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return
    except Exception as e:
        print(f"❌ Error ในการ login: {e}")
        return
    
    # 2. ทดสอบ API /api/users/me/
    print("\n2. ทดสอบ API /api/users/me/")
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        me_response = requests.get('http://localhost:8000/api/users/me/', headers=headers)
        
        print(f"Status: {me_response.status_code}")
        if me_response.status_code == 200:
            me_data = me_response.json()
            print("✅ /api/users/me/ สำเร็จ")
            print(f"   User: {me_data.get('username')} - {me_data.get('first_name')} {me_data.get('last_name')}")
        else:
            print(f"❌ /api/users/me/ ล้มเหลว")
            print(f"   Response: {me_response.text}")
    except Exception as e:
        print(f"❌ Error ในการเรียก /api/users/me/: {e}")
    
    # 3. ทดสอบ API /api/users/
    print("\n3. ทดสอบ API /api/users/")
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        users_response = requests.get('http://localhost:8000/api/users/', headers=headers)
        
        print(f"Status: {users_response.status_code}")
        if users_response.status_code == 200:
            users_data = users_response.json()
            print(f"✅ /api/users/ สำเร็จ")
            print(f"   พบผู้ใช้ {len(users_data)} คน:")
            for user in users_data:
                print(f"     - {user.get('username')}: {user.get('first_name')} {user.get('last_name')} ({'Superuser' if user.get('is_superuser') else 'Staff' if user.get('is_staff') else 'User'})")
        else:
            print(f"❌ /api/users/ ล้มเหลว")
            print(f"   Response: {users_response.text}")
    except Exception as e:
        print(f"❌ Error ในการเรียก /api/users/: {e}")
    
    # 4. ทดสอบ API /api/users/ โดยไม่ใช้ token
    print("\n4. ทดสอบ API /api/users/ โดยไม่ใช้ token")
    try:
        users_response_no_token = requests.get('http://localhost:8000/api/users/')
        
        print(f"Status: {users_response_no_token.status_code}")
        if users_response_no_token.status_code == 200:
            print("✅ /api/users/ ทำงานได้โดยไม่ใช้ token (AllowAny)")
        else:
            print(f"❌ /api/users/ ต้องการ authentication")
            print(f"   Response: {users_response_no_token.text}")
    except Exception as e:
        print(f"❌ Error ในการเรียก /api/users/ โดยไม่ใช้ token: {e}")

if __name__ == "__main__":
    print("🚀 เริ่มต้นทดสอบ API Users")
    test_users_api()
    print("\n✅ เสร็จสิ้นการทดสอบ") 