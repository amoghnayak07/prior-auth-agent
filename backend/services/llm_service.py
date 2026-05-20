import json
import os

from groq import Groq

MODEL = "llama-3.3-70b-versatile"
MAX_TOKENS = 4096

SYSTEM_PROMPT = (
    "You are a medical prior authorization specialist. "
    "Generate professional, accurate prior authorization letters based on clinical notes. "
    "Always respond with a single valid JSON object and nothing else."
)


class LLMResponseError(Exception):
    pass


def _build_user_prompt(
    patient_name: str,
    insurance_provider: str,
    diagnosis: str,
    clinical_text: str,
) -> str:
    return (
        f"Patient name: {patient_name}\n"
        f"Insurance provider: {insurance_provider}\n"
        f"Primary diagnosis: {diagnosis}\n\n"
        f"Clinical notes (extracted from the uploaded PDF):\n"
        f"---\n{clinical_text}\n---\n\n"
        "Write a formal prior authorization letter addressed to the insurance provider "
        "requesting approval of the proposed treatment, citing the clinical evidence above.\n\n"
        "Return a JSON object with exactly these fields:\n"
        '  - "letter": string. The full formal prior authorization letter.\n'
        '  - "icd_codes": array of strings. ICD-10 codes relevant to the diagnosis and findings.\n'
        '  - "summary": string. A two-sentence clinical summary.\n'
    )


def generate_letter(
    patient_name: str,
    insurance_provider: str,
    diagnosis: str,
    clinical_text: str,
) -> dict:
    if not os.environ.get("GROQ_API_KEY"):
        raise LLMResponseError("GROQ_API_KEY is not configured on the server.")

    client = Groq()
    completion = client.chat.completions.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": _build_user_prompt(
                    patient_name, insurance_provider, diagnosis, clinical_text
                ),
            },
        ],
    )

    if not completion.choices or not completion.choices[0].message.content:
        raise LLMResponseError("LLM returned an empty response.")

    raw = completion.choices[0].message.content.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise LLMResponseError(f"LLM did not return valid JSON: {e}") from e

    missing = [k for k in ("letter", "icd_codes", "summary") if k not in data]
    if missing:
        raise LLMResponseError(f"LLM response missing fields: {', '.join(missing)}")

    if not isinstance(data["icd_codes"], list) or not all(
        isinstance(c, str) for c in data["icd_codes"]
    ):
        raise LLMResponseError("'icd_codes' must be an array of strings.")
    if not isinstance(data["letter"], str) or not isinstance(data["summary"], str):
        raise LLMResponseError("'letter' and 'summary' must be strings.")

    return data
