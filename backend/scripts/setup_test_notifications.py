import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from api.models import Apartment, Payment, NotificationLog
from datetime import date, timedelta

target_phone = "905326363250"

print("Test için ödememiş 2 daire ayarlanıyor...")

# Ödenmemiş tüm borçları bul
unpaid_payments = Payment.objects.filter(is_paid=False)

if unpaid_payments.count() < 2:
    print(f"Sistemde sadece {unpaid_payments.count()} adet ödenmemiş borç var. Robot testi için en az 2 tane bekleniyordu.")
    # Eğer az ise, test için sahte borçlar yaratalım bari. Ama muhtemelen vardır.

# Eğer varsa ilk iki tanesini al.
selected_payments = unpaid_payments[:2]
for idx, payment in enumerate(selected_payments):
    apt = payment.apartment
    
    # Telefon numarasını kullanıcının istediği test numarasına çevir
    apt.phone_number = target_phone
    apt.save()
    print(f"Daire {apt.number} telefon numarası '{target_phone}' olarak güncellendi.")
    
    # Eğer bu borç için henüz bekleyen bildirim yoksa kuyruğa ekle
    if not NotificationLog.objects.filter(payment=payment, status='PENDING').exists():
        log = NotificationLog.objects.create(
            apartment=apt,
            payment=payment,
            message_type='HATIRLATMA'
        )
        print(f" -> Daire {apt.number}: {payment.amount} TL borç bildirimi eklendi (Log ID: {log.id}).")
    else:
        print(f" -> Daire {apt.number} için zaten kuyrukta bildirim var.")

print("Kuyruk hazırlığı tamamlandı! Şimdi `python scripts/wa_robot.py` çalıştırılarak gönderim test edilebilir.")
