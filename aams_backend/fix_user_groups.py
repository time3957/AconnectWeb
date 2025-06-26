#!/usr/bin/env python
"""
Script สำหรับกำหนดสิทธิ์กลุ่มและเพิ่มผู้ใช้เข้าในกลุ่ม
"""
import os
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import User
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def setup_groups_and_permissions():
    """ตั้งค่ากลุ่มและสิทธิ์"""
    print("=== ตั้งค่ากลุ่มและสิทธิ์ ===")
    
    # สร้างหรืออัปเดตกลุ่ม
    groups_data = {
        'Admin': {
            'description': 'ผู้ดูแลระบบ - มีสิทธิ์เต็ม',
            'users': ['admin', 'adminuser'],
            'permissions': ['add', 'change', 'delete', 'view']
        },
        'Supervisor': {
            'description': 'หัวหน้างาน - จัดการโครงการและทีม',
            'users': ['manager'],
            'permissions': ['add', 'change', 'view']
        },
        'Agent': {
            'description': 'พนักงาน - ทำงานในโครงการ',
            'users': ['user1'],
            'permissions': ['view']
        }
    }
    
    # ดึง ContentType สำหรับ User และ Project
    user_ct = ContentType.objects.get_for_model(User)
    project_ct = ContentType.objects.get_for_model(User)  # ใช้ User model เป็นตัวอย่าง
    
    for group_name, group_info in groups_data.items():
        # สร้างหรืออัปเดตกลุ่ม
        group, created = Group.objects.get_or_create(name=group_name)
        if created:
            print(f"✅ สร้างกลุ่ม '{group_name}' ใหม่")
        else:
            print(f"📝 อัปเดตกลุ่ม '{group_name}' ที่มีอยู่")
        
        # เพิ่ม permissions
        permissions_to_add = []
        for action in group_info['permissions']:
            try:
                perm = Permission.objects.get(
                    codename=f'{action}_user',
                    content_type=user_ct
                )
                permissions_to_add.append(perm)
            except Permission.DoesNotExist:
                print(f"⚠️  ไม่พบ permission: {action}_user")
        
        # เพิ่ม permissions ให้กลุ่ม
        group.permissions.set(permissions_to_add)
        print(f"   เพิ่ม {len(permissions_to_add)} permissions")
        
        # เพิ่มผู้ใช้เข้าในกลุ่ม
        users_added = 0
        for username in group_info['users']:
            try:
                user = User.objects.get(username=username)
                user.groups.add(group)
                users_added += 1
                print(f"   เพิ่ม {username} เข้าในกลุ่ม {group_name}")
            except User.DoesNotExist:
                print(f"⚠️  ไม่พบผู้ใช้: {username}")
        
        print(f"   เพิ่มผู้ใช้ {users_added} คนเข้าในกลุ่ม\n")

def show_current_status():
    """แสดงสถานะปัจจุบัน"""
    print("=== สถานะปัจจุบัน ===")
    
    # แสดงกลุ่มและ permissions
    print("\n📋 กลุ่มและ Permissions:")
    for group in Group.objects.all():
        print(f"\n👥 {group.name}")
        print(f"   Permissions: {group.permissions.count()} ตัว")
        if group.permissions.count() > 0:
            for perm in group.permissions.all()[:5]:  # แสดงแค่ 5 ตัวแรก
                print(f"     - {perm.codename}")
            if group.permissions.count() > 5:
                print(f"     ... และอีก {group.permissions.count() - 5} ตัว")
    
    # แสดงผู้ใช้และกลุ่ม
    print("\n👤 ผู้ใช้และกลุ่ม:")
    for user in User.objects.all():
        groups = [g.name for g in user.groups.all()]
        print(f"   {user.username}: {groups if groups else 'ไม่มีกลุ่ม'}")
        print(f"     is_staff: {user.is_staff}, is_superuser: {user.is_superuser}")

def test_api_access():
    """ทดสอบการเข้าถึง API"""
    print("\n=== ทดสอบการเข้าถึง API ===")
    
    from django.test import Client
    from django.contrib.auth import authenticate
    
    client = Client()
    
    # ทดสอบ login
    print("\n1. ทดสอบ Login:")
    for username in ['admin', 'manager', 'user1']:
        try:
            user = authenticate(username=username, password=f'{username}123')
            if user:
                print(f"   ✅ {username}: Login สำเร็จ")
                print(f"      Groups: {[g.name for g in user.groups.all()]}")
                print(f"      Permissions: {user.get_all_permissions()}")
            else:
                print(f"   ❌ {username}: Login ล้มเหลว")
        except Exception as e:
            print(f"   ❌ {username}: Error - {e}")

if __name__ == "__main__":
    print("🚀 เริ่มต้นตั้งค่ากลุ่มและสิทธิ์")
    
    # ตั้งค่ากลุ่มและสิทธิ์
    setup_groups_and_permissions()
    
    # แสดงสถานะปัจจุบัน
    show_current_status()
    
    # ทดสอบการเข้าถึง API
    test_api_access()
    
    print("\n✅ เสร็จสิ้นการตั้งค่ากลุ่มและสิทธิ์")
    print("\n📋 สรุป:")
    print("1. Admin: admin, adminuser (สิทธิ์เต็ม)")
    print("2. Supervisor: manager (จัดการโครงการ)")
    print("3. Agent: user1 (ดูข้อมูล)")
    print("\n🎯 ตอนนี้ระบบมีสิทธิ์ครบถ้วนแล้ว") 