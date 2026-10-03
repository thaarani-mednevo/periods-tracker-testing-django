import uuid

from django.conf import settings
from django.db import models


class OnboardingProfile(models.Model):
    """
    One row per completed onboarding submission.
    Field names/choices mirror src/types.ts::OnboardingData on the frontend
    1:1 so the serializer needs no renaming beyond camelCase <-> snake_case.
    """

    class CycleLengthOption(models.TextChoices):
        KNOWN = "known", "Known"
        UNSURE = "unsure", "Unsure"
        VARIES = "varies", "Varies"

    class PeriodRegularity(models.TextChoices):
        REGULAR = "regular", "Regular"
        IRREGULAR = "irregular", "Irregular"
        UNKNOWN = "unknown", "Unknown"

    class BirthControlAnswer(models.TextChoices):
        YES = "yes", "Yes"
        NO = "no", "No"
        PREFER_NOT_TO_SAY = "prefer-not-to-say", "Prefer not to say"

    class BirthControlCategory(models.TextChoices):
        NATURAL = "natural", "Natural"
        HORMONAL = "hormonal", "Hormonal"
        OTHER = "other", "Other"

    class FertilityGoal(models.TextChoices):
        TRYING_TO_CONCEIVE = "trying-to-conceive", "Trying to conceive"
        PREGNANCY_PREVENTION = "pregnancy-prevention", "Pregnancy prevention"
        UNDERSTAND_CYCLE = "understand-cycle", "Understand cycle"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # No login flow yet — anonymous submissions allowed, so this is nullable.
    # Once auth is wired in later, backfill + make required again.
    patient = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="period_profile",
    )

    # Step 1 — StepLastPeriod.tsx (name/age come from the patient record)
    last_period = models.DateField()

    # Step 2 — StepCycleLength.tsx
    cycle_length_option = models.CharField(max_length=10, choices=CycleLengthOption.choices)
    cycle_length = models.PositiveSmallIntegerField(null=True, blank=True)

    # Step 3 — StepPeriodRegularity.tsx
    period_regularity = models.CharField(max_length=10, choices=PeriodRegularity.choices)

    # Step 4 — StepPeriodDuration.tsx
    period_duration = models.PositiveSmallIntegerField(null=True, blank=True)
    use_manual_duration = models.BooleanField(default=False)
    manual_period_duration = models.PositiveSmallIntegerField(null=True, blank=True)

    # Step 5 — StepHealthDetails.tsx
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    # BMI is derived, never stored (matches the frontend comment in types.ts).

    # Step 6 — StepMedicalInfo.tsx
    medical_conditions = models.JSONField(default=list, blank=True)
    other_medical_condition = models.CharField(max_length=255, blank=True, default="")
    taking_medication = models.BooleanField(null=True, blank=True)
    medications = models.JSONField(default=list, blank=True)

    # Step 7 — StepSymptoms.tsx
    symptoms = models.JSONField(default=list, blank=True)
    custom_symptom = models.CharField(max_length=255, blank=True, default="")
    moods = models.JSONField(default=list, blank=True)
    custom_mood = models.CharField(max_length=255, blank=True, default="")

    # Step 8 — StepNotifications.tsx
    period_reminder = models.BooleanField(default=False)
    period_reminder_days = models.PositiveSmallIntegerField(null=True, blank=True)
    ovulation_reminder = models.BooleanField(default=False)
    ovulation_reminder_days = models.PositiveSmallIntegerField(null=True, blank=True)

    # Step 9 — StepBirthControl.tsx
    birth_control = models.CharField(max_length=20, choices=BirthControlAnswer.choices, blank=True, default="")
    birth_control_category = models.CharField(
        max_length=10, choices=BirthControlCategory.choices, blank=True, default=""
    )
    birth_control_method = models.CharField(max_length=100, blank=True, default="")
    birth_control_custom_method = models.CharField(max_length=100, blank=True, default="")

    # Step 10 — StepFertilityGoals.tsx
    fertility_goal = models.CharField(max_length=25, choices=FertilityGoal.choices, blank=True, default="")
    fertility_tracking = models.JSONField(default=dict, blank=True)

    # Bookkeeping — sent alongside "profile" in the POST envelope
    submitted_at = models.DateTimeField()
    payload_version = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "onboarding_profile"

    def __str__(self):
        return f"Tracker profile of patient {self.patient_id}"

    @property
    def bmi(self):
        if not self.height_cm or not self.weight_kg:
            return None
        height_m = self.height_cm / 100
        return round(self.weight_kg / (height_m**2), 1)


class OnboardingDraft(models.Model):
    """Per-step onboarding progress of a patient, kept until final submit."""

    patient = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="period_onboarding_draft"
    )
    step = models.PositiveSmallIntegerField(default=1)
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "onboarding_draft"

    def __str__(self):
        return f"draft of patient {self.patient_id} (step {self.step})"