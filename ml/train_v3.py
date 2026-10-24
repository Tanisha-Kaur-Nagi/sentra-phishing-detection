"""
Sentra - ML training v3: the model reads the URL text (character patterns).
Run: python train_v3.py
"""
import json
import re

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.feature_extraction.text import HashingVectorizer, TfidfTransformer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, ConfusionMatrixDisplay)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline

PHI_CSV = "PhiUSIIL_Phishing_URL_Dataset.csv"
NEW_CSV = "malicious_phish.csv"


def normalize(url) -> str:
    u = str(url).strip().lower()
    u = re.sub(r"^[a-z][a-z0-9+.-]*://", "", u)
    u = re.sub(r"^www\d*\.", "", u)
    return u


def build_model():
    return make_pipeline(
        HashingVectorizer(analyzer="char", ngram_range=(3, 5), n_features=2**20,
                          alternate_sign=False, norm=None),
        TfidfTransformer(sublinear_tf=True),
        SGDClassifier(loss="log_loss", alpha=1e-6, max_iter=30, tol=1e-4, random_state=42),
    )


SAFE_LINKS = [
    "https://www.wikipedia.org", "wikipedia.org/wiki/Python",
    "en.wikipedia.org/wiki/Machine_learning", "github.com/torvalds/linux",
    "docs.python.org/3/", "python.org/downloads", "https://www.google.com/search?q=cats",
    "stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster",
    "bbc.com/news/world", "https://www.microsoft.com/en-us/windows",
    "youtube.com/watch?v=dQw4w9WgXcQ", "amazon.in", "flipkart.com", "irctc.co.in",
    "nptel.ac.in/courses", "mit.edu", "news.ycombinator.com",
    "https://www.hdfcbank.com", "example.com", "http://example.com/about",
]
PHISHING_LINKS = [
    "http://secure-login-verify.example.com/account/update?id=1",
    "paypal-verify-account.com/signin", "http://paypal-login.com",
    "http://192.168.1.10/paypal/login.php", "http://free-gift.net/claim?id=123&ref=abc",
    "http://amaz0n-account-update.com/login.php",
    "http://sbi-online-verify-secure.com/netbanking/login",
    "update-your-bank-password.info/confirm/account",
    "http://login.microsoftonline.com.secure-check.xyz/signin",
    "http://paypa1.com-verify.net/webscr?cmd=login",
    "http://apple-id-locked.support-center.top/verify/account",
    "http://free-bonus-gift.click/claim", "http://user@192.168.0.5/bank/login",
    "https://secure-bank-login-confirm-password.com/verify",
]


def main():
    print("Loading datasets...")
    phi = pd.read_csv(PHI_CSV, usecols=["URL", "label"])
    phi = pd.DataFrame({"url": phi["URL"], "label": (phi["label"] == 0).astype(int)})
    new = pd.read_csv(NEW_CSV)
    new = new[new["type"].isin(["benign", "phishing"])]
    new = pd.DataFrame({"url": new["url"], "label": (new["type"] == "phishing").astype(int)})

    df = pd.concat([phi, new], ignore_index=True)
    df["norm"] = df["url"].map(normalize)
    df = df.drop_duplicates(subset=["norm", "label"])
    df = df.drop_duplicates(subset=["norm"], keep=False).reset_index(drop=True)
    print("Rows:", len(df), "| Phishing:", int(df["label"].sum()))

    Xtr, Xte, ytr, yte = train_test_split(df["norm"], df["label"], test_size=0.2,
                                          stratify=df["label"], random_state=42)
    print("Training (a few minutes)...")
    model = build_model()
    model.fit(Xtr, ytr)

    pred = model.predict(Xte)
    cm = confusion_matrix(yte, pred)
    res = {
        "accuracy": round(accuracy_score(yte, pred), 4),
        "precision": round(precision_score(yte, pred), 4),
        "recall": round(recall_score(yte, pred), 4),
        "f1": round(f1_score(yte, pred), 4),
        "confusion_matrix": cm.tolist(),
    }
    print("\n=== v3 RESULT (compare: v2 accuracy 0.8209, recall 0.7471, f1 0.6775) ===")
    for k, v in res.items():
        print(f"  {k:<17}: {v}")
    ConfusionMatrixDisplay(cm, display_labels=["Legitimate", "Phishing"]).plot(cmap="Blues")
    plt.title("v3 character-pattern model")
    plt.savefig("v3_confusion_matrix.png", dpi=150, bbox_inches="tight")
    plt.close()

    joblib.dump(model, "model_best_v3.joblib", compress=3)
    with open("metrics_v3.json", "w") as f:
        json.dump(res, f, indent=2)

    def prob(u):
        return float(model.predict_proba([normalize(u)])[0][1])

    def band(p):
        return "SAFE" if p < 0.30 else ("SUSPICIOUS" if p < 0.70 else "MALICIOUS")

    print("\n===== SAFE links (should be SAFE) =====")
    ok1 = 0
    for u in SAFE_LINKS:
        p = prob(u)
        good = p < 0.5
        ok1 += good
        print(f"{'PASS' if good else 'FAIL'}  {p:.3f}  {band(p):<11} {u}")
    print("\n===== PHISHING-style links (should be MALICIOUS) =====")
    ok2 = 0
    for u in PHISHING_LINKS:
        p = prob(u)
        good = p >= 0.5
        ok2 += good
        print(f"{'PASS' if good else 'FAIL'}  {p:.3f}  {band(p):<11} {u}")
    print(f"\nSUMMARY: safe correct {ok1}/{len(SAFE_LINKS)} | phishing caught {ok2}/{len(PHISHING_LINKS)}")
    print("(v2 was: safe 11/20, phishing 11/14)")
    print("Saved: model_best_v3.joblib, metrics_v3.json, v3_confusion_matrix.png")


if __name__ == "__main__":
    main()