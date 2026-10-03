from rest_framework import serializers

from . import schema

TIME_RE = r"^([01]\d|2[0-3]):[0-5]\d$"


def _choice(values, **kw):
    return serializers.ChoiceField(choices=values, required=False, allow_null=True, **kw)


class ProductSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=list(schema.PRODUCT_SIZES))
    label = serializers.CharField(required=False, allow_blank=True, max_length=60, default="")
    size = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=20)
    quantity = serializers.IntegerField(min_value=1, max_value=20)

    def validate(self, attrs):
        # The parent runs with partial=True, which makes DRF skip "required" checks on nested items too.
        if "type" not in attrs or "quantity" not in attrs:
            raise serializers.ValidationError("Each product needs a type and a quantity.")
        sizes = schema.PRODUCT_SIZES[attrs["type"]]
        size = attrs.get("size") or None
        if sizes:
            if size not in sizes:
                raise serializers.ValidationError({"size": "Choose a valid size."})
        else:
            size = None
        if attrs["type"] == "Other" and not attrs.get("label", "").strip():
            raise serializers.ValidationError({"label": "Describe the product."})
        attrs["size"] = size
        return attrs


class DailyLogWriteSerializer(serializers.Serializer):
    """Used with partial=True: only the keys present in the request are changed; null clears a value."""

    flow = _choice(schema.FLOW)
    bloodColor = _choice(schema.BLOOD_COLOR)
    clotsPresent = serializers.BooleanField(required=False, allow_null=True)
    clotSize = _choice(schema.CLOT_SIZE)
    cramps = _choice(schema.CRAMPS)
    painScore = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=10)
    symptoms = serializers.ListField(
        child=serializers.ChoiceField(choices=schema.SYMPTOMS), required=False, allow_null=True, max_length=len(schema.SYMPTOMS)
    )
    mood = _choice(schema.MOOD)
    energy = _choice(schema.ENERGY)
    libido = _choice(schema.LIBIDO)
    cervicalMucus = _choice(schema.MUCUS)
    bbtCelsius = serializers.FloatField(required=False, allow_null=True, min_value=35.0, max_value=38.5)
    bbtTime = serializers.RegexField(TIME_RE, required=False, allow_null=True)
    lhTest = _choice(schema.LH_TEST)
    intercourse = serializers.BooleanField(required=False, allow_null=True)
    sleep = _choice(schema.SLEEP)
    fatigue = _choice(schema.LEVEL)
    cravings = _choice(schema.LEVEL)
    waterMl = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=10000)
    steps = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=100000)
    weightKg = serializers.FloatField(required=False, allow_null=True, min_value=25, max_value=300)
    products = ProductSerializer(many=True, required=False, allow_null=True, max_length=20)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=1000)


class MedicationWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    dose = serializers.CharField(required=False, allow_blank=True, max_length=50, default="")
    form = serializers.CharField(required=False, allow_blank=True, max_length=30, default="")
    frequency = serializers.CharField(required=False, allow_blank=True, max_length=50, default="")
    time = serializers.RegexField(TIME_RE, required=False, allow_blank=True, default="")
    startDate = serializers.DateField(required=False, allow_null=True, default=None)
    endDate = serializers.DateField(required=False, allow_null=True, default=None)
    reminder = serializers.BooleanField(required=False, default=False)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter the medication name.")
        return value

    def validate(self, attrs):
        start, end = attrs.get("startDate"), attrs.get("endDate")
        if start and end and end < start:
            raise serializers.ValidationError({"endDate": "End date can't be before the start date."})
        return attrs


class IntakeSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["taken", "skipped"], allow_null=True)
