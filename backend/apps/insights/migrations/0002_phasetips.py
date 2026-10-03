import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('insights', '0001_initial'),
        ('onboarding', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PhaseTips',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('phase', models.CharField(max_length=12)),
                ('tips', models.JSONField(default=list)),
                ('based_on', models.JSONField(default=dict)),
                ('input_hash', models.CharField(max_length=64)),
                ('model', models.CharField(max_length=80)),
                ('generated_at', models.DateTimeField(auto_now=True)),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='phase_tips', to='onboarding.onboardingprofile')),
            ],
            options={
                'db_table': 'insights_phase_tips',
                'constraints': [models.UniqueConstraint(fields=('profile', 'date'), name='uniq_tips_per_day')],
            },
        ),
    ]