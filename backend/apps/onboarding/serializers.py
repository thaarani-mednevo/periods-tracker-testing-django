from django.core.validators import MaxValueValidator, MinValueValidator
from rest_framework import serializers

from apps.logs.services import active_medication_names, sync_profile_medications

from .models import OnboardingProfile

# Mirrors src/constants.ts ranges — keep these two files in sync.
AGE_RANGE = (9, 70)
CYCLE_RANGE = (15, 365)
DURATION_RANGE = (1, 30)
MANUAL_DURATION_MAX = 90
HEIGHT_RANGE = (100, 250)
WEIGHT_RANGE = (25, 300)


class OnboardingProfileSerializer(serializers.ModelSerializer):
    lastPeriod = serializers.DateField(source="last_period")

    cycleLengthOption = serializers.ChoiceField(
        source="cycle_length_option", choices=OnboardingProfile.CycleLengthOption.choices
    )
    cycleLength = serializers.IntegerField(
        source="cycle_length", required=False, allow_null=True,
        validators=[MinValueValidator(CYCLE_RANGE[0]), MaxValueValidator(CYCLE_RANGE[1])],
    )

    periodRegularity = serializers.ChoiceField(
        source="period_regularity", choices=OnboardingProfile.PeriodRegularity.choices
    )

    periodDuration = serializers.IntegerField(
        source="period_duration", required=False, allow_null=True,
        validators=[MinValueValidator(DURATION_RANGE[0]), MaxValueValidator(DURATION_RANGE[1])],
    )
    useManualDuration = serializers.BooleanField(source="use_manual_duration", default=False)
    manualPeriodDuration = serializers.IntegerField(
        source="manual_period_duration", required=False, allow_null=True,
        validators=[MinValueValidator(DURATION_RANGE[0]), MaxValueValidator(MANUAL_DURATION_MAX)],
    )

    height = serializers.FloatField(
        source="height_cm",
        validators=[MinValueValidator(HEIGHT_RANGE[0]), MaxValueValidator(HEIGHT_RANGE[1])],
    )
    weight = serializers.FloatField(
        source="weight_kg",
        validators=[MinValueValidator(WEIGHT_RANGE[0]), MaxValueValidator(WEIGHT_RANGE[1])],
    )
    bmi = serializers.FloatField(read_only=True)

    medicalConditions = serializers.ListField(
        source="medical_conditions", child=serializers.CharField(), allow_empty=False
    )
    otherMedicalCondition = serializers.CharField(source="other_medical_condition", required=False, allow_blank=True)
    takingMedication = serializers.BooleanField(source="taking_medication")
    medications = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    symptoms = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    customSymptom = serializers.CharField(source="custom_symptom", required=False, allow_blank=True)
    moods = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    customMood = serializers.CharField(source="custom_mood", required=False, allow_blank=True)

    periodReminder = serializers.BooleanField(source="period_reminder", default=False)
    periodReminderDays = serializers.ChoiceField(
        source="period_reminder_days", choices=[1, 3, 5], required=False, allow_null=True
    )
    ovulationReminder = serializers.BooleanField(source="ovulation_reminder", default=False)
    ovulationReminderDays = serializers.ChoiceField(
        source="ovulation_reminder_days", choices=[1, 3, 5], required=False, allow_null=True
    )

    birthControl = serializers.ChoiceField(
        source="birth_control", choices=OnboardingProfile.BirthControlAnswer.choices
    )
    birthControlCategory = serializers.ChoiceField(
        source="birth_control_category",
        choices=OnboardingProfile.BirthControlCategory.choices,
        required=False, allow_blank=True,
    )
    birthControlMethod = serializers.CharField(source="birth_control_method", required=False, allow_blank=True)
    birthControlCustomMethod = serializers.CharField(
        source="birth_control_custom_method", required=False, allow_blank=True
    )

    fertilityGoal = serializers.ChoiceField(
        source="fertility_goal", choices=OnboardingProfile.FertilityGoal.choices
    )
    fertilityTracking = serializers.DictField(source="fertility_tracking", required=False, default=dict)

    class Meta:
        model = OnboardingProfile
        fields = [
            "id", "lastPeriod",
            "cycleLengthOption", "cycleLength",
            "periodRegularity",
            "periodDuration", "useManualDuration", "manualPeriodDuration",
            "height", "weight", "bmi",
            "medicalConditions", "otherMedicalCondition", "takingMedication", "medications",
            "symptoms", "customSymptom", "moods", "customMood",
            "periodReminder", "periodReminderDays", "ovulationReminder", "ovulationReminderDays",
            "birthControl", "birthControlCategory", "birthControlMethod", "birthControlCustomMethod",
            "fertilityGoal", "fertilityTracking",
        ]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        names = active_medication_names(instance)
        data["medications"] = names
        if names:
            data["takingMedication"] = True  # Daily Log-la add panna meds, stale "No" wipe pannaadhu
        return data

    def validate(self, attrs):
        if attrs.get("use_manual_duration"):
            if attrs.get("manual_period_duration") is None:
                raise serializers.ValidationError({"manualPeriodDuration": "Please enter the number of days."})
        elif attrs.get("period_duration") is None:
            raise serializers.ValidationError({"periodDuration": "Please set how many days your period usually lasts."})

        conditions = attrs.get("medical_conditions", [])
        if "Other" in conditions and not attrs.get("other_medical_condition", "").strip():
            raise serializers.ValidationError({"otherMedicalCondition": "Please specify your condition."})
        if attrs.get("taking_medication") and not any(m.strip() for m in attrs.get("medications", [])):
            raise serializers.ValidationError({"medications": "Please add at least one medication."})

        if "Other" in attrs.get("symptoms", []) and not attrs.get("custom_symptom", "").strip():
            raise serializers.ValidationError({"customSymptom": "Tell us which symptom you'd like to track."})
        if "Other" in attrs.get("moods", []) and not attrs.get("custom_mood", "").strip():
            raise serializers.ValidationError({"customMood": "Tell us which feeling you'd like to track."})

        if attrs.get("birth_control") == OnboardingProfile.BirthControlAnswer.YES:
            category = attrs.get("birth_control_category")
            if not category:
                raise serializers.ValidationError({"birthControlCategory": "Please choose the type you're using."})
            method = attrs.get("birth_control_method")
            custom = attrs.get("birth_control_custom_method", "")
            if category != OnboardingProfile.BirthControlCategory.OTHER and not method:
                raise serializers.ValidationError({"birthControlMethod": "Please choose a method."})
            if (category == OnboardingProfile.BirthControlCategory.OTHER or method == "Other") and not custom.strip():
                raise serializers.ValidationError({"birthControlCustomMethod": "Please specify your method."})

        return attrs


class OnboardingSubmissionSerializer(serializers.Serializer):
    profile = OnboardingProfileSerializer()
    submittedAt = serializers.DateTimeField()
    version = serializers.IntegerField(default=1)

    def create(self, validated_data):
        profile_data = validated_data["profile"]
        profile = OnboardingProfile.objects.create(
            patient=self.context["patient"],
            submitted_at=validated_data["submittedAt"],
            payload_version=validated_data.get("version", 1),
            **profile_data,
        )
        sync_profile_medications(profile, profile_data.get("medications", []))
        return profile
    def update(self, instance, validated_data):
        profile_data = validated_data["profile"]
        for field, value in profile_data.items():
            setattr(instance, field, value)
        instance.submitted_at = validated_data["submittedAt"]
        instance.payload_version = validated_data.get("version", 1)
        instance.save()
        sync_profile_medications(instance, profile_data.get("medications", []))
        return instance


class OnboardingDraftSerializer(serializers.Serializer):
    step = serializers.IntegerField()
    data = serializers.DictField()