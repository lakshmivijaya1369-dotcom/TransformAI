
import os
import re
import json

from backend.prompts import SYSTEM_INSTRUCTION, PROMPTS

ALLOWED_OUTPUTS = set(PROMPTS)


def is_ai_configured() -> bool:
    demo = os.getenv("DEMO_MODE", "false").lower() == "true"
    return demo or bool(os.getenv("OPENAI_API_KEY"))


def clean_source_text(text: str) -> str:
    """Remove common personal-detail lines before processing."""

    patterns = [
        r"\bname\s*[:\-]",
        r"\bprn\s*[:\-]",
        r"\broll\s*(number|no\.?)\s*[:\-]",
        r"\bstudent\s*id\s*[:\-]",
        r"\bregistration\s*(number|no\.?)\s*[:\-]",
        r"\bemail\s*[:\-]",
        r"\bphone\s*(number|no\.?)?\s*[:\-]",
        r"\bcontact\s*(number|no\.?)?\s*[:\-]",
        r"\bsubmitted\s+(by|to)\b",
    ]

    safe_lines = []

    for line in text.splitlines():
        if any(re.search(p, line, re.IGNORECASE) for p in patterns):
            continue
        safe_lines.append(line)

    return "\n".join(safe_lines).strip()


def get_sentences(text: str) -> list:
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [
        re.sub(r"\s+", " ", item).strip(" •-*")
        for item in parts
        if len(item.strip(" •-*")) >= 25
    ]


def make_demo_data(text: str, output_type: str) -> dict:
    sentences = get_sentences(text)

    if not sentences:
        sentences = [text[:500] or "No source content was found."]

    if output_type == "summary":
        return {
            "type": "summary",
            "title": "Your Study Summary",
            "overview": "A simplified overview based on your supplied source.",
            "key_points": sentences[:6],
            "terms": [
                {
                    "term": f"Key idea {i + 1}",
                    "meaning": sentence
                }
                for i, sentence in enumerate(sentences[:4])
            ],
            "conclusion": "Review these key points alongside the original source."
        }

    if output_type == "quiz":
        questions = []

        for i, sentence in enumerate(sentences[:5]):
            distractors = [
                sentences[(i + j) % len(sentences)]
                for j in range(1, 4)
                if sentences[(i + j) % len(sentences)] != sentence
            ]

            while len(distractors) < 3:
                distractors.append("This statement is not supported by the source.")

            options = [sentence] + distractors[:3]
            correct_index = i % 4
            options[0], options[correct_index] = (
                options[correct_index],
                options[0]
            )

            questions.append({
                "question": "Which statement is supported by the source?",
                "options": options,
                "answer": correct_index,
                "explanation": "This statement is taken from the supplied source."
            })

        return {
            "type": "quiz",
            "title": "Knowledge Check",
            "questions": questions
        }

    if output_type == "report":
        return {
            "type": "report",
            "title": "Content Analysis Report",
            "sections": [
                {"heading": "Executive Summary", "content": " ".join(sentences[:2])},
                {"heading": "Background", "content": sentences[0]},
                {"heading": "Key Findings", "content": "\n".join(
                    f"• {s}" for s in sentences[:5]
                )},
                {"heading": "Discussion", "content": "The findings above are drawn from the supplied source."},
                {"heading": "Conclusion", "content": "Refer to the original source for full context."}
            ]
        }

    if output_type == "questions":
        return {
            "type": "questions",
            "title": "Study Practice",
            "questions": [
                {
                    "question": f"What does the source state about this point?",
                    "answer": sentence
                }
                for sentence in sentences[:10]
            ]
        }

    raise ValueError("Unsupported output type.")


def get_ai_result(text: str, output_type: str, detail_level: str) -> dict:
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    formats = {
        "summary": """
Return JSON with:
{"type":"summary","title":"...","overview":"...",
"key_points":["..."],"terms":[{"term":"...","meaning":"..."}],
"conclusion":"..."}
""",
        "quiz": """
Return JSON with:
{"type":"quiz","title":"...","questions":[
{"question":"...","options":["...","...","...","..."],
"answer":0,"explanation":"..."}]}
Use answer as a zero-based option index (0 to 3).
Create 8 questions. Each question must have exactly four options.
""",
        "report": """
Return JSON with:
{"type":"report","title":"...","sections":[
{"heading":"Executive Summary","content":"..."},
{"heading":"Background","content":"..."},
{"heading":"Key Findings","content":"..."},
{"heading":"Discussion","content":"..."},
{"heading":"Conclusion","content":"..."}]}
""",
        "questions": """
Return JSON with:
{"type":"questions","title":"Study Practice","questions":[
{"question":"...","answer":"..."}]}
Create 10 question-and-answer pairs.
"""
    }

    prompt = f"""
Task: {PROMPTS[output_type]}

Detail level: {detail_level}

Output format:
{formats[output_type]}

Use only facts from the source. Do not invent information.
Do not include personal names, PRNs, student IDs, roll numbers,
email addresses, phone numbers, or submission details.

SOURCE:
{text}
"""

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        instructions=SYSTEM_INSTRUCTION + "\nReturn valid JSON only.",
        input=prompt,
        temperature=0.3,
        max_output_tokens=4096
    )

    raw = response.output_text.strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)

    data = json.loads(raw)

    if data.get("type") != output_type:
        raise ValueError("The AI returned an unexpected output format.")

    return data


def generate_content(
    text: str,
    output_type: str,
    detail_level: str = "medium"
) -> str:

    if output_type not in ALLOWED_OUTPUTS:
        raise ValueError("Unsupported transformation type.")

    if len(text.strip()) < 30:
        raise ValueError("Please provide at least 30 characters of source text.")

    safe_text = clean_source_text(text)

    if len(safe_text) < 30:
        raise ValueError(
            "Not enough source text remains after removing personal-detail lines."
        )

    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"

    if demo_mode:
        data = make_demo_data(safe_text, output_type)
    else:
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise RuntimeError(
                "OpenAI API key is not configured. Add it to your .env file."
            )

        try:
            data = get_ai_result(safe_text, output_type, detail_level)
        except ImportError as exc:
            raise RuntimeError(
                "OpenAI package is missing. Run: pip install -r requirements.txt"
            ) from exc
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "The AI response was not valid JSON. Please try again."
            ) from exc

    return json.dumps(data, ensure_ascii=False)
