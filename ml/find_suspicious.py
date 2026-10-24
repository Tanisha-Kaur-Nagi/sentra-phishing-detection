import joblib
import pandas as pd
from train_model import url_features

model = joblib.load("model_best.joblib")
order = list(model.feature_names_in_)

urls = [
    "https://www.wikipedia.org",
    "https://wikipedia.org/wiki/Python",
    "https://github.com/torvalds/linux",
    "https://www.google.com/search?q=cats",
    "https://example.com",
    "https://example.com/",
    "http://example.com",
    "http://example.com/login",
    "https://shop.example.com",
    "https://my-bank-secure.com",
    "https://paypal-login.com",
    "http://free-gift.net",
    "https://example.com/about",
    "https://news.example.com/world",
    "https://example.co.in",
    "https://www.example.com/contact-us",
    "https://docs.python.org/3/",
    "http://192.168.1.10",
]

for u in urls:
    p = model.predict_proba(pd.DataFrame([url_features(u)])[order])[0][1]
    band = "SAFE" if p < 0.15 else ("SUSPICIOUS  <== USE THIS" if p < 0.85 else "MALICIOUS")
    print(f"{p:.3f}  {band:<26} {u}")