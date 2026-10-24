"""
Sentra - test the v2 model on real-looking links.
Run:  python test_model_v2.py
Test your own link:  python test_model_v2.py "github.com/some/repo"
"""
import sys

import joblib
import pandas as pd

from train_v2 import url_features

model = joblib.load("model_best_v2.joblib")
order = list(model.feature_names_in_)


def phishing_probability(url):
    return float(model.predict_proba(pd.DataFrame([url_features(url)])[order])[0][1])


def band(p):
    if p < 0.30:
        return "SAFE"
    if p < 0.70:
        return "SUSPICIOUS"
    return "MALICIOUS"


# Your own link from the command line
if len(sys.argv) > 1:
    for u in sys.argv[1:]:
        p = phishing_probability(u)
        print(f"{p:.3f}  {band(p):<11} {u}")
    sys.exit()

SAFE_LINKS = [
    "https://www.wikipedia.org",
    "wikipedia.org/wiki/Python",
    "en.wikipedia.org/wiki/Machine_learning",
    "github.com/torvalds/linux",
    "docs.python.org/3/",
    "python.org/downloads",
    "https://www.google.com/search?q=cats",
    "stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster",
    "bbc.com/news/world",
    "https://www.microsoft.com/en-us/windows",
    "youtube.com/watch?v=dQw4w9WgXcQ",
    "amazon.in",
    "flipkart.com",
    "irctc.co.in",
    "nptel.ac.in/courses",
    "mit.edu",
    "news.ycombinator.com",
    "https://www.hdfcbank.com",
    "example.com",
    "http://example.com/about",
]

PHISHING_LINKS = [
    "http://secure-login-verify.example.com/account/update?id=1",
    "paypal-verify-account.com/signin",
    "http://paypal-login.com",
    "http://192.168.1.10/paypal/login.php",
    "http://free-gift.net/claim?id=123&ref=abc",
    "http://amaz0n-account-update.com/login.php",
    "http://sbi-online-verify-secure.com/netbanking/login",
    "update-your-bank-password.info/confirm/account",
    "http://login.microsoftonline.com.secure-check.xyz/signin",
    "http://paypa1.com-verify.net/webscr?cmd=login",
    "http://apple-id-locked.support-center.top/verify/account",
    "http://free-bonus-gift.click/claim",
    "http://user@192.168.0.5/bank/login",
    "https://secure-bank-login-confirm-password.com/verify",
]


def run(title, links, expect_phishing):
    print(f"\n===== {title} =====")
    ok = 0
    for u in links:
        p = phishing_probability(u)
        correct = (p >= 0.5) if expect_phishing else (p < 0.5)
        ok += correct
        mark = "PASS" if correct else "FAIL"
        print(f"{mark}  {p:.3f}  {band(p):<11} {u}")
    print(f"--> {ok} of {len(links)} correct")
    return ok


safe_ok = run("SAFE links (should be SAFE)", SAFE_LINKS, expect_phishing=False)
phish_ok = run("PHISHING-style links (should be MALICIOUS)", PHISHING_LINKS, expect_phishing=True)

print("\n===== SUMMARY =====")
print(f"Safe links called safe:           {safe_ok}/{len(SAFE_LINKS)}")
print(f"Phishing links caught (recall):   {phish_ok}/{len(PHISHING_LINKS)}")
total = safe_ok + phish_ok
print(f"Overall: {total}/{len(SAFE_LINKS) + len(PHISHING_LINKS)} correct")
print("\nNote: the phishing links are made up to look like phishing, not live attacks.")
print("This is a quick sanity test. The official numbers are the confusion matrix from train_v2.py.")