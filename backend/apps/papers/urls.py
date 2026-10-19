from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PaperViewSet, SharedPaperView, DashboardStatsView

router = DefaultRouter()
router.register('papers', PaperViewSet, basename='paper')

urlpatterns = [
    path('papers/share/<uuid:token>/', SharedPaperView.as_view()),
    path('dashboard/stats/', DashboardStatsView.as_view()),
] + router.urls
