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
from django.contrib.auth.models import Group

# สร้าง Custom Permission เพื่อเช็คว่าเป็น Admin หรือไม่
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        # ตรวจสอบ:
        # 1. user login อยู่หรือไม่
        # 2. user เป็น staff หรือ superuser หรือไม่
        print(f"Checking permission for user: {request.user}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Is staff: {request.user.is_staff}")
        print(f"Is superuser: {request.user.is_superuser}")
        
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )

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
    permission_classes = [permissions.AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def me(self, request):
        """
        ดึงข้อมูลผู้ใช้ปัจจุบัน
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows groups to be viewed.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.AllowAny]

class RoleViewSet(viewsets.ModelViewSet):
    """
    API endpoint สำหรับจัดการ Role
    """
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [permissions.AllowAny]

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

class PermissionViewSet(viewsets.ModelViewSet):
    """
    API endpoint สำหรับจัดการ Permission
    """
    queryset = Permission.objects.all().order_by('category', 'name')
    serializer_class = PermissionSerializer
    permission_classes = [permissions.AllowAny]

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
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """
        บันทึกข้อมูลพร้อม assigned_by
        """
        serializer.save(assigned_by=self.request.user)

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
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """
        บันทึกข้อมูลพร้อม granted_by
        """
        serializer.save(granted_by=self.request.user)

