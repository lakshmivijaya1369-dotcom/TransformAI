# TransformAI – GenAI Content Transformation Platform

**Course:** CDS208 – Emerging Tools and Applications  
**Project:** GenAI Platform for Automated Content Transformation

TransformAI is a student project prototype that accepts pasted text or PDF/TXT documents and uses Google Gemini to create summaries, multiple-choice quizzes, structured reports, and study questions with answers.

## Features
- Responsive HTML/CSS/JavaScript frontend
- FastAPI backend with upload and transformation endpoints
- PDF and TXT text extraction
- Gemini-powered generation with prompt templates
- Four transformation modes: Summary, Quiz, Report, Study Q&A
- Download generated output as a text file
- Health endpoint to check backend and API-key configuration

## Requirements
- Python 3.10 or newer
- Internet connection for Gemini API requests
- A Gemini API key for AI generation

## Setup on Windows

1. Extract the ZIP file.
2. Open the extracted `GenAI_Content_Transformation` folder in VS Code.
3. Open the terminal in that folder.
4. Create and activate a virtual environment:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use Command Prompt:

```cmd
.venv\Scripts\activate.bat
```

5. Install dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

6. Create your local `.env` file by copying `.env.example` and adding your own Gemini API key. Never upload `.env` to GitHub.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Then open `.env` and replace the placeholder with your key.

7. Start the app from the project root:

```bash
python -m uvicorn backend.main:app --reload
```

8. Open this address in your browser:

```text
http://127.0.0.1:8000
```

API documentation is available at `http://127.0.0.1:8000/docs`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server and API-key setup |
| POST | `/api/upload` | Extract text from PDF/TXT |
| POST | `/api/transform` | Generate selected output using Gemini |

## Example API request

```json
{
  "text": "Paste at least 30 characters of source material here...",
  "output_type": "summary",
  "detail_level": "medium"
}
```

Allowed `output_type` values: `summary`, `quiz`, `report`, `questions`.

## Project workflow

1. User pastes text or uploads a PDF/TXT file.
2. Frontend sends the file to FastAPI.
3. Backend extracts the source text.
4. User selects a transformation type.
5. Prompt template and source content are sent to Gemini.
6. Gemini returns generated content.
7. Frontend displays the result and offers a TXT download.

## Troubleshooting
- **Module not found:** Activate `.venv` and run `pip install -r requirements.txt`.
- **Gemini API key missing:** Create `.env` from `.env.example` and add a valid key.
- **API error:** Check internet connectivity, key validity, API access, and the terminal error.
- **PDF has no extracted text:** Scanned/image-only PDFs need OCR, which is not included in this version.
- **Port in use:** Start with `python -m uvicorn backend.main:app --reload --port 8001` and open port 8001.

## Important project notes
This is a working prototype, not a production service. It does not include user accounts, database storage, OCR, or deployment hardening. Review generated AI output before using it; AI can make mistakes. Use only documents you are allowed to process.
