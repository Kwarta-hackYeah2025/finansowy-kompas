from decimal import Decimal
from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool

from backend.models.PensionModel import PensionModel
from backend.models.pension_models.MacroeconomicFactors import MacroeconomicFactors
from ..schemas import PensionPreviewRequest, PensionPreviewResponse, TimelinePoint

router = APIRouter(prefix="/user-profile", tags=["user-profile"])

@router.post("/pension/preview", response_model=PensionPreviewResponse)
async def pension_preview(payload: PensionPreviewRequest) -> PensionPreviewResponse:
    current_salary = Decimal(str(payload.current_monthly_salary))

    model = PensionModel(
        current_age=payload.current_age,
        years_of_experience=payload.years_of_experience,
        current_salary=current_salary,
        is_male=payload.is_male,
        alpha=float(payload.alpha),
        beta=float(payload.beta),
        retirement_age=payload.retirement_age,
        macroeconomic_factors=MacroeconomicFactors(),
    )

    breakdown = await run_in_threadpool(model.get_detailed_breakdown)
    timeline  = await run_in_threadpool(model.get_timeline_for_visualization)

    def _to_2f(x: Decimal) -> float:
        return float(x.quantize(Decimal("0.01")))

    return PensionPreviewResponse(
        retirement_age=int(breakdown["retirement_age"]),
        years_to_retirement=int(breakdown["years_to_retirement"]),

        # --- NOMINAL ---
        monthly_pension_nominal=_to_2f(breakdown["monthly_pension_nominal"]),
        replacement_rate_percent_nominal=_to_2f(breakdown["replacement_rate_percent_nominal"]),
        i_pillar_capital_nominal=_to_2f(breakdown["i_pillar_capital_nominal"]),
        ii_pillar_capital_nominal=_to_2f(breakdown["ii_pillar_capital_nominal"]),
        total_capital_nominal=_to_2f(breakdown["total_capital_nominal"]),
        current_monthly_salary_nominal=_to_2f(breakdown["current_monthly_salary_nominal"]),
        final_monthly_salary_nominal=_to_2f(breakdown["final_monthly_salary_nominal"]),

        # --- REAL ---
        monthly_pension_real=_to_2f(breakdown["monthly_pension_real"]),
        replacement_rate_percent_real=_to_2f(breakdown["replacement_rate_percent_real"]),
        i_pillar_capital_real=_to_2f(breakdown["i_pillar_capital_real"]),
        ii_pillar_capital_real=_to_2f(breakdown["ii_pillar_capital_real"]),
        total_capital_real=_to_2f(breakdown["total_capital_real"]),
        final_monthly_salary_real=_to_2f(breakdown["final_monthly_salary_real"]),

        # --- TIMELINE: oba nurty ---
        timeline=[
            TimelinePoint(
                year=int(point["year"]),
                # nominal
                i_pillar=_to_2f(point["i_pillar_nominal"]),
                ii_pillar=_to_2f(point["ii_pillar_nominal"]),
                total=_to_2f(point["total_nominal"]),
                annual_salary=_to_2f(point["annual_salary_nominal"]),
                # real (dodane pola w schemacie)
                i_pillar_real=_to_2f(point["i_pillar_real"]),
                ii_pillar_real=_to_2f(point["ii_pillar_real"]),
                total_real=_to_2f(point["total_real"]),
                annual_salary_real=_to_2f(point["annual_salary_real"]),
            )
            for point in timeline
        ],
    )