from django.db import models
from django.db.models import F, Q


class PeriodCycle(models.Model):
    """
    One OBSERVED period (what the user logged). Nothing derived is stored here:
    cycle length, ovulation, next period and phase boundaries are always
    recomputed from these rows, so editing/deleting a row can never leave
    stale predictions behind.
    """

    class Source(models.TextChoices):
        ONBOARDING = "onboarding", "Onboarding"
        USER = "user", "User"

    profile = models.ForeignKey(
        "onboarding.OnboardingProfile", on_delete=models.CASCADE, related_name="periods"
    )
    start_date = models.DateField()
    # Null = user has not logged when it ended. The engine then falls back to the
    # user's own typical period length and marks the end as "estimated".
    end_date = models.DateField(null=True, blank=True)
    source = models.CharField(max_length=12, choices=Source.choices, default=Source.USER)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cycles_period"
        ordering = ["start_date"]
        constraints = [
            models.UniqueConstraint(fields=["profile", "start_date"], name="uniq_period_start_per_profile"),
            models.CheckConstraint(
                condition=Q(end_date__isnull=True) | Q(end_date__gte=F("start_date")),
                name="period_end_not_before_start",
            ),
        ]

    def __str__(self):
        return f"{self.profile_id}: {self.start_date} -> {self.end_date or '?'}"