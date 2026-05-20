import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from groq import GroqError

from models.schemas import AuthorizeResponse, ErrorResponse
from services.llm_service import LLMResponseError, generate_letter
from services.pdf_parser import PDFParseError, extract_text

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

router = APIRouter(prefix="/api", tags=["authorize"])


@router.post(
    "/authorize",
    response_model=AuthorizeResponse,
    responses={
        400: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def authorize(
    pdf_file: UploadFile = File(...),
    patient_name: str = Form(...),
    insurance_provider: str = Form(...),
    diagnosis: str = Form(...),
) -> AuthorizeResponse:
    if pdf_file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Uploaded file must be a PDF.", "detail": pdf_file.content_type},
        )

    file_bytes = await pdf_file.read()

    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "error": "PDF is larger than 10 MB. Please upload a smaller file.",
                "detail": f"{len(file_bytes)} bytes",
            },
        )

    try:
        clinical_text = extract_text(file_bytes)
    except PDFParseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": str(e), "detail": None},
        )

    try:
        data = generate_letter(
            patient_name=patient_name,
            insurance_provider=insurance_provider,
            diagnosis=diagnosis,
            clinical_text=clinical_text,
        )
    except LLMResponseError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "Letter generation failed.", "detail": str(e)},
        )
    except GroqError as e:
        logger.exception("Groq API error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "Upstream LLM service error.", "detail": str(e)},
        )
    except Exception as e:
        logger.exception("Unexpected error in /api/authorize")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Unexpected server error.", "detail": str(e)},
        )

    return AuthorizeResponse(**data)
