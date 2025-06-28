from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission as DjangoPermission
from django.contrib.contenttypes.models import ContentType
from core.models import Role, Permission, UserRole, RolePermission
from core.permissions import sync_role_with_django_group, create_django_permission_from_custom

class Command(BaseCommand):
    help = 'ซิงค์ Custom Permissions และ Roles กับ Django Permission System'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-default-permissions',
            action='store_true',
            help='สร้าง default permissions สำหรับระบบ',
        )
        parser.add_argument(
            '--create-default-roles',
            action='store_true',
            help='สร้าง default roles สำหรับระบบ',
        )
        parser.add_argument(
            '--sync-all',
            action='store_true',
            help='ซิงค์ permissions และ roles ทั้งหมด',
        )

    def handle(self, *args, **options):
        if options['create_default_permissions']:
            self.create_default_permissions()
        
        if options['create_default_roles']:
            self.create_default_roles()
        
        if options['sync_all']:
            self.sync_all_permissions()
            self.sync_all_roles()

    def create_default_permissions(self):
        """สร้าง default permissions สำหรับระบบ"""
        self.stdout.write('กำลังสร้าง default permissions...')
        
        default_permissions = [
            # User Management
            {'name': 'user_management', 'description': 'จัดการผู้ใช้', 'category': 'user'},
            {'name': 'user_view', 'description': 'ดูข้อมูลผู้ใช้', 'category': 'user'},
            {'name': 'user_create', 'description': 'สร้างผู้ใช้ใหม่', 'category': 'user'},
            {'name': 'user_edit', 'description': 'แก้ไขข้อมูลผู้ใช้', 'category': 'user'},
            {'name': 'user_delete', 'description': 'ลบผู้ใช้', 'category': 'user'},
            
            # Role Management
            {'name': 'role_management', 'description': 'จัดการ roles', 'category': 'role'},
            {'name': 'role_view', 'description': 'ดูข้อมูล roles', 'category': 'role'},
            {'name': 'role_create', 'description': 'สร้าง role ใหม่', 'category': 'role'},
            {'name': 'role_edit', 'description': 'แก้ไข role', 'category': 'role'},
            {'name': 'role_delete', 'description': 'ลบ role', 'category': 'role'},
            {'name': 'role_assign', 'description': 'กำหนด role ให้ผู้ใช้', 'category': 'role'},
            
            # Project Management
            {'name': 'project_management', 'description': 'จัดการโปรเจค', 'category': 'project'},
            {'name': 'project_view', 'description': 'ดูข้อมูลโปรเจค', 'category': 'project'},
            {'name': 'project_create', 'description': 'สร้างโปรเจคใหม่', 'category': 'project'},
            {'name': 'project_edit', 'description': 'แก้ไขโปรเจค', 'category': 'project'},
            {'name': 'project_delete', 'description': 'ลบโปรเจค', 'category': 'project'},
            {'name': 'project_assign', 'description': 'กำหนดผู้ใช้ให้โปรเจค', 'category': 'project'},
            
            # System Management
            {'name': 'system_admin', 'description': 'ผู้ดูแลระบบ', 'category': 'system'},
            {'name': 'system_config', 'description': 'ตั้งค่าระบบ', 'category': 'system'},
            {'name': 'system_backup', 'description': 'สำรองข้อมูล', 'category': 'system'},
            
            # Reports
            {'name': 'report_view', 'description': 'ดูรายงาน', 'category': 'report'},
            {'name': 'report_create', 'description': 'สร้างรายงาน', 'category': 'report'},
            {'name': 'report_export', 'description': 'ส่งออกรายงาน', 'category': 'report'},
        ]
        
        created_count = 0
        for perm_data in default_permissions:
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
                self.stdout.write(f'  สร้าง permission: {permission.name}')
        
        self.stdout.write(
            self.style.SUCCESS(f'สร้าง permissions เรียบร้อยแล้ว {created_count} รายการ')
        )

    def create_default_roles(self):
        """สร้าง default roles สำหรับระบบ"""
        self.stdout.write('กำลังสร้าง default roles...')
        
        default_roles = [
            {
                'name': 'Super Admin',
                'description': 'ผู้ดูแลระบบสูงสุด',
                'color': '#dc3545',
                'permissions': [
                    'system_admin', 'system_config', 'system_backup',
                    'user_management', 'role_management', 'project_management',
                    'report_view', 'report_create', 'report_export'
                ]
            },
            {
                'name': 'Admin',
                'description': 'ผู้ดูแลระบบ',
                'color': '#fd7e14',
                'permissions': [
                    'user_management', 'role_management', 'project_management',
                    'report_view', 'report_create', 'report_export'
                ]
            },
            {
                'name': 'Manager',
                'description': 'ผู้จัดการ',
                'color': '#ffc107',
                'permissions': [
                    'user_view', 'project_management', 'project_assign',
                    'report_view', 'report_create'
                ]
            },
            {
                'name': 'User',
                'description': 'ผู้ใช้ทั่วไป',
                'color': '#28a745',
                'permissions': [
                    'user_view', 'project_view', 'report_view'
                ]
            },
            {
                'name': 'Guest',
                'description': 'ผู้เยี่ยมชม',
                'color': '#6c757d',
                'permissions': [
                    'project_view'
                ]
            }
        ]
        
        created_count = 0
        for role_data in default_roles:
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
                self.stdout.write(f'  สร้าง role: {role.name}')
                
                # กำหนด permissions ให้กับ role
                for perm_name in role_data['permissions']:
                    try:
                        permission = Permission.objects.get(name=perm_name, is_active=True)
                        RolePermission.objects.get_or_create(
                            role=role,
                            permission=permission,
                            defaults={'is_active': True}
                        )
                        self.stdout.write(f'    กำหนด permission: {permission.name}')
                    except Permission.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(f'    ไม่พบ permission: {perm_name}')
                        )
        
        self.stdout.write(
            self.style.SUCCESS(f'สร้าง roles เรียบร้อยแล้ว {created_count} รายการ')
        )

    def sync_all_permissions(self):
        """ซิงค์ permissions ทั้งหมดกับ Django Permission System"""
        self.stdout.write('กำลังซิงค์ permissions...')
        
        permissions = Permission.objects.filter(is_active=True)
        synced_count = 0
        
        for permission in permissions:
            try:
                django_perm = create_django_permission_from_custom(permission)
                synced_count += 1
                self.stdout.write(f'  ซิงค์ permission: {permission.name}')
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  เกิดข้อผิดพลาดในการซิงค์ {permission.name}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'ซิงค์ permissions เรียบร้อยแล้ว {synced_count} รายการ')
        )

    def sync_all_roles(self):
        """ซิงค์ roles ทั้งหมดกับ Django Group System"""
        self.stdout.write('กำลังซิงค์ roles...')
        
        roles = Role.objects.filter(is_active=True)
        synced_count = 0
        
        for role in roles:
            try:
                django_group = sync_role_with_django_group(role)
                synced_count += 1
                self.stdout.write(f'  ซิงค์ role: {role.name} -> {django_group.name}')
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  เกิดข้อผิดพลาดในการซิงค์ {role.name}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'ซิงค์ roles เรียบร้อยแล้ว {synced_count} รายการ')
        ) 