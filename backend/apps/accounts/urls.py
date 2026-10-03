from django.urls import path

from .views import LoginView, LogoutView, MeView, SignupView

urlpatterns = [
    path("v1/auth/signup", SignupView.as_view()),
    path("v1/auth/login", LoginView.as_view()),
    path("v1/auth/logout", LogoutView.as_view()),
    path("v1/auth/me", MeView.as_view()),
]