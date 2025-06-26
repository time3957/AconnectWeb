#!/usr/bin/env python
"""
สคริปต์สำหรับสร้างข้อมูลตัวอย่างโครงการ
"""
import os
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import Project, User, AgentProjectAssignment

def create_sample_projects():
    """สร้างข้อมูลตัวอย่างโครงการ"""
    print("=== สร้างข้อมูลตัวอย่างโครงการ ===")
    
    projects_data = [
        {
            'name': 'โครงการพัฒนาระบบ CRM',
            'description': 'พัฒนาและปรับปรุงระบบ Customer Relationship Management สำหรับการจัดการลูกค้าและโอกาสการขาย',
            'is_active': True
        },
        {
            'name': 'โครงการปรับปรุงเว็บไซต์',
            'description': 'ปรับปรุงและพัฒนาเว็บไซต์องค์กรให้ทันสมัยและใช้งานง่ายขึ้น',
            'is_active': True
        },
        {
            'name': 'โครงการระบบคลังสินค้า',
            'description': 'พัฒนาระบบจัดการคลังสินค้าและสินค้าคงเหลือแบบอัตโนมัติ',
            'is_active': True
        },
        {
            'name': 'โครงการระบบบัญชี',
            'description': 'พัฒนาและปรับปรุงระบบบัญชีและการเงินขององค์กร',
            'is_active': False
        },
        {
            'name': 'โครงการระบบ HR',
            'description': 'พัฒนาระบบจัดการทรัพยากรมนุษย์และการเงินเดือน',
            'is_active': True
        },
        {
            'name': 'โครงการระบบขายออนไลน์',
            'description': 'พัฒนาแพลตฟอร์มการขายออนไลน์และระบบชำระเงิน',
            'is_active': True
        },
        {
            'name': 'โครงการระบบรายงาน',
            'description': 'พัฒนาและปรับปรุงระบบรายงานและแดชบอร์ดสำหรับผู้บริหาร',
            'is_active': True
        },
        {
            'name': 'โครงการระบบความปลอดภัย',
            'description': 'พัฒนาและปรับปรุงระบบความปลอดภัยและสิทธิ์การเข้าถึง',
            'is_active': True
        }
    ]
    
    created_projects = []
    for project_data in projects_data:
        project, created = Project.objects.get_or_create(
            name=project_data['name'],
            defaults=project_data
        )
        if created:
            print(f"✅ สร้างโครงการ: {project.name}")
        else:
            print(f"⚠️ โครงการมีอยู่แล้ว: {project.name}")
        created_projects.append(project)
    
    return created_projects

def assign_users_to_projects(projects):
    """มอบหมายผู้ใช้ให้กับโครงการ"""
    print("\n=== มอบหมายผู้ใช้ให้กับโครงการ ===")
    
    try:
        # ดึงผู้ใช้ที่มีอยู่
        users = User.objects.filter(is_active=True)[:5]  # ใช้ 5 คนแรก
        
        if not users.exists():
            print("❌ ไม่พบผู้ใช้ในระบบ กรุณาสร้างผู้ใช้ก่อน")
            return
        
        # มอบหมายผู้ใช้ให้กับโครงการ
        for i, project in enumerate(projects):
            # มอบหมายผู้ใช้ 2-3 คนต่อโครงการ
            for j in range(min(3, len(users))):
                user = users[(i + j) % len(users)]
                assignment, created = AgentProjectAssignment.objects.get_or_create(
                    agent=user,
                    project=project,
                    defaults={'is_active': True}
                )
                if created:
                    print(f"✅ มอบหมาย {user.username} ให้กับโครงการ {project.name}")
                else:
                    print(f"⚠️ การมอบหมายมีอยู่แล้ว: {user.username} - {project.name}")
    
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการมอบหมายผู้ใช้: {e}")

def update_project_user_counts():
    """อัพเดทจำนวนผู้ใช้ในแต่ละโครงการ"""
    print("\n=== อัพเดทจำนวนผู้ใช้ในแต่ละโครงการ ===")
    
    projects = Project.objects.all()
    for project in projects:
        user_count = project.agent_assignments.filter(is_active=True).count()
        print(f"📊 โครงการ {project.name}: {user_count} ผู้ใช้")

def main():
    """ฟังก์ชันหลัก"""
    print("🚀 เริ่มสร้างข้อมูลตัวอย่างโครงการ...")
    
    # สร้างโครงการ
    projects = create_sample_projects()
    
    # มอบหมายผู้ใช้ให้กับโครงการ
    assign_users_to_projects(projects)
    
    # อัพเดทจำนวนผู้ใช้
    update_project_user_counts()
    
    print("\n✅ เสร็จสิ้นการสร้างข้อมูลตัวอย่างโครงการ!")
    print(f"📋 สร้างโครงการทั้งหมด: {len(projects)} โครงการ")

if __name__ == '__main__':
    main() 