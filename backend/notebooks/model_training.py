import pandas as pd
import numpy as np
import pickle
import json
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import shap

df = pd.read_csv("../data/train_clean.csv")
df = df.reset_index(drop=True)

with open("../models/artifacts.json", "r") as f:
    artifacts = json.load(f)

FEATURES = artifacts["features"]
print(f"Features ({len(FEATURES)}): {FEATURES}")
print(f"Total rows: {len(df)}")

X = df[FEATURES]
y = df["Time_taken(min)"]

val_idx   = int(len(df) * 0.7)
split_idx = int(len(df) * 0.8)

X_train = X.iloc[:val_idx]
y_train = y.iloc[:val_idx]
X_val   = X.iloc[val_idx:split_idx]
y_val   = y.iloc[val_idx:split_idx]
X_test  = X.iloc[split_idx:]
y_test  = y.iloc[split_idx:]

print(f"Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")

baseline_mae = mean_absolute_error(y_test, np.full(len(y_test), y_train.mean()))
print(f"Baseline MAE: {baseline_mae:.2f} min")

model = XGBRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    early_stopping_rounds=30
)

model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    verbose=100
)

y_pred    = model.predict(X_test)
mae       = mean_absolute_error(y_test, y_pred)
r2        = r2_score(y_test, y_pred)
residuals = y_test - y_pred

print(f"\nBaseline MAE:  {baseline_mae:.2f} min")
print(f"XGBoost MAE:   {mae:.2f} min")
print(f"Improvement:   {baseline_mae - mae:.2f} min")
print(f"R2 Score:      {r2:.4f}")

print(f"\nResidual Analysis:")
print(f"  Mean: {residuals.mean():.2f} min")
print(f"  Std:  {residuals.std():.2f} min")

within_5  = (np.abs(residuals) <= 5).mean()  * 100
within_10 = (np.abs(residuals) <= 10).mean() * 100
above_10  = (np.abs(residuals) > 10).mean()  * 100

print(f"\nError Distribution:")
print(f"  Within 5 min:  {within_5:.1f}%")
print(f"  Within 10 min: {within_10:.1f}%")
print(f"  Above 10 min:  {above_10:.1f}%")

print("\nCalculating SHAP...")
explainer   = shap.Explainer(model)
shap_values = explainer(X_test[:200])

importance = pd.DataFrame({
    "feature":    FEATURES,
    "importance": np.abs(shap_values.values).mean(axis=0)
}).sort_values("importance", ascending=False)
print(importance.to_string(index=False))

with open("../models/xgboost_model.pkl", "wb") as f:
    pickle.dump(model, f)

artifacts["feature_importance"] = importance.set_index("feature")["importance"].round(4).to_dict()

artifacts["model_performance"] = {
    "delivery_time_model": {
        "type":              "XGBoost",
        "split":             "chronological",
        "train_rows":        int(len(X_train)),
        "val_rows":          int(len(X_val)),
        "test_rows":         int(len(X_test)),
        "baseline_mae":      round(float(baseline_mae), 2),
        "mae_minutes":       round(float(mae), 2),
        "r2_score":          round(float(r2), 4),
        "improvement":       round(float(baseline_mae - mae), 2),
        "residual_mean":     round(float(residuals.mean()), 2),
        "residual_std":      round(float(residuals.std()), 2),
        "within_5min_pct":   round(within_5, 1),
        "within_10min_pct":  round(within_10, 1),
        "above_10min_pct":   round(above_10, 1)
    }
}

with open("../models/artifacts.json", "w") as f:
    json.dump(artifacts, f, indent=2)

print("\nModel saved. Artifacts updated.")
print("Next: python demand_forecast.py")