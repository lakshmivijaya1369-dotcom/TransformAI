from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from backend.file_handler import extract_text
from backend.ai_engine import generate_content

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

app = FastAPI(
    title="GenAI Content Transformation API",
    description="Transform documents into summaries, quizzes, reports and study questions.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to your frontend domain before public deployment.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransformRequest(BaseModel):
    text: str = Field(min_length=30, max_length=50000)
    output_type: str
    detail_level: str = "medium"

@app.get("/api/health")
def health():
    from backend.ai_engine import is_ai_configured
    return {"status": "ok", "service": "GenAI Content Transformation", "ai_configured": is_ai_configured()}

@app.post("/api/transform")
async def transform(request: TransformRequest):
    try:
        result = generate_content(
            text=request.text,
            output_type=request.output_type,
            detail_level=request.detail_level,
        )
        return {"success": True, "output_type": request.output_type, "result": result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI request failed: {exc}")

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    allowed = {".pdf", ".txt"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail="Upload a PDF or TXT file.")
    raw = await file.read()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is larger than the 8 MB limit.")
    try:
        text = extract_text(raw, suffix)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read the file: {exc}")
    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text was found in this file.")
    if len(text) > 50000:
        text = text[:50000]
    return {"success": True, "filename": file.filename, "text": text, "characters": len(text)}

# Serve the frontend from the same FastAPI server.
app.mount("/", StaticFiles(directory=ROOT / "frontend", html=True), name="frontend")
