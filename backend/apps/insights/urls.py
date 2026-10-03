from django.urls import path

from .views import PhaseInsightView
from .views import AskAvaView, PhaseTipsView

urlpatterns = [
    path("v1/insights/phase", PhaseInsightView.as_view(), name="insights-phase"),
    path("v1/insights/tips", PhaseTipsView.as_view(), name="insights-tips"),
    path("v1/insights/ask", AskAvaView.as_view(), name="insights-ask"),
]