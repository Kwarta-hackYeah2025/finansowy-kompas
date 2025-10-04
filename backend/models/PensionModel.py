from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, computed_field

from llm.random_nonfunctional_periods import NonFunctionalEvent
from models.calculate_salary.experience_multiplier import experience_multiplier
from models.nonfunctional_periods.generate_periods import generate_periods
from models.pension_models.MacroeconomicFactors import MacroeconomicFactors
from models.pension_models.RetirementAgeConfig import RetirementAgeConfig
from models.pension_models.ZUSContributionRates import ZUSContributionRates


class PensionModel(BaseModel):
    """User profile with basic demographic info"""

    current_age: int = Field(description="Age")
    current_salary: Decimal = Field(description="The current salary")
    alpha: float = Field(description="Parameter alpha for experience multiplier model")
    beta: float = Field(
        description="Parameter beta for the experience multiplier model"
    )
    years_of_experience: int = Field(description="Years of experience")
    is_male: bool = Field(default=True, description="Gender (affects retirement age)")
    current_year: int = Field(default_factory=lambda: date.today().year)
    macroeconomic_factors: MacroeconomicFactors = Field(
        default=MacroeconomicFactors(), description="Macroeconomic factors"
    )
    zus_contribution_rate: ZUSContributionRates = Field(
        default=ZUSContributionRates(), description="ZUS contribution rates"
    )
    retirement_age: Optional[int] = Field(
        default=None, description="Age at which retirement is planned"
    )
    accumulated_i_pillar_capital: Decimal = Field(
        default=Decimal("0"), description="Already accumulated capital in I filar"
    )
    accumulated_ii_pillar_capital: Decimal = Field(
        default=Decimal("0"),
        description="Already accumulated capital in II filar (subkonto)",
    )
    non_functional_events: list[NonFunctionalEvent] = Field(default_factory=list,
                                             description="`Periods of absence/reduction of contribution base for E+R")

    def salary_in_the_past_or_future(
        self, current_salary: Decimal, year_delta: int
    ) -> Decimal:
        """
        Calculates the salary year_delta years from now
        (negative for past, positive for future)
        Based on experience curve, NOT accounting for macroeconomic factors

        The experience multiplier is a saturation curve, NOT pure exponential.
        Therefore we must use the ratio method: S_then = S_now * (m(exp_then) / m(exp_now))

        Args:
            current_salary: Current annual gross salary
            year_delta: Years from current year (can be negative)

        Returns:
            Estimated gross salary for that year
        """
        # Calculate ABSOLUTE experience at target time
        experience_then = self.years_of_experience + year_delta

        # Don't allow negative experience
        experience_then = max(0, experience_then)

        # Get multiplier at target experience level
        multiplier_then = experience_multiplier(
            exp=experience_then,
            alpha=self.alpha,
            beta=self.beta,
        )

        # Get multiplier at current experience level
        multiplier_now = experience_multiplier(
            exp=self.years_of_experience,
            alpha=self.alpha,
            beta=self.beta,
        )

        return current_salary * Decimal(str(multiplier_then / multiplier_now))

    @computed_field  # type: ignore
    @property
    def work_start_year(self) -> int:
        """Assume they started working at (current_age - years_of_experience)"""
        return self.current_year - self.years_of_experience

    @computed_field  # type: ignore
    @property
    def years_to_standard_retirement(self) -> int:
        config = RetirementAgeConfig()
        retirement_age = self.retirement_age or config.get_retirement_age(self.is_male)
        return max(0, retirement_age - self.current_age)

    @computed_field  # type: ignore
    @property
    def effective_retirement_age(self) -> int:
        """Actual retirement age (custom or standard)"""
        config = RetirementAgeConfig()
        return self.retirement_age or config.get_retirement_age(self.is_male)

    @property
    def birth_year(self) -> int:
        return self.current_year - self.current_age

    def age_in_year(self, year: int) -> int:
        """Age in a given calendar year."""
        return year - self.birth_year

    def contribution_multiplier_for_age(self, age: int) -> Decimal:
        """
        Returns the final contribution base multiplier for a given age.
        Rules:
        - if anything has basis_zero=True and covers the age -> 0
        - otherwise, we take the minimum of contribution_multiplier for all covering events
        - if no events -> 1
        """

        applicable = [e for e in self.non_functional_events if e.start_age <= age < e.end_age]
        if not applicable:
            return Decimal("1")

        if any(e.basis_zero for e in applicable):
            return Decimal("0")

        min_m = min(e.contrib_multiplier for e in applicable)
        return Decimal(str(min_m))


    def calculate_annual_contribution_i_pillar(self, gross_salary: Decimal) -> Decimal:
        """
        Calculate annual I filar contribution

        Args:
            gross_salary: Annual gross salary

        Returns:
            Annual contribution to I filar
        """
        return gross_salary * self.zus_contribution_rate.i_pillar_rate

    def calculate_annual_contribution_ii_pillar(self, gross_salary: Decimal) -> Decimal:
        """
        Calculate annual II filar (subkonto) contribution

        Args:
            gross_salary: Annual gross salary

        Returns:
            Annual contribution to II filar
        """
        return gross_salary * self.zus_contribution_rate.ii_pillar_rate

    # ========================================================================
    # VALORIZATION & INDEXATION RATE RETRIEVAL
    # ========================================================================

    def get_i_pillar_valorization_rate(self, year: int) -> Decimal:
        """
        Get I filar valorization rate for a specific year

        Args:
            year: Year for which to get the rate

        Returns:
            Valorization rate for that year
        """
        year_str = str(year)
        if year_str in self.macroeconomic_factors.historical_data:
            # historical_data tuple: (inflation, real_wage_growth, i_pillar_index, ii_pillar_index)
            return self.macroeconomic_factors.historical_data[year_str][2]
        else:
            # Use projected/default rate for future years
            return self.macroeconomic_factors.i_pillar_indexation_rate

    def get_ii_pillar_indexation_rate(self, year: int) -> Decimal:
        """
        Get II filar indexation rate for a specific year

        Args:
            year: Year for which to get the rate

        Returns:
            Indexation rate for that year
        """
        year_str = str(year)
        if year_str in self.macroeconomic_factors.historical_data:
            # historical_data tuple: (inflation, real_wage_growth, i_pillar_index, ii_pillar_index)
            return self.macroeconomic_factors.historical_data[year_str][3]
        else:
            # Use projected/default rate for future years
            return self.macroeconomic_factors.ii_pillar_indexation_rate

    # ========================================================================
    # CAPITAL VALORIZATION & INDEXATION
    # ========================================================================

    def valorize_i_pillar_capital(
        self, capital: Decimal, from_year: int, to_year: int
    ) -> Decimal:
        """
        Apply ZUS I filar valorization to capital from one year to another

        Formula: capital × ∏(1 + valorization_rate[year]) for each year

        Args:
            capital: Initial capital amount
            from_year: Starting year
            to_year: Ending year (exclusive)

        Returns:
            Valorized capital
        """
        valorized = capital
        for year in range(from_year, to_year):
            rate = self.get_i_pillar_valorization_rate(year)
            valorized *= Decimal("1") + rate
        return valorized

    def index_ii_pillar_capital(
        self, capital: Decimal, from_year: int, to_year: int
    ) -> Decimal:
        """
        Apply II filar indexation to capital from one year to another

        Formula: capital × ∏(1 + indexation_rate[year]) for each year

        Args:
            capital: Initial capital amount
            from_year: Starting year
            to_year: Ending year (exclusive)

        Returns:
            Indexed capital
        """
        indexed = capital
        for year in range(from_year, to_year):
            rate = self.get_ii_pillar_indexation_rate(year)
            indexed *= Decimal("1") + rate
        return indexed

    # ========================================================================
    # HISTORICAL RECONSTRUCTION
    # ========================================================================

    def reconstruct_historical_contributions(self) -> tuple[Decimal, Decimal]:
        """
           Reconstructs and valorizes/indexes all past E+R (pension + disability) contributions
           from work_start_year up to current_year, also accounting for periods of breaks
           or reduced work activity.

           For each year:
             1. Estimate the nominal salary using the experience curve.
             2. Check if any event applies at that age:
                - if basis_zero == True → contributions for that year = 0 (skipped),
                - if contrib_multiplier < 1 → the contribution base is proportionally reduced.
             3. Calculate I-pillar and II-pillar contributions from the adjusted base.
             4. Valorize (I-pillar) / index (II-pillar) those contributions from that year
                up to current_year.
             5. Add the results to the totals.

           Returns:
               (total_i_pillar_valorized, total_ii_pillar_indexed) —
               total valorized/indexed contributions to I and II pillars as of the current year.
           """
        total_i_pillar = Decimal("0")
        total_ii_pillar = Decimal("0")

        for year in range(self.work_start_year, self.current_year):
            year_delta = year - self.current_year
            salary_then = self.salary_in_the_past_or_future(
                year_delta=year_delta, current_salary=self.current_salary
            )

            age_then = self.age_in_year(year)
            base_mult = self.contribution_multiplier_for_age(age_then)
            if base_mult == 0:
                continue

            adjusted_salary = salary_then * base_mult

            i_contribution = self.calculate_annual_contribution_i_pillar(adjusted_salary)
            ii_contribution = self.calculate_annual_contribution_ii_pillar(adjusted_salary)

            i_valorized = self.valorize_i_pillar_capital(i_contribution, year, self.current_year)
            ii_indexed = self.index_ii_pillar_capital(ii_contribution, year, self.current_year)

            total_i_pillar += i_valorized
            total_ii_pillar += ii_indexed

        return total_i_pillar, total_ii_pillar

    def project_future_accumulation(self) -> tuple[Decimal, Decimal]:
        """
        Project future E+R (pension + disability) accumulation from the current year
        up to (but excluding) the retirement year, taking into account non-functional
        events that reduce or zero out the contribution base.

        For each future year:
          1) Estimate the nominal annual salary from the experience curve.
          2) Check events for the person's age in that year:
             - if basis_zero == True → no E+R title → contributions for that year are skipped,
             - else apply contrib_multiplier ∈ [0, 1] to reduce the contribution base.
          3) Compute I-pillar and II-pillar contributions from the adjusted base.
          4) Valorize (I-pillar) / index (II-pillar) the contributions from that year
             to the retirement year.
          5) Add to the running totals.

        Returns:
            (total_i_pillar_at_retirement, total_ii_pillar_at_retirement)
            — totals at the retirement year, after valorization/indexation.
        """
        total_i_pillar = Decimal("0")
        total_ii_pillar = Decimal("0")

        retirement_year = self.current_year + self.years_to_standard_retirement

        for year in range(self.current_year, retirement_year):
            year_delta = year - self.current_year
            salary_future = self.salary_in_the_past_or_future(
                year_delta=year_delta, current_salary=self.current_salary
            )

            # NOWE: mnożnik/wyzerowanie podstawy wg wieku
            age_then = self.age_in_year(year)
            base_mult = self.contribution_multiplier_for_age(age_then)
            if base_mult == 0:
                continue

            adjusted_salary = salary_future * base_mult

            i_contribution = self.calculate_annual_contribution_i_pillar(adjusted_salary)
            ii_contribution = self.calculate_annual_contribution_ii_pillar(adjusted_salary)

            i_valorized = self.valorize_i_pillar_capital(i_contribution, year, retirement_year)
            ii_indexed = self.index_ii_pillar_capital(ii_contribution, year, retirement_year)

            total_i_pillar += i_valorized
            total_ii_pillar += ii_indexed

        return total_i_pillar, total_ii_pillar

    # ========================================================================
    # TOTAL CAPITAL CALCULATION
    # ========================================================================

    def calculate_total_retirement_capital(self) -> tuple[Decimal, Decimal]:
        """
        Calculate complete retirement capital at retirement age
        Combines historical reconstruction + future projection

        NOTE: Currently ignores accumulated_i_pillar_capital and
        accumulated_ii_pillar_capital fields (assumes reconstruction from scratch)

        Returns:
            (total_i_pillar, total_ii_pillar) at retirement
        """
        # Reconstruct past contributions (valorized to current year)
        past_i, past_ii = self.reconstruct_historical_contributions()

        # Project future contributions (valorized to retirement year)
        future_i, future_ii = self.project_future_accumulation()

        # Need to valorize past contributions from current_year to retirement_year
        retirement_year = self.current_year + self.years_to_standard_retirement

        past_i_at_retirement = self.valorize_i_pillar_capital(
            past_i, self.current_year, retirement_year
        )
        past_ii_at_retirement = self.index_ii_pillar_capital(
            past_ii, self.current_year, retirement_year
        )

        total_i = past_i_at_retirement + future_i
        total_ii = past_ii_at_retirement + future_ii

        return total_i, total_ii

    # ========================================================================
    # MONTHLY PENSION CALCULATION
    # ========================================================================

    def calculate_monthly_pension(
        self,
        total_i_pillar: Optional[Decimal] = None,
        total_ii_pillar: Optional[Decimal] = None,
        life_expectancy_years: Optional[int] = None,
    ) -> Decimal:
        """
        Calculate monthly pension amount using ZUS formula

        ZUS Formula: Monthly Pension = Total Capital / (Life Expectancy in Months)

        Args:
            total_i_pillar: Total I filar capital (if None, calculates it)
            total_ii_pillar: Total II filar capital (if None, calculates it)
            life_expectancy_years: Expected years to live from retirement
                                   (if None, uses Polish averages: M=84, F=88)

        Returns:
            Monthly pension amount in PLN
        """
        # Calculate totals if not provided
        if total_i_pillar is None or total_ii_pillar is None:
            total_i_pillar, total_ii_pillar = self.calculate_total_retirement_capital()

        # Calculate life expectancy if not provided
        if life_expectancy_years is None:
            # Polish life expectancy averages (approximate)
            retirement_age = self.effective_retirement_age
            if self.is_male:
                life_expectancy_years = 84 - retirement_age
            else:
                life_expectancy_years = 88 - retirement_age

        # Total capital = I filar + II filar
        total_capital = total_i_pillar + total_ii_pillar

        # Convert years to months
        life_expectancy_months = life_expectancy_years * 12

        # Calculate monthly pension
        monthly_pension = total_capital / Decimal(str(life_expectancy_months))

        return monthly_pension

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    def get_replacement_rate(self) -> Decimal:
        """
        Calculate replacement rate: ratio of pension to final salary

        Returns:
            Replacement rate as decimal (e.g., 0.45 = 45%)
        """
        monthly_pension = self.calculate_monthly_pension()

        # Estimate final salary (at retirement)
        years_to_retirement = self.years_to_standard_retirement
        final_salary = self.salary_in_the_past_or_future(
            year_delta=years_to_retirement, current_salary=self.current_salary
        )
        monthly_final_salary = final_salary / Decimal("12")

        if monthly_final_salary == 0:
            return Decimal("0")

        return monthly_pension / monthly_final_salary

    def get_detailed_breakdown(self) -> dict:
        """
        Get the detailed breakdown of all pension calculations

        Returns:
            Dictionary with all key metrics
        """
        total_i, total_ii = self.calculate_total_retirement_capital()
        monthly_pension = self.calculate_monthly_pension(total_i, total_ii)
        replacement_rate = self.get_replacement_rate()

        return {
            "current_age": self.current_age,
            "retirement_age": self.effective_retirement_age,
            "years_to_retirement": self.years_to_standard_retirement,
            "current_monthly_salary": self.current_salary / Decimal("12"),
            "i_pillar_capital": total_i,
            "ii_pillar_capital": total_ii,
            "total_capital": total_i + total_ii,
            "monthly_pension": monthly_pension,
            "replacement_rate_percent": replacement_rate * Decimal("100"),
        }

    def get_cumulative_capital_by_year(self) -> dict[int, dict]:
        """
        Build a year-by-year cumulative view of pension capital from the current year
        through the retirement year (inclusive), suitable for timeline visualization.

        For each target year Y in [current_year, retirement_year]:
          - Iterate over every contribution_year from work_start_year to Y-1:
            1) Estimate the nominal salary for contribution_year from the experience curve.
            2) Check events for the age in contribution_year:
               * if basis_zero == True → skip contributions for that year,
               * else apply contrib_multiplier ∈ [0, 1] to reduce the contribution base.
            3) Compute I-pillar and II-pillar contributions from the adjusted base.
            4) Valorize (I-pillar) / index (II-pillar) those contributions up to Y.
            5) Accumulate into totals for Y.
          - Additionally compute:
            * annual_salary for Y (nominal salary estimate for that year, before any event-based
              reduction),
            * contrib_base_multiplier for Y (the multiplier that would apply in Y, useful for UI).

        Returns:
            A dict mapping:
                year → {
                    "i_pillar": Decimal,              # cumulative I-pillar capital at year
                    "ii_pillar": Decimal,             # cumulative II-pillar capital at year
                    "total": Decimal,                 # i_pillar + ii_pillar
                    "annual_salary": Decimal,         # nominal salary estimate for that year
                    "contrib_base_multiplier": Decimal  # event-based base multiplier for that year
                }
        """
        timeline = {}
        retirement_year = self.current_year + self.years_to_standard_retirement

        for target_year in range(self.current_year, retirement_year + 1):
            i_pillar_total = Decimal("0")
            ii_pillar_total = Decimal("0")

            for contribution_year in range(self.work_start_year, target_year):
                year_delta = contribution_year - self.current_year
                salary = self.salary_in_the_past_or_future(
                    year_delta=year_delta, current_salary=self.current_salary
                )

                # NOWE: mnożnik/wyzerowanie podstawy wg wieku
                age_then = self.age_in_year(contribution_year)
                base_mult = self.contribution_multiplier_for_age(age_then)
                if base_mult == 0:
                    continue
                adjusted_salary = salary * base_mult

                i_contribution = self.calculate_annual_contribution_i_pillar(adjusted_salary)
                ii_contribution = self.calculate_annual_contribution_ii_pillar(adjusted_salary)

                i_valorized = self.valorize_i_pillar_capital(i_contribution, contribution_year, target_year)
                ii_indexed = self.index_ii_pillar_capital(ii_contribution, contribution_year, target_year)

                i_pillar_total += i_valorized
                ii_pillar_total += ii_indexed

            years_since_current = target_year - self.current_year
            salary_at_year = self.salary_in_the_past_or_future(
                year_delta=years_since_current, current_salary=self.current_salary
            )

            age_at_year = self.age_in_year(target_year)
            base_mult_for_year = self.contribution_multiplier_for_age(age_at_year)

            timeline[target_year] = {
                "i_pillar": i_pillar_total,
                "ii_pillar": ii_pillar_total,
                "total": i_pillar_total + ii_pillar_total,
                "annual_salary": salary_at_year,
                "contrib_base_multiplier": base_mult_for_year,
            }

        return timeline

    def get_timeline_for_visualization(self) -> list[dict]:
        """
        Get timeline data formatted for frontend visualization.
        Returns a list sorted by year for easy iteration.

        Returns:
            List of dictionaries with year-by-year data, sorted by year
        """
        timeline_dict = self.get_cumulative_capital_by_year()

        # Convert to list and add year field
        timeline_list = []
        for year, data in sorted(timeline_dict.items()):
            entry = {"year": year, **data}
            timeline_list.append(entry)

        return timeline_list

if __name__ == '__main__':
    import asyncio
    async def main():
        pension = PensionModel(
            current_age=30,
            years_of_experience=10,
            current_salary=Decimal("30000"),
            is_male=True,
            alpha=0.02,
            beta=0.02,
            macroeconomic_factors=MacroeconomicFactors(
                inflation_rate=Decimal("0.02"),
                real_wage_growth_rate=Decimal("0.02"),
                i_pillar_indexation_rate=Decimal("0.02"),
                ii_pillar_indexation_rate=Decimal("0.02"),
            ),
        )

        birth_year = pension.current_year - pension.current_age

        events = await generate_periods(birth_year=birth_year, current_year=pension.current_year)

        pension.non_functional_events = events

        print("=== Wygenerowane przerwy (LLM) ===")
        for e in events:
            print(f"- {e.reason} | wiek {e.start_age}–{e.end_age} | mnożnik składek {e.contrib_multiplier}")

        total_i, total_ii = pension.calculate_total_retirement_capital()
        monthly = pension.calculate_monthly_pension(total_i, total_ii)

        print("\n=== Wyniki emerytalne ===")
        print(f"I filar: {total_i:.2f}")
        print(f"II filar: {total_ii:.2f}")
        print(f"Suma: {(total_i + total_ii):.2f}")
        print(f"Miesięczna emerytura: {monthly:.2f} PLN")


    asyncio.run(main())