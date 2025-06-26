#!/usr/bin/env python
"""
Script สำหรับลบการกำหนดกลุ่มและสิทธิ์ออก
"""
import os
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import User
from django.contrib.auth.models import Group, Permission

def clear_user_groups():
    """ลบการกำหนดกลุ่มและสิทธิ์ออก"""
    print("=== ลบการกำหนดกลุ่มและสิทธิ์ ===")
    
    # ลบผู้ใช้ออกจากทุกกลุ่ม
    for user in User.objects.all():
        user.groups.clear()
        print(f"✅ ลบ {user.username} ออกจากทุกกลุ่ม")
    
    # ลบ permissions ออกจากทุกกลุ่ม
    for group in Group.objects.all():
        group.permissions.clear()
        print(f"✅ ลบ permissions ออกจากกลุ่ม {group.name}")
    
    print("\n✅ ลบการกำหนดกลุ่มและสิทธิ์เรียบร้อยแล้ว")

def show_current_status():
    """แสดงสถานะปัจจุบัน"""
    print("\n=== สถานะปัจจุบัน ===")
    
    # แสดงผู้ใช้และกลุ่ม
    print("\n👤 ผู้ใช้และกลุ่ม:")
    for user in User.objects.all():
        groups = [g.name for g in user.groups.all()]
        print(f"   {user.username}: {groups if groups else 'ไม่มีกลุ่ม'}")
        print(f"     is_staff: {user.is_staff}, is_superuser: {user.is_superuser}")
    
    # แสดงกลุ่มและ permissions
    print("\n📋 กลุ่มและ Permissions:")
    for group in Group.objects.all():
        print(f"   {group.name}: {group.permissions.count()} permissions")

if __name__ == "__main__":
    print("🚀 เริ่มต้นลบการกำหนดกลุ่มและสิทธิ์")
    
    # ลบการกำหนดกลุ่มและสิทธิ์
    clear_user_groups()
    
    # แสดงสถานะปัจจุบัน
    show_current_status()
    
    print("\n✅ เสร็จสิ้นการลบการกำหนดกลุ่มและสิทธิ์")
    print("\n🎯 ตอนนี้ผู้ใช้ทุกคนไม่มีกลุ่มและสิทธิ์พิเศษแล้ว")
    print("📋 API /api/users/ ควรทำงานได้โดยไม่ต้องมีสิทธิ์พิเศษ") 