#!/usr/bin/env python
"""
สคริปต์สำหรับมอบหมาย Role ให้กับ users ที่สร้างใหม่
"""
import os
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import User, Role, UserRole

def assign_roles_to_users():
    """มอบหมาย Role ให้กับ users"""
    print("=== มอบหมาย Role ให้กับ Users ===")
    
    # ลบ UserRole เดิมทั้งหมด
    UserRole.objects.all().delete()
    print("🗑️ ลบ UserRole เดิมทั้งหมด")
    
    # มอบหมาย Role ตาม is_superuser และ is_staff
    admin_role = Role.objects.get(name='System Administrator')
    manager_role = Role.objects.get(name='Project Manager')
    agent_role = Role.objects.get(name='Agent')
    
    for user in User.objects.filter(is_active=True):
        if user.is_superuser:
            UserRole.objects.create(user=user, role=admin_role, is_active=True)
            print(f"✅ มอบหมาย System Administrator ให้ {user.username}")
        elif user.is_staff:
            UserRole.objects.create(user=user, role=manager_role, is_active=True)
            print(f"✅ มอบหมาย Project Manager ให้ {user.username}")
        else:
            UserRole.objects.create(user=user, role=agent_role, is_active=True)
            print(f"✅ มอบหมาย Agent ให้ {user.username}")

def show_user_roles():
    """แสดง Role ของ users ทั้งหมด"""
    print("\n=== Role ของ Users ทั้งหมด ===")
    
    for user in User.objects.filter(is_active=True):
        user_roles = user.user_roles.filter(is_active=True, role__is_active=True)
        roles = [user_role.role.name for user_role in user_roles]
        
        print(f"👤 {user.username}: {roles if roles else 'ไม่มี Role'}")

if __name__ == "__main__":
    print("🚀 เริ่มต้นมอบหมาย Role ให้กับ Users")
    
    # มอบหมาย Role
    assign_roles_to_users()
    
    # แสดงผลลัพธ์
    show_user_roles()
    
    print("\n✅ เสร็จสิ้นการมอบหมาย Role")
    print("\n🎯 ตอนนี้ Users มี Role ครบถ้วนแล้ว")
    print("📋 ข้อมูลสำหรับทดสอบ:")
    print("   - admin: System Administrator (ทุก Permission)")
    print("   - manager: Project Manager (7 Permission)")
    print("   - user1: Agent (2 Permission)") 