from pydantic import BaseModel, Field


class RetirementAgeConfig(BaseModel):
    """Retirement age configuration"""

    male_retirement_age: int = Field(default=65, description="Retirement age for men")
    female_retirement_age: int = Field(
        default=60, description="Retirement age for women"
    )

    def get_retirement_age(self, is_male: bool) -> int:
        return self.male_retirement_age if is_male else self.female_retirement_age
