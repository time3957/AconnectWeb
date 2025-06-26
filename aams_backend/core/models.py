# D:\AAMS\aams_backend\core\models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# เราจะขยายความสามารถของ User Model ที่มีอยู่แล้วของ Django
# เพื่อเพิ่มฟิลด์ที่เราต้องการ เช่น employee_id, position
class User(AbstractUser):
    employee_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)
    
    class Meta:
        db_table = 'core_user'

    def __str__(self):
        return self.get_full_name() or self.username

class Role(models.Model):
    """โมเดลสำหรับเก็บข้อมูล Role/Badge ต่างๆ"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#007bff')  # Hex color code
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'core_role'
        ordering = ['name']
    
    def __str__(self):
        return self.name

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