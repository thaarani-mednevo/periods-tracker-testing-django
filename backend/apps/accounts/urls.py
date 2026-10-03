from django.urls import path

from .views import (
    ForgotPasswordView, LoginView, LogoutView, MeView,
    ResetPasswordView, SignupView, VerifyOtpView,
)

urlpatterns = [
    path("v1/auth/signup", SignupView.as_view()),
    path("v1/auth/login", LoginView.as_view()),
    path("v1/auth/logout", LogoutView.as_view()),
    path("v1/auth/me", MeView.as_view()),
    path("v1/auth/forgot-password", ForgotPasswordView.as_view()),
    path("v1/auth/verify-otp", VerifyOtpView.as_view()),
    path("v1/auth/reset-password", ResetPasswordView.as_view()),
]