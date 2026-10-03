from rest_framework import status
from rest_framework.exceptions import APIException


class CycleAPIError(APIException):
    """Renders as {"message", "error": {"code", "fieldErrors"?}} - same shape as every other error."""

    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str, code: str, status_code: int | None = None, field_errors: dict | None = None):
        if status_code is not None:
            self.status_code = status_code
        error = {"code": code}
        if field_errors:
            error["fieldErrors"] = field_errors
        self.detail = {"message": message, "error": error}