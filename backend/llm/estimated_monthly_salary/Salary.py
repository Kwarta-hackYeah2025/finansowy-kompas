from decimal import Decimal, ROUND_HALF_UP
from pydantic import BaseModel, Field, field_validator


class Salary(BaseModel):
    salary: Decimal = Field(
        decimal_places=2,
        ge=Decimal("4666.00"),
        description="Estimated monthly gross salary in PLN, two decimals",
    )

    @field_validator("salary", mode="before")
    @classmethod
    def coerce_salary(cls, v):
        if isinstance(v, (int, float, str)):
            v = Decimal(str(v))
        return v

    @field_validator("salary")
    @classmethod
    def validate_salary_positive_and_scale(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Salary must be greater than 0")
        return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
