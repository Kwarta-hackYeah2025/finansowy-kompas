from fastapi import APIRouter

from backend.api.schemas import FunFactsResponse
from backend.llm.fun_facts.get_fun_fact import get_fun_facts

router = APIRouter(prefix="/fun-facts", tags=["fun-facts"])


@router.get("/", response_model=FunFactsResponse)
async def fun_facts() -> FunFactsResponse:
    """Return a single fun fact from the LLM."""
    result = await get_fun_facts()
    return FunFactsResponse(facts=result)
