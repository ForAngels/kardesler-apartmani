import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Admin kullanıcısı yoksa otomatik oluşturur'

    def handle(self, *args, **options):
        # Ortam değişkenlerinden al
        username = os.getenv('ADMIN_USERNAME', 'admin')
        password = os.getenv('ADMIN_PASSWORD', 'admin123')
        email = os.getenv('ADMIN_EMAIL', 'admin@example.com')

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username, email, password)
            self.stdout.write(self.style.SUCCESS(f'BAŞARILI: Admin kullanıcısı oluşturuldu: {username}'))
        else:
            self.stdout.write(self.style.WARNING(f'BİLGİ: Admin kullanıcısı zaten mevcut: {username}'))
