import asyncio
import logging
from decimal import Decimal

from models.calculate_salary.experience_multiplier import experience_multiplier
from models.salary_regressions.data.regression_dict import regression_dict
from llm.classify_job.classify_job import classify_job
from llm.estimated_monthly_salary.get_estimated_monthly_salary import (
    get_estimated_monthly_salary,
)

logger = logging.getLogger(__name__)


async def calculate_salary(industry: str, location: str, experience: int):
    """
    Calculate base salary based on industry, location and age using the model:
    salary = base_salary * experience_multiplier
    experience_multiplier = 1 + alpha * (1 - e^(-beta * years_of_experience))
    """

    category = await classify_job(industry)
    logger.info(f'Industry {industry} classified as: {category}')
    alpha, beta = regression_dict.get(category, (.85, .12))
    logger.info(f'alpha: {alpha}, beta: {beta}')
    multi = experience_multiplier(experience, float(alpha), float(beta))
    base_salary = await get_estimated_monthly_salary(industry, location)
    logger.info(f'calculating the salary based on based salary: {base_salary} and experience multiplier: {multi} for experience: {experience} years.')
    return round(Decimal(float(base_salary) * multi), 2)


if __name__ == "__main__":
    async def main():
        result = await calculate_salary("Pracuję jako prawnik", "Łódź", 20)
        print(result)

    asyncio.run(main())

