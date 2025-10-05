

from fastapi import APIRouter

from backend.api.schemas import FunFactResponse
from backend.llm.fun_facts.get_fun_fact import get_fun_fact

router = APIRouter(prefix="/fun-fact", tags=["fun-fact"]) 


@router.get("/", response_model=FunFactResponse)
async def fun_fact() -> FunFactResponse:
    """Return a single fun fact from the LLM."""
    result = await get_fun_fact()
    return FunFactResponse(fact=result.fact)
