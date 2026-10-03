from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.onboarding.models import OnboardingProfile

User = get_user_model()


def err(message, code, http=400, fields=None):
    # Frontend ApiError shape: { message, error: { code, fieldErrors } }
    body = {"message": message, "error": {"code": code}}
    if fields:
        body["error"]["fieldErrors"] = fields
    return Response(body, status=http)


def norm_email(raw):
    return str(raw or "").strip().lower()


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