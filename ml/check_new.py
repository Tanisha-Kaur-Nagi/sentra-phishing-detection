import pandas as pd

d = pd.read_csv("malicious_phish.csv")
print(d.columns.tolist())
print(d.iloc[:, 1].value_counts())
print(d.head(8).to_string())