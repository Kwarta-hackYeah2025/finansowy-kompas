import os.path
import matplotlib.pyplot as plt

from models.salary_regressions.classification.WageProgressionClassifier import (
    WageProgressionClassifier,
)

classifier = WageProgressionClassifier()
classifier.load_data(filepath=os.path.join("II_base_pension", "model", "data", "regression_results.csv"))

# Visualize raw data to identify potential clusters
overview_fig = classifier.plot_data_overview()
plt.show()

# Iterate through all supported methods, evaluate per-method, and show key outputs
methods = ["KMeans", "GMM", "Hierarchical_Ward", "Hierarchical_Complete"]
for method in methods:
    print("\n" + "#" * 80)
    print(f"Evaluating and fitting method: {method}")
    print("#" * 80)

    result = classifier.evaluate_and_fit_method(method_name=method, k_range=range(2, 11))

    # Optionally, access artifacts:
    # result["metrics_df"], result["best_k"], result["validation_fig"],
    # result["profiles_fig"], result.get("dendrogram_fig"), result["summary_df"]

    # Cluster profiles and summaries are already generated inside evaluate_and_fit_method.
    # You can export classifications per method if desired:
    # classifier.export_classification(method_name=method, output_file=f"classification_{method}.csv")
