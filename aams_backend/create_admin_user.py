#!/usr/bin/env python
"""
Script สำหรับสร้าง Admin User และ Password เบื้องต้น
"""
import os
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import User

def create_admin_user():
    """สร้าง admin user และ password เบื้องต้น"""
    print("=== สร้าง Admin User ===")
    
    # ข้อมูล admin user
    admin_data = {
        'username': 'admin',
        'email': 'admin@aams.com',
        'first_name': 'ผู้ดูแล',
        'last_name': 'ระบบ',
        'employee_id': 'ADM001',
        'position': 'ผู้ดูแลระบบ',
        'department': 'IT',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True
    }
    
    # ตรวจสอบว่ามี admin user อยู่แล้วหรือไม่
    existing_admin = User.objects.filter(username='admin').first()
    
    if existing_admin:
        print("⚠️  พบ admin user อยู่แล้ว")
        print(f"   Username: {existing_admin.username}")
        print(f"   Email: {existing_admin.email}")
        print(f"   is_staff: {existing_admin.is_staff}")
        print(f"   is_superuser: {existing_admin.is_superuser}")
        
        # ถามว่าต้องการรีเซ็ตรหัสผ่านหรือไม่
        response = input("\nต้องการรีเซ็ตรหัสผ่านเป็น 'admin123' หรือไม่? (y/n): ")
        if response.lower() == 'y':
            existing_admin.set_password('admin123')
            existing_admin.save()
            print("✅ รีเซ็ตรหัสผ่านเรียบร้อยแล้ว")
            print("   Username: admin")
            print("   Password: admin123")
        else:
            print("❌ ไม่ได้รีเซ็ตรหัสผ่าน")
        
        return existing_admin
    
    # สร้าง admin user ใหม่
    try:
        admin_user = User.objects.create_user(
            username=admin_data['username'],
            email=admin_data['email'],
            password='admin123',  # รหัสผ่านเริ่มต้น
            first_name=admin_data['first_name'],
            last_name=admin_data['last_name'],
            employee_id=admin_data['employee_id'],
            position=admin_data['position'],
            department=admin_data['department'],
            is_staff=admin_data['is_staff'],
            is_superuser=admin_data['is_superuser'],
            is_active=admin_data['is_active']
        )
        
        print("✅ สร้าง Admin User เรียบร้อยแล้ว")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Password: admin123")
        print(f"   Name: {admin_user.get_full_name()}")
        print(f"   Employee ID: {admin_user.employee_id}")
        print(f"   Position: {admin_user.position}")
        print(f"   Department: {admin_user.department}")
        print(f"   is_staff: {admin_user.is_staff}")
        print(f"   is_superuser: {admin_user.is_superuser}")
        
        return admin_user
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการสร้าง admin user: {e}")
        return None

def create_test_users():
    """สร้าง test users เพิ่มเติม"""
    print("\n=== สร้าง Test Users ===")
    
    test_users = [
        {
            'username': 'manager',
            'email': 'manager@aams.com',
            'first_name': 'ผู้จัดการ',
            'last_name': 'โครงการ',
            'employee_id': 'MGR001',
            'position': 'ผู้จัดการโครงการ',
            'department': 'โครงการ',
            'is_staff': True,
            'is_superuser': False,
            'password': 'manager123'
        },
        {
            'username': 'user1',
            'email': 'user1@aams.com',
            'first_name': 'ผู้ใช้',
            'last_name': 'ทดสอบ',
            'employee_id': 'USR001',
            'position': 'นักพัฒนา',
            'department': 'IT',
            'is_staff': False,
            'is_superuser': False,
            'password': 'user123'
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        # ตรวจสอบว่ามี user อยู่แล้วหรือไม่
        existing_user = User.objects.filter(username=user_data['username']).first()
        
        if existing_user:
            print(f"⚠️  พบ user '{user_data['username']}' อยู่แล้ว")
            continue
        
        try:
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                employee_id=user_data['employee_id'],
                position=user_data['position'],
                department=user_data['department'],
                is_staff=user_data['is_staff'],
                is_superuser=user_data['is_superuser'],
                is_active=True
            )
            
            print(f"✅ สร้าง user '{user.username}' เรียบร้อย")
            print(f"   Password: {user_data['password']}")
            created_users.append(user)
            
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาดในการสร้าง user '{user_data['username']}': {e}")
    
    return created_users

def list_all_users():
    """แสดงรายการ users ทั้งหมด"""
    print("\n=== รายการ Users ทั้งหมด ===")
    
    users = User.objects.all().order_by('username')
    
    if not users.exists():
        print("❌ ไม่พบ users ในระบบ")
        return
    
    print(f"พบ users ทั้งหมด {users.count()} คน:")
    
    for user in users:
        print(f"\n👤 {user.username}")
        print(f"   Name: {user.get_full_name()}")
        print(f"   Email: {user.email}")
        print(f"   Employee ID: {user.employee_id}")
        print(f"   Position: {user.position}")
        print(f"   Department: {user.department}")
        print(f"   is_staff: {user.is_staff}")
        print(f"   is_superuser: {user.is_superuser}")
        print(f"   is_active: {user.is_active}")
        print(f"   Date joined: {user.date_joined.strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    print("🚀 เริ่มต้นสร้าง Users สำหรับระบบ AAMS")
    
    # สร้าง admin user
    admin_user = create_admin_user()
    
    # สร้าง test users
    test_users = create_test_users()
    
    # แสดงรายการ users ทั้งหมด
    list_all_users()
    
    print("\n=== สรุปข้อมูลการ Login ===")
    print("📋 ข้อมูลสำหรับการทดสอบ Login:")
    print("\n1. Admin User:")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Role: Superuser")
    
    print("\n2. Manager User:")
    print("   Username: manager")
    print("   Password: manager123")
    print("   Role: Staff (Admin)")
    
    print("\n3. Regular User:")
    print("   Username: user1")
    print("   Password: user123")
    print("   Role: Regular User")
    
    print("\n✅ เสร็จสิ้นการสร้าง Users")
    print("🎯 ตอนนี้คุณสามารถใช้ข้อมูลข้างต้นเพื่อ Login ทดสอบได้แล้ว") 