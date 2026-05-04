import pandas as pd
import numpy as np
import pickle
import json
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error

with open("../models/artifacts.json", "r") as f:
    artifacts = json.load(f)

original_df = pd.read_csv("../data/train.csv")
original_df["Order_Date"]  = pd.to_datetime(original_df["Order_Date"], format="%d-%m-%Y", errors="coerce")
original_df["Time_Orderd"] = pd.to_datetime(original_df["Time_Orderd"], format="%H:%M:%S", errors="coerce")
original_df["order_hour"]  = original_df["Time_Orderd"].dt.hour
original_df["day_of_week"] = original_df["Order_Date"].dt.dayofweek
original_df["is_weekend"]  = original_df["day_of_week"].apply(lambda d: 1 if d >= 5 else 0)
original_df = original_df.dropna(subset=["Order_Date","order_hour"])
original_df["order_hour"]  = original_df["order_hour"].astype(int)

original_df["ds"] = original_df["Order_Date"] + pd.to_timedelta(original_df["order_hour"], unit="h")

ts = original_df.groupby("ds").agg(
    order_count=("Order_Date","count"),
    order_hour=("order_hour","first"),
    day_of_week=("day_of_week","first"),
    is_weekend=("is_weekend","first")
).reset_index().sort_values("ds").reset_index(drop=True)

PEAK_HOURS   = artifacts["peak_hours"]
ts["is_peak"] = ts["order_hour"].apply(lambda h: 1 if h in PEAK_HOURS else 0)

ts["prev_1h_count"]  = ts["order_count"].shift(1).fillna(0)
ts["prev_2h_count"]  = ts["order_count"].shift(2).fillna(0)
ts["rolling_avg_3h"] = ts["order_count"].shift(1).rolling(3, min_periods=1).mean().fillna(0)

print(f"Total time points: {len(ts)}")
print(ts.head(10))

FEATURES  = ["order_hour","day_of_week","is_weekend","is_peak",
             "prev_1h_count","prev_2h_count","rolling_avg_3h"]
X         = ts[FEATURES]
y         = ts["order_count"]

split_idx = int(len(ts) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")
print(f"Train: {ts['ds'].iloc[0].date()} → {ts['ds'].iloc[split_idx-1].date()}")
print(f"Test:  {ts['ds'].iloc[split_idx].date()} → {ts['ds'].iloc[-1].date()}")

baseline_mae = mean_absolute_error(y_test, np.full(len(y_test), y_train.mean()))
print(f"\nBaseline MAE: {baseline_mae:.1f} orders")

model  = XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=5, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mae    = mean_absolute_error(y_test, y_pred)
print(f"Demand MAE: {mae:.1f} orders")
print(f"Improvement: {baseline_mae - mae:.1f} orders")

forecast_std = round(float(np.std(y_test.values - y_pred)), 1)
print(f"Forecast Std: {forecast_std}")

print("\nSample Predictions:")
for i in range(8):
    print(f"  Pred: {int(y_pred[i])} | Actual: {int(y_test.values[i])} | Diff: {abs(int(y_pred[i])-int(y_test.values[i]))}")

# Use last observed hour from dataset — not static hour 20
last_ts_hour = int(ts.iloc[-1]["order_hour"])
last_known   = ts.tail(3)["order_count"].tolist()
print(f"\nForecast from last observed hour: {last_ts_hour}")

for i in range(6):
    h = (last_ts_hour + i + 1) % 24
    feat = np.array([[h, 4, 0, 1 if h in PEAK_HOURS else 0,
                      last_known[-1], last_known[-2], np.mean(last_known[-3:])]])
    pred = max(0, int(model.predict(feat)[0]))
    tag  = "PEAK" if h in PEAK_HOURS else "normal"
    print(f"  Hour {h:02d}:00 → {pred} orders [{tag}]")
    last_known.append(pred)

with open("../models/demand_model.pkl", "wb") as f:
    pickle.dump(model, f)

artifacts["demand_meta"] = {
    "peak_hours":           PEAK_HOURS,
    "features":             FEATURES,
    "split":                "chronological",
    "mae_orders":           round(float(mae), 1),
    "baseline_mae":         round(float(baseline_mae), 1),
    "forecast_std":         forecast_std,
    "last_known_baseline":  ts.tail(3)["order_count"].tolist(),
    "last_timestamp":       str(ts.iloc[-1]["ds"])
}
artifacts["model_performance"]["demand_model"] = {
    "type":         "XGBoost with lag features",
    "mae_orders":   round(float(mae), 1),
    "baseline_mae": round(float(baseline_mae), 1),
    "forecast_std": forecast_std,
    "features":     FEATURES
}

with open("../models/artifacts.json", "w") as f:
    json.dump(artifacts, f, indent=2)

print("\nDemand model saved. Artifacts updated.")
print("Next: uvicorn main:app --reload")