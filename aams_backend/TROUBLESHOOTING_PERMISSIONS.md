# คู่มือการแก้ไขปัญหา Permissions ใน AAMS

## ปัญหาที่พบบ่อยและวิธีแก้ไข

### 1. หน้า Frontend ไม่แสดงข้อมูล (403 Forbidden)

#### สาเหตุ
- เปลี่ยน permission classes จาก `AllowAny` เป็น custom permissions
- ยังไม่ได้สร้าง default permissions และ roles
- ผู้ใช้ไม่มี role ที่เหมาะสม

#### วิธีแก้ไข

##### ขั้นตอนที่ 1: สร้าง Default Permissions และ Roles
```bash
# สร้าง default permissions
python manage.py sync_permissions --create-default-permissions

# สร้าง default roles
python manage.py sync_permissions --create-default-roles

# ซิงค์ทั้งหมด
python manage.py sync_permissions --sync-all
```

##### ขั้นตอนที่ 2: กำหนด Role ให้กับ Superuser
```bash
python assign_superadmin_role.py
```

##### ขั้นตอนที่ 3: ตรวจสอบ Permission Classes ใน Views
```python
# เปลี่ยนจาก
permission_classes = [HasProjectPermission]

# เป็น
permission_classes = [permissions.IsAuthenticated]
```

### 2. API 403 Forbidden

#### สาเหตุ
- ผู้ใช้ไม่มีสิทธิ์เข้าถึง endpoint
- Token หมดอายุ
- ไม่ได้ส่ง Authorization header

#### วิธีแก้ไข

##### ตรวจสอบ Token
```javascript
// ใน Frontend
const token = localStorage.getItem('accessToken');
if (token) {
    headers['Authorization'] = `Bearer ${token}`;
}
```

##### ตรวจสอบ Permission
```python
# ใน Django Shell
from core.models import User, Role, UserRole

# ตรวจสอบ role ของผู้ใช้
user = User.objects.get(username='your_username')
user_roles = UserRole.objects.filter(user=user, is_active=True)
for ur in user_roles:
    print(f"Role: {ur.role.name}")
    print(f"Permissions: {[rp.permission.name for rp in ur.role.role_permissions.all()]}")
```

### 3. ข้อมูลไม่แสดงใน Frontend

#### สาเหตุ
- `get_queryset()` กรองข้อมูลมากเกินไป
- ผู้ใช้ไม่มีสิทธิ์เข้าถึงข้อมูล

#### วิธีแก้ไข

##### ตรวจสอบ get_queryset
```python
def get_queryset(self):
    user = self.request.user
    if user.is_superuser or user.is_staff:
        return Project.objects.all()  # แสดงทั้งหมด
    
    # กรองตามสิทธิ์
    return Project.objects.filter(
        agent_assignments__agent=user,
        agent_assignments__is_active=True
    ).distinct()
```

##### ตรวจสอบ Serializer
```python
# ตรวจสอบว่า serializer ส่งข้อมูลครบหรือไม่
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'  # หรือระบุ fields ที่ต้องการ
```

### 4. Permission Denied Error

#### สาเหตุ
- ผู้ใช้ไม่มี permission ที่ต้องการ
- Role หมดอายุ
- Permission ถูกปิดใช้งาน

#### วิธีแก้ไข

##### ตรวจสอบ Permission ของผู้ใช้
```python
# ใน Django Shell
from core.permissions import HasProjectPermission

user = User.objects.get(username='your_username')
permission_checker = HasProjectPermission()
has_permission = permission_checker._has_custom_permission(user, 'project_management')
print(f"Has project_management permission: {has_permission}")
```

##### กำหนด Permission ให้กับ Role
```python
# ใน Django Shell
from core.models import Role, Permission, RolePermission

# หา role และ permission
role = Role.objects.get(name='Manager')
permission = Permission.objects.get(name='project_management')

# กำหนด permission ให้กับ role
role_permission, created = RolePermission.objects.get_or_create(
    role=role,
    permission=permission,
    defaults={'is_active': True}
)
```

### 5. Django Groups ไม่ซิงค์

#### สาเหตุ
- ไม่ได้รัน sync command
- มีข้อผิดพลาดในการสร้าง Django Group

#### วิธีแก้ไข

##### รัน Sync Command
```bash
python manage.py sync_permissions --sync-all
```

##### ตรวจสอบ Django Groups
```python
# ใน Django Shell
from django.contrib.auth.models import Group
from core.models import Role

# ตรวจสอบ Django Groups
groups = Group.objects.all()
for group in groups:
    print(f"Group: {group.name}")
    print(f"Permissions: {[p.codename for p in group.permissions.all()]}")

# ตรวจสอบ Role ที่เชื่อมโยงกับ Group
roles = Role.objects.all()
for role in roles:
    if role.django_group:
        print(f"Role {role.name} -> Group {role.django_group.name}")
    else:
        print(f"Role {role.name} ไม่มี Django Group")
```

### 6. Frontend ไม่สามารถ Login ได้

#### สาเหตุ
- API endpoint เปลี่ยน
- Token format ไม่ถูกต้อง
- CORS settings

#### วิธีแก้ไข

##### ตรวจสอบ API Endpoint
```javascript
// ตรวจสอบ URL ที่ถูกต้อง
const loginUrl = 'http://localhost:8000/api/token/';
```

##### ตรวจสอบ CORS Settings
```python
# ใน settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

CORS_ALLOW_CREDENTIALS = True
```

### 7. การ Debug Permission System

#### ใช้ Django Debug Toolbar
```python
# ใน settings.py
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

#### ใช้ Logging
```python
# ใน settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'core.permissions': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

#### ตรวจสอบใน Django Shell
```python
# เปิด Django Shell
python manage.py shell

# ตรวจสอบ permissions
from core.models import User, Role, Permission, UserRole, RolePermission

# ตรวจสอบผู้ใช้
user = User.objects.get(username='admin')
print(f"User: {user.username}")
print(f"Is superuser: {user.is_superuser}")
print(f"Is staff: {user.is_staff}")

# ตรวจสอบ roles
user_roles = UserRole.objects.filter(user=user, is_active=True)
for ur in user_roles:
    print(f"Role: {ur.role.name}")
    print(f"Is expired: {ur.is_expired}")
    
    # ตรวจสอบ permissions ของ role
    role_permissions = RolePermission.objects.filter(
        role=ur.role, 
        is_active=True,
        permission__is_active=True
    )
    for rp in role_permissions:
        print(f"  Permission: {rp.permission.name} ({rp.permission.category})")
```

### 8. การ Reset Permission System

#### ถ้าต้องการเริ่มต้นใหม่
```bash
# ลบข้อมูลทั้งหมด
python manage.py flush

# สร้าง superuser ใหม่
python manage.py createsuperuser

# สร้าง permissions และ roles ใหม่
python manage.py sync_permissions --create-default-permissions
python manage.py sync_permissions --create-default-roles
python manage.py sync_permissions --sync-all

# กำหนด role ให้ superuser
python assign_superadmin_role.py
```

### 9. การทดสอบ API

#### ใช้ curl
```bash
# ทดสอบ health check
curl http://localhost:8000/api/health/

# ทดสอบ login
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# ทดสอบ API ด้วย token
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### ใช้ Postman
1. สร้าง request ไปที่ `http://localhost:8000/api/token/`
2. ใช้ method POST
3. ส่ง JSON body: `{"username":"admin","password":"your_password"}`
4. ใช้ access token ที่ได้ใน Authorization header

### 10. การตรวจสอบ Performance

#### ตรวจสอบ Database Queries
```python
# ใน Django Shell
from django.db import connection
from django.test.utils import override_settings

# เปิด debug mode
with override_settings(DEBUG=True):
    # รัน code ที่ต้องการตรวจสอบ
    projects = Project.objects.all()
    print(f"Queries: {len(connection.queries)}")
```

#### ใช้ Django Debug Toolbar
- ติดตั้ง django-debug-toolbar
- ดู SQL queries ที่ใช้
- ตรวจสอบ N+1 query problems

## สรุป

การแก้ไขปัญหา permissions ใน AAMS ต้องทำตามลำดับ:

1. **สร้าง default permissions และ roles**
2. **กำหนด role ให้กับ superuser**
3. **ปรับ permission classes ใน views**
4. **ทดสอบ API endpoints**
5. **ตรวจสอบ frontend integration**

หากยังมีปัญหา ให้ตรวจสอบ logs และใช้ Django Shell เพื่อ debug ระบบ permissions 