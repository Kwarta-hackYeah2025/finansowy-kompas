import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
import logging

from II_base_pension.model.experience_multiplier_function import (
    experience_multiplier_function,
)
from utils import use_cwd

logger = logging.getLogger(__name__)


def calculate_regression(
    row_index: int,
    csv_path: str = use_cwd("data/salary_growth.csv"),
):
    """
    For given data with earnings for different years of experience, calculate the regression for the experience
    multiplier (the salary normalized by the starting salary at 0 years of experience) based on this formula:
    experience_multiplier(exp) = 1 + α · (1 - e^(-β·exp))
    """
    # Load data
    df = pd.read_csv(csv_path)
    if row_index < 0 or row_index >= len(df):
        raise ValueError(f"Row index {row_index} is out of range [0, {len(df)-1}]")

    # Extract salary data and normalize by starting salary
    experience_points = np.array(
        [1, 3.5, 7.5, 12.5, 20]
    )  # midpoints of experience ranges
    salary_data = np.array(
        [
            df.iloc[row_index]["0-2_Years"],
            df.iloc[row_index]["2-5_Years"],
            df.iloc[row_index]["5-10_Years"],
            df.iloc[row_index]["10-15_Years"],
            df.iloc[row_index]["20+_Years"],
        ]
    )
    multipliers = salary_data / salary_data[0]  # normalize by starting salary
    x0 = 1  # align years of experience with 1 year to be in accordance with the data

    try:
        popt, _ = curve_fit(
            lambda x, a, b: experience_multiplier_function(x, a, b, x0=x0),
            experience_points,
            multipliers,
            p0=[1.0, 0.1],
            bounds=((0.0, 0.0), (np.inf, np.inf)),
        )
        alpha, beta = popt
        return alpha, beta
    except RuntimeError as e:
        logger.warning(f"Regression failed for row {row_index} ({df.iloc[row_index]['Job_Description']}): {e}")
        return None, None
