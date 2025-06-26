# D:\AAMS\aams_backend\core\admin.py

from django.contrib import admin

# Register your models here.

from .models import User, Role, Project, AgentProjectAssignment

admin.site.register(User)
admin.site.register(Role)
admin.site.register(Project)
admin.site.register(AgentProjectAssignment)
