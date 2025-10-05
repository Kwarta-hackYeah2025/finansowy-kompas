# python
import logging
from typing import List

from backend.llm.client import client
from backend.llm.fun_facts.FunFact import FunFact

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT_20 = """
Produce exactly 20 fun facts about ZUS, pensions, or retirement in Poland.

Requirements for each fact:
- Polish, max 80 words, concise and factual.
- Numeric/statistical fact or specific regulation (no forecasts or speculation).
- Append a reputable source name and year in parentheses at the end, e.g., (GUS, 2023) or (ZUS, 2024).
- Allowed sources: government reports, legislation, GUS, NBP, ZUS, OECD, Eurostat, reputable media.
- No financial advice, no personal data, neutral tone.

Output:
- Return ONLY a JSON array of 20 objects, each with this exact shape:
[{"fact":"<tutaj wstaw fakt>"} , ... 20 items total ...]
""".strip()


async def get_fun_facts() -> List[FunFact]:
    """
    Ask the LLM for 20 fun facts and return a validated list of FunFact.
    """
    response = await client.chat.completions.create(
        response_model=List[FunFact],
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT_20},
            {"role": "user", "content": "Podaj dokładnie 20 rzetelnych ciekawostek teraz."},
        ],
    )
    logger.info("LLM returned %d fun facts", len(response))
    return response


__all__ = ["get_fun_facts"]
