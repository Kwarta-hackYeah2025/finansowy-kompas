import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from utils import use_cwd
from models.salary_regressions.calculate_regression import calculate_regression
from models.salary_regressions.experience_multiplier_function import (
    experience_multiplier_function,
)


def plot_salary_data(
    row_index: int,
    csv_path: str = use_cwd("data/salary_growth.csv"),
    output_file: str | None = None,
    show_regression: bool = False,
) -> None:
    """
    Plot salary data from a CSV file for a specific job description.

    Args:
        csv_path: Path to CSV file with salary data
        row_index: Index of the row to plot
        output_file: Optional path to save the plot
        show_regression: Whether to display the regression curve on the plot
    """

    df = pd.read_csv(csv_path)
    if row_index < 0 or row_index >= len(df):
        raise ValueError(f"Row index {row_index} is out of range [0, {len(df)-1}]")

    plt.figure(figsize=(10, 6))
    experience_points = np.array([1, 3.5, 7.5, 12.5, 20.0])
    labels = [
        "0–2 (1y)",
        "2–5 (3.5y)",
        "5–10 (7.5y)",
        "10–15 (12.5y)",
        "20+ (20y)",
    ]
    experience_data = [
        df.iloc[row_index]["0-2_Years"],
        df.iloc[row_index]["2-5_Years"],
        df.iloc[row_index]["5-10_Years"],
        df.iloc[row_index]["10-15_Years"],
        df.iloc[row_index]["20+_Years"],
    ]

    plt.scatter(
        experience_points,  # not range(5)
        experience_data,
        s=150,
        c="#2E86C1",
        alpha=0.6,
        edgecolor="navy",
        linewidth=1.5,
        marker="o",
        label="Salary",
    )

    # Customize plot
    plt.grid(True, linestyle="--", alpha=0.7)
    plt.xlabel("Experience Range", fontsize=12, labelpad=10)
    plt.ylabel("Salary (PLN)", fontsize=12, labelpad=10)
    plt.title(
        f"Salary Growth for {df.iloc[row_index]['Job_Description']}",
        fontsize=14,
        pad=20,
    )
    plt.xticks(experience_points, labels, rotation=45, fontsize=10)
    plt.yticks(fontsize=10)
    plt.gca().yaxis.set_major_formatter(
        plt.FuncFormatter(lambda xp, p: f"{xp:,.0f} PLN")
    )
    if show_regression:
        alpha, beta = calculate_regression(row_index, csv_path)
        if alpha is None or beta is None:
            return

        x_smooth = np.linspace(0, 20, 100)
        y_smooth = (
            experience_multiplier_function(x_smooth, alpha, beta) * experience_data[0]
        )
        plt.plot(x_smooth, y_smooth, "r-", label="Regression curve", alpha=0.7)

    plt.legend(fontsize=10)
    plt.tight_layout()

    # Save or show plot
    if output_file:
        plt.savefig(output_file, dpi=300, bbox_inches="tight")
    else:
        plt.show()


if __name__ == "__main__":
    plot_salary_data(
        59,
        show_regression=True,
        # output_file=use_cwd("salary_progression7.png")
    )
