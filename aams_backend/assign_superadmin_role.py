#!/usr/bin/env python
"""
สคริปต์สำหรับกำหนด Super Admin role ให้กับ superuser
"""

import os
import sys
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import User, Role, UserRole

def assign_superadmin_role():
    """กำหนด Super Admin role ให้กับ superuser ทั้งหมด"""
    
    # หา Super Admin role
    try:
        super_admin_role = Role.objects.get(name='Super Admin', is_active=True)
        print(f"พบ Super Admin role: {super_admin_role.name}")
    except Role.DoesNotExist:
        print("ไม่พบ Super Admin role กรุณารัน sync_permissions --create-default-roles ก่อน")
        return
    
    # หา superuser ทั้งหมด
    superusers = User.objects.filter(is_superuser=True, is_active=True)
    print(f"พบ superuser {superusers.count()} คน")
    
    assigned_count = 0
    for user in superusers:
        # ตรวจสอบว่ามี role นี้แล้วหรือไม่
        user_role, created = UserRole.objects.get_or_create(
            user=user,
            role=super_admin_role,
            defaults={
                'assigned_by': user,  # ตัวเองเป็นคนกำหนด
                'is_active': True
            }
        )
        
        if created:
            print(f"  กำหนด Super Admin role ให้กับ {user.username}")
            assigned_count += 1
        else:
            print(f"  {user.username} มี Super Admin role อยู่แล้ว")
    
    print(f"\nกำหนด Super Admin role เรียบร้อยแล้ว {assigned_count} คน")

if __name__ == '__main__':
    assign_superadmin_role() 