from decimal import Decimal

from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool

from backend.models.PensionModel import PensionModel
from backend.models.pension_models.MacroeconomicFactors import MacroeconomicFactors
from ..schemas import PensionPreviewRequest, PensionPreviewResponse, TimelinePoint

router = APIRouter(prefix="/user-profile", tags=["user-profile"]) 


@router.post("/pension/preview", response_model=PensionPreviewResponse)
async def pension_preview(payload: PensionPreviewRequest) -> PensionPreviewResponse:

    model = PensionModel(
        current_age=payload.current_age,
        years_of_experience=payload.years_of_experience,
        current_salary=payload.current_salary,
        is_male=payload.is_male,
        alpha=float(payload.alpha),
        beta=float(payload.beta),
        retirement_age=payload.retirement_age,
        macroeconomic_factors=MacroeconomicFactors(),
    )

    breakdown = await run_in_threadpool(model.get_detailed_breakdown)
    timeline = await run_in_threadpool(model.get_timeline_for_visualization)

    def _to_float(x: Decimal) -> float:
        return float(x)

    return PensionPreviewResponse(
        retirement_age=int(breakdown["retirement_age"]),
        years_to_retirement=int(breakdown["years_to_retirement"]),
        monthly_pension=_to_float(breakdown["monthly_pension"]),
        replacement_rate_percent=_to_float(breakdown["replacement_rate_percent"]),
        i_pillar_capital=_to_float(breakdown["i_pillar_capital"]),
        ii_pillar_capital=_to_float(breakdown["ii_pillar_capital"]),
        total_capital=_to_float(breakdown["total_capital"]),
        current_monthly_salary=_to_float(breakdown["current_monthly_salary"]),
        timeline=[
            TimelinePoint(
                year=int(point["year"]),
                i_pillar=_to_float(point["i_pillar"]),
                ii_pillar=_to_float(point["ii_pillar"]),
                total=_to_float(point["total"]),
                annual_salary=_to_float(point["annual_salary"]),
            )
            for point in timeline
        ],
    )
