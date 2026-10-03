import logging

from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from apps.cycles.exceptions import CycleAPIError
from apps.cycles.views import ProfileScopedView
from . import services, tips
from . import services
from .ask import MAX_QUESTION_CHARS, ask_ava

log = logging.getLogger(__name__)


class PhaseInsightView(ProfileScopedView):
    """GET /api/v1/insights/phase?date=YYYY-MM-DD  ->  today's phase explanation (generated once per phase)."""

    def get(self, request):
        return Response(services.phase_insight_for(self.get_profile(request), self.today(request)))


class AskThrottle(UserRateThrottle):
    rate = "20/hour"


class AskAvaView(ProfileScopedView):
    """POST /api/v1/insights/ask  {"question": "..."}  ->  {"answer": "..."}"""

    throttle_classes = [AskThrottle]

    def post(self, request):
        profile = self.get_profile(request)
        question = request.data.get("question") if isinstance(request.data, dict) else None
        if not isinstance(question, str) or not question.strip():
            raise CycleAPIError("Type a question first.", "INVALID_QUESTION")
        question = question.strip()
        if len(question) > MAX_QUESTION_CHARS:
            raise CycleAPIError(f"Please keep it under {MAX_QUESTION_CHARS} characters.", "INVALID_QUESTION")
        try:
            answer = ask_ava(profile, self.today(request), question)
        except Exception:  # network, auth, empty answer: never show invented text
            log.exception("Ask Ava failed for profile %s", profile.pk)
            raise CycleAPIError("Ava isn't available right now. Please try again later.", "AI_UNAVAILABLE", 503)
        return Response({"answer": answer})
class PhaseTipsView(ProfileScopedView):
    """GET /api/v1/insights/tips?date=YYYY-MM-DD  ->  4 personalised tips from health profile + recent logs."""

    def get(self, request):
        return Response(tips.phase_tips_for(self.get_profile(request), self.today(request)))