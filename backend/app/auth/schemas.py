import uuid

from pydantic import EmailStr, Field, model_validator

from app.common.schemas import APIModel


class SignUpRequest(APIModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    organization_name: str = Field(min_length=2, max_length=120)

    @model_validator(mode="after")
    def validate_password(self) -> "SignUpRequest":
        has_letter = any(character.isalpha() for character in self.password)
        has_number = any(character.isdigit() for character in self.password)
        if not has_letter or not has_number:
            raise ValueError("Password must include a letter and a number")
        return self


class SignInRequest(APIModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(APIModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str


class OrganizationSummary(APIModel):
    id: uuid.UUID
    name: str
    slug: str
    role: str
    plan: str


class SessionResponse(APIModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
    organization: OrganizationSummary


class ForgotPasswordRequest(APIModel):
    email: EmailStr


class ResetPasswordRequest(APIModel):
    token: str = Field(min_length=32)
    password: str = Field(min_length=10, max_length=128)

    @model_validator(mode="after")
    def validate_password(self) -> "ResetPasswordRequest":
        has_letter = any(character.isalpha() for character in self.password)
        has_number = any(character.isdigit() for character in self.password)
        if not has_letter or not has_number:
            raise ValueError("Password must include a letter and a number")
        return self
