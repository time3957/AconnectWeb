#!/usr/bin/env python
"""
สคริปต์สำหรับลบตารางทั้งหมดในฐานข้อมูล PostgreSQL
"""
import os
import django
import psycopg2
from django.conf import settings

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

def reset_database():
    """ลบตารางทั้งหมดในฐานข้อมูล"""
    print("🗑️ เริ่มต้นลบตารางทั้งหมดในฐานข้อมูล...")
    
    try:
        # เชื่อมต่อฐานข้อมูล
        conn = psycopg2.connect(
            host=settings.DATABASES['default']['HOST'],
            port=settings.DATABASES['default']['PORT'],
            database=settings.DATABASES['default']['NAME'],
            user=settings.DATABASES['default']['USER'],
            password=settings.DATABASES['default']['PASSWORD']
        )
        
        cursor = conn.cursor()
        
        # ปิดการตรวจสอบ foreign key constraints ชั่วคราว
        cursor.execute("SET session_replication_role = replica;")
        
        # ดึงรายชื่อตารางทั้งหมด
        cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE 'pg_%'
            AND tablename NOT LIKE 'sql_%'
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print(f"📋 พบตาราง {len(tables)} ตาราง:")
            for table in tables:
                print(f"   - {table[0]}")
            
            # ลบตารางทั้งหมด
            for table in tables:
                table_name = table[0]
                cursor.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE;")
                print(f"✅ ลบตาราง: {table_name}")
            
            # เปิดการตรวจสอบ foreign key constraints กลับมา
            cursor.execute("SET session_replication_role = DEFAULT;")
            
            conn.commit()
            print("\n✅ ลบตารางทั้งหมดเรียบร้อยแล้ว")
        else:
            print("📋 ไม่พบตารางใดๆ ในฐานข้อมูล")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 เริ่มต้นรีเซ็ตฐานข้อมูล")
    
    if reset_database():
        print("\n🎯 ตอนนี้ฐานข้อมูลว่างเปล่าแล้ว")
        print("📋 ขั้นตอนต่อไป:")
        print("   1. รัน: python manage.py migrate")
        print("   2. รัน: python setup_role_system.py")
    else:
        print("\n❌ ไม่สามารถรีเซ็ตฐานข้อมูลได้") 