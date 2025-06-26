# การแก้ไขปัญหา Login

## ปัญหาที่พบ
- Login ไม่ได้ ขึ้น "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"

## วิธีแก้ไข

### 1. ตรวจสอบ Django Server
```bash
# ตรวจสอบว่า Django server กำลังทำงานอยู่หรือไม่
cd aams_backend
python manage.py runserver
```

### 2. ตั้งค่า DEBUG=True
สร้างไฟล์ `.env` ในโฟลเดอร์ `aams_backend`:
```env
DEBUG=True
DB_NAME=aams_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
```

### 3. แก้ไข Superuser
```bash
# รัน script เพื่อแก้ไข superuser
python fix_superuser.py
```

### 4. ทดสอบ API
```bash
# ทดสอบ API endpoints
python test_api.py
```

### 5. ตรวจสอบ Console
เปิด Developer Tools ใน browser และดู Console tab เพื่อดู error messages

### 6. ตรวจสอบ Network Tab
ดู Network tab ใน Developer Tools เพื่อดู:
- Request ที่ส่งไป
- Response ที่ได้รับกลับมา
- Status code
- Headers

## ปัญหาที่อาจเกิดขึ้น

### CORS Error
- ตรวจสอบว่า CORS_ALLOWED_ORIGINS ตั้งค่าถูกต้อง
- ตรวจสอบว่า corsheaders middleware อยู่ใน MIDDLEWARE

### Database Connection Error
- ตรวจสอบการตั้งค่าฐานข้อมูลใน .env
- ตรวจสอบว่า PostgreSQL กำลังทำงานอยู่

### JWT Token Error
- ตรวจสอบการตั้งค่า SIMPLE_JWT
- ตรวจสอบว่า rest_framework_simplejwt ถูกติดตั้ง

### Permission Error
- ตรวจสอบว่า superuser มี is_staff=True
- ตรวจสอบ IsAdminUser permission class

## การ Debug

### 1. เปิด Console Log
ใน LoginPage.js มี console.log เพื่อ debug:
```javascript
console.log('Login response:', response.data);
console.error('Error details:', {
    message: error.message,
    response: error.response,
    request: error.request
});
```

### 2. ตรวจสอบ Network Requests
ดู Network tab ใน Developer Tools:
- Method: POST
- URL: http://localhost:8000/api/token/
- Headers: Content-Type: application/json
- Body: {"username": "...", "password": "..."}

### 3. ตรวจสอบ Response
- Status Code: 200 (สำเร็จ), 400 (ข้อมูลไม่ถูกต้อง), 401 (ไม่ได้รับอนุญาต), 500 (server error)
- Response Body: ควรมี access และ refresh token

## คำสั่งที่มีประโยชน์

```bash
# รีสตาร์ท Django server
python manage.py runserver

# ตรวจสอบ migrations
python manage.py showmigrations

# สร้าง superuser ใหม่
python manage.py createsuperuser

# ตรวจสอบ database
python manage.py dbshell

# รัน tests
python manage.py test
```

## ติดต่อผู้พัฒนา
หากยังมีปัญหา กรุณาแจ้ง:
1. Error message ที่ได้รับ
2. Console log
3. Network request/response
4. Django server log 