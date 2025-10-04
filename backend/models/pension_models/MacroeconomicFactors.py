from decimal import Decimal

from pydantic import BaseModel, Field, computed_field

from models.data.poland_historical_macro_data import poland_macro_data


class MacroeconomicFactors(BaseModel):
    """Macroeconomic assumptions for pension calculations"""

    historical_data: dict[str, tuple[Decimal, Decimal, Decimal, Decimal]] = Field(
        default=poland_macro_data
    )

    inflation_rate: Decimal = Field(
        default=Decimal("0.025"), description="Average annual inflation"
    )
    real_wage_growth_rate: Decimal = Field(
        default=Decimal("0.02"), description="Real wage growth"
    )
    i_pillar_indexation_rate: Decimal = Field(
        default=Decimal("0.045"),
        description="I filar indexation (inflation + real growth)",
    )
    ii_pillar_indexation_rate: Decimal = Field(
        default=Decimal("0.0475"),
        description="II filar indexation (75% of wage growth)",
    )

    @computed_field  # type: ignore
    @property
    def nominal_wage_growth_rate(self) -> Decimal:
        """Combined nominal growth rate"""
        return self.inflation_rate + self.real_wage_growth_rate
