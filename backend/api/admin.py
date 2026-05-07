from django.contrib import admin
from .models import Category, Order


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_number', 'table', 'status', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('created_at',)
