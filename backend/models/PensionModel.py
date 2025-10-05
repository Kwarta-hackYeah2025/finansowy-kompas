from datetime import date
from decimal import Decimal
from typing import Optional, List
import logging

from pydantic import BaseModel, Field, computed_field

from backend.models.calculate_salary.experience_multiplier import experience_multiplier
from backend.models.nonfunctional_periods.generate_periods import generate_periods
from backend.models.pension_models.MacroeconomicFactors import MacroeconomicFactors
from backend.models.pension_models.RetirementAgeConfig import RetirementAgeConfig
from backend.models.pension_models.ZUSContributionRates import ZUSContributionRates
from backend.llm.random_nonfunctional_periods import NonFunctionalEvent

logger = logging.getLogger(__name__)

ONE = Decimal("1")


class PensionModel(BaseModel):
    """
    Model spójny z dwiema walutami:
    - NOMINALNA: „ile złotych” w danym roku (z inflacją).
    - REALNA: w stałej sile nabywczej dzisiejszych pieniędzy (po odjęciu inflacji).
    Zdarzenia (non_functional_events) pozwalają wyzerować lub zredukować podstawę składek
    w wybranych przedziałach wieku.
    """

    # ------------------------------
    # Dane wejściowe
    # ------------------------------
    current_age: int = Field(description="Wiek (lata)")
    current_salary: Decimal = Field(description="Bieżące wynagrodzenie miesięczne (nominalne)")
    alpha: float = Field(description="Parametr alpha dla krzywej doświadczenia")
    beta: float = Field(description="Parametr beta dla krzywej doświadczenia")
    years_of_experience: int = Field(description="Lata doświadczenia zawodowego")
    is_male: bool = Field(default=True, description="Płeć (wpływa na wiek emerytalny)")
    current_year: int = Field(default_factory=lambda: date.today().year)

    macroeconomic_factors: MacroeconomicFactors = Field(
        default=MacroeconomicFactors(), description="Czynniki makro (z historią)"
    )
    zus_contribution_rate: ZUSContributionRates = Field(
        default=ZUSContributionRates(), description="Stawki składek ZUS (I/II filar)"
    )

    retirement_age: Optional[int] = Field(
        default=None, description="Planowany wiek przejścia na emeryturę"
    )

    accumulated_i_pillar_capital: Decimal = Field(
        default=Decimal("0"), description="Zgromadzony kapitał w I filarze (nominalnie)"
    )
    accumulated_ii_pillar_capital: Decimal = Field(
        default=Decimal("0"), description="Zgromadzony kapitał w II filarze (nominalnie)"
    )

    # --- ZDARZENIA: przerwy/ograniczenia tytułu E+R ---
    non_functional_events: List[NonFunctionalEvent] = Field(
        default_factory=list,
        description="Okresy nieczynności/redukcji podstawy składek (basis_zero lub multiplier < 1)."
    )

    # ------------------------------
    # Krzywa doświadczenia
    # ------------------------------
    def _experience_multiplier_ratio(self, year_delta: int) -> Decimal:
        exp_then = max(0, self.years_of_experience + year_delta)
        m_then = experience_multiplier(exp=exp_then, alpha=self.alpha, beta=self.beta)
        m_now  = experience_multiplier(exp=self.years_of_experience, alpha=self.alpha, beta=self.beta)
        return Decimal(str(m_then / m_now))

    def salary_in_the_past_or_future_real(self, current_salary: Decimal, year_delta: int) -> Decimal:
        """
        REAL: tylko doświadczenie (stała siła nabywcza), bez makro.
        """
        return current_salary * self._experience_multiplier_ratio(year_delta)

    # ------------------------------
    # Stopy makro (z historii lub defaultów)
    # ------------------------------
    def _inflation_rate_for_year(self, year: int) -> Decimal:
        ys = str(year)
        if ys in self.macroeconomic_factors.historical_data:
            infl = self.macroeconomic_factors.historical_data[ys][0]
            return infl
        return self.macroeconomic_factors.inflation_rate

    def _real_wage_growth_rate_for_year(self, year: int) -> Decimal:
        ys = str(year)
        if ys in self.macroeconomic_factors.historical_data:
            real = self.macroeconomic_factors.historical_data[ys][1]
            return real
        return self.macroeconomic_factors.real_wage_growth_rate

    def _nominal_wage_growth_rate_for_year(self, year: int) -> Decimal:
        ys = str(year)
        if ys in self.macroeconomic_factors.historical_data:
            infl, real, *_ = self.macroeconomic_factors.historical_data[ys]
            return infl + real
        return self.macroeconomic_factors.nominal_wage_growth_rate

    # ------------------------------
    # Akumulatory wzrostów (nominalny / realny)
    # ------------------------------
    def _cumulative_nominal_growth(self, from_year: int, to_year: int) -> Decimal:
        factor = ONE
        if to_year > from_year:
            for y in range(from_year, to_year):
                factor *= (ONE + self._nominal_wage_growth_rate_for_year(y))
        elif to_year < from_year:
            for y in range(to_year, from_year):
                factor /= (ONE + self._nominal_wage_growth_rate_for_year(y))
        return factor

    def _cumulative_real_growth(self, from_year: int, to_year: int) -> Decimal:
        """
        Skumulowany REALNY wzrost płac (bez inflacji) między latami.
        """
        factor = ONE
        if to_year > from_year:
            for y in range(from_year, to_year):
                factor *= (ONE + self._real_wage_growth_rate_for_year(y))
        elif to_year < from_year:
            for y in range(to_year, from_year):
                factor /= (ONE + self._real_wage_growth_rate_for_year(y))
        return factor

    # ------------------------------
    # Pensje: nominalna i realna (z makro)
    # ------------------------------
    def salary_in_the_past_or_future_nominal(self, current_salary: Decimal, year_delta: int) -> Decimal:
        """
        NOMINALNA: doświadczenie × skumulowany nominalny wzrost płac.
        """
        real_salary = self.salary_in_the_past_or_future_real(current_salary, year_delta)
        target_year = self.current_year + year_delta
        nominal_factor = self._cumulative_nominal_growth(self.current_year, target_year)
        return real_salary * nominal_factor

    def salary_in_the_past_or_future_real_with_macro(self, current_salary: Decimal, year_delta: int) -> Decimal:
        """
        REALNA: doświadczenie × skumulowany REALNY wzrost płac.
        """
        base = self.salary_in_the_past_or_future_real(current_salary, year_delta)
        target_year = self.current_year + year_delta
        real_factor = self._cumulative_real_growth(self.current_year, target_year)
        return base * real_factor

    # ------------------------------
    # Pola pochodne
    # ------------------------------
    @computed_field  # type: ignore
    @property
    def work_start_year(self) -> int:
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
        config = RetirementAgeConfig()
        return self.retirement_age or config.get_retirement_age(self.is_male)

    # --- pomocnicze do eventów ---
    @property
    def birth_year(self) -> int:
        return self.current_year - self.current_age

    def age_in_year(self, year: int) -> int:
        """Wiek w danym roku kalendarzowym."""
        return year - self.birth_year

    def contribution_multiplier_for_age(self, age: int) -> Decimal:
        """
        Końcowy mnożnik podstawy składek dla danego wieku:
        - jeśli jakikolwiek event z basis_zero=True pokrywa wiek → 0
        - w przeciwnym razie min(contrib_multiplier) z pokrywających
        - brak eventów → 1
        """
        applicable = [e for e in self.non_functional_events if e.start_age <= age < e.end_age]
        if not applicable:
            return Decimal("1")
        if any(e.basis_zero for e in applicable):
            return Decimal("0")
        min_m = min(e.contrib_multiplier for e in applicable)
        return Decimal(str(min_m))

    # ------------------------------
    # Składki roczne (z miesięcznego brutto)
    # ------------------------------
    def calculate_annual_contribution_i_pillar(self, gross_monthly_salary: Decimal) -> Decimal:
        return gross_monthly_salary * self.zus_contribution_rate.i_pillar_rate * Decimal("12")

    def calculate_annual_contribution_ii_pillar(self, gross_monthly_salary: Decimal) -> Decimal:
        return gross_monthly_salary * self.zus_contribution_rate.ii_pillar_rate * Decimal("12")

    # ------------------------------
    # Stopy waloryzacji I/II: nominalne i realne
    # ------------------------------
    def get_i_pillar_valorization_rate(self, year: int) -> Decimal:
        ys = str(year)
        if ys in self.macroeconomic_factors.historical_data:
            return self.macroeconomic_factors.historical_data[ys][2]
        return self.macroeconomic_factors.i_pillar_indexation_rate

    def get_ii_pillar_indexation_rate(self, year: int) -> Decimal:
        ys = str(year)
        if ys in self.macroeconomic_factors.historical_data:
            return self.macroeconomic_factors.historical_data[ys][3]
        return self.macroeconomic_factors.ii_pillar_indexation_rate

    def get_i_pillar_real_valorization_rate(self, year: int) -> Decimal:
        r_nom = self.get_i_pillar_valorization_rate(year)
        pi    = self._inflation_rate_for_year(year)
        return (ONE + r_nom) / (ONE + pi) - ONE

    def get_ii_pillar_real_indexation_rate(self, year: int) -> Decimal:
        r_nom = self.get_ii_pillar_indexation_rate(year)
        pi    = self._inflation_rate_for_year(year)
        return (ONE + r_nom) / (ONE + pi) - ONE

    # ------------------------------
    # Waloryzacja kapitału: nominal / real
    # ------------------------------
    def valorize_i_pillar_capital(self, capital: Decimal, from_year: int, to_year: int) -> Decimal:
        out = capital
        for y in range(from_year, to_year):
            out *= (ONE + self.get_i_pillar_valorization_rate(y))
        return out

    def index_ii_pillar_capital(self, capital: Decimal, from_year: int, to_year: int) -> Decimal:
        out = capital
        for y in range(from_year, to_year):
            out *= (ONE + self.get_ii_pillar_indexation_rate(y))
        return out

    def valorize_i_pillar_capital_real(self, capital: Decimal, from_year: int, to_year: int) -> Decimal:
        out = capital
        for y in range(from_year, to_year):
            out *= (ONE + self.get_i_pillar_real_valorization_rate(y))
        return out

    def index_ii_pillar_capital_real(self, capital: Decimal, from_year: int, to_year: int) -> Decimal:
        out = capital
        for y in range(from_year, to_year):
            out *= (ONE + self.get_ii_pillar_real_indexation_rate(y))
        return out

    # ------------------------------
    # Rekonstrukcja i projekcja (NOMINALNIE) — z eventami
    # ------------------------------
    def reconstruct_historical_contributions(self) -> tuple[Decimal, Decimal]:
        """
        NOMINAL: składki od nominalnej pensji miesięcznej, modyfikowane przez eventy,
        zwaloryzowane/indexowane do roku bieżącego.
        """
        total_i = self.accumulated_i_pillar_capital or Decimal("0")
        total_ii = self.accumulated_ii_pillar_capital or Decimal("0")

        for year in range(self.work_start_year, self.current_year):
            year_delta = year - self.current_year
            base_monthly_nom = self.salary_in_the_past_or_future_nominal(self.current_salary, year_delta)

            age_then = self.age_in_year(year)
            mult = self.contribution_multiplier_for_age(age_then)
            if mult == 0:
                continue

            adj_monthly = base_monthly_nom * mult
            i_contrib = self.calculate_annual_contribution_i_pillar(adj_monthly)
            ii_contrib = self.calculate_annual_contribution_ii_pillar(adj_monthly)

            total_i += self.valorize_i_pillar_capital(i_contrib, year, self.current_year)
            total_ii += self.index_ii_pillar_capital(ii_contrib, year, self.current_year)
        return total_i, total_ii

    def project_future_accumulation(self) -> tuple[Decimal, Decimal]:
        """
        NOMINAL: projekcja do roku emerytury z eventami, waloryzacja/indexacja do roku emerytury.
        """
        total_i = Decimal("0")
        total_ii = Decimal("0")
        retirement_year = self.current_year + self.years_to_standard_retirement

        for year in range(self.current_year, retirement_year):
            year_delta = year - self.current_year
            base_monthly_nom = self.salary_in_the_past_or_future_nominal(self.current_salary, year_delta)

            age_then = self.age_in_year(year)
            mult = self.contribution_multiplier_for_age(age_then)
            if mult == 0:
                continue

            adj_monthly = base_monthly_nom * mult
            i_contrib = self.calculate_annual_contribution_i_pillar(adj_monthly)
            ii_contrib = self.calculate_annual_contribution_ii_pillar(adj_monthly)

            total_i += self.valorize_i_pillar_capital(i_contrib, year, retirement_year)
            total_ii += self.index_ii_pillar_capital(ii_contrib, year, retirement_year)
        return total_i, total_ii

    # ------------------------------
    # Rekonstrukcja i projekcja (REALNIE) — z eventami
    # ------------------------------
    def reconstruct_historical_contributions_real(self) -> tuple[Decimal, Decimal]:
        """
        REAL: składki od pensji REALNYCH (doświadczenie × real growth) z eventami,
        waloryzowane realnie do roku bieżącego.
        """
        total_i = Decimal("0")
        total_ii = Decimal("0")

        # (opcjonalnie) już zgromadzone kapitały — tu bez zmiany, są nominalne na dziś
        if self.accumulated_i_pillar_capital:
            total_i += self.valorize_i_pillar_capital_real(self.accumulated_i_pillar_capital,
                                                           self.current_year, self.current_year)
        if self.accumulated_ii_pillar_capital:
            total_ii += self.index_ii_pillar_capital_real(self.accumulated_ii_pillar_capital,
                                                          self.current_year, self.current_year)

        for year in range(self.work_start_year, self.current_year):
            year_delta = year - self.current_year
            base_monthly_real = self.salary_in_the_past_or_future_real_with_macro(self.current_salary, year_delta)

            age_then = self.age_in_year(year)
            mult = self.contribution_multiplier_for_age(age_then)
            if mult == 0:
                continue

            adj_monthly = base_monthly_real * mult
            i_contrib = self.calculate_annual_contribution_i_pillar(adj_monthly)
            ii_contrib = self.calculate_annual_contribution_ii_pillar(adj_monthly)

            total_i += self.valorize_i_pillar_capital_real(i_contrib, year, self.current_year)
            total_ii += self.index_ii_pillar_capital_real(ii_contrib, year, self.current_year)
        return total_i, total_ii

    def project_future_accumulation_real(self) -> tuple[Decimal, Decimal]:
        """
        REAL: projekcja do roku emerytury z eventami, waloryzacja realna do roku emerytury.
        """
        total_i = Decimal("0")
        total_ii = Decimal("0")
        retirement_year = self.current_year + self.years_to_standard_retirement

        for year in range(self.current_year, retirement_year):
            year_delta = year - self.current_year
            base_monthly_real = self.salary_in_the_past_or_future_real_with_macro(self.current_salary, year_delta)

            age_then = self.age_in_year(year)
            mult = self.contribution_multiplier_for_age(age_then)
            if mult == 0:
                continue

            adj_monthly = base_monthly_real * mult
            i_contrib = self.calculate_annual_contribution_i_pillar(adj_monthly)
            ii_contrib = self.calculate_annual_contribution_ii_pillar(adj_monthly)

            total_i += self.valorize_i_pillar_capital_real(i_contrib, year, retirement_year)
            total_ii += self.index_ii_pillar_capital_real(ii_contrib, year, retirement_year)
        return total_i, total_ii

    # ------------------------------
    # Łączny kapitał na emeryturę
    # ------------------------------
    def calculate_total_retirement_capital(self) -> tuple[Decimal, Decimal]:
        """Nominalnie."""
        past_i, past_ii = self.reconstruct_historical_contributions()
        future_i, future_ii = self.project_future_accumulation()

        retirement_year = self.current_year + self.years_to_standard_retirement
        past_i_at_ret = self.valorize_i_pillar_capital(past_i, self.current_year, retirement_year)
        past_ii_at_ret = self.index_ii_pillar_capital(past_ii, self.current_year, retirement_year)

        return past_i_at_ret + future_i, past_ii_at_ret + future_ii

    def calculate_total_retirement_capital_real(self) -> tuple[Decimal, Decimal]:
        """Realnie."""
        past_i, past_ii = self.reconstruct_historical_contributions_real()
        future_i, future_ii = self.project_future_accumulation_real()

        retirement_year = self.current_year + self.years_to_standard_retirement
        past_i_at_ret = self.valorize_i_pillar_capital_real(past_i, self.current_year, retirement_year)
        past_ii_at_ret = self.index_ii_pillar_capital_real(past_ii, self.current_year, retirement_year)

        return past_i_at_ret + future_i, past_ii_at_ret + future_ii

    # ------------------------------
    # Emerytura miesięczna
    # ------------------------------
    def _life_expectancy_years_default(self) -> int:
        retirement_age = self.effective_retirement_age
        years = (84 - retirement_age) if self.is_male else (88 - retirement_age)
        return max(1, years)

    def calculate_monthly_pension(
        self,
        total_i_pillar: Optional[Decimal] = None,
        total_ii_pillar: Optional[Decimal] = None,
        life_expectancy_years: Optional[int] = None,
    ) -> Decimal:
        """Nominalnie."""
        if total_i_pillar is None or total_ii_pillar is None:
            total_i_pillar, total_ii_pillar = self.calculate_total_retirement_capital()
        life_expectancy_years = life_expectancy_years or self._life_expectancy_years_default()
        return (total_i_pillar + total_ii_pillar) / Decimal(str(life_expectancy_years * 12))

    def calculate_monthly_pension_real(self) -> Decimal:
        """Realnie."""
        total_i, total_ii = self.calculate_total_retirement_capital_real()
        life_expectancy_years = self._life_expectancy_years_default()
        return (total_i + total_ii) / Decimal(str(life_expectancy_years * 12))

    # ------------------------------
    # Replacement rate
    # ------------------------------
    def get_replacement_rate_nominal(self) -> Decimal:
        mp = self.calculate_monthly_pension()
        yrs = self.years_to_standard_retirement
        final_salary_nom = self.salary_in_the_past_or_future_nominal(self.current_salary, yrs)
        return (mp / final_salary_nom) if final_salary_nom else Decimal("0")

    def get_replacement_rate_real(self) -> Decimal:
        mp_real = self.calculate_monthly_pension_real()
        yrs = self.years_to_standard_retirement
        final_salary_real = self.salary_in_the_past_or_future_real_with_macro(self.current_salary, yrs)
        return (mp_real / final_salary_real) if final_salary_real else Decimal("0")

    # ------------------------------
    # Szczegóły (obie waluty)
    # ------------------------------
    def get_detailed_breakdown(self) -> dict:
        # nominal
        total_i_nom, total_ii_nom = self.calculate_total_retirement_capital()
        monthly_pension_nom = self.calculate_monthly_pension(total_i_nom, total_ii_nom)
        rr_nom = self.get_replacement_rate_nominal()

        # real
        total_i_real, total_ii_real = self.calculate_total_retirement_capital_real()
        monthly_pension_real = self.calculate_monthly_pension_real()
        rr_real = self.get_replacement_rate_real()

        yrs = self.years_to_standard_retirement
        final_salary_nom = self.salary_in_the_past_or_future_nominal(self.current_salary, yrs)
        final_salary_real = self.salary_in_the_past_or_future_real_with_macro(self.current_salary, yrs)

        return {
            "current_age": self.current_age,
            "retirement_age": self.effective_retirement_age,
            "years_to_retirement": yrs,

            # salaries
            "current_monthly_salary_nominal": self.current_salary,
            "final_monthly_salary_nominal": final_salary_nom,
            "final_monthly_salary_real": final_salary_real,

            # nominal block
            "i_pillar_capital_nominal": total_i_nom,
            "ii_pillar_capital_nominal": total_ii_nom,
            "total_capital_nominal": total_i_nom + total_ii_nom,
            "monthly_pension_nominal": monthly_pension_nom,
            "replacement_rate_percent_nominal": rr_nom * Decimal("100"),

            # real block
            "i_pillar_capital_real": total_i_real,
            "ii_pillar_capital_real": total_ii_real,
            "total_capital_real": total_i_real + total_ii_real,
            "monthly_pension_real": monthly_pension_real,
            "replacement_rate_percent_real": rr_real * Decimal("100"),
        }

    # ------------------------------
    # Oś czasu dla obu walut (z eventami)
    # ------------------------------
    def get_cumulative_capital_by_year(self) -> dict[int, dict]:
        timeline = {}
        retirement_year = self.current_year + self.years_to_standard_retirement

        for target_year in range(self.current_year, retirement_year + 1):
            # NOMINAL: sumujemy po latach pracy do target_year z eventami
            i_nom = Decimal("0")
            ii_nom = Decimal("0")
            for y in range(self.work_start_year, target_year):
                yd = y - self.current_year
                sal_nom = self.salary_in_the_past_or_future_nominal(self.current_salary, yd)

                age_then = self.age_in_year(y)
                mult = self.contribution_multiplier_for_age(age_then)
                if mult == 0:
                    continue
                adj = sal_nom * mult

                i_nom += self.valorize_i_pillar_capital(self.calculate_annual_contribution_i_pillar(adj), y, target_year)
                ii_nom += self.index_ii_pillar_capital(self.calculate_annual_contribution_ii_pillar(adj), y, target_year)

            # REAL: analogicznie, ale pensje realne i waloryzacja realna
            i_real = Decimal("0")
            ii_real = Decimal("0")
            for y in range(self.work_start_year, target_year):
                yd = y - self.current_year
                sal_real = self.salary_in_the_past_or_future_real_with_macro(self.current_salary, yd)

                age_then = self.age_in_year(y)
                mult = self.contribution_multiplier_for_age(age_then)
                if mult == 0:
                    continue
                adj = sal_real * mult

                i_real += self.valorize_i_pillar_capital_real(self.calculate_annual_contribution_i_pillar(adj), y, target_year)
                ii_real += self.index_ii_pillar_capital_real(self.calculate_annual_contribution_ii_pillar(adj), y, target_year)

            # Pensje w roku target_year (bez redukcji eventem — do referencji/wykresu)
            yrs_since = target_year - self.current_year
            sal_nom_year  = self.salary_in_the_past_or_future_nominal(self.current_salary, yrs_since)
            sal_real_year = self.salary_in_the_past_or_future_real_with_macro(self.current_salary, yrs_since)

            timeline[target_year] = {
                "i_pillar_nominal": i_nom,
                "ii_pillar_nominal": ii_nom,
                "total_nominal": i_nom + ii_nom,
                "annual_salary_nominal": sal_nom_year * Decimal("12"),

                "i_pillar_real": i_real,
                "ii_pillar_real": ii_real,
                "total_real": i_real + ii_real,
                "annual_salary_real": sal_real_year * Decimal("12"),
            }

        return timeline

    def get_timeline_for_visualization(self) -> list[dict]:
        tl = self.get_cumulative_capital_by_year()
        return [{"year": y, **data} for y, data in sorted(tl.items())]


if __name__ == "__main__":
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

        breakdown = pension.get_detailed_breakdown()
        print(breakdown)
        timeline = pension.get_timeline_for_visualization()
        print(timeline[:2], "...", timeline[-1] if timeline else None)


    asyncio.run(main())
