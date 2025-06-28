#!/usr/bin/env python
"""
สคริปต์สำหรับสร้าง default permissions และ roles
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import Permission, Role, User, UserRole, RolePermission
from django.contrib.auth.models import Group

def create_default_permissions():
    """สร้าง default permissions"""
    print("กำลังสร้าง default permissions...")
    
    permissions_data = [
        # User Management
        {'name': 'user_management', 'description': 'จัดการผู้ใช้', 'category': 'user'},
        {'name': 'user_create', 'description': 'สร้างผู้ใช้', 'category': 'user'},
        {'name': 'user_edit', 'description': 'แก้ไขผู้ใช้', 'category': 'user'},
        {'name': 'user_delete', 'description': 'ลบผู้ใช้', 'category': 'user'},
        {'name': 'user_view', 'description': 'ดูข้อมูลผู้ใช้', 'category': 'user'},
        
        # Role Management
        {'name': 'role_management', 'description': 'จัดการบทบาท', 'category': 'role'},
        {'name': 'role_create', 'description': 'สร้างบทบาท', 'category': 'role'},
        {'name': 'role_edit', 'description': 'แก้ไขบทบาท', 'category': 'role'},
        {'name': 'role_delete', 'description': 'ลบบทบาท', 'category': 'role'},
        {'name': 'role_view', 'description': 'ดูข้อมูลบทบาท', 'category': 'role'},
        
        # Permission Management
        {'name': 'permission_management', 'description': 'จัดการสิทธิ์', 'category': 'permission'},
        {'name': 'permission_assign', 'description': 'กำหนดสิทธิ์', 'category': 'permission'},
        {'name': 'permission_revoke', 'description': 'เพิกถอนสิทธิ์', 'category': 'permission'},
        {'name': 'permission_view', 'description': 'ดูข้อมูลสิทธิ์', 'category': 'permission'},
        
        # Project Management
        {'name': 'project_management', 'description': 'จัดการโครงการ', 'category': 'project'},
        {'name': 'project_create', 'description': 'สร้างโครงการ', 'category': 'project'},
        {'name': 'project_edit', 'description': 'แก้ไขโครงการ', 'category': 'project'},
        {'name': 'project_delete', 'description': 'ลบโครงการ', 'category': 'project'},
        {'name': 'project_view', 'description': 'ดูข้อมูลโครงการ', 'category': 'project'},
        
        # Report Management
        {'name': 'report_management', 'description': 'จัดการรายงาน', 'category': 'report'},
        {'name': 'report_create', 'description': 'สร้างรายงาน', 'category': 'report'},
        {'name': 'report_edit', 'description': 'แก้ไขรายงาน', 'category': 'report'},
        {'name': 'report_delete', 'description': 'ลบรายงาน', 'category': 'report'},
        {'name': 'report_view', 'description': 'ดูรายงาน', 'category': 'report'},
        
        # Dashboard Access
        {'name': 'dashboard_access', 'description': 'เข้าถึงแดชบอร์ด', 'category': 'dashboard'},
        {'name': 'dashboard_admin', 'description': 'แดชบอร์ดผู้ดูแลระบบ', 'category': 'dashboard'},
        {'name': 'dashboard_user', 'description': 'แดชบอร์ดผู้ใช้', 'category': 'dashboard'},
    ]
    
    created_count = 0
    for perm_data in permissions_data:
        permission, created = Permission.objects.get_or_create(
            name=perm_data['name'],
            defaults={
                'description': perm_data['description'],
                'category': perm_data['category'],
                'is_active': True
            }
        )
        if created:
            created_count += 1
            print(f"  ✅ สร้าง permission: {permission.name}")
    
    print(f"สร้าง permissions ใหม่ {created_count} รายการ")

def create_default_roles():
    """สร้าง default roles"""
    print("\nกำลังสร้าง default roles...")
    
    roles_data = [
        {
            'name': 'System Administrator',
            'description': 'ผู้ดูแลระบบสูงสุด มีสิทธิ์ทุกอย่าง',
            'color': '#dc3545',
            'permissions': [
                'user_management', 'user_create', 'user_edit', 'user_delete', 'user_view',
                'role_management', 'role_create', 'role_edit', 'role_delete', 'role_view',
                'permission_management', 'permission_assign', 'permission_revoke', 'permission_view',
                'project_management', 'project_create', 'project_edit', 'project_delete', 'project_view',
                'report_management', 'report_create', 'report_edit', 'report_delete', 'report_view',
                'dashboard_access', 'dashboard_admin', 'dashboard_user'
            ]
        },
        {
            'name': 'Project Manager',
            'description': 'ผู้จัดการโครงการ มีสิทธิ์จัดการโครงการและรายงาน',
            'color': '#007bff',
            'permissions': [
                'user_view',
                'role_view',
                'project_management', 'project_create', 'project_edit', 'project_view',
                'report_management', 'report_create', 'report_edit', 'report_view',
                'dashboard_access', 'dashboard_user'
            ]
        },
        {
            'name': 'Team Lead',
            'description': 'หัวหน้าทีม มีสิทธิ์จัดการทีมและดูรายงาน',
            'color': '#28a745',
            'permissions': [
                'user_view',
                'project_view',
                'report_view',
                'dashboard_access', 'dashboard_user'
            ]
        },
        {
            'name': 'Senior Agent',
            'description': 'เอเจนต์อาวุโส มีสิทธิ์เข้าถึงข้อมูลและรายงาน',
            'color': '#ffc107',
            'permissions': [
                'user_view',
                'project_view',
                'report_view',
                'dashboard_access', 'dashboard_user'
            ]
        },
        {
            'name': 'Agent',
            'description': 'เอเจนต์ทั่วไป มีสิทธิ์เข้าถึงข้อมูลพื้นฐาน',
            'color': '#6c757d',
            'permissions': [
                'user_view',
                'project_view',
                'dashboard_access', 'dashboard_user'
            ]
        },
        {
            'name': 'Trainee',
            'description': 'ผู้ฝึกงาน มีสิทธิ์เข้าถึงข้อมูลจำกัด',
            'color': '#17a2b8',
            'permissions': [
                'user_view',
                'project_view',
                'dashboard_access', 'dashboard_user'
            ]
        },
        {
            'name': 'HR',
            'description': 'ฝ่ายทรัพยากรบุคคล มีสิทธิ์จัดการผู้ใช้',
            'color': '#e83e8c',
            'permissions': [
                'user_management', 'user_create', 'user_edit', 'user_view',
                'role_view',
                'project_view',
                'report_view',
                'dashboard_access', 'dashboard_user'
            ]
        }
    ]
    
    created_count = 0
    for role_data in roles_data:
        role, created = Role.objects.get_or_create(
            name=role_data['name'],
            defaults={
                'description': role_data['description'],
                'color': role_data['color'],
                'is_active': True
            }
        )
        
        if created:
            created_count += 1
            print(f"  ✅ สร้าง role: {role.name}")
        
        # กำหนด permissions ให้กับ role
        for perm_name in role_data['permissions']:
            try:
                permission = Permission.objects.get(name=perm_name, is_active=True)
                role_perm, perm_created = RolePermission.objects.get_or_create(
                    role=role,
                    permission=permission,
                    defaults={
                        'granted_by': User.objects.filter(is_superuser=True).first(),
                        'is_active': True
                    }
                )
                if perm_created:
                    print(f"    🔐 กำหนดสิทธิ์: {permission.name}")
            except Permission.DoesNotExist:
                print(f"    ⚠️ ไม่พบ permission: {perm_name}")
    
    print(f"สร้าง roles ใหม่ {created_count} รายการ")

def assign_superadmin_role():
    """กำหนด Super Admin role ให้กับ superuser"""
    print("\nกำลังกำหนด Super Admin role ให้กับ superuser...")
    
    try:
        # หา superuser คนแรก
        superuser = User.objects.filter(is_superuser=True).first()
        if not superuser:
            print("  ⚠️ ไม่พบ superuser")
            return
        
        # หา System Administrator role
        admin_role = Role.objects.filter(name='System Administrator', is_active=True).first()
        if not admin_role:
            print("  ⚠️ ไม่พบ System Administrator role")
            return
        
        # กำหนด role ให้กับ superuser
        user_role, created = UserRole.objects.get_or_create(
            user=superuser,
            role=admin_role,
            defaults={
                'assigned_by': superuser,
                'is_active': True
            }
        )
        
        if created:
            print(f"  ✅ กำหนด System Administrator role ให้กับ {superuser.username}")
        else:
            print(f"  ℹ️ {superuser.username} มี System Administrator role อยู่แล้ว")
            
    except Exception as e:
        print(f"  ❌ เกิดข้อผิดพลาด: {e}")

def main():
    """ฟังก์ชันหลัก"""
    print("🚀 เริ่มต้นสร้าง default permissions และ roles...")
    
    try:
        create_default_permissions()
        create_default_roles()
        assign_superadmin_role()
        
        print("\n✅ เสร็จสิ้นการสร้าง default permissions และ roles!")
        print("\n📋 สรุป:")
        print(f"  - Permissions: {Permission.objects.count()} รายการ")
        print(f"  - Roles: {Role.objects.count()} รายการ")
        print(f"  - Role Permissions: {RolePermission.objects.count()} รายการ")
        
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาด: {e}")

if __name__ == '__main__':
    main() 