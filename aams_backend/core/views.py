# D:\AconnectWeb\aams_backend\core\views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Project, User, Role, Permission, UserRole, RolePermission
from .serializers import (
    ProjectSerializer, UserSerializer, GroupSerializer, RoleSerializer,
    PermissionSerializer, UserRoleSerializer, RolePermissionSerializer
)
from .permissions import (
    IsAdminUser, HasProjectPermission, HasUserManagementPermission,
    HasRoleManagementPermission, HasRolePermission
)
from django.contrib.auth.models import Group
from rest_framework import serializers

# Custom Token View ที่ส่งข้อมูลผู้ใช้กลับมาด้วย
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(
                {'detail': 'No active account found with the given credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        user = serializer.user
        response_data = {
            'access': serializer.validated_data['access'],
            'refresh': serializer.validated_data['refresh'],
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'employee_id': user.employee_id,
                'position': user.position,
                'department': user.department,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined.isoformat(),
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)

# Health Check Endpoint
@api_view(['GET'])
@permission_classes([])
def health_check(request):
    """
    Health check endpoint สำหรับตรวจสอบสถานะ API
    """
    return Response({
        'status': 'healthy',
        'message': 'AAMS API is running',
        'timestamp': '2024-01-01T00:00:00Z'
    })

class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.
    """
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]  # เปลี่ยนเป็น IsAuthenticated ก่อน

    def get_queryset(self):
        """
        กรองข้อมูลตามสิทธิ์ของผู้ใช้
        """
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return Project.objects.all()
        
        # กรองเฉพาะโปรเจคที่ผู้ใช้มีสิทธิ์เข้าถึง
        return Project.objects.filter(
            agent_assignments__agent=user,
            agent_assignments__is_active=True
        ).distinct()

    def perform_create(self, serializer):
        """
        ตรวจสอบสิทธิ์ก่อนสร้างโปรเจค
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            # ตรวจสอบ custom permission
            from .permissions import HasProjectPermission
            permission_checker = HasProjectPermission()
            if not permission_checker._has_custom_permission(user, 'project_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์สร้างโปรเจค")
        
        serializer.save()

    def perform_update(self, serializer):
        """
        ตรวจสอบสิทธิ์ก่อนอัปเดตโปรเจค
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            from .permissions import HasProjectPermission
            permission_checker = HasProjectPermission()
            if not permission_checker._has_custom_permission(user, 'project_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์แก้ไขโปรเจค")
        
        serializer.save()

    def perform_destroy(self, instance):
        """
        ตรวจสอบสิทธิ์ก่อนลบโปรเจค
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            from .permissions import HasProjectPermission
            permission_checker = HasProjectPermission()
            if not permission_checker._has_custom_permission(user, 'project_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์ลบโปรเจค")
        
        instance.delete()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]  # เปลี่ยนเป็น IsAuthenticated ก่อน

    def get_queryset(self):
        """
        กรองข้อมูลตามสิทธิ์ของผู้ใช้
        """
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return User.objects.all()
        
        # ผู้ใช้ทั่วไปเห็นได้เฉพาะข้อมูลของตัวเอง
        return User.objects.filter(id=user.id)

    def list(self, request, *args, **kwargs):
        """
        Override list method เพื่อเพิ่ม error handling
        """
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        ดึงข้อมูลผู้ใช้ปัจจุบัน
        """
        try:
            serializer = self.get_serializer(request.user)
            data = serializer.data
            return Response(data)
        except Exception as e:
            print(f"Error in me endpoint: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"เกิดข้อผิดพลาดในการดึงข้อมูล: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        """
        ตรวจสอบสิทธิ์ก่อนสร้างผู้ใช้
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            from .permissions import HasUserManagementPermission
            permission_checker = HasUserManagementPermission()
            if not permission_checker._has_custom_permission(user, 'user_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์สร้างผู้ใช้")
        
        # สร้าง user
        new_user = serializer.save()
        
        # ตรวจสอบว่ามี role_id ใน request หรือไม่
        role_id = self.request.data.get('role_id')
        
        if role_id:
            # ถ้ามี role_id ให้ assign role ที่เลือก
            try:
                role = Role.objects.get(id=role_id, is_active=True)
                UserRole.objects.create(
                    user=new_user,
                    role=role,
                    assigned_by=user,
                    is_active=True
                )
                print(f"✅ กำหนด role '{role.name}' ให้กับ {new_user.username}")
            except Role.DoesNotExist:
                print(f"⚠️ ไม่พบ role ID {role_id} สำหรับ {new_user.username}")
                # ถ้าไม่พบ role ที่เลือก ให้ assign Basic User
                self._assign_basic_user_role(new_user, user)
        else:
            # ถ้าไม่มี role_id ให้ assign Basic User อัตโนมัติ
            self._assign_basic_user_role(new_user, user)
    
    def _assign_basic_user_role(self, new_user, assigned_by):
        """กำหนด Basic User role ให้กับ user"""
        try:
            basic_user_role = Role.objects.filter(
                name='Basic User',
                is_active=True
            ).first()
            
            if basic_user_role:
                UserRole.objects.create(
                    user=new_user,
                    role=basic_user_role,
                    assigned_by=assigned_by,
                    is_active=True
                )
                print(f"✅ กำหนด default role 'Basic User' ให้กับ {new_user.username}")
            else:
                print(f"⚠️ ไม่พบ default role 'Basic User' สำหรับ {new_user.username}")
        except Exception as e:
            print(f"❌ Error assigning Basic User role to {new_user.username}: {e}")

    def perform_update(self, serializer):
        """
        ตรวจสอบสิทธิ์ก่อนอัปเดตผู้ใช้
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            from .permissions import HasUserManagementPermission
            permission_checker = HasUserManagementPermission()
            if not permission_checker._has_custom_permission(user, 'user_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์แก้ไขผู้ใช้")
        
        serializer.save()

    def perform_destroy(self, instance):
        """
        ตรวจสอบสิทธิ์ก่อนลบผู้ใช้
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            from .permissions import HasUserManagementPermission
            permission_checker = HasUserManagementPermission()
            if not permission_checker._has_custom_permission(user, 'user_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์ลบผู้ใช้")
        
        instance.delete()

    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        """
        กำหนด role ให้กับผู้ใช้
        """
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        try:
            role = Role.objects.get(id=role_id, is_active=True)
            user_role, created = UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={
                    'assigned_by': request.user,
                    'is_active': True
                }
            )
            
            if not created:
                user_role.is_active = True
                user_role.assigned_by = request.user
                user_role.save()
            
            serializer = UserRoleSerializer(user_role)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Role.DoesNotExist:
            return Response(
                {'error': 'Role not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_role(self, request, pk=None):
        """
        ลบ role ออกจากผู้ใช้
        """
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        try:
            user_role = UserRole.objects.get(
                user=user,
                role_id=role_id,
                is_active=True
            )
            user_role.is_active = False
            user_role.save()
            
            return Response({'message': 'Role removed successfully'})
            
        except UserRole.DoesNotExist:
            return Response(
                {'error': 'User role not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows groups to be viewed.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAdminUser]

class RoleViewSet(viewsets.ModelViewSet):
    """
    API endpoint สำหรับจัดการ Role
    """
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]  # เปลี่ยนเป็น IsAuthenticated ก่อน

    def get_queryset(self):
        """
        กรองข้อมูลตามสิทธิ์
        """
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return Role.objects.all()
        
        # ผู้ใช้ทั่วไปเห็นได้เฉพาะ roles ที่ active
        return Role.objects.filter(is_active=True)

    def perform_create(self, serializer):
        """
        บันทึกข้อมูลและสร้าง Django Group
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            from .permissions import HasRoleManagementPermission
            permission_checker = HasRoleManagementPermission()
            if not permission_checker._has_custom_permission(user, 'role_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์สร้าง role")
        
        role = serializer.save()
        # สร้าง Django Group สำหรับ role นี้
        from .permissions import sync_role_with_django_group
        sync_role_with_django_group(role)

    def perform_update(self, serializer):
        """
        อัปเดตข้อมูลและซิงค์กับ Django Group
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            from .permissions import HasRoleManagementPermission
            permission_checker = HasRoleManagementPermission()
            if not permission_checker._has_custom_permission(user, 'role_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์แก้ไข role")
        
        role = serializer.save()
        # อัปเดต Django Group
        from .permissions import sync_role_with_django_group
        sync_role_with_django_group(role)

    def perform_destroy(self, instance):
        """
        ตรวจสอบสิทธิ์และป้องกันการลบ role ที่สำคัญ
        """
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            from .permissions import HasRoleManagementPermission
            permission_checker = HasRoleManagementPermission()
            if not permission_checker._has_custom_permission(user, 'role_management'):
                raise permissions.PermissionDenied("คุณไม่มีสิทธิ์ลบ role")
        
        # ตรวจสอบว่าเป็น System Role หรือไม่ (ป้องกันการลบ role สำคัญ)
        system_roles = ['System Administrator', 'Basic User']
        if instance.name in system_roles:
            raise serializers.ValidationError({
                'error': f'ไม่สามารถลบ System Role "{instance.name}" ได้ เนื่องจากเป็น role สำคัญของระบบ'
            })
        
        # ตรวจสอบว่ามี user ใช้ role นี้อยู่หรือไม่
        active_user_roles = instance.user_roles.filter(is_active=True, user__is_active=True)
        if active_user_roles.exists():
            # หา Basic User role
            basic_user_role = Role.objects.filter(name='Basic User', is_active=True).first()
            if not basic_user_role:
                raise serializers.ValidationError({
                    'error': 'ไม่พบ Basic User role กรุณาสร้าง Basic User role ก่อนลบ role นี้'
                })
            
            # เปลี่ยน role ของ user ทั้งหมดเป็น Basic User
            users_affected = []
            for user_role in active_user_roles:
                user_role.role = basic_user_role
                user_role.save()
                users_affected.append(user_role.user.username)
            
            # ลบ role เดิม
            instance.delete()
            
            # ส่งข้อมูลกลับว่ามี user ถูกเปลี่ยน role
            raise serializers.ValidationError({
                'success': True,
                'message': f'ลบ Role "{instance.name}" สำเร็จ และเปลี่ยน role ของผู้ใช้ {len(users_affected)} คนเป็น "Basic User"',
                'users_affected': users_affected,
                'user_count': len(users_affected)
            })
        
        # ถ้าไม่มี user ใช้ สามารถลบได้เลย
        instance.delete()

    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """
        ดึงรายชื่อผู้ใช้ที่มี Role นี้
        """
        role = self.get_object()
        user_roles = role.user_roles.filter(is_active=True, user__is_active=True)
        users = [user_role.user for user_role in user_roles]
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def permissions(self, request, pk=None):
        """
        ดึงรายการ Permission ของ Role นี้
        """
        role = self.get_object()
        role_permissions = role.role_permissions.filter(is_active=True, permission__is_active=True)
        permissions = [rp.permission for rp in role_permissions]
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_permission(self, request, pk=None):
        """
        กำหนด permission ให้กับ role
        """
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        try:
            permission = Permission.objects.get(id=permission_id, is_active=True)
            role_permission, created = RolePermission.objects.get_or_create(
                role=role,
                permission=permission,
                defaults={
                    'granted_by': request.user,
                    'is_active': True
                }
            )
            
            if not created:
                role_permission.is_active = True
                role_permission.granted_by = request.user
                role_permission.save()
            
            # อัปเดต Django Group
            from .permissions import sync_role_with_django_group
            sync_role_with_django_group(role)
            
            serializer = RolePermissionSerializer(role_permission)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Permission.DoesNotExist:
            return Response(
                {'error': 'Permission not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_permission(self, request, pk=None):
        """
        ลบ permission ออกจาก role
        """
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        try:
            role_permission = RolePermission.objects.get(
                role=role,
                permission_id=permission_id,
                is_active=True
            )
            role_permission.is_active = False
            role_permission.save()
            
            # อัปเดต Django Group
            from .permissions import sync_role_with_django_group
            sync_role_with_django_group(role)
            
            return Response({'message': 'Permission removed successfully'})
            
        except RolePermission.DoesNotExist:
            return Response(
                {'error': 'Role permission not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class PermissionViewSet(viewsets.ModelViewSet):
    """
    API endpoint สำหรับจัดการ Permission
    """
    queryset = Permission.objects.all().order_by('category', 'name')
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]  # เปลี่ยนเป็น IsAuthenticated ก่อน

    def get_queryset(self):
        """
        กรองข้อมูลตามสิทธิ์
        """
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return Permission.objects.all()
        
        # ผู้ใช้ทั่วไปเห็นได้เฉพาะ permissions ที่ active
        return Permission.objects.filter(is_active=True)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        ดึงรายการ Category ทั้งหมด
        """
        categories = Permission.objects.values_list('category', flat=True).distinct()
        return Response(list(categories))

class UserRoleViewSet(viewsets.ModelViewSet):
    """
    API endpoint สำหรับจัดการ UserRole
    """
    queryset = UserRole.objects.all().order_by('-assigned_at')
    serializer_class = UserRoleSerializer
    permission_classes = [permissions.IsAuthenticated]  # เปลี่ยนเป็น IsAuthenticated ก่อน

    def get_queryset(self):
        """
        กรองข้อมูลตามสิทธิ์
        """
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return UserRole.objects.all()
        
        # ผู้ใช้ทั่วไปเห็นได้เฉพาะ user roles ของตัวเอง
        return UserRole.objects.filter(user=user)

    def perform_create(self, serializer):
        """
        บันทึกข้อมูลพร้อม assigned_by
        """
        user_role = serializer.save(assigned_by=self.request.user)
        
        # เพิ่มผู้ใช้เข้า Django Group
        if user_role.role.django_group:
            user_role.user.groups.add(user_role.role.django_group)

    def perform_update(self, serializer):
        """
        อัปเดตข้อมูล
        """
        user_role = serializer.save()
        
        # อัปเดต Django Group
        if user_role.role.django_group:
            if user_role.is_active:
                user_role.user.groups.add(user_role.role.django_group)
            else:
                user_role.user.groups.remove(user_role.role.django_group)

    @action(detail=False, methods=['get'])
    def my_roles(self, request):
        """
        ดึง Role ของผู้ใช้ปัจจุบัน
        """
        user_roles = UserRole.objects.filter(
            user=request.user,
            is_active=True,
            role__is_active=True
        ).order_by('-assigned_at')
        serializer = self.get_serializer(user_roles, many=True)
        return Response(serializer.data)

class RolePermissionViewSet(viewsets.ModelViewSet):
    """
    API endpoint สำหรับจัดการ RolePermission
    """
    queryset = RolePermission.objects.all().order_by('-granted_at')
    serializer_class = RolePermissionSerializer
    permission_classes = [permissions.IsAuthenticated]  # เปลี่ยนเป็น IsAuthenticated ก่อน

    def get_queryset(self):
        """
        กรองข้อมูลตามสิทธิ์
        """
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return RolePermission.objects.all()
        
        # ผู้ใช้ทั่วไปเห็นได้เฉพาะ role permissions ของ roles ที่มี
        user_roles = UserRole.objects.filter(user=user, is_active=True)
        role_ids = [ur.role.id for ur in user_roles]
        return RolePermission.objects.filter(role_id__in=role_ids)

    def perform_create(self, serializer):
        """
        บันทึกข้อมูลพร้อม granted_by
        """
        role_permission = serializer.save(granted_by=self.request.user)
        
        # อัปเดต Django Group
        from .permissions import sync_role_with_django_group
        sync_role_with_django_group(role_permission.role)

    def perform_update(self, serializer):
        """
        อัปเดตข้อมูล
        """
        role_permission = serializer.save()
        
        # อัปเดต Django Group
        from .permissions import sync_role_with_django_group
        sync_role_with_django_group(role_permission.role)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            
            if serializer.is_valid():
                self.perform_update(serializer)
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Exception in update: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"เกิดข้อผิดพลาดในการอัปเดตข้อมูล: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

