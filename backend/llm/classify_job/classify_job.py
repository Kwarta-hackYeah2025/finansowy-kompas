from llm.client import client
from llm.classify_job.JobEnum import JobEnum
import logging

logger = logging.getLogger(__name__)

async def classify_job(industry: str) -> str:
    """
    Classifies the job title based on the user-provided description of the industry (which can a job title, name of the
    industry, etc. in Polish or in English). Options for the classification are provided in the regression_dict.py 
    dictionary.

    Args:
        industry (str): The industry/profession/job description
        (e.g., 'Frontend developer', 'Lekarz', 'budownictwo', 'uczę dzieci' etc.)

    Returns:
        one of the regression_dict.py dictionary keys.
    """

    response = await client.chat.completions.create(
        response_model=JobEnum,
        messages=[
            {
                "role": "system",
                "content": """
                Classify the job title based on the user-provided description of the industry
                (which can a job title, name of the industry, etc. in Polish or in English).
                Respond ONLY with one of the predefined categories from the regression dictionary.
                Return ONLY the category string, with no additional words, labels, or punctuation.
                
                Pick the category that best matches the job description or at least the pay progression of the job.
                
                If none of the predefined categories matches, respond with the category 'AVERAGE - Polish Worker General'.
                    Examples: [
                        "programmer" -> "IT - Software Developer Frontend",
                        "lekarz" -> "Healthcare - Doctor General",
                        "architekt" -> "Construction - Architect",
                        "teacher" -> "Education - Primary Teacher"
                    ]
                    Example INVALID outputs: ["category: IT specialist", "Architekt", "Branża budowlana"]
                """,
            },
            {"role": "user", "content": industry},
        ],
    )

    logger.info(f"LLM server returned category: {response.category} for industry: {industry}")
    return response.category
