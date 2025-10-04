from decimal import Decimal

from pydantic import BaseModel, Field


class MacroeconomicFactors(BaseModel):
    inflation_rate: Decimal = Field(
        default=Decimal("0.025"),
        description="Annual inflation rate",
    )
    real_wage_growth_rate: Decimal = Field(
        default=Decimal("0.02"),
        description="Annual real wage growth rate",
    )
    # gdp_growth_rate: Decimal = Field(
    #     default=Decimal("0.03"),
    #     description="Annual GDP growth rate",
    # )

