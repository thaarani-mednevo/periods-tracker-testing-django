from rest_framework import serializers

from .models import PeriodCycle


class PeriodWriteSerializer(serializers.Serializer):
    startDate = serializers.DateField(source="start_date")
    endDate = serializers.DateField(source="end_date", required=False, allow_null=True)


class PeriodSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source="start_date", read_only=True)
    endDate = serializers.DateField(source="end_date", read_only=True)
    periodLength = serializers.SerializerMethodField()

    class Meta:
        model = PeriodCycle
        fields = ["id", "startDate", "endDate", "periodLength", "source"]

    def get_periodLength(self, obj):
        return None if obj.end_date is None else (obj.end_date - obj.start_date).days + 1