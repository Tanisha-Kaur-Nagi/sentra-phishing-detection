import pandas as pd

df = pd.read_csv("PhiUSIIL_Phishing_URL_Dataset.csv")
df["www"] = df["URL"].str.contains("://www.", regex=False)
print(df.groupby("label")["www"].mean().round(3))
print("(label 1 = legitimate, 0 = phishing)")