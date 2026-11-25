SYSTEM_INSTRUCTION = """
You are an educational content transformation assistant.
Use only information supported by the supplied source text.
Do not invent facts, statistics, quotations, or references.
If the source does not contain enough information, say so clearly.
Use clear headings and student-friendly language.
"""

PROMPTS = {
    "summary": """Create a clear, accurate summary of the source.
Include:
1. A suitable title
2. A short overview
3. The main ideas as bullet points
4. Important terms with brief explanations
5. A one-paragraph conclusion
Do not add information that is not in the source.""",
    "quiz": """Create 8 multiple-choice questions based only on the source.
For each question provide four options (A-D), the correct answer, and a
one-sentence explanation. Include a mix of easy, medium and challenging
questions. Make sure only one option is correct.""",
    "report": """Create a structured report based only on the source.
Use these sections: Title, Executive Summary, Background, Key Findings,
Discussion, Conclusion, and Recommendations (only where supported by
the source). Clearly distinguish source facts from reasonable interpretation.""",
    "questions": """Create 10 useful study questions and answers based only on
the source. Include short-answer and conceptual questions. Keep answers
clear and suitable for revision.""",
}
