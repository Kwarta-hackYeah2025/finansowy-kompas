from datetime import date
from decimal import Decimal
from typing import Optional
import logging

from pydantic import BaseModel, Field, computed_field

from backend.models.calculate_salary.experience_multiplier import experience_multiplier
from backend.models.pension_models.MacroeconomicFactors import MacroeconomicFactors
from backend.models.pension_models.RetirementAgeConfig import RetirementAgeConfig
from backend.models.pension_models.ZUSContributionRates import ZUSContributionRates

logger = logging.getLogger(__name__)

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

    def salary_in_the_past_or_future(
        self, current_salary: Decimal, year_delta: int
    ) -> Decimal:
        """
        Calculates the REAL (constant-price) salary year_delta years from now
        (negative for past, positive for future) using only the experience curve.

        The experience multiplier is a saturation curve, NOT pure exponential.
        Therefore we must use the ratio method: S_then = S_now * (m(exp_then) / m(exp_now))

        Args:
            current_salary: Current gross salary (monthly or annual — consistent usage)
            year_delta: Years from current year (can be negative)

        Returns:
            Estimated gross salary for that year in real terms (without inflation)
        """
        experience_then = max(0, self.years_of_experience + year_delta)

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

    # ------------------------------
    # Nominal wage helpers & salary
    # ------------------------------
    def _nominal_wage_growth_rate_for_year(self, year: int) -> Decimal:
        """
        Resolve nominal wage growth rate for a given year.
        Uses historical data if available; otherwise falls back to default
        nominal_wage_growth_rate from MacroeconomicFactors.
        """
        year_str = str(year)
        if year_str in self.macroeconomic_factors.historical_data:
            infl, real_growth, *_ = self.macroeconomic_factors.historical_data[year_str]
            return infl + real_growth
        return self.macroeconomic_factors.nominal_wage_growth_rate

    def _cumulative_nominal_growth(self, from_year: int, to_year: int) -> Decimal:
        """
        Compute cumulative nominal wage growth factor between two years.
        - If to_year > from_year: ∏ (1 + g_y) for y in [from_year, to_year)
        - If to_year < from_year: ∏ (1 / (1 + g_y)) for y in [to_year, from_year)
        - If equal: 1
        """
        factor = Decimal("1")
        if to_year > from_year:
            for y in range(from_year, to_year):
                rate = self._nominal_wage_growth_rate_for_year(y)
                factor *= (Decimal("1") + rate)
        elif to_year < from_year:
            for y in range(to_year, from_year):
                rate = self._nominal_wage_growth_rate_for_year(y)
                factor /= (Decimal("1") + rate)
        return factor

    def salary_in_the_past_or_future_nominal(
        self, current_salary: Decimal, year_delta: int
    ) -> Decimal:
        """
        Calculates the NOMINAL salary year_delta years from now by:
        1) Adjusting for experience curve (real effect)
        2) Applying cumulative nominal wage growth (inflation + real macro growth)
        """
        # Step 1: real, experience-based salary change
        real_salary = self.salary_in_the_past_or_future(current_salary, year_delta)

        # Step 2: apply nominal macro factor from current_year to target year
        target_year = self.current_year + year_delta
        nominal_factor = self._cumulative_nominal_growth(self.current_year, target_year)

        return (real_salary * nominal_factor)

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

    def calculate_annual_contribution_i_pillar(self, gross_salary: Decimal) -> Decimal:
        """
        Calculate annual I filar contribution

        Args:
            gross_salary: Annual gross salary

        Returns:
            Annual contribution to I filar
        """
        return gross_salary * self.zus_contribution_rate.i_pillar_rate * Decimal('12')

    def calculate_annual_contribution_ii_pillar(self, gross_salary: Decimal) -> Decimal:
        """
        Calculate annual II filar (subkonto) contribution

        Args:
            gross_salary: Annual gross salary

        Returns:
            Annual contribution to II filar
        """
        return gross_salary * self.zus_contribution_rate.ii_pillar_rate * Decimal('12')

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
        Reconstruct and valorize/index all past contributions from work_start_year
        to current_year

        For each past year:
        1. Estimate salary based on experience curve
        2. Calculate contributions
        3. Valorize/index from that year to present
        4. Sum all valorized contributions

        Returns:
            (total_i_pillar_valorized, total_ii_pillar_indexed)
        """
        total_i_pillar = Decimal("0")
        total_ii_pillar = Decimal("0")

        # Loop through each year of work history
        for year in range(self.work_start_year, self.current_year):
            # Calculate how many years ago this was
            year_delta = year - self.current_year

            # Estimate salary for that year
            salary_then = self.salary_in_the_past_or_future(
                year_delta=year_delta, current_salary=self.current_salary
            )

            # Calculate contributions for that year
            i_contribution = self.calculate_annual_contribution_i_pillar(salary_then)
            ii_contribution = self.calculate_annual_contribution_ii_pillar(salary_then)

            # Valorize/index from contribution year to current year
            i_valorized = self.valorize_i_pillar_capital(
                i_contribution, year, self.current_year
            )
            ii_indexed = self.index_ii_pillar_capital(
                ii_contribution, year, self.current_year
            )

            # Add to totals
            total_i_pillar += i_valorized
            total_ii_pillar += ii_indexed

        return total_i_pillar, total_ii_pillar

    def project_future_accumulation(self) -> tuple[Decimal, Decimal]:
        """
        Project future I and II pillar accumulation from the current year until retirement

        For each future year:
        1. Project salary based on the experience multiplier model
        2. Calculate contributions
        3. Valorize/index from contribution year to retirement year
        4. Sum all future contributions

        Returns:
            (total_i_pillar_at_retirement, total_ii_pillar_at_retirement)
        """
        total_i_pillar = Decimal("0")
        total_ii_pillar = Decimal("0")

        retirement_year = self.current_year + self.years_to_standard_retirement

        # Loop through each future working year
        for year in range(self.current_year, retirement_year):
            # Calculate years from now
            year_delta = year - self.current_year

            # Project salary for that year
            salary_future = self.salary_in_the_past_or_future(
                year_delta=year_delta, current_salary=self.current_salary
            )

            # Calculate contributions
            i_contribution = self.calculate_annual_contribution_i_pillar(salary_future)
            ii_contribution = self.calculate_annual_contribution_ii_pillar(
                salary_future
            )

            # Valorize/index from contribution year to retirement
            i_valorized = self.valorize_i_pillar_capital(
                i_contribution, year, retirement_year
            )
            ii_indexed = self.index_ii_pillar_capital(
                ii_contribution, year, retirement_year
            )

            # Add to totals
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

        total_capital = total_i_pillar + total_ii_pillar

        life_expectancy_months = life_expectancy_years * 12

        monthly_pension = total_capital / Decimal(str(life_expectancy_months))

        return monthly_pension

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    def get_replacement_rate(self) -> dict:
        """
        Calculate replacement rate: ratio of pension to final salary.
        Returns both real- and nominal-based rates.

        Returns:
            {
                'real': Decimal,     # using final real salary (experience-only)
                'nominal': Decimal,  # using final nominal salary (incl. inflation)
            }
        """
        monthly_pension = self.calculate_monthly_pension()

        # Estimate final salary (at retirement)
        years_to_retirement = self.years_to_standard_retirement
        final_salary_real = self.salary_in_the_past_or_future(
            year_delta=years_to_retirement, current_salary=self.current_salary
        )
        final_salary_nominal = self.salary_in_the_past_or_future_nominal(
            year_delta=years_to_retirement, current_salary=self.current_salary
        )

        return {
            'real': (monthly_pension / final_salary_real) if final_salary_real else Decimal('0'),
            'nominal': (monthly_pension / final_salary_nominal) if final_salary_nominal else Decimal('0'),
        }

    def get_detailed_breakdown(self) -> dict:
        """
        Get the detailed breakdown of all pension calculations.
        Adds nominal wage-related fields alongside real ones.

        Returns:
            Dictionary with all key metrics including real/nominal wage info.
        """
        total_i, total_ii = self.calculate_total_retirement_capital()
        monthly_pension = self.calculate_monthly_pension(total_i, total_ii)

        years_to_retirement = self.years_to_standard_retirement
        final_salary_real = self.salary_in_the_past_or_future(
            year_delta=years_to_retirement, current_salary=self.current_salary
        )
        final_salary_nominal = self.salary_in_the_past_or_future_nominal(
            year_delta=years_to_retirement, current_salary=self.current_salary
        )

        replacement_rate = self.get_replacement_rate()

        return {
            "current_age": self.current_age,
            "retirement_age": self.effective_retirement_age,
            "years_to_retirement": years_to_retirement,
            "current_monthly_salary": self.current_salary,
            # Wage endpoints
            "final_salary_real": final_salary_real,
            "final_salary_nominal": final_salary_nominal,
            # Capitals and pension
            "i_pillar_capital": total_i,
            "ii_pillar_capital": total_ii,
            "total_capital": total_i + total_ii,
            "monthly_pension": monthly_pension,
            # Replacement rates
            "replacement_rate_percent": replacement_rate["real"] * Decimal("100"),
            "replacement_rate_percent_real": replacement_rate["real"] * Decimal("100"),
            "replacement_rate_percent_nominal": replacement_rate["nominal"] * Decimal("100"),
        }

    def get_cumulative_capital_by_year(self) -> dict[int, dict]:
        """
        Calculate cumulative pension capital for each year from current to retirement.
        This is used for timeline visualization (MODUŁ 6).

        For each year Y from current_year to retirement_year:
        - Calculate all contributions from work_start_year to Y
        - Valorize/index them to year Y
        - Return accumulated totals

        Returns:
            Dictionary mapping year → {
                'age': int,
                'i_pillar': Decimal,
                'ii_pillar': Decimal,
                'total': Decimal,
                'annual_salary': Decimal,
                'years_of_experience': int
            }
        """
        timeline = {}
        retirement_year = self.current_year + self.years_to_standard_retirement

        # For each year from current to retirement
        for target_year in range(self.current_year, retirement_year + 1):
            i_pillar_total = Decimal("0")
            ii_pillar_total = Decimal("0")

            # Calculate contributions from all past working years up to target_year
            # (includes both historical and future-relative-to-now years)
            for contribution_year in range(self.work_start_year, target_year):
                # Calculate year delta for salary estimation
                year_delta = contribution_year - self.current_year

                # Estimate salary for that year
                salary = self.salary_in_the_past_or_future(
                    year_delta=year_delta, current_salary=self.current_salary
                )

                # Calculate contributions
                i_contribution = self.calculate_annual_contribution_i_pillar(salary)
                ii_contribution = self.calculate_annual_contribution_ii_pillar(salary)

                # Valorize/index from contribution year to target year
                i_valorized = self.valorize_i_pillar_capital(
                    i_contribution, contribution_year, target_year
                )
                ii_indexed = self.index_ii_pillar_capital(
                    ii_contribution, contribution_year, target_year
                )

                # Add to totals for this target year
                i_pillar_total += i_valorized
                ii_pillar_total += ii_indexed

            # Calculate age and experience for this year
            years_since_current = target_year - self.current_year

            # Get salary for this year (real and nominal)
            salary_at_year_real = self.salary_in_the_past_or_future(
                year_delta=years_since_current, current_salary=self.current_salary
            )
            salary_at_year_nominal = self.salary_in_the_past_or_future_nominal(
                year_delta=years_since_current, current_salary=self.current_salary
            )

            print(f"i_pillar: {i_pillar_total},"
                  f" ii_pillar: {ii_pillar_total},"
                  f" total: {i_pillar_total + ii_pillar_total},"
                  f" annual_salary_real: {salary_at_year_real * Decimal("12")},"
                  f" annual_salary_nominal: {salary_at_year_nominal * Decimal("12")}")


            timeline[target_year] = {
                "i_pillar": i_pillar_total,
                "ii_pillar": ii_pillar_total,
                "total": i_pillar_total + ii_pillar_total,
                # Add explicit fields
                "annual_salary_real": salary_at_year_real * Decimal("12"),
                "annual_salary_nominal": salary_at_year_nominal * Decimal("12"),
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
        )
    )
