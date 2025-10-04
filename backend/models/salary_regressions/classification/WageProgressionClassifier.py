import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    calinski_harabasz_score,
)
from scipy.cluster.hierarchy import dendrogram, linkage
import warnings

warnings.filterwarnings("ignore")


class WageProgressionClassifier:
    """
    A comprehensive system for classifying job titles based on wage progression parameters.
    """

    def __init__(self, data=None):
        """
        Initialize the classifier.

        Parameters:
        -----------
        data : pd.DataFrame with columns ['job_title', 'param1', 'param2']
        """
        self.data = data
        self.scaler = StandardScaler()
        self.scaled_params = None
        self.models = {}
        self.results = {}

    def load_data(self, filepath=None, dataframe=None):
        """Load data from the file or dataframe"""
        if filepath:
            self.data = pd.read_csv(filepath)
        elif dataframe is not None:
            self.data = dataframe
        else:
            raise ValueError("Provide either filepath or dataframe")

        # Validate columns
        required_cols = ["Job_Description", "alpha", "beta"]
        if not all(col in self.data.columns for col in required_cols):
            raise ValueError(f"Data must contain columns: {required_cols}")

        # Standardize parameters
        self.scaled_params = self.scaler.fit_transform(self.data[["alpha", "beta"]])
        print(f"✓ Loaded {len(self.data)} job titles")

    def evaluate_clustering_range(self, method="kmeans", k_range=range(2, 11)):
        """
        Evaluate different numbers of clusters using multiple metrics.

        Returns validation metrics for each k.
        """
        metrics = {
            "k": [],
            "inertia": [],
            "silhouette": [],
            "davies_bouldin": [],
            "calinski_harabasz": [],
        }

        for k in k_range:
            if method == "kmeans":
                model = KMeans(n_clusters=k, random_state=42, n_init=10)
            elif method == "gmm":
                model = GaussianMixture(n_components=k, random_state=42)
            elif method == "hierarchical_ward":
                model = AgglomerativeClustering(n_clusters=k, linkage="ward")
            elif method == "hierarchical_complete":
                model = AgglomerativeClustering(n_clusters=k, linkage="complete")
            else:
                raise ValueError("Method must be one of: 'kmeans', 'gmm', 'hierarchical_ward', 'hierarchical_complete'")

            labels = model.fit_predict(self.scaled_params)

            metrics["k"].append(k)

            # Inertia (for KMeans) or BIC (for GMM). Not applicable for hierarchical methods.
            if method == "kmeans":
                metrics["inertia"].append(model.inertia_)
            elif method == "gmm":
                metrics["inertia"].append(model.bic(self.scaled_params))
            else:
                metrics["inertia"].append(np.nan)

            # Silhouette score (higher is better, range [-1, 1])
            metrics["silhouette"].append(silhouette_score(self.scaled_params, labels))

            # Davies-Bouldin score (lower is better)
            metrics["davies_bouldin"].append(
                davies_bouldin_score(self.scaled_params, labels)
            )

            # Calinski-Harabasz score (higher is better)
            metrics["calinski_harabasz"].append(
                calinski_harabasz_score(self.scaled_params, labels)
            )

        return pd.DataFrame(metrics)

    def plot_validation_metrics(self, metrics_df, method_name="KMeans"):
        """Plot all validation metrics in a grid"""
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle(
            f"Clustering Quality Metrics - {method_name}",
            fontsize=16,
            fontweight="bold",
        )

        # Elbow plot (Inertia or BIC)
        axes[0, 0].plot(
            metrics_df["k"], metrics_df["inertia"], "bo-", linewidth=2, markersize=8
        )
        axes[0, 0].set_xlabel("Number of Clusters (k)", fontsize=11)
        axes[0, 0].set_ylabel(
            "Inertia" if method_name == "KMeans" else "BIC", fontsize=11
        )
        axes[0, 0].set_title("Elbow Method", fontsize=12, fontweight="bold")
        axes[0, 0].grid(True, alpha=0.3)

        # Silhouette score (higher is better)
        axes[0, 1].plot(
            metrics_df["k"], metrics_df["silhouette"], "go-", linewidth=2, markersize=8
        )
        best_k_sil = metrics_df.loc[metrics_df["silhouette"].idxmax(), "k"]
        axes[0, 1].axvline(
            best_k_sil,
            color="red",
            linestyle="--",
            alpha=0.7,
            label=f"Best k={int(best_k_sil)}",
        )
        axes[0, 1].set_xlabel("Number of Clusters (k)", fontsize=11)
        axes[0, 1].set_ylabel("Silhouette Score", fontsize=11)
        axes[0, 1].set_title(
            "Silhouette Score (Higher is Better)", fontsize=12, fontweight="bold"
        )
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)

        # Davies-Bouldin score (lower is better)
        axes[1, 0].plot(
            metrics_df["k"],
            metrics_df["davies_bouldin"],
            "ro-",
            linewidth=2,
            markersize=8,
        )
        best_k_db = metrics_df.loc[metrics_df["davies_bouldin"].idxmin(), "k"]
        axes[1, 0].axvline(
            best_k_db,
            color="green",
            linestyle="--",
            alpha=0.7,
            label=f"Best k={int(best_k_db)}",
        )
        axes[1, 0].set_xlabel("Number of Clusters (k)", fontsize=11)
        axes[1, 0].set_ylabel("Davies-Bouldin Score", fontsize=11)
        axes[1, 0].set_title(
            "Davies-Bouldin Index (Lower is Better)", fontsize=12, fontweight="bold"
        )
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)

        # Calinski-Harabasz score (higher is better)
        axes[1, 1].plot(
            metrics_df["k"],
            metrics_df["calinski_harabasz"],
            "mo-",
            linewidth=2,
            markersize=8,
        )
        best_k_ch = metrics_df.loc[metrics_df["calinski_harabasz"].idxmax(), "k"]
        axes[1, 1].axvline(
            best_k_ch,
            color="red",
            linestyle="--",
            alpha=0.7,
            label=f"Best k={int(best_k_ch)}",
        )
        axes[1, 1].set_xlabel("Number of Clusters (k)", fontsize=11)
        axes[1, 1].set_ylabel("Calinski-Harabasz Score", fontsize=11)
        axes[1, 1].set_title(
            "Calinski-Harabasz Index (Higher is Better)", fontsize=12, fontweight="bold"
        )
        axes[1, 1].legend()
        axes[1, 1].grid(True, alpha=0.3)

        plt.tight_layout()
        return fig

    def plot_data_overview(self, annotate=False, bins=30, cmap="Blues"):
        """Visualize raw parameter space to spot potential clusters.

        Creates a joint-style figure with:
        - Scatter of alpha vs beta
        - Hexbin density overlay
        - Marginal histograms for alpha and beta

        Parameters:
        - annotate: bool, whether to annotate points with Job_Description (can be cluttered)
        - bins: int, number of bins for histograms
        - cmap: str, colormap name for density hexbin
        """
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data first.")

        alpha = self.data["alpha"].values
        beta = self.data["beta"].values

        from matplotlib.gridspec import GridSpec

        fig = plt.figure(figsize=(12, 10))
        gs = GridSpec(4, 4, figure=fig)

        ax_histx = fig.add_subplot(gs[0, 0:3])
        ax_scatter = fig.add_subplot(gs[1:4, 0:3])
        ax_histy = fig.add_subplot(gs[1:4, 3])

        # Scatter with light styling
        ax_scatter.scatter(alpha, beta, s=60, alpha=0.6, edgecolors="black")
        ax_scatter.set_xlabel("alpha", fontsize=12)
        ax_scatter.set_ylabel("beta", fontsize=12)
        ax_scatter.set_title("Parameter space: alpha vs beta", fontsize=14, fontweight="bold")
        ax_scatter.grid(True, alpha=0.3)

        # Density overlay (hexbin)
        hb = ax_scatter.hexbin(alpha, beta, gridsize=25, cmap=cmap, alpha=0.5)
        cbar = fig.colorbar(hb, ax=ax_scatter)
        cbar.set_label("Density")

        # Optional annotations (could be dense)
        if annotate and "Job_Description" in self.data.columns:
            for x, y, label in zip(alpha, beta, self.data["Job_Description" ].values):
                ax_scatter.annotate(str(label), (x, y), fontsize=6, alpha=0.7)

        # Marginal histograms
        ax_histx.hist(alpha, bins=bins, color="#4c72b0")
        ax_histx.set_ylabel("Count")
        ax_histx.grid(True, alpha=0.2)
        ax_histy.hist(beta, bins=bins, orientation="horizontal", color="#55a868")
        ax_histy.set_xlabel("Count")
        ax_histy.grid(True, alpha=0.2)

        plt.tight_layout()
        return fig

    def fit_single_method(self, method_name="KMeans", n_clusters=5):
        """Fit a single clustering method and store its results."""
        method_map = {
            "KMeans": KMeans(n_clusters=n_clusters, random_state=42, n_init=10),
            "Hierarchical_Ward": AgglomerativeClustering(n_clusters=n_clusters, linkage="ward"),
            "Hierarchical_Complete": AgglomerativeClustering(n_clusters=n_clusters, linkage="complete"),
            "GMM": GaussianMixture(n_components=n_clusters, random_state=42),
        }
        if method_name not in method_map:
            raise ValueError("Unknown method_name. Use one of: 'KMeans', 'GMM', 'Hierarchical_Ward', 'Hierarchical_Complete'")

        model = method_map[method_name]
        labels = model.fit_predict(self.scaled_params)

        # Calculate metrics
        sil_score = silhouette_score(self.scaled_params, labels)
        db_score = davies_bouldin_score(self.scaled_params, labels)
        ch_score = calinski_harabasz_score(self.scaled_params, labels)

        self.models[method_name] = model
        self.results[method_name] = {
            "labels": labels,
            "silhouette": sil_score,
            "davies_bouldin": db_score,
            "calinski_harabasz": ch_score,
            "n_clusters": n_clusters,
        }
        return self.results[method_name]

    def evaluate_and_fit_method(self, method_name="KMeans", k_range=range(2, 11), selection_metric="silhouette"):
        """
        Evaluate k-range for a method, plot validation metrics, select best k, fit the method,
        and produce key visualizations and summary.
        Returns a dict with metrics_df, best_k, validation_fig, profiles_fig, summary_df, and optional dendrogram_fig.
        """
        eval_key_map = {
            "KMeans": "kmeans",
            "GMM": "gmm",
            "Hierarchical_Ward": "hierarchical_ward",
            "Hierarchical_Complete": "hierarchical_complete",
        }
        if method_name not in eval_key_map:
            raise ValueError("Unknown method_name for evaluation.")

        metrics_df = self.evaluate_clustering_range(method=eval_key_map[method_name], k_range=k_range)
        validation_fig = self.plot_validation_metrics(metrics_df, method_name=method_name)

        # Choose best k
        if selection_metric.lower() == "silhouette":
            best_k = int(metrics_df.loc[metrics_df["silhouette"].idxmax(), "k"])
        elif selection_metric.lower() in ("davies_bouldin", "db"):
            best_k = int(metrics_df.loc[metrics_df["davies_bouldin"].idxmin(), "k"])
        elif selection_metric.lower() in ("calinski_harabasz", "ch"):
            best_k = int(metrics_df.loc[metrics_df["calinski_harabasz"].idxmax(), "k"])
        elif selection_metric.lower() == "inertia":
            # For KMeans: lower is better. For GMM, column holds BIC (lower is better). For hierarchical, values are NaN -> fallback to silhouette.
            col = "inertia"
            if metrics_df[col].notna().any():
                best_k = int(metrics_df.loc[metrics_df[col].idxmin(), "k"])
            else:
                best_k = int(metrics_df.loc[metrics_df["silhouette"].idxmax(), "k"])
        else:
            best_k = int(metrics_df.loc[metrics_df["silhouette"].idxmax(), "k"])

        _ = self.fit_single_method(method_name=method_name, n_clusters=best_k)

        # Visualizations and summary for the fitted method
        profiles_fig = self.plot_cluster_profiles(method_name=method_name)
        summary_df = self.get_cluster_summary(method_name=method_name)

        result = {
            "metrics_df": metrics_df,
            "best_k": best_k,
            "validation_fig": validation_fig,
            "profiles_fig": profiles_fig,
            "summary_df": summary_df,
        }

        if method_name.startswith("Hierarchical"):
            try:
                dendrogram_fig = self.plot_dendrogram(method="ward" if method_name == "Hierarchical_Ward" else "complete")
                result["dendrogram_fig"] = dendrogram_fig
            except Exception:
                pass

        return result

    def fit_multiple_methods(self, n_clusters=5):
        """
        Fit multiple clustering methods and store results.
        """
        methods_config = {
            "KMeans": KMeans(n_clusters=n_clusters, random_state=42, n_init=10),
            "Hierarchical_Ward": AgglomerativeClustering(
                n_clusters=n_clusters, linkage="ward"
            ),
            "Hierarchical_Complete": AgglomerativeClustering(
                n_clusters=n_clusters, linkage="complete"
            ),
            "GMM": GaussianMixture(n_components=n_clusters, random_state=42),
        }

        for name, model in methods_config.items():
            labels = model.fit_predict(self.scaled_params)

            # Calculate metrics
            sil_score = silhouette_score(self.scaled_params, labels)
            db_score = davies_bouldin_score(self.scaled_params, labels)
            ch_score = calinski_harabasz_score(self.scaled_params, labels)

            self.models[name] = model
            self.results[name] = {
                "labels": labels,
                "silhouette": sil_score,
                "davies_bouldin": db_score,
                "calinski_harabasz": ch_score,
                "n_clusters": n_clusters,
            }

        # Create comparison dataframe
        comparison = pd.DataFrame(
            {
                "Method": list(self.results.keys()),
                "Silhouette": [self.results[m]["silhouette"] for m in self.results],
                "Davies-Bouldin": [
                    self.results[m]["davies_bouldin"] for m in self.results
                ],
                "Calinski-Harabasz": [
                    self.results[m]["calinski_harabasz"] for m in self.results
                ],
            }
        )

        print("\n" + "=" * 70)
        print(f"CLUSTERING COMPARISON (k={n_clusters})")
        print("=" * 70)
        print(comparison.to_string(index=False))
        print("\nMetric Interpretation:")
        print("  • Silhouette: Higher is better (range: -1 to 1)")
        print("  • Davies-Bouldin: Lower is better")
        print("  • Calinski-Harabasz: Higher is better")

        return comparison

    def plot_clusters_comparison(self):
        """Plot clusters from all methods side by side"""
        n_methods = len(self.results)
        fig, axes = plt.subplots(1, n_methods, figsize=(5 * n_methods, 5))

        if n_methods == 1:
            axes = [axes]

        for idx, (method_name, result) in enumerate(self.results.items()):
            ax = axes[idx]
            labels = result["labels"]

            scatter = ax.scatter(
                self.data["alpha"],
                self.data["beta"],
                c=labels,
                cmap="tab10",
                s=100,
                alpha=0.6,
                edgecolors="black",
            )

            ax.set_xlabel("Parameter 1", fontsize=11)
            ax.set_ylabel("Parameter 2", fontsize=11)
            ax.set_title(
                f'{method_name}\nSil: {result["silhouette"]:.3f}',
                fontsize=12,
                fontweight="bold",
            )
            ax.grid(True, alpha=0.3)

            # Add cluster centers for KMeans
            if method_name == "KMeans":
                centers = self.scaler.inverse_transform(
                    self.models[method_name].cluster_centers_
                )
                ax.scatter(
                    centers[:, 0],
                    centers[:, 1],
                    c="red",
                    marker="X",
                    s=300,
                    edgecolors="black",
                    linewidths=2,
                    label="Centroids",
                )
                ax.legend()

        plt.tight_layout()
        return fig

    def plot_dendrogram(self, method="ward"):
        """Plot hierarchical clustering dendrogram"""
        linkage_matrix = linkage(self.scaled_params, method=method)

        fig, ax = plt.subplots(figsize=(15, 7))
        dendrogram(
            linkage_matrix,
            ax=ax,
            labels=self.data["Job_Description"].values,
            leaf_font_size=8,
            color_threshold=0,
        )
        ax.set_xlabel("Job Title", fontsize=12)
        ax.set_ylabel("Distance", fontsize=12)
        ax.set_title(
            f"Hierarchical Clustering Dendrogram ({method.capitalize()} linkage)",
            fontsize=14,
            fontweight="bold",
        )
        plt.xticks(rotation=90)
        plt.tight_layout()
        return fig

    def plot_cluster_profiles(self, method_name="KMeans"):
        """
        Plot the wage progression curves for each cluster.
        Shows what each cluster's typical wage progression looks like.
        """
        if method_name not in self.results:
            raise ValueError(f"Method {method_name} not fitted yet")

        labels = self.results[method_name]["labels"]
        n_clusters = len(np.unique(labels))

        # Calculate cluster centroids in original space
        cluster_params = []
        for i in range(n_clusters):
            mask = labels == i
            centroid = self.data.loc[mask, ["alpha", "beta"]].mean()
            cluster_params.append(centroid)

        # Plot progression curves
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))

        # Years of experience
        years = np.linspace(0, 30, 100)

        # Subplot 1: All curves together
        for i, params in enumerate(cluster_params):
            # Assuming model: multiplier = alpha + beta * years
            # Adjust this formula based on your actual model!
            multiplier = params["alpha"] + params["beta"] * years
            axes[0].plot(years, multiplier, linewidth=3, label=f"Cluster {i}")

        axes[0].set_xlabel("Years of Experience", fontsize=12)
        axes[0].set_ylabel("Wage Multiplier", fontsize=12)
        axes[0].set_title(
            "Cluster Wage Progression Profiles", fontsize=14, fontweight="bold"
        )
        axes[0].legend(fontsize=10)
        axes[0].grid(True, alpha=0.3)

        # Subplot 2: Parameter space with cluster sizes
        for i in range(n_clusters):
            mask = labels == i
            cluster_data = self.data[mask]
            axes[1].scatter(
                cluster_data["alpha"],
                cluster_data["beta"],
                s=100,
                alpha=0.6,
                label=f"Cluster {i} (n={mask.sum()})",
                edgecolors="black",
            )

        axes[1].set_xlabel("Parameter 1", fontsize=12)
        axes[1].set_ylabel("Parameter 2", fontsize=12)
        axes[1].set_title("Clusters in Parameter Space", fontsize=14, fontweight="bold")
        axes[1].legend(fontsize=10)
        axes[1].grid(True, alpha=0.3)

        plt.tight_layout()
        return fig

    def get_cluster_summary(self, method_name="KMeans"):
        """Get detailed summary of each cluster"""
        if method_name not in self.results:
            raise ValueError(f"Method {method_name} not fitted yet")

        labels = self.results[method_name]["labels"]
        self.data["cluster"] = labels

        summary = []
        for cluster_id in sorted(self.data["cluster"].unique()):
            cluster_data = self.data[self.data["cluster"] == cluster_id]

            summary.append(
                {
                    "Cluster": cluster_id,
                    "Size": len(cluster_data),
                    "Alpha_mean": cluster_data["alpha"].mean(),
                    "Alpha_std": cluster_data["alpha"].std(),
                    "Beta_mean": cluster_data["beta"].mean(),
                    "Beta_std": cluster_data["beta"].std(),
                    "Example_jobs": ", ".join(cluster_data["Job_Description"].head(3).values),
                }
            )

        summary_df = pd.DataFrame(summary)
        print(f"\n{'='*100}")
        print(f"CLUSTER SUMMARY - {method_name}")
        print("=" * 100)
        print(summary_df.to_string(index=False))

        return summary_df

    def classify_new_job(self, param1, param2, method_name="KMeans"):
        """
        Classify a new job based on its parameters.
        """
        if method_name not in self.models:
            raise ValueError(f"Method {method_name} not fitted yet")

        # Scale the new parameters
        new_params_scaled = self.scaler.transform([[param1, param2]])

        # Predict cluster
        if method_name == "GMM":
            cluster = self.models[method_name].predict(new_params_scaled)[0]
        else:
            cluster = self.models[method_name].fit_predict(
                np.vstack([self.scaled_params, new_params_scaled])
            )[-1]

        return int(cluster)

    def export_classification(
        self, method_name="KMeans", output_file="job_classification.csv"
    ):
        """Export the final classification to CSV"""
        if method_name not in self.results:
            raise ValueError(f"Method {method_name} not fitted yet")

        output_df = self.data.copy()
        output_df["cluster"] = self.results[method_name]["labels"]
        output_df.to_csv(output_file, index=False)
        print(f"✓ Classification exported to {output_file}")

        return output_df


# Example usage workflow
if __name__ == "__main__":
    # Generate sample data (replace with your actual data)
    np.random.seed(42)
    n_jobs = 100

    # Simulate different job progression patterns
    jobs = []

    # Cluster 1: Flat progression (low param2)
    for i in range(20):
        jobs.append(
            {
                "job_title": f"FlatJob_{i}",
                "param1": np.random.uniform(1.0, 1.2),
                "param2": np.random.uniform(0.001, 0.01),
            }
        )

    # Cluster 2: Linear growth (moderate param2)
    for i in range(30):
        jobs.append(
            {
                "job_title": f"LinearJob_{i}",
                "param1": np.random.uniform(0.8, 1.0),
                "param2": np.random.uniform(0.02, 0.04),
            }
        )

    # Cluster 3: Steep growth (high param2)
    for i in range(25):
        jobs.append(
            {
                "job_title": f"SteepJob_{i}",
                "param1": np.random.uniform(0.6, 0.8),
                "param2": np.random.uniform(0.05, 0.08),
            }
        )

    # Cluster 4: Very steep growth
    for i in range(25):
        jobs.append(
            {
                "job_title": f"VerySteepJob_{i}",
                "param1": np.random.uniform(0.5, 0.7),
                "param2": np.random.uniform(0.09, 0.12),
            }
        )

    sample_data = pd.DataFrame(jobs)

    # Initialize classifier
    classifier = WageProgressionClassifier()
    classifier.load_data(dataframe=sample_data)

    # Step 1: Evaluate different numbers of clusters
    print("\n🔍 Step 1: Evaluating optimal number of clusters...")
    metrics = classifier.evaluate_clustering_range(
        method="kmeans", k_range=range(2, 11)
    )
    fig1 = classifier.plot_validation_metrics(metrics, method_name="KMeans")
    plt.show()

    # Step 2: Fit multiple methods with chosen k
    print("\n🔍 Step 2: Comparing clustering methods...")
    optimal_k = 4  # Based on metrics
    comparison = classifier.fit_multiple_methods(n_clusters=optimal_k)

    # Step 3: Visualize clusters
    print("\n🔍 Step 3: Visualizing clusters...")
    fig2 = classifier.plot_clusters_comparison()
    plt.show()

    # Step 4: Plot cluster profiles
    fig3 = classifier.plot_cluster_profiles(method_name="KMeans")
    plt.show()

    # Step 5: Get cluster summary
    summary = classifier.get_cluster_summary(method_name="KMeans")

    # Step 6: Classify a new job
    print("\n🔍 Step 6: Classifying new job...")
    new_cluster = classifier.classify_new_job(
        param1=0.9, param2=0.03, method_name="KMeans"
    )
    print(f"New job with (param1=0.9, param2=0.03) belongs to Cluster {new_cluster}")

    # Step 7: Export results
    classifier.export_classification(method_name="KMeans")

    print("\n✅ Analysis complete!")

