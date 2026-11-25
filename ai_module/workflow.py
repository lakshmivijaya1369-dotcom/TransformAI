"""Simple orchestration layer for the content transformation workflow."""
from backend.ai_engine import generate_content

def run_workflow(source_text: str, requested_outputs: list[str]) -> dict[str, str]:
    """Run one or more transformations and return output keyed by type."""
    if not requested_outputs:
        raise ValueError("Select at least one output type.")
    results = {}
    for output_type in requested_outputs:
        results[output_type] = generate_content(source_text, output_type)
    return results
