from enum import Enum
from typing import Optional
from typing import List

from pydantic import BaseModel, Field, field_validator, model_validator
from backend.llm.fun_facts.FunFact import FunFact


class Sex(str, Enum):
    male = "male"
    female = "female"


def _too_sexy_enum(value) -> Sex | None:
    if isinstance(value, Sex):
        return value
    if isinstance(value, str):
        try:
            return Sex(value)
        except ValueError:
            return None
    return None


RETIREMENT_AGE_PL = {
    Sex.male: 65,
    Sex.female: 60,
}


class SalaryRequest(BaseModel):
    sex: Sex = Field(..., description="Sex of the user: male or female (affects default retirement age in PL)")
    age: int = Field(..., ge=0, le=120, description="Current age in years")
    city: str = Field(..., min_length=1, description="City of residence/work used for salary baseline")
    industry: str = Field(..., min_length=1, description="Free-text industry / job description")
    career_start: Optional[int] = Field(23, ge=0, le=120, description="Age when career started; default 23")
    career_end: Optional[int] = Field(
        None,
        ge=0,
        le=120,
        description="Planned retirement age (optional). Defaults to 65 for males and 60 for females if not provided.",
    )

    @field_validator("career_start", mode="before")
    @classmethod
    def set_default_career_start(cls, v):
        if v is None:
            return 23
        return v

    @model_validator(mode="before")
    @classmethod
    def set_default_career_end(cls, data):
        if not isinstance(data, dict):
            return data
        if data.get("career_end") is not None:
            return data

        sex_enum = _too_sexy_enum(data.get("sex"))
        default_age = RETIREMENT_AGE_PL.get(sex_enum) if sex_enum is not None else None
        if default_age is None:
            return data

        return {**data, "career_end": default_age}


class SalaryResponse(BaseModel):
    salary: float = Field(..., description="Estimated current monthly salary (PLN)")
    experience_years: int = Field(..., description="Years of professional experience")
    retirement_age: int = Field(..., description="Retirement age used (could be user-provided or default by sex)")
    years_to_retirement: int = Field(..., description="Years remaining to retirement (floored at 0)")
    alpha: float = Field(..., description="Alpha parameter used in experience multiplier model")
    beta: float = Field(..., description="Beta parameter used in experience multiplier model")


class PensionPreviewRequest(BaseModel):
    current_age: int = Field(..., ge=0, le=120, description="Current age in years")
    years_of_experience: int = Field(..., ge=0, le=100, description="Years of work experience")
    current_monthly_salary: float = Field(..., ge=0, description="Current monthly gross salary (PLN)")
    is_male: bool = Field(True, description="Gender flag; True = male, False = female")
    alpha: float = Field(..., description="Alpha parameter for experience multiplier model")
    beta: float = Field(..., description="Beta parameter for experience multiplier model")
    retirement_age: Optional[int] = Field(
        None,
        ge=0,
        le=120,
        description="Optional custom retirement age; if omitted, standard age is used",
    )
    simulation_mode: bool = False


class SimulationEventDTO(BaseModel):
    reason: str
    start_age: int
    end_age: int
    basis_zero: bool
    contrib_multiplier: float
    kind: str | None = None


class TimelinePoint(BaseModel):
    # --- nominal ---
    year: int = Field(..., description="Rok")
    i_pillar: float = Field(..., description="Skumulowany kapitał I filara (nominalnie) do końca roku")
    ii_pillar: float = Field(..., description="Skumulowany kapitał II filara (nominalnie) do końca roku")
    total: float = Field(..., description="Suma kapitału I+II (nominalnie) do końca roku")
    annual_salary: float = Field(..., description="Roczna pensja w danym roku (nominalnie)")

    # --- real ---
    i_pillar_real: float = Field(..., description="Skumulowany kapitał I filara (realnie) do końca roku")
    ii_pillar_real: float = Field(..., description="Skumulowany kapitał II filara (realnie) do końca roku")
    total_real: float = Field(..., description="Suma kapitału I+II (realnie) do końca roku")
    annual_salary_real: float = Field(..., description="Roczna pensja w danym roku (realnie)")


class PensionPreviewResponse(BaseModel):
    # metadane
    retirement_age: int = Field(..., description="Wiek przejścia na emeryturę")
    years_to_retirement: int = Field(..., description="Liczba lat do emerytury")

    # --- NOMINAL ---
    monthly_pension_nominal: float = Field(..., description="Miesięczna emerytura w cenach nominalnych")
    replacement_rate_percent_nominal: float = Field(..., description="Replacement rate w % (nominalnie)")
    i_pillar_capital_nominal: float = Field(..., description="Kapitał I filara na starcie emerytury (nominalnie)")
    ii_pillar_capital_nominal: float = Field(..., description="Kapitał II filara na starcie emerytury (nominalnie)")
    total_capital_nominal: float = Field(..., description="Kapitał łączny I+II (nominalnie)")
    current_monthly_salary_nominal: float = Field(..., description="Obecna miesięczna pensja (nominalnie)")
    final_monthly_salary_nominal: float = Field(..., description="Miesięczna pensja w roku emerytury (nominalnie)")

    # --- REAL ---
    monthly_pension_real: float = Field(..., description="Miesięczna emerytura w stałych cenach (realnie)")
    replacement_rate_percent_real: float = Field(..., description="Replacement rate w % (realnie)")
    i_pillar_capital_real: float = Field(..., description="Kapitał I filara na starcie emerytury (realnie)")
    ii_pillar_capital_real: float = Field(..., description="Kapitał II filara na starcie emerytury (realnie)")
    total_capital_real: float = Field(..., description="Kapitał łączny I+II (realnie)")
    final_monthly_salary_real: float = Field(..., description="Miesięczna pensja w roku emerytury (realnie)")

    # oś czasu
    timeline: List[TimelinePoint] = Field(..., description="Punkty osi czasu do wizualizacji (nominal + real)")

    simulation_events: List[SimulationEventDTO] = []


class FunFactsResponse(BaseModel):
    facts: List[FunFact] = Field(..., description="A fun facts about salaries or pensions")
