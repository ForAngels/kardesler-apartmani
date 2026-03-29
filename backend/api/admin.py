from django.contrib import admin
from .models import Apartment, Payment, Expense, MaintenanceLog, Feedback, BuildingSettings

@admin.register(BuildingSettings)
class BuildingSettingsAdmin(admin.ModelAdmin):
    list_display = ('id', 'default_dues_amount')
    list_editable = ('default_dues_amount',)

    def has_add_permission(self, request):
        return not BuildingSettings.objects.exists()

@admin.register(Apartment)
class ApartmentAdmin(admin.ModelAdmin):
    list_display = ('number', 'type', 'owner', 'tenant')
    list_display_links = ('number',)
    search_fields = ('number', 'owner__username', 'tenant__username', 'owner__first_name', 'tenant__first_name')
    list_filter = ('type',)
    list_per_page = 20

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('apartment', 'amount', 'payment_type', 'due_date', 'paid_date', 'is_paid')
    list_display_links = ('apartment',)
    list_editable = ('is_paid', 'paid_date')
    list_filter = ('is_paid', 'payment_type', 'due_date')
    search_fields = ('apartment__number', 'description')
    date_hierarchy = 'due_date'
    list_per_page = 20

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'expense_type', 'amount', 'date', 'should_distribute', 'is_distributed')
    list_display_links = ('title',)
    list_filter = ('expense_type', 'date', 'should_distribute')
    search_fields = ('title',)
    readonly_fields = ('is_distributed',)
    date_hierarchy = 'date'
    list_per_page = 20

@admin.register(MaintenanceLog)
class MaintenanceLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'scheduled_date', 'cost', 'is_completed')
    list_display_links = ('title',)
    list_editable = ('is_completed',)
    list_filter = ('is_completed', 'scheduled_date')
    search_fields = ('title',)
    date_hierarchy = 'scheduled_date'
    list_per_page = 20

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'subject', 'message')
    list_editable = ('status',)
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Mesaj Bilgisi', {
            'fields': ('user', 'subject', 'message', 'created_at')
        }),
        ('Yönetim Yanıtı', {
            'fields': ('status', 'admin_note')
        }),
    )
