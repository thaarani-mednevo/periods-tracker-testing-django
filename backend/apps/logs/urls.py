from django.urls import path

from .views import (
    DailyLogView, LogRangeView, MedicationDetailView, MedicationHistoryView,
    MedicationIntakeView, MedicationListView,
)

urlpatterns = [
    path("v1/logs", LogRangeView.as_view(), name="logs-range"),
    path("v1/logs/<str:day>", DailyLogView.as_view(), name="logs-day"),
    path("v1/medications", MedicationListView.as_view(), name="medications"),
    path("v1/medications/history", MedicationHistoryView.as_view(), name="medications-history"),
    path("v1/medications/<int:med_id>", MedicationDetailView.as_view(), name="medications-detail"),
    path("v1/medications/<int:med_id>/intake/<str:day>", MedicationIntakeView.as_view(), name="medications-intake"),
]
