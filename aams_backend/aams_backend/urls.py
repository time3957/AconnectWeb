# D:\AconnectWeb\aams_backend\aams_backend\urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenBlacklistView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # URL สำหรับ API ทั้งหมดในระบบ (รวมถึง /api/auth/login/)
    path('', include('core.urls')),

    # URL สำหรับการขอ Token ใหม่ (เมื่อ Token เก่าหมดอายุ)
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # URL สำหรับการ Logout (Blacklist Token)
    path('api/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
]