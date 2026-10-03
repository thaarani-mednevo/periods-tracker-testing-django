from django.urls import path

from .views import CurrentCycleView, CycleHistoryView, PeriodDetailView, PeriodListCreateView, PredictionsView

urlpatterns = [
    path("v1/cycle/current", CurrentCycleView.as_view(), name="cycle-current"),
    path("v1/cycle/predictions", PredictionsView.as_view(), name="cycle-predictions"),
    path("v1/cycles/history", CycleHistoryView.as_view(), name="cycles-history"),
    path("v1/cycles/periods", PeriodListCreateView.as_view(), name="cycles-periods"),
    path("v1/cycles/periods/<int:period_id>", PeriodDetailView.as_view(), name="cycles-period-detail"),
]