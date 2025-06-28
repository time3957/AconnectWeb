# D:\AAMS\aams_backend\core\models.py

from django.db import models
from django.contrib.auth.models import AbstractUser, Group
from django.utils import timezone
from django.contrib.auth.models import Permission as DjangoPermission
from django.contrib.contenttypes.models import ContentType

# เราจะขยายความสามารถของ User Model ที่มีอยู่แล้วของ Django
# เพื่อเพิ่มฟิลด์ที่เราต้องการ เช่น employee_id, position
class User(AbstractUser):
    employee_id = models.CharField(max_length=20, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)
    termination_date = models.DateField(blank=True, null=True)  # วันลาออก
    
    class Meta:
        db_table = 'core_user'
        constraints = [
            models.UniqueConstraint(
                fields=['employee_id'],
                condition=models.Q(employee_id__isnull=False),
                name='unique_employee_id_when_not_null'
            )
        ]

    def __str__(self):
        return self.get_full_name() or self.username

    def has_custom_permission(self, permission_name, app_label='core'):
        """
        ตรวจสอบว่าผู้ใช้มี custom permission หรือไม่
        """
        return self.has_perm(f'{app_label}.{permission_name}')

    def get_all_custom_permissions(self):
        """
        ดึง permissions ทั้งหมดของผู้ใช้ รวมถึงจาก groups และ custom permissions
        """
        permissions = set()
        
        # Django built-in permissions
        permissions.update(super().get_all_permissions())
        
        # Custom permissions จาก Role
        for user_role in self.user_roles.filter(is_active=True, role__is_active=True):
            if not user_role.is_expired:
                for role_perm in user_role.role.role_permissions.filter(is_active=True):
                    permissions.add(f"{role_perm.permission.category}.{role_perm.permission.name}")
        
        return permissions

    def has_role(self, role_name):
        """
        ตรวจสอบว่าผู้ใช้มี role นี้หรือไม่
        """
        return self.user_roles.filter(
            role__name=role_name,
            is_active=True,
            role__is_active=True
        ).exists()

    def get_active_roles(self):
        """
        ดึง roles ที่ active ทั้งหมดของผู้ใช้
        """
        return self.user_roles.filter(
            is_active=True,
            role__is_active=True
        ).exclude(expires_at__lt=timezone.now())

    def assign_default_role(self):
        """กำหนด default role ให้กับ user"""
        try:
            # ตรวจสอบว่ามี role อยู่แล้วหรือไม่
            if self.user_roles.filter(is_active=True).exists():
                return
            
            # หา default role "Basic User"
            default_role = Role.objects.filter(
                name='Basic User',
                is_active=True
            ).first()
            
            if default_role:
                UserRole.objects.create(
                    user=self,
                    role=default_role,
                    is_active=True
                )
                print(f"✅ กำหนด default role 'Basic User' ให้กับ {self.username}")
            else:
                print(f"⚠️ ไม่พบ default role 'Basic User' สำหรับ {self.username}")
        except Exception as e:
            print(f"❌ Error assigning default role to {self.username}: {e}")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

class Role(models.Model):
    """โมเดลสำหรับเก็บข้อมูล Role/Badge ต่างๆ"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#007bff')  # Hex color code
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # เพิ่มการเชื่อมโยงกับ Django Group
    django_group = models.ForeignKey(
        Group,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='custom_roles'
    )
    
    class Meta:
        db_table = 'core_role'
        ordering = ['name']
    
    def __str__(self):
        return self.name

    def sync_with_django_group(self):
        """
        สร้างหรืออัปเดต Django Group ให้ตรงกับ Role นี้
        """
        if not self.django_group:
            self.django_group, created = Group.objects.get_or_create(name=f"role_{self.name}")
        
        # อัปเดต permissions ใน Django Group
        self.django_group.permissions.clear()
        for role_perm in self.role_permissions.filter(is_active=True):
            # สร้าง Django Permission ถ้ายังไม่มี
            content_type = ContentType.objects.get_for_model(self)
            django_perm, created = DjangoPermission.objects.get_or_create(
                codename=role_perm.permission.name,
                content_type=content_type,
                defaults={'name': role_perm.permission.description or role_perm.permission.name}
            )
            self.django_group.permissions.add(django_perm)

class Permission(models.Model):
    """โมเดลสำหรับเก็บข้อมูล Permission/Skill ต่างๆ"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)  # เช่น 'system', 'project', 'user'
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'core_permission'
        ordering = ['category', 'name']
    
    def __str__(self):
        return self.name

    def get_django_permission(self):
        """
        สร้างหรือดึง Django Permission ที่ตรงกับ Permission นี้
        """
        content_type = ContentType.objects.get_for_model(self)
        django_perm, created = DjangoPermission.objects.get_or_create(
            codename=self.name,
            content_type=content_type,
            defaults={'name': self.description or self.name}
        )
        return django_perm

class UserRole(models.Model):
    """โมเดลสำหรับเชื่อมโยง User กับ Role"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_roles')
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'core_user_role'
        unique_together = ['user', 'role']
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.role.name}"
    
    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

class RolePermission(models.Model):
    """โมเดลสำหรับเชื่อมโยง Role กับ Permission"""
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='role_permissions')
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='granted_permissions')
    granted_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'core_role_permission'
        unique_together = ['role', 'permission']
        ordering = ['-granted_at']
    
    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'core_project'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class AgentProjectAssignment(models.Model):
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_assignments', default=1, null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='agent_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'core_agent_project_assignment'
        unique_together = ['agent', 'project']
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.agent.username} - {self.project.name}"