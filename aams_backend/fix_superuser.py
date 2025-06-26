#!/usr/bin/env python
"""
Script สำหรับแก้ไข Superuser ให้มี is_staff=True
"""
import os
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import User

def fix_superuser():
    """แก้ไข superuser ให้มี is_staff=True"""
    print("=== แก้ไข Superuser ===")
    
    # หา superuser ทั้งหมด
    superusers = User.objects.filter(is_superuser=True)
    
    if not superusers.exists():
        print("❌ ไม่พบ Superuser ในระบบ")
        return
    
    print(f"พบ Superuser {superusers.count()} คน:")
    
    for user in superusers:
        print(f"\n👤 Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   is_superuser: {user.is_superuser}")
        print(f"   is_staff: {user.is_staff}")
        print(f"   is_active: {user.is_active}")
        
        # ตรวจสอบว่าต้องแก้ไขหรือไม่
        if not user.is_staff:
            print("   ⚠️  Superuser นี้ไม่มี is_staff=True")
            print("   🔧 กำลังแก้ไข...")
            user.is_staff = True
            user.save()
            print("   ✅ แก้ไขเรียบร้อยแล้ว")
        else:
            print("   ✅ Superuser นี้มีสิทธิ์ครบถ้วนแล้ว")

if __name__ == "__main__":
    fix_superuser()
    print("\n=== เสร็จสิ้น ===") 