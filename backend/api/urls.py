from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PingView, CategoryViewSet, ListingItemViewSet, OrderViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'listing-items', ListingItemViewSet, basename='listing-item')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('ping/', PingView.as_view({'get': 'list'}), name='ping'),
]
