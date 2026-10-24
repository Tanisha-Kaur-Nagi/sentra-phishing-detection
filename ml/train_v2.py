"""
Sentra - ML training v2 (combined datasets, bias-free URL cleaning)
Datasets: PhiUSIIL + malicious_phish.csv (benign + phishing rows only)
Run: python train_v2.py
"""
import json
import re
import time
from urllib.parse import urlparse

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import (RandomForestClassifier, ExtraTreesClassifier,
                              HistGradientBoostingClassifier)
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, ConfusionMatrixDisplay)
from sklearn.model_selection import train_test_split

PHI_CSV = "PhiUSIIL_Phishing_URL_Dataset.csv"
NEW_CSV = "malicious_phish.csv"
RANDOM_STATE = 42
SUSPICIOUS_WORDS = ["login", "verify", "secure", "account", "update", "bank",
                    "signin", "confirm", "password", "paypal", "free", "bonus"]


def normalize(url) -> str:
    """Lowercase, remove http(s):// and www. so datasets cannot leak formatting habits."""
    u = str(url).strip().lower()
    u = re.sub(r"^[a-z][a-z0-9+.-]*://", "", u)
    u = re.sub(r"^www\d*\.", "", u)
    return u


def url_features(url: str) -> dict:
    u = normalize(url)
    try:
        p = urlparse("http://" + u)
        host = p.netloc.split("@")[-1].split(":")[0]
        path = p.path or ""
    except ValueError:
        host = u.split("/")[0].split(":")[0]
        path = u[len(host):]
    parts = host.split(".")
    letters = sum(c.isalpha() for c in u)
    digits = sum(c.isdigit() for c in u)
    specials = sum(not c.isalnum() for c in u)
    n = max(len(u), 1)
    return {
        "url_length": len(u),
        "domain_length": len(host),
        "path_length": len(path),
        "num_dots": u.count("."),
        "num_hyphens": u.count("-"),
        "num_slashes": u.count("/"),
        "num_digits": digits,
        "num_letters": letters,
        "digit_ratio": digits / n,
        "special_ratio": specials / n,
        "num_subdomains": max(len(parts) - 2, 0),
        "tld_length": len(parts[-1]) if parts else 0,
        "has_ip": int(bool(re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host))),
        "has_at": int("@" in u),
        "num_equals": u.count("="),
        "num_qmark": u.count("?"),
        "num_amp": u.count("&"),
        "num_suspicious_words": sum(w in u for w in SUSPICIOUS_WORDS),
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
    print("  confusion matrix:", cm.tolist())
    if plot:
        ConfusionMatrixDisplay(cm, display_labels=["Legitimate", "Phishing"]).plot(cmap="Blues")
        plt.title(name)
        fname = "v2_confusion_" + re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_") + ".png"
        plt.savefig(fname, dpi=150, bbox_inches="tight")
        plt.close()
    m["confusion_matrix"] = cm.tolist()
    return m


def correlation_heatmap(X):
    corr = X.corr().fillna(0)
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
    ax.set_title(f"Correlation matrix of the {len(corr.columns)} URL features (v2)")
    fig.tight_layout()
    fig.savefig("v2_correlation_heatmap.png", dpi=150, bbox_inches="tight")
    plt.close(fig)


def main():
    print("Loading datasets...")
    phi = pd.read_csv(PHI_CSV, usecols=["URL", "label"])
    phi = pd.DataFrame({"url": phi["URL"], "label": (phi["label"] == 0).astype(int), "source": "phiusiil"})

    new = pd.read_csv(NEW_CSV)
    new = new[new["type"].isin(["benign", "phishing"])]
    new = pd.DataFrame({"url": new["url"], "label": (new["type"] == "phishing").astype(int), "source": "malicious_phish"})

    df = pd.concat([phi, new], ignore_index=True)
    print("Rows before cleaning:", len(df))
    df["norm"] = df["url"].map(normalize)
    df = df.drop_duplicates(subset=["norm", "label"])
    df = df.drop_duplicates(subset=["norm"], keep=False)   # remove URLs that have both labels
    df = df.reset_index(drop=True)
    print("Rows after cleaning:", len(df))
    print("Phishing:", int(df["label"].sum()), "| Legitimate:", int((1 - df["label"]).sum()))
    print(df.groupby("source")["label"].agg(["count", "mean"]).rename(columns={"mean": "phishing_share"}))

    print("\nExtracting features (1-3 minutes)...")
    X = pd.DataFrame([url_features(u) for u in df["norm"]])
    y = df["label"]
    correlation_heatmap(X)

    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE)

    candidates = {
        "Random Forest (100 trees)": RandomForestClassifier(n_estimators=100, min_samples_leaf=2, class_weight="balanced", n_jobs=-1, random_state=RANDOM_STATE),
        "Random Forest (200 trees)": RandomForestClassifier(n_estimators=200, min_samples_leaf=2, class_weight="balanced", n_jobs=-1, random_state=RANDOM_STATE),
        "Random Forest (300 trees)": RandomForestClassifier(n_estimators=300, min_samples_leaf=2, class_weight="balanced", n_jobs=-1, random_state=RANDOM_STATE),
        "Extra Trees (200 trees)": ExtraTreesClassifier(n_estimators=200, min_samples_leaf=2, class_weight="balanced", n_jobs=-1, random_state=RANDOM_STATE),
        "Gradient Boosting": HistGradientBoostingClassifier(random_state=RANDOM_STATE),
    }
    comparison, fitted = [], {}
    for name, model in candidates.items():
        t0 = time.time()
        model.fit(Xtr, ytr)
        secs = round(time.time() - t0, 1)
        m = evaluate(name, model, Xte, yte, plot=False)
        m["train_seconds"] = secs
        comparison.append(m)
        fitted[name] = model

    comp_df = pd.DataFrame(comparison).drop(columns=["confusion_matrix"])
    print("\n================ MODEL COMPARISON (v2) ================")
    print(comp_df.to_string(index=False))
    comp_df.to_csv("v2_model_comparison.csv", index=False)

    best = max(comparison, key=lambda r: (r["f1"], r["accuracy"]))
    best_name = best["model"]
    best_model = fitted[best_name]
    print("\nBest model (highest F1):", best_name)
    joblib.dump(best_model, "model_best_v2.joblib", compress=3)
    evaluate(best_name, best_model, Xte, yte, plot=True)

    # Feature importance (only models that have it)
    if hasattr(best_model, "feature_importances_"):
        imp = pd.Series(best_model.feature_importances_, index=X.columns).sort_values(ascending=False)
        print("\nTop 8 features:")
        print(imp.head(8).round(4).to_string())
        imp.head(10).sort_values().plot(kind="barh", title=f"Top URL features ({best_name})")
        plt.savefig("v2_feature_importance.png", dpi=150, bbox_inches="tight")
        plt.close()

    with open("metrics_v2.json", "w") as f:
        json.dump({"rows": int(len(df)), "comparison": comparison, "best_model": best_name}, f, indent=2)

    # Real-world sanity check
    print("\n================ REAL LINK TEST (probability of phishing) ================")
    tests = [
        "https://www.wikipedia.org", "https://github.com/torvalds/linux",
        "https://docs.python.org/3/", "https://www.google.com/search?q=cats",
        "https://example.com", "https://example.com/about",
        "http://secure-login-verify.example.com/account/update?id=1",
        "https://paypal-login.com", "http://free-gift.net",
        "http://192.168.1.10/paypal/login.php", "http://example.com/claim-free-gift",
    ]
    order = list(best_model.feature_names_in_)
    for u in tests:
        p = best_model.predict_proba(pd.DataFrame([url_features(u)])[order])[0][1]
        print(f"  {p:.3f}  {u}")

    print("\nSaved: model_best_v2.joblib, metrics_v2.json, v2_model_comparison.csv, v2_*.png")


if __name__ == "__main__":
    main()