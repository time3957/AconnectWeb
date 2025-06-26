# D:\AconnectWeb\aams_backend\core\urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# สร้าง Router สำหรับ ViewSets
router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'projects', views.ProjectViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'roles', views.RoleViewSet)
router.register(r'permissions', views.PermissionViewSet)
router.register(r'user-roles', views.UserRoleViewSet)
router.register(r'role-permissions', views.RolePermissionViewSet)

urlpatterns = [
    # API endpoints สำหรับ ViewSets
    path('api/', include(router.urls)),
    
    # Custom endpoints
    path('api/auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/health/', views.health_check, name='health_check'),
]

