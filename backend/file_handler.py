from io import BytesIO
from pypdf import PdfReader

def extract_text(data: bytes, suffix: str) -> str:
    """Extract text from a PDF or UTF-8 text file."""
    if suffix == ".txt":
        return data.decode("utf-8-sig", errors="replace")
    if suffix == ".pdf":
        reader = PdfReader(BytesIO(data))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    raise ValueError("Unsupported file type. Use PDF or TXT.")
