from django.core.management.base import BaseCommand
from core.models import User, Role, UserRole

class Command(BaseCommand):
    help = 'กำหนด default role "Basic User" ให้กับ user ที่ไม่มี role'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='แสดงรายการ user ที่จะได้รับ default role โดยไม่ทำการเปลี่ยนแปลง',
        )

    def handle(self, *args, **options):
        # หา default role "Basic User"
        default_role = Role.objects.filter(
            name='Basic User',
            is_active=True
        ).first()
        
        if not default_role:
            self.stdout.write(
                self.style.ERROR('❌ ไม่พบ default role "Basic User" กรุณารัน setup_role_system.py ก่อน')
            )
            return
        
        # หา user ที่ไม่มี role
        users_without_roles = User.objects.filter(
            is_active=True
        ).exclude(
            user_roles__is_active=True
        ).distinct()
        
        if not users_without_roles.exists():
            self.stdout.write(
                self.style.SUCCESS('✅ ทุก user มี role อยู่แล้ว')
            )
            return
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING(f'🔍 พบ user {users_without_roles.count()} คนที่ไม่มี role:')
            )
            for user in users_without_roles:
                self.stdout.write(f'   - {user.username} ({user.get_full_name() or "ไม่มีชื่อ"})')
            self.stdout.write(
                self.style.WARNING(f'จะกำหนด role "{default_role.name}" ให้กับ user เหล่านี้')
            )
            return
        
        # กำหนด default role
        count = 0
        for user in users_without_roles:
            try:
                UserRole.objects.create(
                    user=user,
                    role=default_role,
                    is_active=True
                )
                self.stdout.write(
                    self.style.SUCCESS(f'✅ กำหนด default role ให้ {user.username}')
                )
                count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ ไม่สามารถกำหนด role ให้ {user.username}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 เสร็จสิ้น: กำหนด default role ให้กับ user {count} คน')
        ) 