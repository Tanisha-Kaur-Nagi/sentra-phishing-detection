# Sentra: AI-Powered Phishing URL Detection Platform

TYBCA Semester V project by **Tanisha Kaur**.

Sentra checks a link (URL) and says whether it is **Safe**, **Suspicious** or **Malicious**. A machine learning model reads the link, and risky links go to human security analysts for a final decision.

## Features
- **ML detection:** model reads the character patterns of a URL and gives a verdict with reasons
- **Safety rules:** links with an IP address, "@", many hyphens or several suspicious keywords can never be marked Safe
- **Human review:** suspicious links need 3 analyst votes, and the majority becomes the final verdict
- **Three roles:** User, Analyst and Admin dashboards, with role-based page protection on the website
- **Subscription plans:** Free, Solo, Team and Business, with daily scan limits enforced
- **Demo checkout:** simulated card payment that activates a plan (see Payments below)
- **Admin analytics:** real revenue overview and analyst performance table

## Tech stack
| Part | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Java, Spring Boot, Spring Data JPA |
| Database | MySQL (XAMPP) |
| ML service | Python, scikit-learn, Flask |

## Machine learning summary
- Data: about 745,000 URLs from two Kaggle datasets (PhiUSIIL and malicious_phish)
- First model scored 99.57%, but this was misleading: a dataset shortcut ("www" appeared in all safe URLs). I found it, cleaned the data and rebuilt the model.
- Final model (v3): character n-grams + TF-IDF + logistic regression
- Results: accuracy 91.27%, precision 89.54%, recall 73.98%, F1 0.81
- Graphs and result files are in the `ml` folder

## Payments
- The demo uses a **simulated checkout**. Use the test card `4111 1111 1111 1111`, any expiry like `12/30` and any 3-digit CVV. No real money is used.
- Order creation was also tested against the **Cashfree sandbox**. It needs your own test keys in `backend/src/main/resources/cashfree-secrets.properties` (this file is private and not in the repository):
  ```
  cashfree.client-id=YOUR_TEST_APP_ID
  cashfree.client-secret=YOUR_TEST_SECRET
  ```
  Without this file the backend still starts, and only the Cashfree endpoints are disabled.
- Real payment gateways need business verification, so a live gateway is future scope.

## Known limitations
- The model reads only the URL text. It has no live data such as domain age.
- It still flags some real sites and misses some phishing links, which is why safety rules and analyst review exist.
- Page protection is on the website only. The backend API is still open, so this project is not secured for public deployment.
- The demo checkout has no real payment check.
- Some admin charts use sample data.

## How to run
Datasets and trained model files are not in this repository (too large). Run the training scripts in `ml` to create them.

1. Start MySQL in XAMPP and create the database `sentinel_db`
2. ML service: `cd ml`, then `python predict_api.py` (runs on port 5000)
3. Backend: `cd backend`, then `mvnw.cmd spring-boot:run` (port 8080). The tables are created automatically.
4. Add the plans once, in phpMyAdmin (SQL tab, database `sentinel_db`):
   ```sql
   INSERT INTO plans (name, price_per_month, scans_per_day, seats, api_access) VALUES
   ('Free', 0, 5, 1, FALSE),
   ('Solo', 199, 100, 1, FALSE),
   ('Team', 799, 500, 5, FALSE),
   ('Business', 2999, NULL, 25, TRUE);
   ```
5. Frontend: `cd frontend`, then `npm install` and `npm run dev` (port 5173)

## Folders
- `backend` Spring Boot REST API
- `frontend` React web app
- `ml` training scripts, results and the Flask prediction service