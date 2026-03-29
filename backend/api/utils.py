from datetime import date
from .models import Apartment, Payment, BuildingSettings

def ensure_monthly_dues_created():
    today = date.today()
    # Ayın ilk günü kontrolü (veya ayın herhangi bir günü ama o ay için kayıt yoksa)
    
    settings = BuildingSettings.objects.first()
    if not settings:
        return
        
    amount = settings.default_dues_amount
    apartments = Apartment.objects.all()
    
    for apt in apartments:
        # Bu ay için AIDAT tipinde kayıt var mı?
        exists = Payment.objects.filter(
            apartment=apt,
            payment_type='AIDAT',
            due_date__year=today.year,
            due_date__month=today.month
        ).exists()
        
        if not exists:
            Payment.objects.create(
                apartment=apt,
                amount=amount,
                payment_type='AIDAT',
                due_date=date(today.year, today.month, 10), # Her ayın 10'u son ödeme
                description=f"{today.year} - {today.month} Aidat"
            )
