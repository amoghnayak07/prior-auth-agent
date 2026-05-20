from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError


class PDFParseError(Exception):
    pass


_ALLOWED_CONTROL = {"\t", "\n", "\r"}


def _sanitize(text: str) -> str:
    return "".join(
        ch
        for ch in text
        if ch in _ALLOWED_CONTROL or ord(ch) >= 0x20
    )


def extract_text(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_bytes))
    except PdfReadError as e:
        raise PDFParseError(f"Could not read PDF: {e}") from e

    if reader.is_encrypted:
        raise PDFParseError("PDF is password-protected. Please upload an unencrypted file.")

    pages_text: list[str] = []
    for page in reader.pages:
        try:
            pages_text.append(page.extract_text() or "")
        except Exception as e:
            raise PDFParseError(f"Failed to extract text from a page: {e}") from e

    text = _sanitize("\n\n".join(pages_text)).strip()
    if not text:
        raise PDFParseError("No text could be extracted from the PDF (it may be a scanned image).")
    return text
