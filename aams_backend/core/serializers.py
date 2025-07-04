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
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'employee_id', 'position', 'department', 'phone', 'address',
            'date_of_birth', 'hire_date', 'termination_date', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'groups', 'user_roles', 'password'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_groups(self, obj):
        return [group.name for group in obj.groups.all()]
    
    def get_user_roles(self, obj):
        try:
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
        except Exception as e:
            print(f"Error in get_user_roles for user {obj.username}: {e}")  # Debug log
            return []
    
    def create(self, validated_data):
        """สร้าง user ใหม่พร้อมรหัสผ่าน"""
        password = validated_data.pop('password', None)
        
        # จัดการ employee_id - ถ้าเป็นค่าว่างให้เป็น None
        if 'employee_id' in validated_data and not validated_data['employee_id']:
            validated_data['employee_id'] = None
        
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        return user
    
    def update(self, instance, validated_data):
        """อัปเดต user พร้อมรหัสผ่าน (ถ้ามี)"""
        password = validated_data.pop('password', None)
        
        # จัดการ employee_id - ถ้าเป็นค่าว่างให้เป็น None
        if 'employee_id' in validated_data:
            if not validated_data['employee_id'] or validated_data['employee_id'].strip() == '':
                validated_data['employee_id'] = None
            else:
                validated_data['employee_id'] = validated_data['employee_id'].strip()
        
        # จัดการฟิลด์อื่นๆ ที่อาจเป็นค่าว่าง
        empty_fields = ['position', 'department', 'phone', 'address']
        for field in empty_fields:
            if field in validated_data and (not validated_data[field] or validated_data[field].strip() == ''):
                validated_data[field] = None
            elif field in validated_data:
                validated_data[field] = validated_data[field].strip()
        
        # อัปเดตข้อมูลอื่นๆ
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # อัปเดตรหัสผ่าน (ถ้ามี)
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

    def to_representation(self, instance):
        """
        Override to_representation เพื่อเพิ่ม error handling
        """
        try:
            return super().to_representation(instance)
        except Exception as e:
            # Return basic user info if serialization fails
            return {
                'id': instance.id,
                'username': instance.username,
                'email': instance.email,
                'first_name': instance.first_name,
                'last_name': instance.last_name,
                'is_active': instance.is_active,
                'error': 'Serialization error'
            }

    def validate_employee_id(self, value):
        """
        ตรวจสอบว่า employee_id ไม่ซ้ำกับคนอื่น
        """
        if value:
            # ตรวจสอบว่ามี employee_id นี้อยู่แล้วหรือไม่
            user = self.instance  # user ที่กำลังอัปเดต (ถ้ามี)
            
            existing_user = User.objects.filter(employee_id=value).first()
            
            if existing_user and (not user or existing_user.id != user.id):
                raise serializers.ValidationError("รหัสพนักงานนี้ถูกใช้งานแล้ว กรุณาใช้รหัสอื่น")
        
        return value


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