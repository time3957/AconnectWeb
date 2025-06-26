# aams_backend/core/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import Project, User, AgentProjectAssignment, Role, Permission, UserRole, RolePermission # Import Model ทั้งหมดที่เกี่ยวข้อง

# 1. Serializer สำหรับ Group (Role)
# ใช้สำหรับอ่านข้อมูล Group เพื่อไปแสดงเป็นตัวเลือกใน Frontend
class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']


# 2. Serializer สำหรับ Project
class ProjectSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        # ระบุฟิลด์ทั้งหมดที่ต้องการให้ API ส่งออกไป
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at', 'user_count']
        # กำหนดให้ฟิลด์ 'created_at' เป็นแบบอ่านอย่างเดียว (Frontend แก้ไขไม่ได้)
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_count']
    
    def get_user_count(self, obj):
        """นับจำนวนผู้ใช้ที่อยู่ในโครงการนี้"""
        return obj.agent_assignments.filter(is_active=True, agent__is_active=True).count()


# 3. Serializer สำหรับ User
# ตัวนี้มีความซับซ้อนในการจัดการรหัสผ่านและ Group
class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    user_roles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'employee_id', 'position', 'department', 'phone', 'address',
            'date_of_birth', 'hire_date', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'groups', 'user_roles'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_groups(self, obj):
        return [group.name for group in obj.groups.all()]
    
    def get_user_roles(self, obj):
        active_roles = obj.user_roles.filter(is_active=True, role__is_active=True)
        return [
            {
                'id': user_role.id,
                'role_name': user_role.role.name,
                'role_color': user_role.role.color,
                'assigned_at': user_role.assigned_at,
                'expires_at': user_role.expires_at,
                'is_expired': user_role.is_expired
            }
            for user_role in active_roles
        ]


# 4. Serializer สำหรับ Role
class RoleSerializer(serializers.ModelSerializer):
    permission_count = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'description', 'color', 'is_active',
            'created_at', 'updated_at', 'permission_count', 'user_count', 'permissions'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_permission_count(self, obj):
        return obj.role_permissions.filter(is_active=True, permission__is_active=True).count()
    
    def get_user_count(self, obj):
        return obj.user_roles.filter(is_active=True, user__is_active=True).count()
    
    def get_permissions(self, obj):
        active_permissions = obj.role_permissions.filter(is_active=True, permission__is_active=True)
        return [
            {
                'id': role_perm.permission.id,
                'name': role_perm.permission.name,
                'description': role_perm.permission.description,
                'category': role_perm.permission.category
            }
            for role_perm in active_permissions
        ]


# 5. Serializer สำหรับ Permission
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'description', 'category', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# 6. Serializer สำหรับ UserRole
class UserRoleSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_color = serializers.CharField(source='role.color', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'user', 'user_username', 'role', 'role_name', 'role_color',
            'assigned_by', 'assigned_by_username', 'assigned_at', 'expires_at',
            'is_active', 'is_expired'
        ]
        read_only_fields = ['id', 'assigned_at', 'is_expired']


# 7. Serializer สำหรับ RolePermission
class RolePermissionSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    permission_category = serializers.CharField(source='permission.category', read_only=True)
    granted_by_username = serializers.CharField(source='granted_by.username', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = [
            'id', 'role', 'role_name', 'permission', 'permission_name',
            'permission_category', 'granted_by', 'granted_by_username',
            'granted_at', 'is_active'
        ]
        read_only_fields = ['id', 'granted_at']


# 8. Serializer สำหรับ AgentProjectAssignment
class AgentProjectAssignmentSerializer(serializers.ModelSerializer):
    agent_username = serializers.CharField(source='agent.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = AgentProjectAssignment
        fields = [
            'id', 'agent', 'agent_username', 'project', 'project_name',
            'assigned_at', 'is_active'
        ]
        read_only_fields = ['id', 'assigned_at']

# (อาจจะมี Serializer อื่นๆ ในอนาคต เช่น AgentProjectAssignmentSerializer)