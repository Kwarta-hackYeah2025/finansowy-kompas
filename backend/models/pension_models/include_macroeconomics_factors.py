from decimal import Decimal

from backend.models.pension_models.MacroeconomicFactors import MacroeconomicFactors


def include_macroeconomics_factors(
    income: Decimal,
    years: int,
    macroeconomic_factors=MacroeconomicFactors(
        inflation_rate=Decimal(0.025),
        real_wage_growth_rate=Decimal(0.02),
        # gdp_growth_rate=Decimal(0.03),
    ),
):
    nominal_growth_rate = (
        macroeconomic_factors.real_wage_growth_rate
        + macroeconomic_factors.inflation_rate
    )

    results = {
        "nominal_income": income * ((1 + nominal_growth_rate) ** years),
        "real_income": income
        * ((1 + macroeconomic_factors.real_wage_growth_rate) ** years),
    }

    return results
