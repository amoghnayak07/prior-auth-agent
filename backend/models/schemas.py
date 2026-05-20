from pydantic import BaseModel


class AuthorizeResponse(BaseModel):
    letter: str
    icd_codes: list[str]
    summary: str


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
