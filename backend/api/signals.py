import math
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date
from .models import Expense, Apartment, Payment

@receiver(post_save, sender=Expense)
def distribute_expense_to_apartments(sender, instance, created, **kwargs):
    # Eğer "Dairelere Böl" işaretliyse ve henüz bölüştürülmemişse
    if instance.should_distribute and not instance.is_distributed:
        apartments = Apartment.objects.all()
        count = apartments.count()
        
        if count > 0:
            # Tutarı daire sayısına böl ve yukarı yuvarla
            amount_per_apt = math.ceil(float(instance.amount) / count)
            
            for apt in apartments:
                Payment.objects.create(
                    apartment=apt,
                    amount=amount_per_apt,
                    payment_type='EK_ODEME',
                    due_date=date.today(), # Varsayılan olarak bugün
                    description=f"Ek Ödeme: {instance.title}",
                    linked_expense=instance
                )
            
            # Bölüştürme tamamlandı olarak işaretle (sonsuz döngüyü önlemek için update kullanıyoruz)
            Expense.objects.filter(pk=instance.pk).update(is_distributed=True)
