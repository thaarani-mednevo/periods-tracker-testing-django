import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.onboarding.models import OnboardingProfile

from .models import PasswordResetOTP

User = get_user_model()
log = logging.getLogger(__name__)

OTP_TTL = timedelta(minutes=10)
RESET_TTL = timedelta(minutes=10)
RESEND_COOLDOWN = timedelta(seconds=60)
MAX_ATTEMPTS = 5


def err(message, code, http=400, fields=None):
    # Frontend ApiError shape: { message, error: { code, fieldErrors } }
    body = {"message": message, "error": {"code": code}}
    if fields:
        body["error"]["fieldErrors"] = fields
    return Response(body, status=http)


def norm_email(raw):
    return str(raw or "").strip().lower()


def sha256(value):
    return hashlib.sha256(value.encode()).hexdigest()


def auth_payload(user, token=None):
    data = {
        "user": {"name": user.first_name, "email": user.email},
        "onboardingCompleted": OnboardingProfile.objects.filter(patient=user).exists(),
    }
    if token is not None:
        data["token"] = token.key
    return data


class PublicView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


class SignupView(PublicView):
    def post(self, request):
        name = str(request.data.get("name") or "").strip()[:150]
        email = norm_email(request.data.get("email"))
        password = str(request.data.get("password") or "")
        fields = {}

        if not name:
            fields["name"] = ["Name is required."]
        try:
            validate_email(email)
            if len(email) > 150:
                raise DjangoValidationError("too long")
        except DjangoValidationError:
            fields["email"] = ["Enter a valid email address."]
        else:
            if User.objects.filter(username=email).exists():
                fields["email"] = ["An account with this email already exists."]
        try:
            validate_password(password)
        except DjangoValidationError as e:
            fields["password"] = list(e.messages)

        if fields:
            return err("Please fix the highlighted fields.", "VALIDATION", 400, fields)

        user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
        token = Token.objects.create(user=user)
        return Response(auth_payload(user, token), status=201)


class LoginView(PublicView):
    def post(self, request):
        email = norm_email(request.data.get("email"))
        password = str(request.data.get("password") or "")
        user = authenticate(request, username=email, password=password)
        if user is None:
            return err("Incorrect email or password.", "INVALID_CREDENTIALS")
        token, _ = Token.objects.get_or_create(user=user)
        return Response(auth_payload(user, token))


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(auth_payload(request.user))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        return Response(status=204)


class ForgotPasswordView(PublicView):
    def post(self, request):
        email = norm_email(request.data.get("email"))
        user = User.objects.filter(username=email, is_active=True).first()
        now = timezone.now()

        if user and not PasswordResetOTP.objects.filter(user=user, created_at__gt=now - RESEND_COOLDOWN).exists():
            PasswordResetOTP.objects.filter(user=user, used=False).update(used=True)
            otp = f"{secrets.randbelow(10**6):06d}"
            PasswordResetOTP.objects.create(user=user, otp_hash=make_password(otp), expires_at=now + OTP_TTL)
            try:
                send_mail(
                    "Your password reset OTP",
                    f"Your OTP is {otp}. It is valid for 10 minutes.",
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                )
            except Exception:
                log.exception("OTP mail failed")

        return Response({"message": "If an account exists for this email, an OTP has been sent."})


class VerifyOtpView(PublicView):
    def post(self, request):
        email = norm_email(request.data.get("email"))
        otp = str(request.data.get("otp") or "").strip()
        bad = err("Invalid or expired OTP.", "INVALID_OTP")

        user = User.objects.filter(username=email, is_active=True).first()
        record = (
            PasswordResetOTP.objects.filter(user=user, used=False, verified_at__isnull=True)
            .order_by("-created_at").first()
            if user else None
        )
        if record is None or record.expires_at < timezone.now() or record.attempts >= MAX_ATTEMPTS:
            return bad
        if not check_password(otp, record.otp_hash):
            record.attempts += 1
            record.save(update_fields=["attempts"])
            return bad

        reset_token = secrets.token_urlsafe(32)
        record.reset_token_hash = sha256(reset_token)
        record.verified_at = timezone.now()
        record.save(update_fields=["reset_token_hash", "verified_at"])
        return Response({"resetToken": reset_token})


class ResetPasswordView(PublicView):
    def post(self, request):
        reset_token = str(request.data.get("resetToken") or "")
        password = str(request.data.get("password") or "")

        record = PasswordResetOTP.objects.filter(
            reset_token_hash=sha256(reset_token), used=False,
            verified_at__gte=timezone.now() - RESET_TTL,
        ).select_related("user").first()
        if record is None:
            return err("Reset session expired. Please start again.", "INVALID_RESET_TOKEN")
        try:
            validate_password(password, record.user)
        except DjangoValidationError as e:
            return err("Please fix the highlighted fields.", "VALIDATION", 400, {"password": list(e.messages)})

        record.user.set_password(password)
        record.user.save()
        record.used = True
        record.save(update_fields=["used"])
        Token.objects.filter(user=record.user).delete()
        return Response({"message": "Password updated. Please log in."})