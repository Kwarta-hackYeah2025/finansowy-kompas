from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Sex(str, Enum):
    male = "male"
    female = "female"


class SalaryRequest(BaseModel):
    sex: Sex = Field(..., description="Sex of the user: male or female (affects retirement age in PL)")
    age: int = Field(..., ge=0, le=120, description="Current age in years")
    city: str = Field(..., min_length=1, description="City of residence/work used for salary baseline")
    industry: str = Field(..., min_length=1, description="Free-text industry / job description")
    career_start: Optional[int] = Field(23, ge=0, le=111, description="Age when career started; default 23")


class SalaryResponse(BaseModel):
    salary: float = Field(..., description="Estimated current monthly salary (PLN)")
    experience_years: int = Field(..., description="Years of professional experience")
    retirement_age: int = Field(..., description="Statutory retirement age in Poland based on sex")
    years_to_retirement: int = Field(..., description="Years remaining to retirement (floored at 0)")
