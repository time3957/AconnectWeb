from rest_framework import permissions
from django.contrib.auth.models import Permission as DjangoPermission
from django.contrib.contenttypes.models import ContentType
from .models import User, Role, Permission, UserRole, RolePermission

class HasRolePermission(permissions.BasePermission):
    """
    Custom permission ที่ตรวจสอบว่าผู้ใช้มี role ที่มี permission นี้หรือไม่
    """
    
    def has_permission(self, request, view):
        # ตรวจสอบว่าผู้ใช้ login อยู่หรือไม่
        if not request.user.is_authenticated:
            return False
        
        # ถ้าเป็น superuser หรือ staff ให้ผ่าน
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # ดึง permission ที่ต้องการจาก view
        required_permission = getattr(view, 'required_permission', None)
        if not required_permission:
            return True
        
        # ตรวจสอบ Django built-in permissions ก่อน
        if request.user.has_perm(required_permission):
            return True
        
        # ตรวจสอบ custom permissions จาก roles
        return self._has_custom_permission(request.user, required_permission)
    
    def _has_custom_permission(self, user, permission_name):
        """
        ตรวจสอบว่าผู้ใช้มี custom permission หรือไม่
        """
        # แยก app_label และ codename
        if '.' in permission_name:
            app_label, codename = permission_name.split('.', 1)
        else:
            app_label = 'core'
            codename = permission_name
        
        # ตรวจสอบจาก user roles
        user_roles = UserRole.objects.filter(
            user=user,
            is_active=True,
            role__is_active=True
        )
        
        for user_role in user_roles:
            # ตรวจสอบว่า role หมดอายุหรือไม่
            if user_role.is_expired:
                continue
            
            # ตรวจสอบ permissions ของ role นี้
            role_permissions = RolePermission.objects.filter(
                role=user_role.role,
                is_active=True,
                permission__is_active=True
            )
            
            for role_perm in role_permissions:
                if role_perm.permission.name == codename:
                    return True
        
        return False

class IsAdminUser(permissions.BasePermission):
    """
    Permission สำหรับ Admin users เท่านั้น
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )

class HasProjectPermission(permissions.BasePermission):
    """
    Permission สำหรับตรวจสอบสิทธิ์ในโปรเจค
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # ตรวจสอบ permission สำหรับ project management
        return self._has_custom_permission(request.user, 'project_management')
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # ตรวจสอบว่าผู้ใช้เป็นเจ้าของโปรเจคหรือมีสิทธิ์ในโปรเจคนี้
        if hasattr(obj, 'agent_assignments'):
            return obj.agent_assignments.filter(
                agent=request.user,
                is_active=True
            ).exists()
        
        return False
    
    def _has_custom_permission(self, user, permission_name):
        """
        ตรวจสอบ custom permission
        """
        user_roles = UserRole.objects.filter(
            user=user,
            is_active=True,
            role__is_active=True
        )
        
        for user_role in user_roles:
            if user_role.is_expired:
                continue
            
            role_permissions = RolePermission.objects.filter(
                role=user_role.role,
                is_active=True,
                permission__is_active=True,
                permission__name=permission_name
            )
            
            if role_permissions.exists():
                return True
        
        return False

class HasUserManagementPermission(permissions.BasePermission):
    """
    Permission สำหรับจัดการผู้ใช้
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        return self._has_custom_permission(request.user, 'user_management')
    
    def _has_custom_permission(self, user, permission_name):
        """
        ตรวจสอบ custom permission
        """
        user_roles = UserRole.objects.filter(
            user=user,
            is_active=True,
            role__is_active=True
        )
        
        for user_role in user_roles:
            if user_role.is_expired:
                continue
            
            role_permissions = RolePermission.objects.filter(
                role=user_role.role,
                is_active=True,
                permission__is_active=True,
                permission__name=permission_name
            )
            
            if role_permissions.exists():
                return True
        
        return False

class HasRoleManagementPermission(permissions.BasePermission):
    """
    Permission สำหรับจัดการ roles
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        return self._has_custom_permission(request.user, 'role_management')
    
    def _has_custom_permission(self, user, permission_name):
        """
        ตรวจสอบ custom permission
        """
        user_roles = UserRole.objects.filter(
            user=user,
            is_active=True,
            role__is_active=True
        )
        
        for user_role in user_roles:
            if user_role.is_expired:
                continue
            
            role_permissions = RolePermission.objects.filter(
                role=user_role.role,
                is_active=True,
                permission__is_active=True,
                permission__name=permission_name
            )
            
            if role_permissions.exists():
                return True
        
        return False

# Utility functions สำหรับจัดการ permissions
def create_django_permission_from_custom(custom_permission):
    """
    สร้าง Django Permission จาก Custom Permission
    """
    content_type = ContentType.objects.get_for_model(custom_permission)
    django_perm, created = DjangoPermission.objects.get_or_create(
        codename=custom_permission.name,
        content_type=content_type,
        defaults={'name': custom_permission.description or custom_permission.name}
    )
    return django_perm

def sync_role_with_django_group(role):
    """
    ซิงค์ Role กับ Django Group
    """
    from django.contrib.auth.models import Group
    
    if not role.django_group:
        role.django_group, created = Group.objects.get_or_create(name=f"role_{role.name}")
    
    # อัปเดต permissions ใน Django Group
    role.django_group.permissions.clear()
    for role_perm in role.role_permissions.filter(is_active=True):
        django_perm = create_django_permission_from_custom(role_perm.permission)
        role.django_group.permissions.add(django_perm)
    
    return role.django_group

def assign_role_to_user(user, role, assigned_by=None):
    """
    กำหนด role ให้กับผู้ใช้
    """
    user_role, created = UserRole.objects.get_or_create(
        user=user,
        role=role,
        defaults={
            'assigned_by': assigned_by,
            'is_active': True
        }
    )
    
    # เพิ่มผู้ใช้เข้า Django Group
    if role.django_group:
        user.groups.add(role.django_group)
    
    return user_role

def remove_role_from_user(user, role):
    """
    ลบ role ออกจากผู้ใช้
    """
    UserRole.objects.filter(user=user, role=role).update(is_active=False)
    
    # ลบผู้ใช้ออกจาก Django Group
    if role.django_group:
        user.groups.remove(role.django_group) 