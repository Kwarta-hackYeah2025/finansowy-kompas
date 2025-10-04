import pandas as pd
from pandas import notnull

from backend.utils import use_cwd
from backend.models.salary_regressions.calculate_regression import calculate_regression
import logging

logger = logging.getLogger(__name__)


def generate_regression_data(
    csv_path: str = use_cwd("data/salary_growth.csv"),
):
    """
    This function uses the regression model from the calculate_regression function to generate the regression parameters
    for every row in the salary_growth.csv file.
    """
    df = pd.read_csv(csv_path)
    regression_params = pd.DataFrame(
        [calculate_regression(idx, csv_path) for idx in df.index],
        columns=["alpha", "beta"],
    )
    regression_params["Job_Description"] = df["Job_Description"]
    regression_params = regression_params.dropna()
    return regression_params[["Job_Description", "alpha", "beta"]]


if __name__ == "__main__":
    try:
        regression_data = generate_regression_data()
        output_path = use_cwd("data/regression_results.csv")
        regression_data.to_csv(output_path, index=False)
        logger.info(f"Regression parameters saved to {output_path}")
    except Exception as e:
        logger.error(f"Error generating regression parameters: {e}")
