"""
Sentra ML service (v3: character-pattern model + safety rules).
Run: python predict_api.py     (keep this window open)
"""
import re

import joblib
from flask import Flask, jsonify, request

app = Flask(__name__)
model = joblib.load("model_best_v3.joblib")

WORDS = ["login", "verify", "secure", "account", "update", "bank",
         "signin", "confirm", "password", "paypal", "free", "bonus"]


def normalize(url) -> str:
    u = str(url).strip().lower()
    u = re.sub(r"^[a-z][a-z0-9+.-]*://", "", u)
    u = re.sub(r"^www\d*\.", "", u)
    return u


def rule_flags(raw: str):
    u = normalize(raw)
    host = u.split("/")[0].split("@")[-1].split(":")[0]
    flags = []
    if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host):
        flags.append("Uses an IP address instead of a domain name")
    if "@" in u.split("/")[0]:
        flags.append("Contains '@' symbol (can hide the real destination)")
    hits = [w for w in WORDS if w in u]
    if len(hits) >= 2:
        flags.append("Contains several suspicious keywords: " + ", ".join(hits))
    if host.count("-") >= 3:
        flags.append("Many hyphens in the domain")
    if host.count(".") >= 4:
        flags.append("Unusually many subdomains")
    return flags


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": "v3"})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    url = str(data.get("url", "")).strip()
    if not url:
        return jsonify({"error": "url is required"}), 400

    prob = float(model.predict_proba([normalize(url)])[0][1])
    flags = rule_flags(url)
    reasons = []

    if prob < 0.30:
        verdict = "SAFE"
    elif prob < 0.70:
        verdict = "SUSPICIOUS"
    else:
        verdict = "MALICIOUS"

    # Safety rules: a risky-looking link can never be called SAFE
    if flags:
        reasons.extend(flags)
        if verdict == "SAFE":
            verdict = "SUSPICIOUS"
            reasons.append("Sent for analyst review by safety rules")
    if not url.lower().startswith("https://"):
        reasons.append("Does not use HTTPS")
    reasons.append(f"Model phishing probability: {prob * 100:.0f}%")

    return jsonify({
        "url": url,
        "verdict": verdict,
        "confidence": round(max(prob, 1 - prob) * 100, 1),
        "phishingProbability": round(prob, 4),
        "reasons": reasons,
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)