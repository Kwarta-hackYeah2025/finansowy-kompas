from decimal import Decimal

from pydantic import BaseModel, Field


class ZUSContributionRates(BaseModel):
    """ZUS contribution rates - configurable for future changes"""

    total_pension_rate: Decimal = Field(
        default=Decimal("0.1952"), description="Total pension contribution rate"
    )
    i_pillar_rate: Decimal = Field(
        default=Decimal("0.1222"), description="I filar rate"
    )
    ii_pillar_rate: Decimal = Field(
        default=Decimal("0.073"), description="II filar rate (subkonto)"
    )

    def validate_rates(self) -> bool:
        """Ensure rates sum up correctly"""
        return abs(
            self.i_pillar_rate + self.ii_pillar_rate - self.total_pension_rate
        ) < Decimal("0.0001")
