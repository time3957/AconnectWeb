#!/usr/bin/env python
"""
สคริปต์สำหรับตั้งค่าระบบ Role ใหม่
"""
import os
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aams_backend.settings')
django.setup()

from core.models import User, Role, Permission, UserRole, RolePermission

def create_roles():
    """สร้าง Role เริ่มต้น"""
    print("=== สร้าง Role เริ่มต้น ===")
    
    roles_data = [
        {
            'name': 'System Administrator',
            'description': 'ผู้ดูแลระบบสูงสุด มีสิทธิ์ทุกอย่าง',
            'color': '#dc3545'
        },
        {
            'name': 'Project Manager',
            'description': 'ผู้จัดการโครงการ ดูแลและควบคุมโครงการ',
            'color': '#fd7e14'
        },
        {
            'name': 'Team Lead',
            'description': 'หัวหน้าทีม ดูแลทีมงานและงานประจำวัน',
            'color': '#ffc107'
        },
        {
            'name': 'Senior Agent',
            'description': 'เอเจนต์อาวุโส มีประสบการณ์สูง',
            'color': '#28a745'
        },
        {
            'name': 'Agent',
            'description': 'เอเจนต์ทั่วไป ทำงานตามที่ได้รับมอบหมาย',
            'color': '#17a2b8'
        },
        {
            'name': 'Basic User',
            'description': 'ผู้ใช้พื้นฐาน มีสิทธิ์เข้าถึงระบบขั้นพื้นฐาน',
            'color': '#6f42c1'
        },
        {
            'name': 'Trainee',
            'description': 'ผู้ฝึกงาน กำลังเรียนรู้ระบบ',
            'color': '#6c757d'
        },
        {
            'name': 'HR',
            'description': 'ฝ่ายบุคคล ดูแลข้อมูลพนักงานและสิทธิ์ที่เกี่ยวข้อง',
            'color': '#e83e8c'
        }
    ]
    
    created_roles = []
    for role_data in roles_data:
        role, created = Role.objects.get_or_create(
            name=role_data['name'],
            defaults=role_data
        )
        if created:
            print(f"✅ สร้าง Role: {role.name}")
        else:
            print(f"⏭️  Role มีอยู่แล้ว: {role.name}")
        created_roles.append(role)
    
    return created_roles

def create_permissions():
    """สร้าง Permission เริ่มต้น"""
    print("\n=== สร้าง Permission เริ่มต้น ===")
    
    permissions_data = [
        # System permissions
        {'name': 'view_dashboard', 'description': 'ดูหน้า Dashboard', 'category': 'system'},
        {'name': 'manage_users', 'description': 'จัดการผู้ใช้', 'category': 'system'},
        {'name': 'manage_roles', 'description': 'จัดการ Role', 'category': 'system'},
        {'name': 'manage_permissions', 'description': 'จัดการ Permission', 'category': 'system'},
        
        # Project permissions
        {'name': 'view_projects', 'description': 'ดูโครงการ', 'category': 'project'},
        {'name': 'create_projects', 'description': 'สร้างโครงการ', 'category': 'project'},
        {'name': 'edit_projects', 'description': 'แก้ไขโครงการ', 'category': 'project'},
        {'name': 'delete_projects', 'description': 'ลบโครงการ', 'category': 'project'},
        {'name': 'assign_agents', 'description': 'มอบหมายเอเจนต์', 'category': 'project'},
        
        # User permissions
        {'name': 'view_user_profiles', 'description': 'ดูโปรไฟล์ผู้ใช้', 'category': 'user'},
        {'name': 'edit_user_profiles', 'description': 'แก้ไขโปรไฟล์ผู้ใช้', 'category': 'user'},
        {'name': 'view_user_roles', 'description': 'ดู Role ของผู้ใช้', 'category': 'user'},
        {'name': 'assign_user_roles', 'description': 'มอบหมาย Role ให้ผู้ใช้', 'category': 'user'},
    ]
    
    created_permissions = []
    for perm_data in permissions_data:
        permission, created = Permission.objects.get_or_create(
            name=perm_data['name'],
            defaults=perm_data
        )
        if created:
            print(f"✅ สร้าง Permission: {permission.name} ({permission.category})")
        else:
            print(f"⏭️  Permission มีอยู่แล้ว: {permission.name}")
        created_permissions.append(permission)
    
    return created_permissions

def assign_role_permissions(roles, permissions):
    """มอบหมาย Permission ให้กับ Role"""
    print("\n=== มอบหมาย Permission ให้กับ Role ===")
    
    # กำหนด Permission สำหรับแต่ละ Role
    role_permissions = {
        'System Administrator': [perm.name for perm in permissions],  # ทุก Permission
        'Project Manager': [
            'view_dashboard', 'view_projects', 'create_projects', 'edit_projects',
            'assign_agents', 'view_user_profiles', 'view_user_roles'
        ],
        'Team Lead': [
            'view_dashboard', 'view_projects', 'edit_projects', 'assign_agents',
            'view_user_profiles', 'view_user_roles'
        ],
        'Senior Agent': [
            'view_dashboard', 'view_projects', 'view_user_profiles'
        ],
        'Agent': [
            'view_dashboard', 'view_projects'
        ],
        'Basic User': [
            'view_dashboard'
        ],
        'Trainee': [
            'view_dashboard'
        ],
        'HR': [
            'view_user_profiles', 'edit_user_profiles'
        ]
    }
    
    for role in roles:
        if role.name in role_permissions:
            permission_names = role_permissions[role.name]
            for perm_name in permission_names:
                try:
                    permission = Permission.objects.get(name=perm_name)
                    role_perm, created = RolePermission.objects.get_or_create(
                        role=role,
                        permission=permission,
                        defaults={'is_active': True}
                    )
                    if created:
                        print(f"✅ มอบหมาย {permission.name} ให้ {role.name}")
                except Permission.DoesNotExist:
                    print(f"❌ ไม่พบ Permission: {perm_name}")

def assign_users_to_roles():
    """มอบหมาย Role ให้กับผู้ใช้"""
    print("\n=== มอบหมาย Role ให้กับผู้ใช้ ===")
    
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

def show_summary():
    """แสดงสรุปข้อมูล"""
    print("\n=== สรุปข้อมูล ===")
    
    print(f"👥 ผู้ใช้ทั้งหมด: {User.objects.filter(is_active=True).count()} คน")
    print(f"🎭 Role ทั้งหมด: {Role.objects.filter(is_active=True).count()} ชนิด")
    print(f"🔐 Permission ทั้งหมด: {Permission.objects.filter(is_active=True).count()} ชนิด")
    print(f"🔗 UserRole ทั้งหมด: {UserRole.objects.filter(is_active=True).count()} รายการ")
    print(f"🔗 RolePermission ทั้งหมด: {RolePermission.objects.filter(is_active=True).count()} รายการ")
    
    print("\n📋 รายการ Role:")
    for role in Role.objects.filter(is_active=True):
        user_count = role.user_roles.filter(is_active=True, user__is_active=True).count()
        perm_count = role.role_permissions.filter(is_active=True, permission__is_active=True).count()
        print(f"   {role.name}: {user_count} ผู้ใช้, {perm_count} Permission")

if __name__ == "__main__":
    print("🚀 เริ่มต้นตั้งค่าระบบ Role ใหม่")
    
    # สร้าง Role และ Permission
    roles = create_roles()
    permissions = create_permissions()
    
    # มอบหมาย Permission ให้กับ Role
    assign_role_permissions(roles, permissions)
    
    # มอบหมาย Role ให้กับผู้ใช้
    assign_users_to_roles()
    
    # แสดงสรุป
    show_summary()
    
    print("\n✅ เสร็จสิ้นการตั้งค่าระบบ Role ใหม่")
    print("\n🎯 ตอนนี้ระบบมี Role และ Permission ครบถ้วนแล้ว")
    print("📋 API endpoints ที่ใช้งานได้:")
    print("   - GET /api/roles/ - รายการ Role")
    print("   - GET /api/permissions/ - รายการ Permission")
    print("   - GET /api/user-roles/ - รายการ UserRole")
    print("   - GET /api/role-permissions/ - รายการ RolePermission") 