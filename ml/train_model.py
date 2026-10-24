"""
Sentra - ML training script (PhiUSIIL Phishing URL Dataset)

Trains and saves real, reproducible metrics:
  Model A: full dataset features  (best accuracy, needs page content to compute)
  Model B: URL-only features      (computable from just the URL string -> integrable)
  Extra: correlation heatmap + comparison of Random Forest (100/200/300),
         Extra Trees and Gradient Boosting. The best one is saved as model_best.joblib.

Dataset label: 1 = legitimate, 0 = phishing (we flip it so 1 = phishing below).

Setup:
    pip install pandas scikit-learn joblib matplotlib

Run (CSV in the same folder):
    python train_model.py
"""
import json
import re
import sys
import time
from urllib.parse import urlparse

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import (RandomForestClassifier, ExtraTreesClassifier,
                              GradientBoostingClassifier)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, ConfusionMatrixDisplay)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

CSV_PATH = sys.argv[1] if len(sys.argv) > 1 else "PhiUSIIL_Phishing_URL_Dataset.csv"
RANDOM_STATE = 42
SUSPICIOUS_WORDS = ["login", "verify", "secure", "account", "update", "bank",
                    "signin", "confirm", "password", "paypal", "free", "bonus"]


# ---------- URL-only feature extraction (reuse this at prediction time) ----------
def url_features(url: str) -> dict:
    url = str(url).strip()
    parsed = urlparse(url if "://" in url else "http://" + url)
    host = parsed.netloc.split(":")[0].lower()
    path = parsed.path or ""
    parts = host.split(".")
    letters = sum(c.isalpha() for c in url)
    digits = sum(c.isdigit() for c in url)
    specials = sum(not c.isalnum() for c in url)
    return {
        "url_length": len(url),
        "domain_length": len(host),
        "path_length": len(path),
        "num_dots": url.count("."),
        "num_hyphens": url.count("-"),
        "num_slashes": url.count("/"),
        "num_digits": digits,
        "num_letters": letters,
        "digit_ratio": digits / max(len(url), 1),
        "special_ratio": specials / max(len(url), 1),
        "num_subdomains": max(len(parts) - 2, 0),
        "tld_length": len(parts[-1]) if parts else 0,
        "is_https": int(parsed.scheme == "https"),
        "has_ip": int(bool(re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host))),
        "has_at": int("@" in url),
        "num_equals": url.count("="),
        "num_qmark": url.count("?"),
        "num_amp": url.count("&"),
        "num_suspicious_words": sum(w in url.lower() for w in SUSPICIOUS_WORDS),
    }


def evaluate(name, model, X_test, y_test, plot=True):
    pred = model.predict(X_test)
    m = {
        "model": name,
        "accuracy": round(accuracy_score(y_test, pred), 4),
        "precision": round(precision_score(y_test, pred), 4),
        "recall": round(recall_score(y_test, pred), 4),
        "f1": round(f1_score(y_test, pred), 4),
    }
    print(f"\n=== {name} ===")
    for k, v in m.items():
        if k != "model":
            print(f"  {k:<10}: {v}")
    cm = confusion_matrix(y_test, pred)
    if plot:
        ConfusionMatrixDisplay(cm, display_labels=["Legitimate", "Phishing"]).plot(cmap="Blues")
        plt.title(name)
        fname = "confusion_" + name.lower().replace(" ", "_").replace("(", "").replace(")", "") + ".png"
        plt.savefig(fname, dpi=150, bbox_inches="tight")
        plt.close()
    m["confusion_matrix"] = cm.tolist()
    return m


def correlation_heatmap(X_url, y):
    """Colour grid showing which features move together."""
    corr = X_url.corr().fillna(0)
    fig, ax = plt.subplots(figsize=(13, 11))
    im = ax.imshow(corr.values, cmap="coolwarm", vmin=-1, vmax=1)
    ax.set_xticks(range(len(corr.columns)))
    ax.set_xticklabels(corr.columns, rotation=90, fontsize=8)
    ax.set_yticks(range(len(corr.columns)))
    ax.set_yticklabels(corr.columns, fontsize=8)
    for i in range(len(corr)):
        for j in range(len(corr)):
            ax.text(j, i, f"{corr.iloc[i, j]:.1f}", ha="center", va="center", fontsize=6)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    ax.set_title("Correlation matrix of the 19 URL features")
    fig.tight_layout()
    fig.savefig("correlation_heatmap.png", dpi=150, bbox_inches="tight")
    plt.close(fig)

    # Strongly related feature pairs (easy talking points)
    upper = corr.where(np.triu(np.ones(corr.shape, dtype=bool), k=1)).stack()
    strong = upper[upper.abs() >= 0.8].sort_values(key=lambda s: s.abs(), ascending=False)
    print("\nStrongly correlated feature pairs (|r| >= 0.8):")
    if len(strong) == 0:
        print("  none")
    for (a, b), r in strong.items():
        print(f"  {r:+.2f}  {a}  <->  {b}")

    # How each feature relates to being phishing
    with_label = X_url.corrwith(y).fillna(0).sort_values(key=lambda s: s.abs(), ascending=False)
    print("\nCorrelation of each feature with 'is phishing' (top 8):")
    print(with_label.head(8).round(3).to_string())
    return corr


def main():
    print("Loading dataset:", CSV_PATH)
    df = pd.read_csv(CSV_PATH)
    print("Rows:", len(df), "| Columns:", len(df.columns))

    # Flip label so 1 = phishing (dataset uses 1 = legitimate)
    y = (df["label"] == 0).astype(int)
    print("Phishing:", int(y.sum()), "| Legitimate:", int((1 - y).sum()))

    results = []

    # ---------- Model A: full dataset numeric features ----------
    X_full = df.drop(columns=["label"]).select_dtypes(include="number")
    Xtr, Xte, ytr, yte = train_test_split(X_full, y, test_size=0.2,
                                          stratify=y, random_state=RANDOM_STATE)
    rf_full = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=RANDOM_STATE)
    rf_full.fit(Xtr, ytr)
    results.append(evaluate("Random Forest (full features)", rf_full, Xte, yte))
    joblib.dump(rf_full, "model_full_features.joblib")

    # ---------- Model B: URL-only features ----------
    print("\nExtracting URL-only features (takes ~10-30s)...")
    X_url = pd.DataFrame([url_features(u) for u in df["URL"]])

    # NEW: correlation heatmap
    correlation_heatmap(X_url, y)

    Xtr, Xte, ytr, yte = train_test_split(X_url, y, test_size=0.2,
                                          stratify=y, random_state=RANDOM_STATE)

    rf_url = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=RANDOM_STATE)
    rf_url.fit(Xtr, ytr)
    results.append(evaluate("Random Forest (URL-only)", rf_url, Xte, yte))
    joblib.dump(rf_url, "model_url_only.joblib")   # unchanged, your website can keep using this

    lr_url = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    lr_url.fit(Xtr, ytr)
    results.append(evaluate("Logistic Regression (URL-only)", lr_url, Xte, yte))

    # ---------- NEW: model comparison (same data, same split) ----------
    print("\nComparing models on URL-only features (takes about 5 minutes)...")
    candidates = {
        "Random Forest (100 trees)": RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=RANDOM_STATE),
        "Random Forest (200 trees)": RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=RANDOM_STATE),
        "Random Forest (300 trees)": RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=RANDOM_STATE),
        "Extra Trees (200 trees)": ExtraTreesClassifier(n_estimators=200, n_jobs=-1, random_state=RANDOM_STATE),
        "Gradient Boosting": GradientBoostingClassifier(random_state=RANDOM_STATE),
    }
    comparison = []
    fitted = {}
    for name, model in candidates.items():
        t0 = time.time()
        model.fit(Xtr, ytr)
        secs = round(time.time() - t0, 1)
        m = evaluate(name, model, Xte, yte, plot=False)
        m["train_seconds"] = secs
        comparison.append(m)
        fitted[name] = model

    comp_df = pd.DataFrame(comparison).drop(columns=["confusion_matrix"])
    print("\n================ MODEL COMPARISON ================")
    print(comp_df.to_string(index=False))
    comp_df.to_csv("model_comparison.csv", index=False)

    best = max(comparison, key=lambda r: (r["f1"], r["accuracy"]))
    best_name = best["model"]
    print("\nBest model (highest F1):", best_name)
    joblib.dump(fitted[best_name], "model_best.joblib")
    evaluate(best_name, fitted[best_name], Xte, yte, plot=True)   # saves its confusion matrix PNG

    # Top features for the URL-only forest (good slide material)
    imp = pd.Series(rf_url.feature_importances_, index=X_url.columns).sort_values(ascending=False)
    print("\nTop 8 URL-only features:")
    print(imp.head(8).round(4).to_string())
    imp.head(10).sort_values().plot(kind="barh", title="Top URL features (Random Forest)")
    plt.savefig("feature_importance.png", dpi=150, bbox_inches="tight")
    plt.close()

    with open("metrics.json", "w") as f:
        json.dump({"train_rows": int(len(Xtr)), "test_rows": int(len(Xte)),
                   "results": results,
                   "comparison": comparison,
                   "best_model": best_name,
                   "top_features": imp.head(10).round(4).to_dict()}, f, indent=2)

    # Quick sanity check on sample URLs
    samples = ["https://www.wikipedia.org",
               "http://secure-login-verify.example.com/account/update?id=1",
               "http://192.168.10.5/paypal/login.php"]
    probs = rf_url.predict_proba(pd.DataFrame([url_features(u) for u in samples]))[:, 1]
    print("\nSample predictions (probability of phishing):")
    for u, p in zip(samples, probs):
        print(f"  {p:.2f}  {u}")

    print("\nSaved: model_full_features.joblib, model_url_only.joblib, model_best.joblib,")
    print("       metrics.json, model_comparison.csv, correlation_heatmap.png, *.png")


if __name__ == "__main__":
    main()