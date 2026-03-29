from django.contrib.auth.models import User
import math
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Q
from datetime import date
from .models import Apartment, Payment, Expense, MaintenanceLog, Feedback, BuildingSettings, NotificationLog
from .utils import ensure_monthly_dues_created

@api_view(['GET'])
@permission_classes([AllowAny])
    ensure_monthly_dues_created()
    
    # Otomatik Hatırlatıcı: Günlük ilk girişte borçluları kontrol et (Robot simülasyonu)
    from django.core.management import call_command
    from django.utils import timezone
    today = timezone.now().date()
    if not NotificationLog.objects.filter(sent_at__date=today, message_type='HATIRLATMA').exists():
        try:
            call_command('auto_remind')
        except:
            pass
    
    # Bu fonksiyon yöneticiler için genel istatistikleri verir
    total_paid = Payment.objects.filter(is_paid=True).aggregate(Sum('amount'))['amount__sum'] or 0
    total_expenses = Expense.objects.aggregate(Sum('amount'))['amount__sum'] or 0
    current_balance = float(total_paid) - float(total_expenses)
    
    total_debt = Payment.objects.filter(is_paid=False).aggregate(Sum('amount'))['amount__sum'] or 0
    upcoming_maintenance = MaintenanceLog.objects.filter(is_completed=False, scheduled_date__gte=date.today()).order_by('scheduled_date').first()
    maintenance_data = None
    if upcoming_maintenance:
        days_left = (upcoming_maintenance.scheduled_date - date.today()).days
        maintenance_data = {"title": upcoming_maintenance.title, "days_left": days_left}
    
    recent_payments = Payment.objects.filter(is_paid=True).order_by('-paid_date')[:5]
    recent_expenses = Expense.objects.order_by('-date')[:5]
    transactions = []
    for p in recent_payments:
        transactions.append({"id": f"p_{p.id}", "type": "payment", "title": f"Daire {p.apartment.number} Ödemesi", "amount": float(p.amount), "date": p.paid_date.strftime("%Y-%m-%d"), "positive": True})
    for e in recent_expenses:
        transactions.append({"id": f"e_{e.id}", "type": "expense", "title": e.title, "amount": float(e.amount), "date": e.date.strftime("%Y-%m-%d"), "positive": False})
    transactions.sort(key=lambda x: x['date'], reverse=True)
    
    apts_data = []
    for apt in Apartment.objects.all().order_by('number'):
        debt_amount = apt.payments.filter(is_paid=False).aggregate(Sum('amount'))['amount__sum'] or 0
        owner_name = apt.owner.get_full_name() if apt.owner else (apt.owner.username if apt.owner else "Belirtilmemiş")
        apts_data.append({"id": apt.id, "number": apt.number, "owner": owner_name, "debt": float(debt_amount), "status": "Borçlu" if debt_amount > 0 else "Ödendi"})
        
    return Response({
        "is_admin": request.user.is_staff if request.user.is_authenticated else False,
        "balance": current_balance,
        "total_debt": float(total_debt),
        "maintenance_data": maintenance_data,
        "recent_transactions": transactions[:5],
        "apartment_statuses": apts_data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_dashboard(request):
    # Giriş yapan kullanıcının kendi dairesine ait verileri
    user = request.user
    # Kullanıcı ev sahibi veya kiracı olabilir
    apartments = Apartment.objects.filter(Q(owner=user) | Q(tenant=user))
    
    if not apartments.exists():
        return Response({"error": "Sistemde adınıza kayıtlı bir daire bulunamadı."}, status=404)
    
    apartment = apartments.first()
    payments = Payment.objects.filter(apartment=apartment).order_by('-due_date')
    total_debt = payments.filter(is_paid=False).aggregate(Sum('amount'))['amount__sum'] or 0
    
    # Kendi şikayetleri
    my_feedbacks = Feedback.objects.filter(user=user).order_by('-created_at')[:5]
    feedback_list = []
    for fb in my_feedbacks:
        feedback_list.append({
            "id": fb.id,
            "subject": fb.subject,
            "status": fb.get_status_display(),
            "status_code": fb.status,
            "date": fb.created_at.strftime("%Y-%m-%d"),
            "admin_note": fb.admin_note
        })

    payment_history = []
    for p in payments:
        payment_history.append({
            "id": p.id,
            "amount": float(p.amount),
            "payment_type": p.payment_type,
            "payment_type_display": p.get_payment_type_display(),
            "due_date": p.due_date.strftime("%Y-%m-%d"),
            "paid_date": p.paid_date.strftime("%Y-%m-%d") if p.paid_date else None,
            "is_paid": p.is_paid,
            "description": p.description
        })

    # Yaklaşan Bakım (Paylaşımlı)
    upcoming_maintenance = MaintenanceLog.objects.filter(is_completed=False, scheduled_date__gte=date.today()).order_by('scheduled_date').first()
    maintenance_info = None
    if upcoming_maintenance:
        maintenance_info = {
            "title": upcoming_maintenance.title,
            "days_left": (upcoming_maintenance.scheduled_date - date.today()).days
        }

    return Response({
        "user_full_name": user.get_full_name() or user.username,
        "is_admin": user.is_staff,
        "apartment_number": apartment.number,
        "dues_amount": float(BuildingSettings.objects.first().default_dues_amount) if BuildingSettings.objects.exists() else 450.0,
        "total_debt": float(total_debt),
        "payment_history": payment_history,
        "feedbacks": feedback_list,
        "upcoming_maintenance": maintenance_info
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_feedback(request):
    subject = request.data.get('subject')
    message = request.data.get('message')
    
    if not subject or not message:
        return Response({"error": "Konu ve mesaj alanları zorunludur."}, status=400)
        
    feedback = Feedback.objects.create(
        user=request.user,
        subject=subject,
        message=message
    )
    
    return Response({"success": "Mesajınız yönetime iletildi.", "id": feedback.id})

# --- Yönetici Özel Fonksiyonları ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_all_feedbacks(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    feedbacks = Feedback.objects.all().order_by('-created_at')
    fb_list = []
    for fb in feedbacks:
        fb_list.append({
            "id": fb.id,
            "user": fb.user.username,
            "user_full_name": fb.user.get_full_name() or fb.user.username,
            "subject": fb.subject,
            "message": fb.message,
            "status": fb.get_status_display(),
            "status_code": fb.status,
            "admin_note": fb.admin_note,
            "date": fb.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return Response(fb_list)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_feedback(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    try:
        feedback = Feedback.objects.get(pk=pk)
    except Feedback.DoesNotExist:
        return Response({"error": "Şikayet bulunamadı."}, status=404)
        
    status = request.data.get('status')
    admin_note = request.data.get('admin_note')
    
    if status:
        feedback.status = status
    if admin_note is not None:
        feedback.admin_note = admin_note
        
    feedback.save()
    return Response({"success": "Şikayet güncellendi."})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_extra_payments(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    payments = Payment.objects.filter(payment_type='EK_ODEME').order_by('-due_date')
    p_list = []
    for p in payments:
        p_list.append({
            "id": p.id,
            "apartment_number": p.apartment.number,
            "amount": float(p.amount),
            "is_paid": p.is_paid,
            "due_date": p.due_date.strftime("%Y-%m-%d"),
            "paid_date": p.paid_date.strftime("%Y-%m-%d") if p.paid_date else None,
            "description": p.description,
            "linked_expense_title": p.linked_expense.title if p.linked_expense else "Belirtilmemiş"
        })
    return Response(p_list)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_payment_paid(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    try:
        payment = Payment.objects.get(pk=pk)
    except Payment.DoesNotExist:
        return Response({"error": "Ödeme kaydı bulunamadı."}, status=404)
        
    is_paid = request.data.get('is_paid')
    if is_paid is None:
        is_paid = not payment.is_paid # Toggle logic if not specified
        
    payment.is_paid = is_paid
    if is_paid:
        payment.paid_date = date.today()
    else:
        payment.paid_date = None
        
    payment.save()
    return Response({"success": "Ödeme durumu güncellendi.", "is_paid": payment.is_paid})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_apartments_detailed(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    settings = BuildingSettings.objects.first()
    default_dues = float(settings.default_dues_amount) if settings else 450.0
    
    today = date.today()
    apartments = Apartment.objects.all().order_by('number')
    apts_list = []
    
    for apt in apartments:
        # Mevcut ayın ödemesi var mı?
        this_month_payment = Payment.objects.filter(
            apartment=apt,
            due_date__year=today.year,
            due_date__month=today.month
        ).first()
        
        status = "Bilinmiyor"
        if this_month_payment:
            if this_month_payment.is_paid:
                status = "Ödendi"
            elif today.day <= 10:
                status = "Ödeme Dönemi"
            else:
                status = "Gecikmiş"
        else:
            status = "Aidat Tahakkuk Etmedi"

        owner_name = apt.owner.get_full_name() if apt.owner else (apt.owner.username if apt.owner else "Belirtilmemiş")
        tenant_name = apt.tenant.get_full_name() if apt.tenant else (apt.tenant.username if apt.tenant else "Yok")
        
        total_debt = apt.payments.filter(is_paid=False).aggregate(Sum('amount'))['amount__sum'] or 0
            
        apts_list.append({
            "id": apt.id,
            "number": apt.number,
            "type": apt.get_type_display(),
            "dues_amount": default_dues, # Artık genel ayardan geliyor
            "owner": owner_name,
            "tenant": tenant_name,
            "current_month_status": status,
            "total_debt": float(total_debt)
        })
    return Response(apts_list)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def apartment_payment_history(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    try:
        apt = Apartment.objects.get(pk=pk)
    except Apartment.DoesNotExist:
        return Response({"error": "Daire bulunamadı."}, status=404)
        
    payments = apt.payments.all().order_by('-due_date')
    history = []
    for p in payments:
        history.append({
            "id": p.id,
            "amount": float(p.amount),
            "due_date": p.due_date.strftime("%Y-%m-%d"),
            "paid_date": p.paid_date.strftime("%Y-%m-%d") if p.paid_date else None,
            "is_paid": p.is_paid,
            "description": p.description
        })
    return Response({
        "number": apt.number,
        "history": history
    })

# --- Raporlama Fonksiyonları ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_aidat_report(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    year = int(request.GET.get('year', date.today().year))
    month = int(request.GET.get('month', date.today().month))
    
    apartments = Apartment.objects.all().order_by('number')
    report_data = []
    
    for apt in apartments:
        payment = Payment.objects.filter(
            apartment=apt,
            payment_type='AIDAT',
            due_date__year=year,
            due_date__month=month
        ).first()
        
        report_data.append({
            "apartment_number": apt.number,
            "resident": apt.tenant.get_full_name() if apt.tenant else (apt.owner.get_full_name() if apt.owner else "Boş"),
            "amount": float(payment.amount) if payment else 0,
            "is_paid": payment.is_paid if payment else False,
            "paid_date": payment.paid_date.strftime("%Y-%m-%d") if payment and payment.paid_date else "-",
            "status": "Ödendi" if payment and payment.is_paid else "Bekliyor"
        })
        
    return Response(report_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_list_for_filter(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    # Sadece bölüştürülen giderleri getir
    expenses = Expense.objects.filter(should_distribute=True).order_by('-date')
    return Response([{"id": e.id, "title": e.title, "date": e.date} for e in expenses])

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def extra_payments_by_expense_report(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    expense_id = request.GET.get('expense_id')
    if not expense_id:
        return Response({"error": "Lütfen bir gider seçin."}, status=400)
        
    payments = Payment.objects.filter(linked_expense_id=expense_id).order_by('apartment__number')
    report_data = []
    
    for p in payments:
        report_data.append({
            "apartment_number": p.apartment.number,
            "resident": p.apartment.tenant.get_full_name() if p.apartment.tenant else (p.apartment.owner.get_full_name() if p.apartment.owner else "Bilinmiyor"),
            "amount": float(p.amount),
            "is_paid": p.is_paid,
            "paid_date": p.paid_date.strftime("%Y-%m-%d") if p.paid_date else "-",
            "description": p.description,
            "status": "Ödendi" if p.is_paid else "Bekliyor"
        })
        
    return Response(report_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_monthly_dues_management(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    # Otomasyonu burada da çalıştıralım ki liste güncel olsun
    ensure_monthly_dues_created()
    
    year = int(request.GET.get('year', date.today().year))
    month = int(request.GET.get('month', date.today().month))
    
    payments = Payment.objects.filter(
        payment_type='AIDAT',
        due_date__year=year,
        due_date__month=month
    ).order_by('apartment__number')
    
    p_list = []
    for p in payments:
        p_list.append({
            "id": p.id,
            "apartment_number": p.apartment.number,
            "resident": p.apartment.tenant.get_full_name() if p.apartment.tenant else (p.apartment.owner.get_full_name() if p.apartment.owner else "Boş"),
            "amount": float(p.amount),
            "is_paid": p.is_paid,
            "paid_date": p.paid_date.strftime("%Y-%m-%d") if p.paid_date else None,
            "due_date": p.due_date.strftime("%Y-%m-%d"),
            "phone_number": p.apartment.phone_number
        })
    return Response(p_list)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    query = request.GET.get('q', '')
    users = User.objects.filter(Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query))[:10]
    return Response([{"id": u.id, "username": u.username, "full_name": u.get_full_name()} for u in users])

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_apartment(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    number = request.data.get('number')
    apt_type = request.data.get('type', 'KONUT')
    phone_number = request.data.get('phone_number', '')
    
    if not number:
        return Response({"error": "Daire numarası zorunludur."}, status=400)
        
    if Apartment.objects.filter(number=number).exists():
        return Response({"error": "Bu numaralı daire zaten mevcut."}, status=400)
        
    # Her daire için otomatik bir kullanıcı hesabı oluştur
    username = f"daire{number}"
    password = f"daire{number}2026"
    
    user, created = User.objects.get_or_create(username=username)
    if created:
        user.set_password(password)
        user.save()
        
    apartment = Apartment.objects.create(
        number=number,
        type=apt_type,
        tenant=user,
        phone_number=phone_number
    )
    
    return Response({"success": "Daire ve kullanıcı hesabı oluşturuldu.", "id": apartment.id})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_apartment(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    try:
        apt = Apartment.objects.get(pk=pk)
    except Apartment.DoesNotExist:
        return Response({"error": "Daire bulunamadı."}, status=404)
        
    apt_type = request.data.get('type')
    phone_number = request.data.get('phone_number')
    owner_id = request.data.get('owner_id')
    tenant_id = request.data.get('tenant_id')
    
    if apt_type:
        apt.type = apt_type
    if phone_number is not None:
        apt.phone_number = phone_number
    if owner_id is not None:
        apt.owner_id = owner_id if owner_id != "" else None
    if tenant_id is not None:
        apt.tenant_id = tenant_id if tenant_id != "" else None
        
    apt.save()
    return Response({"success": "Daire güncellendi."})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_apartment(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    try:
        apt = Apartment.objects.get(pk=pk)
        apt.delete()
        return Response({"success": "Daire silindi."})
    except Apartment.DoesNotExist:
        return Response({"error": "Daire bulunamadı."}, status=404)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_expenses(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    if request.method == 'GET':
        expenses = Expense.objects.all().order_by('-date')
        return Response([{
            "id": e.id,
            "title": e.title,
            "expense_type": e.expense_type,
            "expense_type_display": e.get_expense_type_display(),
            "amount": float(e.amount),
            "date": e.date.strftime("%Y-%m-%d"),
            "should_distribute": e.should_distribute,
            "is_distributed": e.is_distributed
        } for e in expenses])
        
    elif request.method == 'POST':
        title = request.data.get('title')
        expense_type = request.data.get('expense_type')
        amount = request.data.get('amount')
        should_distribute = request.data.get('should_distribute', False)
        
        if not all([title, expense_type, amount]):
            return Response({"error": "Tüm alanlar zorunludur."}, status=400)
            
        expense = Expense.objects.create(
            title=title,
            expense_type=expense_type,
            amount=amount,
            should_distribute=should_distribute
        )
        
        return Response({"success": "Gider kaydedildi.", "id": expense.id})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_expense(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    try:
        expense = Expense.objects.get(pk=pk)
        expense.delete()
        return Response({"success": "Gider silindi."})
    except Expense.DoesNotExist:
        return Response({"error": "Gider bulunamadı."}, status=404)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_maintenance(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    if request.method == 'GET':
        logs = MaintenanceLog.objects.all().order_by('-scheduled_date')
        return Response([{
            "id": l.id,
            "title": l.title,
            "scheduled_date": l.scheduled_date.strftime("%Y-%m-%d"),
            "is_completed": l.is_completed,
            "cost": float(l.cost) if l.cost else None
        } for l in logs])
        
    elif request.method == 'POST':
        title = request.data.get('title')
        scheduled_date = request.data.get('scheduled_date')
        cost = request.data.get('cost')
        
        if not title or not scheduled_date:
            return Response({"error": "Başlık ve tarih zorunludur."}, status=400)
            
        log = MaintenanceLog.objects.create(
            title=title,
            scheduled_date=scheduled_date,
            cost=cost
        )
        return Response({"success": "Bakım kaydı oluşturuldu.", "id": log.id})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_maintenance(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    try:
        log = MaintenanceLog.objects.get(pk=pk)
        is_completed = request.data.get('is_completed')
        cost = request.data.get('cost')
        
        if is_completed is not None:
            log.is_completed = is_completed
        if cost is not None:
            log.cost = cost
            
        log.save()
        return Response({"success": "Bakım kaydı güncellendi."})
    except MaintenanceLog.DoesNotExist:
        return Response({"error": "Kayıt bulunamadı."}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_maintenance(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    try:
        log = MaintenanceLog.objects.get(pk=pk)
        log.delete()
        return Response({"success": "Bakım kaydı silindi."})
    except MaintenanceLog.DoesNotExist:
        return Response({"error": "Kayıt bulunamadı."}, status=404)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_notifications(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    if request.method == 'GET':
        logs = NotificationLog.objects.all()[:50]
        return Response([{
            "id": l.id,
            "apartment": l.apartment.number,
            "phone": l.apartment.phone_number,
            "type": l.get_message_type_display(),
            "amount": float(l.payment.amount) if l.payment else 0,
            "sent_at": l.sent_at.strftime("%Y-%m-%d %H:%M") if l.sent_at else None,
            "status": l.status
        } for l in logs])
        
    elif request.method == 'POST':
        # Robotu tetikle veya Manuel olarak kuyruğa ekle
        from datetime import date, timedelta
        today = date.today()
        # 1. Ayın Başı (Aidat Bilgilendirmesi)
        if today.day == 1:
            payments = Payment.objects.filter(due_date__month=today.month, payment_type='AIDAT', is_paid=False)
            for p in payments:
                if not NotificationLog.objects.filter(payment=p, message_type='YENI_AIDAT').exists():
                    NotificationLog.objects.create(apartment=p.apartment, payment=p, message_type='YENI_AIDAT')
        
        # 2. Vadeye 2 Gün Kala (Hatırlatma)
        two_days_later = today + timedelta(days=2)
        payments = Payment.objects.filter(due_date=two_days_later, is_paid=False)
        for p in payments:
            if not NotificationLog.objects.filter(payment=p, message_type='HATIRLATMA').exists():
                NotificationLog.objects.create(apartment=p.apartment, payment=p, message_type='HATIRLATMA')
                
        return Response({"success": "Bildirim kuyruğu güncellendi."})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_building_settings(request):
    if not request.user.is_staff:
        return Response({"error": "Bu işlem için yetkiniz yok."}, status=403)
        
    settings = BuildingSettings.objects.first()
    if not settings:
        settings = BuildingSettings.objects.create(default_dues_amount=450.00)
        
    if request.method == 'GET':
        return Response({
            "default_dues_amount": float(settings.default_dues_amount)
        })
        
    elif request.method == 'POST':
        amount = request.data.get('default_dues_amount')
        if amount is not None:
            settings.default_dues_amount = amount
            settings.save()
            return Response({"success": "Ayarlar güncellendi.", "default_dues_amount": float(settings.default_dues_amount)})
        return Response({"error": "Geçerli bir tutar girin."}, status=400)
