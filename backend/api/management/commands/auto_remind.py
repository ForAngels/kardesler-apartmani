import os
from django.core.management.base import BaseCommand
from api.models import Payment, NotificationLog
from datetime import date

class Command(BaseCommand):
    help = 'Borcu olanlara WhatsApp üzerinden hatırlatma simülasyonu yapar'

    def handle(self, *args, **options):
        today = date.today()
        # Bu ay vadesi gelmiş ve ödenmemiş tüm aidatları bul
        unpaid = Payment.objects.filter(is_paid=False, due_date__month=today.month)
        
        count = 0
        for p in unpaid:
            phone = p.apartment.phone_number
            if phone:
                # WhatsApp Mesaj Taslağı
                message = f"Kardesler Apt. Bilgilendirme: Daire {p.apartment.number} icin {p.amount} TL tutarindaki aidat borcunuzun odemesi beklenmektedir. Iyi gunler dileriz."
                
                # LOG VE BİLDİRİM KAYDI
                self.stdout.write(self.style.SUCCESS(f"ROBOT: Daire {p.apartment.number} ({phone}) icin mesaj kuyruga alindi."))
                
                # Bildirim kaydını sisteme işle
                NotificationLog.objects.create(
                    apartment=p.apartment,
                    payment=p,
                    message_type='HATIRLATMA',
                    status='SENT' # Simülasyon olduğu için SENT diyoruz
                )
                count += 1
            else:
                self.stdout.write(self.style.WARNING(f"UYARI: Daire {p.apartment.number} icin telefon numarasi kayitli degil!"))

        self.stdout.write(self.style.SUCCESS(f"ISLEM TAMAMLANDI: Toplam {count} hatirlatma kaydedildi."))
