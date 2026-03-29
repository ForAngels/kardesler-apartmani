import math
from django.db import models
from django.contrib.auth.models import User

class Apartment(models.Model):
    APARTMENT_TYPES = (
        ('KONUT', 'Konut'),
        ('ISYERI', 'İş Yeri'),
    )
    number = models.IntegerField(unique=True, verbose_name="Daire Numarası")
    type = models.CharField(max_length=15, choices=APARTMENT_TYPES, default='KONUT', verbose_name="Daire Türü")
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_apartments', verbose_name="Ev Sahibi")
    tenant = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='rented_apartments', verbose_name="Kiracı")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefon Numarası")
    
    class Meta:
        verbose_name = "Daire"
        verbose_name_plural = "Daireler"
        ordering = ['number']

    def __str__(self):
        return f"Daire {self.number} ({self.get_type_display()})"

class BuildingSettings(models.Model):
    default_dues_amount = models.DecimalField(max_digits=10, decimal_places=2, default=450.00, verbose_name="Genel Aidat Tutarı (TL)")

    class Meta:
        verbose_name = "Apartman Ayarı"
        verbose_name_plural = "Apartman Ayarları"

    def __str__(self):
        return "Genel Ayarlar"

class Payment(models.Model):
    PAYMENT_TYPES = (
        ('AIDAT', 'Düzenli Aidat'),
        ('EK_ODEME', 'Ekstra Gider/Ödeme'),
    )
    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name='payments', verbose_name="Daire")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Tutar (TL)")
    is_paid = models.BooleanField(default=False, verbose_name="Ödendi mi?")
    payment_type = models.CharField(max_length=15, choices=PAYMENT_TYPES, default='AIDAT', verbose_name="Ödeme Türü")
    due_date = models.DateField(verbose_name="Son Ödeme Tarihi")
    paid_date = models.DateField(null=True, blank=True, verbose_name="Ödenme Tarihi")
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name="Açıklama / Ay Bilgisi")
    linked_expense = models.ForeignKey('Expense', on_delete=models.CASCADE, null=True, blank=True, related_name='related_payments', verbose_name="Bağlı Gider")

    class Meta:
        verbose_name = "Ödeme/Aidat"
        verbose_name_plural = "Ödemeler ve Aidatlar"
        ordering = ['-due_date']

    def __str__(self):
        return f"Daire {self.apartment.number} - {self.amount} TL"

class Expense(models.Model):
    EXPENSE_TYPES = (
        ('ASANSOR', 'Asansör'),
        ('TEMIZLIK', 'Temizlik'),
        ('ELEKTRIK', 'Elektrik'),
        ('DIGER', 'Diğer')
    )
    title = models.CharField(max_length=100, verbose_name="Gider Başlığı")
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPES, verbose_name="Gider Kategorisi")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Tutar (TL)")
    date = models.DateField(auto_now_add=True, verbose_name="Kayıt Tarihi")
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True, verbose_name="Fatura / Makbuz Resmi")
    should_distribute = models.BooleanField(default=False, verbose_name="Tüm Dairelere Borç Olarak Bölüştür")
    is_distributed = models.BooleanField(default=False, verbose_name="Bölüştürme Yapıldı")

    class Meta:
        verbose_name = "Apartman Gideri"
        verbose_name_plural = "Apartman Giderleri"
        ordering = ['-date']

    def __str__(self):
        return f"{self.title} - {self.amount} TL"

class MaintenanceLog(models.Model):
    title = models.CharField(max_length=150, verbose_name="Bakım Konusu (Örn: Asansör)")
    scheduled_date = models.DateField(verbose_name="Planlanan Tarih")
    is_completed = models.BooleanField(default=False, verbose_name="Bakım Tamamlandı mı?")
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Bakım Maliyeti")
    
    class Meta:
        verbose_name = "Bakım Kaydı"
        verbose_name_plural = "Bakım Takvimi"
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"{self.title} ({self.scheduled_date})"

class Feedback(models.Model):
    STATUS_CHOICES = (
        ('ACIK', 'Açık / İnceleniyor'),
        ('COZULDU', 'Çözüldü / Tamamlandı'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks', verbose_name="Gönderen")
    subject = models.CharField(max_length=200, verbose_name="Konu")
    message = models.TextField(verbose_name="Mesaj")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACIK', verbose_name="Durum")
    admin_note = models.TextField(null=True, blank=True, verbose_name="Yönetici Notu")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Gönderim Tarihi")

    class Meta:
        verbose_name = "Şikayet ve Geri Bildirim"
        verbose_name_plural = "Şikayetler ve Geri Bildirimler"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.subject}"

class NotificationLog(models.Model):
    ALERT_TYPES = (
        ('YENI_AIDAT', 'Yeni Aidat Bilgilendirmesi'),
        ('HATIRLATMA', 'Son Ödeme Hatırlatması'),
    )
    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name='notifications')
    payment = models.ForeignKey('Payment', on_delete=models.CASCADE, related_name='notifications', null=True)
    message_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='PENDING') # PENDING, SENT, FAILED
    
    class Meta:
        verbose_name = "Bildirim Kaydı"
        verbose_name_plural = "Bildirim Kayıtları"
        ordering = ['-sent_at']
