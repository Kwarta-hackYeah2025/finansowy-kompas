from enum import Enum
from typing import Optional
from typing import List

from pydantic import BaseModel, Field, field_validator, model_validator


class Sex(str, Enum):
    male = "male"
    female = "female"


def _to_sex_enum(value) -> Sex | None:
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

        sex_enum = _to_sex_enum(data.get("sex"))
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


class TimelinePoint(BaseModel):
    year: int
    i_pillar: float
    ii_pillar: float
    total: float
    annual_salary: float


class PensionPreviewResponse(BaseModel):
    retirement_age: int
    years_to_retirement: int
    monthly_pension: float
    replacement_rate_percent: float
    i_pillar_capital: float
    ii_pillar_capital: float
    total_capital: float
    current_monthly_salary: float
    timeline: List[TimelinePoint]
