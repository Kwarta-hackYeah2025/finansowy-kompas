from fastapi import APIRouter

from ..schemas import SalaryRequest, SalaryResponse
from backend.models.calculate_salary.calculate_salary import calculate_salary

router = APIRouter(prefix="/salary", tags=["salary"])


@router.post("/calculate", response_model=SalaryResponse)
async def calculate_salary_endpoint(payload: SalaryRequest) -> SalaryResponse:
    experience_years = max(0, payload.age - (payload.career_start or 23))

    retirement_age = payload.career_end
    years_to_retirement = max(0, retirement_age - payload.age)

    salary_dec = await calculate_salary(payload.industry, payload.city, experience_years)
    salary = float(salary_dec)

    return SalaryResponse(
        salary=salary,
        experience_years=experience_years,
        retirement_age=retirement_age,
        years_to_retirement=years_to_retirement,
    )
