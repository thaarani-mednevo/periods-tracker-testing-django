from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.onboarding.urls')),
    path('api/', include('apps.cycles.urls')),
    path('api/', include('apps.insights.urls')),
    path('api/', include('apps.logs.urls')),
    
]