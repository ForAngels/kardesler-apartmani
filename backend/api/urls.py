from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_stats, name='dashboard_stats'),
    path('my-dashboard/', views.my_dashboard, name='my_dashboard'),
    path('submit-feedback/', views.submit_feedback, name='submit_feedback'),
    # Admin özel
    path('admin/feedbacks/', views.list_all_feedbacks, name='admin_feedbacks'),
    path('admin/feedbacks/<int:pk>/update/', views.update_feedback, name='update_feedback'),
    path('admin/apartments/', views.list_apartments_detailed, name='admin_apartments'),
    path('admin/apartments/<int:pk>/history/', views.apartment_payment_history, name='apartment_history'),
    path('admin/extra-payments/', views.list_extra_payments, name='list_extra_payments'),
    path('admin/extra-payments/<int:pk>/mark-paid/', views.mark_payment_paid, name='mark_extra_paid'),
    # Raporlar
    path('admin/reports/monthly-aidat/', views.monthly_aidat_report, name='report_monthly_aidat'),
    path('admin/reports/expenses/', views.expense_list_for_filter, name='report_expense_list'),
    path('admin/reports/extra-payments/', views.extra_payments_by_expense_report, name='report_extra_payments'),
    path('admin/dues/management/', views.list_monthly_dues_management, name='dues_management'),
    # Apartment CRUD
    path('admin/users/search/', views.search_users, name='search_users'),
    path('admin/apartments/create/', views.create_apartment, name='create_apartment'),
    path('admin/apartments/<int:pk>/update/', views.update_apartment, name='update_apartment'),
    path('admin/apartments/<int:pk>/delete/', views.delete_apartment, name='delete_apartment'),
    # Expense CRUD
    path('admin/expenses/', views.manage_expenses, name='manage_expenses'),
    path('admin/expenses/<int:pk>/delete/', views.delete_expense, name='delete_expense'),
    # Maintenance CRUD
    path('admin/maintenance/', views.manage_maintenance, name='manage_maintenance'),
    path('admin/maintenance/<int:pk>/update/', views.update_maintenance, name='update_maintenance'),
    path('admin/maintenance/<int:pk>/delete/', views.delete_maintenance, name='delete_maintenance'),
    # Building Settings
    path('admin/settings/', views.manage_building_settings, name='manage_building_settings'),
    # Notifications
    path('admin/notifications/', views.manage_notifications, name='manage_notifications'),
]
