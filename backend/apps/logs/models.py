from django.db import models


class DailyLog(models.Model):
    """
    One day of self-reported data for one profile. Every value is nullable: an untouched field is
    "not recorded", never a default. A row whose fields are all empty is deleted by the service.
    """

    profile = models.ForeignKey("onboarding.OnboardingProfile", on_delete=models.CASCADE, related_name="daily_logs")
    date = models.DateField()

    # period
    flow = models.CharField(max_length=12, null=True, blank=True)
    blood_color = models.CharField(max_length=12, null=True, blank=True)
    clots_present = models.BooleanField(null=True, blank=True)
    clot_size = models.CharField(max_length=10, null=True, blank=True)
    cramps = models.CharField(max_length=10, null=True, blank=True)
    pain_score = models.PositiveSmallIntegerField(null=True, blank=True)
    symptoms = models.JSONField(default=list, blank=True)
    products = models.JSONField(default=list, blank=True)

    # mood / energy / fertility signs
    mood = models.CharField(max_length=12, null=True, blank=True)
    energy = models.CharField(max_length=10, null=True, blank=True)
    libido = models.CharField(max_length=10, null=True, blank=True)
    cervical_mucus = models.CharField(max_length=12, null=True, blank=True)
    bbt_celsius = models.FloatField(null=True, blank=True)
    bbt_time = models.CharField(max_length=5, null=True, blank=True)
    lh_test = models.CharField(max_length=10, null=True, blank=True)
    intercourse = models.BooleanField(null=True, blank=True)

    # wellness
    sleep = models.CharField(max_length=10, null=True, blank=True)
    fatigue = models.CharField(max_length=10, null=True, blank=True)
    cravings = models.CharField(max_length=10, null=True, blank=True)
    water_ml = models.PositiveIntegerField(null=True, blank=True)
    steps = models.PositiveIntegerField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)

    notes = models.TextField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "logs_daily_log"
        constraints = [models.UniqueConstraint(fields=["profile", "date"], name="uniq_log_per_day")]

    def __str__(self):
        return f"{self.profile_id}: {self.date}"


class Medication(models.Model):
    profile = models.ForeignKey(
    "onboarding.OnboardingProfile",
    on_delete=models.CASCADE,
    related_name="medication_records"
)
    name = models.CharField(max_length=100)
    dose = models.CharField(max_length=50, blank=True, default="")
    form = models.CharField(max_length=30, blank=True, default="")
    frequency = models.CharField(max_length=50, blank=True, default="")
    time = models.CharField(max_length=5, blank=True, default="")  # "HH:MM", empty = not scheduled
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    reminder = models.BooleanField(default=False)
    # Removed medications stay (inactive) so past intake history keeps its name.
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "logs_medication"
        ordering = ["time", "name"]

    def __str__(self):
        return f"{self.name} ({self.profile_id})"


class MedicationIntake(models.Model):
    class Status(models.TextChoices):
        TAKEN = "taken", "Taken"
        SKIPPED = "skipped", "Skipped"

    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name="intakes")
    date = models.DateField()
    status = models.CharField(max_length=8, choices=Status.choices)

    class Meta:
        db_table = "logs_medication_intake"
        constraints = [models.UniqueConstraint(fields=["medication", "date"], name="uniq_intake_per_day")]
