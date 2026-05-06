<p align="center">
  <img src="https://img.shields.io/badge/status-production-brightgreen" alt="Production" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License MIT" />
  <img src="https://img.shields.io/github/stars/normienishant/Delivo?style=social" alt="GitHub stars" />
</p>

<p align="center">
  <b>Predict · Simulate · Optimize</b><br>
  <em> A production-grade AI assistant that predicts delivery times, replays real historical orders, and automatically suggests fleet optimization — trained on 45,593 Indian delivery records. </em>
</p>

<p align="center">
  <a href="https://delivo.studio"><strong>🔗 Live Demo</strong></a> ·
  <a href="https://delivo-api-c1yb.onrender.com/docs"><strong>📖 API Docs</strong></a> ·
  <a href="#-features"><strong>✨ Features</strong></a>
</p>

---

## ✨ Features

- ⏱️ **Explainable Predictions** – XGBoost model outputs delivery time with confidence range and **SHAP** factor breakdown (e.g., fog adds +4.8 min).
- 📊 **Live Simulation** – Replays actual historical deliveries every 2 seconds, comparing predicted vs real time and tracking live accuracy.
- 🤖 **AI Copilot** – Monitors zone demand/driver ratios and recommends real-time fleet redistribution with estimated impact.
- 🗺️ **India-wide Location Search** – Restaurant & delivery addresses via **Ola Maps**, secured behind a server-side proxy (no API key exposure).
- 🎨 **Polished Analytics Dashboard** – Charts for weather, traffic, city type, and model performance (R² 0.82).
- 📱 **Fully Responsive** – Dark-amber professional theme, mobile-friendly, smooth animations.

---

- **Frontend:** Next.js static site on Vercel, custom domain `delivo.studio`.
- **Backend:** FastAPI on Render free tier; kept awake by an external cron job every 5 min.
- **Location Search:** Next.js API routes proxy requests to Ola Maps, falling back to Nominatim (OpenStreetMap) for maximum India coverage.
- **Data Ingestion:** Original Kaggle dataset (45,593 rows) cleaned, engineered, and trained locally; model serialized with pickle.

---

## 🧰 Tech Stack

| Layer        | Technology                                                                 |
|--------------|----------------------------------------------------------------------------|
| **Frontend**  | Next.js 15, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Leaflet     |
| **Backend**   | FastAPI, XGBoost, SHAP, Pandas, NumPy, Uvicorn                            |
| **ML Models** | XGBoost (delivery time), XGBoost (demand forecasting)                     |
| **Location**  | Ola Maps (autocomplete, geocode, reverse) + Nominatim fallback             |
| **Deployment**| Vercel (frontend), Render (backend), Cron-Job.org (keep-alive)             |

---

## 📈 Models & Performance

| Model | Task | MAE | R² | Features |
|-------|------|-----|----|----------|
| **Delivery Time Predictor** | Predict delivery duration | **3.19 min** | 0.821 | 22 features (incl. one-hot weather/traffic, interaction `severe_x_distance`) |
| **Demand Forecaster** | Predict hourly order volume | **9.2 orders** | — | 7 temporal features (lag, rolling avg, peak hour) |

**Explainability:** SHAP values drive the UI, showing how each feature contributed to a specific prediction — proven through the live demonstration.

---

## 🚀 Deployment

| Service       | Platform   | URL |
|---------------|------------|-----|
| **Frontend**  | Vercel     | [delivo.studio](https://delivo.studio) |
| **Backend**   | Render     | [delivo-api-c1yb.onrender.com](https://delivo-api-c1yb.onrender.com) |

- **Continuous Deployment:** GitHub push triggers automatic deploy on Vercel.
- **Backend Keep-Alive:** External cron job (Cron-Job.org) pings the Render API every 5 minutes to prevent spin-down.
- **Secrets:** All API keys are injected via environment variables; none are hardcoded.

---

## 📸 Screenshots

<p align="center">
  <b>Homepage / Landing</b><br><br>
  <img src="https://github.com/user-attachments/assets/75141367-b89b-44e5-b893-6dbb09cbc322" width="800"/>
</p>

<p align="center">
  <b>Predictions</b><br><br>
  <img src="https://github.com/user-attachments/assets/f0fb296e-3117-4ee5-beeb-50abe235763b" width="800"/>
</p>

<p align="center">
  <b>Simulation</b><br><br>
  <img src="https://github.com/user-attachments/assets/ec767355-1955-4cce-a600-a041c0d52fa1" width="800"/>
</p>

<p align="center">
  <b>Insights</b><br><br>
  <img src="https://github.com/user-attachments/assets/e4745bb9-534e-4395-9b67-00a18e66549d" width="800"/>
</p>

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 💬 Contact

**Nishant**  
- LinkedIn: [linkedin.com/in/designsbynishant](https://www.linkedin.com/in/designsbynishant/)  
- GitHub: [@normienishant](https://github.com/normienishant)  
- Project Live: [delivo.studio](https://delivo.studio)

---
