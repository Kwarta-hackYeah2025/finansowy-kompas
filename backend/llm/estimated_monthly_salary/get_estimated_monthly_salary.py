from decimal import Decimal

from backend.llm.client import client
from backend.llm.estimated_monthly_salary import Salary
import logging

logger = logging.getLogger(__name__)

async def get_estimated_monthly_salary(industry: str, location: str) -> Decimal:
    """
    Estimates the monthly gross salary in PLN using an LLM and the instructor module,
    for a junior position based on industry and location.

    Args:
        industry (str): The industry/profession (e.g., 'Frontend developer', 'General doctor')
        location (str): The city/location in Poland (e.g., 'Kraków', 'Łódź')

    Returns:
        Decimal: Estimated monthly gross salary in PLN with two decimal places
             (e.g., '9000.00', '7773.00')
    """

    response = await client.chat.completions.create(
        response_model=Salary,
        messages=[
            {
                "role": "system",
                "content": """
                    Estimate the monthly gross salary ("brutto") in PLN of of a starting junior hire for the industry
                    industry and location (use the most recent data). Your response should only contain the number with
                    exactly two decimal places use a dot as the decimal separator.
                    Do not include text, spaces, currency symbols, or the input string.
                    Estimated salary cannot be lower than the current minimal wage (4666.00).
                        Example inputs: ["Frontend developer | Kraków", "General doctor | Łódź", "IT specialist | Katowice"]
                        Example VALID outputs: ["9000.00", "7773.00", "4750.00"]
                        Example INVALID outputs: ["salary: 9000.00", "7773,00", "4750.00 PLN"]
                    """,
            },
            {"role": "user", "content": f"{industry} | {location}"},
        ],
    )

    logger.info(f"LLM sever returned a salary: {response.salary} for industry: {industry} and location: {location}")
    return response.salary
