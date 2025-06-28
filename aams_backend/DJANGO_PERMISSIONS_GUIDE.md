# คู่มือการใช้งาน Django Permission System ใน AAMS

## ภาพรวม

ระบบ AAMS ได้ปรับปรุงการจัดการ Role และ Permission ให้ใช้ประโยชน์จาก Django Permission System ได้เต็มที่ โดยมีการผสมผสานระหว่าง:

1. **Django Built-in Permissions** - สำหรับการจัดการสิทธิ์พื้นฐาน
2. **Custom Permissions** - สำหรับสิทธิ์เฉพาะของระบบ
3. **Role-based Access Control (RBAC)** - สำหรับจัดการสิทธิ์ผ่าน roles

## โครงสร้างระบบ

### 1. Models

#### User Model (ขยายจาก AbstractUser)
```python
class User(AbstractUser):
    employee_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    # ... ฟิลด์อื่นๆ
```

#### Role Model
```python
class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#007bff')
    django_group = models.ForeignKey('auth.Group', ...)  # เชื่อมโยงกับ Django Group
```

#### Permission Model
```python
class Permission(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50)  # เช่น 'user', 'project', 'system'
```

### 2. Custom Permission Classes

#### HasRolePermission
ตรวจสอบว่าผู้ใช้มี role ที่มี permission นี้หรือไม่

#### HasProjectPermission
ตรวจสอบสิทธิ์ในการจัดการโปรเจค

#### HasUserManagementPermission
ตรวจสอบสิทธิ์ในการจัดการผู้ใช้

#### HasRoleManagementPermission
ตรวจสอบสิทธิ์ในการจัดการ roles

## การใช้งาน

### 1. การตั้งค่าเริ่มต้น

#### สร้าง Default Permissions และ Roles
```bash
# สร้าง default permissions
python manage.py sync_permissions --create-default-permissions

# สร้าง default roles
python manage.py sync_permissions --create-default-roles

# ซิงค์ทั้งหมด
python manage.py sync_permissions --sync-all
```

#### Default Roles ที่สร้างขึ้น
- **Super Admin** - ผู้ดูแลระบบสูงสุด
- **Admin** - ผู้ดูแลระบบ
- **Manager** - ผู้จัดการ
- **User** - ผู้ใช้ทั่วไป
- **Guest** - ผู้เยี่ยมชม

### 2. การใช้ Permission ใน Views

#### ตัวอย่างการใช้งานใน ViewSet
```python
from core.permissions import HasProjectPermission

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [HasProjectPermission]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return Project.objects.all()
        
        # กรองเฉพาะโปรเจคที่ผู้ใช้มีสิทธิ์เข้าถึง
        return Project.objects.filter(
            agent_assignments__agent=user,
            agent_assignments__is_active=True
        ).distinct()
```

#### ตัวอย่างการตรวจสอบ Permission ใน View
```python
from core.permissions import HasRolePermission

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRolePermission]
    required_permission = 'project_management'  # กำหนด permission ที่ต้องการ
```

### 3. การจัดการ Roles และ Permissions

#### กำหนด Role ให้กับผู้ใช้
```python
from core.permissions import assign_role_to_user

# กำหนด role ให้กับผู้ใช้
user_role = assign_role_to_user(user, role, assigned_by=admin_user)
```

#### ลบ Role ออกจากผู้ใช้
```python
from core.permissions import remove_role_from_user

# ลบ role ออกจากผู้ใช้
remove_role_from_user(user, role)
```

#### ตรวจสอบ Permission ของผู้ใช้
```python
# ตรวจสอบ Django built-in permission
if user.has_perm('core.project_management'):
    # มีสิทธิ์จัดการโปรเจค
    pass

# ตรวจสอบ custom permission
if user.has_custom_permission('project_management'):
    # มีสิทธิ์จัดการโปรเจค
    pass

# ตรวจสอบ role
if user.has_role('Manager'):
    # มี role Manager
    pass
```

### 4. API Endpoints

#### User Management
- `GET /api/users/` - ดึงรายการผู้ใช้ (ต้องมี user_management permission)
- `POST /api/users/{id}/assign_role/` - กำหนด role ให้ผู้ใช้
- `POST /api/users/{id}/remove_role/` - ลบ role ออกจากผู้ใช้

#### Role Management
- `GET /api/roles/` - ดึงรายการ roles (ต้องมี role_management permission)
- `POST /api/roles/{id}/assign_permission/` - กำหนด permission ให้ role
- `POST /api/roles/{id}/remove_permission/` - ลบ permission ออกจาก role

#### Project Management
- `GET /api/projects/` - ดึงรายการโปรเจค (กรองตามสิทธิ์)
- `POST /api/projects/` - สร้างโปรเจคใหม่ (ต้องมี project_management permission)

## การตั้งค่าใน Settings

### 1. AUTH_USER_MODEL
```python
AUTH_USER_MODEL = 'core.User'
```

### 2. REST_FRAMEWORK Settings
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

## การทดสอบ

### 1. ทดสอบ Permission
```python
from django.test import TestCase
from core.permissions import HasProjectPermission

class PermissionTestCase(TestCase):
    def setUp(self):
        # สร้างผู้ใช้และ roles สำหรับทดสอบ
        pass
    
    def test_project_permission(self):
        # ทดสอบ permission สำหรับโปรเจค
        pass
```

### 2. ทดสอบ API
```python
from rest_framework.test import APITestCase

class ProjectAPITestCase(APITestCase):
    def setUp(self):
        # สร้างข้อมูลทดสอบ
        pass
    
    def test_project_list_with_permission(self):
        # ทดสอบการเข้าถึงรายการโปรเจค
        pass
```

## ข้อดีของการใช้ Django Permission System

### 1. ความปลอดภัย
- ใช้ Django's built-in security features
- มีการตรวจสอบสิทธิ์ที่แข็งแกร่ง
- รองรับการ audit และ logging

### 2. ความยืดหยุ่น
- สามารถผสมผสาน Django permissions กับ custom permissions
- รองรับ role-based access control
- สามารถกำหนดสิทธิ์ระดับ object ได้

### 3. การบำรุงรักษา
- ใช้ Django admin interface สำหรับจัดการ permissions
- มี management commands สำหรับการตั้งค่า
- รองรับการ migrate และ backup

### 4. ประสิทธิภาพ
- ใช้ Django's caching system
- มีการ optimize queries
- รองรับการ scale

## การแก้ไขปัญหา

### 1. Permission ไม่ทำงาน
- ตรวจสอบว่าได้รัน `sync_permissions` command แล้ว
- ตรวจสอบว่า role มี permission ที่ถูกต้อง
- ตรวจสอบว่า user ถูกกำหนด role แล้ว

### 2. API 403 Forbidden
- ตรวจสอบ permission_classes ใน view
- ตรวจสอบว่า user มี role ที่ถูกต้อง
- ตรวจสอบ Django groups

### 3. การซิงค์ข้อมูล
- ใช้ `sync_permissions --sync-all` เพื่อซิงค์ข้อมูลทั้งหมด
- ตรวจสอบ Django admin interface
- ตรวจสอบ logs สำหรับข้อผิดพลาด

## การพัฒนาต่อ

### 1. เพิ่ม Custom Permissions
```python
# สร้าง permission ใหม่
permission = Permission.objects.create(
    name='custom_action',
    description='Custom action permission',
    category='custom'
)
```

### 2. เพิ่ม Custom Permission Classes
```python
class HasCustomPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # ตรวจสอบ custom permission
        return self._has_custom_permission(request.user, 'custom_action')
```

### 3. เพิ่ม Object-level Permissions
```python
def has_object_permission(self, request, view, obj):
    # ตรวจสอบสิทธิ์ระดับ object
    return obj.owner == request.user
```

## สรุป

การปรับปรุงระบบให้ใช้ Django Permission System ได้เต็มที่ช่วยให้:

1. **มีความปลอดภัยสูงขึ้น** - ใช้ Django's proven security features
2. **ง่ายต่อการบำรุงรักษา** - ใช้ Django admin และ management commands
3. **มีความยืดหยุ่น** - รองรับทั้ง built-in และ custom permissions
4. **มีประสิทธิภาพดี** - ใช้ Django's optimization features
5. **รองรับการขยายตัว** - สามารถเพิ่ม features ใหม่ได้ง่าย 