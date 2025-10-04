import numpy as np
import matplotlib.pyplot as plt
from utils import use_cwd
import logging
import utils.logging_config  # noqa: F401  # side-effect import to configure logging

logger = logging.getLogger(__name__)

def experience_multiplier(
    exp: int, alpha: float = 0.85, beta: float = 0.12
) -> float:
    """Calculate experience multiplier based on years of experience using the model:
    multiplier = 1 + alpha * (1 - e^(-beta * YearsOfExperience))

    Args:
        exp (int): Years of experience
        alpha (float): Maximum additional multiplier (default: 0.85)
        beta (float): Growth rate parameter (default: 0.12)

    Returns:
        float: Experience multiplier value(s)
    """
    result = 1 + alpha * (1 - np.exp(-beta * exp))
    return result


if __name__ == "__main__":
    exp_years = np.linspace(0, 20, 100)
    multipliers = [experience_multiplier(exp_year) for exp_year in exp_years]

    plt.figure(figsize=(10, 6))
    plt.plot(exp_years, multipliers, "b-", linewidth=2)
    plt.grid(True, linestyle="--", alpha=0.7)
    plt.xlabel("Years of Experience")
    plt.ylabel("Experience Multiplier")
    plt.title("Experience Multiplier Function")

    # Add some padding to the axes
    plt.margins(x=0.02)
    try:
        plt.savefig(use_cwd('experience_multiplier.png'), dpi=300, bbox_inches="tight")
        logger.info(
            f"Experience multiplier plot saved successfully to: {use_cwd('experience_multiplier.png')}"
        )
    except Exception as e:
        logger.error(f"Error saving experience multiplier plot: {e}")
    plt.show()
