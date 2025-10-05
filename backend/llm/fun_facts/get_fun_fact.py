import logging

from backend.llm.client import client
from backend.llm.fun_facts.FunFact import FunFact

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """
Produce exactly one fun fact about ZUS, pensions, or retirement in Poland.

Requirements:
- Polish, max 100 words.
- Accurate and non-speculative.
- Include a reputable source name and year in parentheses at the end.
- Use only verified sources (e.g., government reports, academic studies, reputable news outlets).
- Output only this JSON object:

{"fact":"<your fact here>"}
""".strip()


async def get_fun_fact() -> FunFact:
    """
    Ask the LLM for a single fun fact and return a validated FunFact.
    """
    response = await client.chat.completions.create(
        response_model=FunFact,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": "Return one fun fact now."},
        ],
    )
    logger.info(f"LLM returned fun fact: {response.fact}")
    return response


__all__ = ["get_fun_fact"]
