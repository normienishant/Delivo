import pandas as pd
import numpy as np
import json
from math import radians, sin, cos, sqrt, atan2

df = pd.read_csv("../data/train.csv")
print(f"Loaded {len(df)} rows")

def clean_time(val):
    try: return float(str(val).strip().split()[-1])
    except: return np.nan

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2-lat1, lon2-lon1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    return R*2*atan2(sqrt(a), sqrt(1-a))

df["Time_taken(min)"] = df["Time_taken(min)"].apply(clean_time)
df["Weatherconditions"] = df["Weatherconditions"].astype(str).str.replace("conditions ", "").str.strip()
df["Weatherconditions"] = df["Weatherconditions"].replace("NaN", np.nan)

cols = ["Road_traffic_density","City","Type_of_vehicle","Type_of_order",
        "Festival","Delivery_person_Age","Delivery_person_Ratings","multiple_deliveries"]
for col in cols:
    df[col] = df[col].astype(str).str.strip().replace("NaN", np.nan)

for col in ["Delivery_person_Age","Delivery_person_Ratings","multiple_deliveries"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")
    df[col] = df[col].fillna(df[col].median())

df["Delivery_person_Ratings"] = df["Delivery_person_Ratings"].clip(upper=5.0)
df["Weatherconditions"]    = df["Weatherconditions"].fillna(df["Weatherconditions"].mode()[0])
df["Road_traffic_density"] = df["Road_traffic_density"].fillna(df["Road_traffic_density"].mode()[0])
df["City"]                 = df["City"].fillna(df["City"].mode()[0])
df["Festival"]             = df["Festival"].fillna("No")

print("Calculating distances...")
df["distance_km"] = df.apply(lambda r: haversine(
    r["Restaurant_latitude"], r["Restaurant_longitude"],
    r["Delivery_location_latitude"], r["Delivery_location_longitude"]), axis=1)
distance_cap = df["distance_km"].quantile(0.99)
df["distance_km"] = df["distance_km"].clip(upper=distance_cap)
print(f"Distance capped at {distance_cap:.2f} km")

df["Order_Date"]  = pd.to_datetime(df["Order_Date"], format="%d-%m-%Y", errors="coerce")
df["Time_Orderd"] = pd.to_datetime(df["Time_Orderd"], format="%H:%M:%S", errors="coerce")

# Use median hour instead of 0 to avoid bias
median_hour = int(df["Time_Orderd"].dt.hour.median())
df["order_hour"]  = df["Time_Orderd"].dt.hour.fillna(median_hour).astype(int)
df["day_of_week"] = df["Order_Date"].dt.dayofweek.fillna(0).astype(int)
df["is_weekend"]  = df["day_of_week"].apply(lambda d: 1 if d >= 5 else 0)

hour_avg    = df.groupby("order_hour")["Time_taken(min)"].mean()
overall_avg = df["Time_taken(min)"].mean()
peak_hours  = sorted([int(h) for h in hour_avg[hour_avg > overall_avg].index.tolist()])
df["is_peak_hour"] = df["order_hour"].apply(lambda h: 1 if h in peak_hours else 0)
print(f"Peak hours: {peak_hours}")

WEATHER_MAP = {"Sunny":0,"Cloudy":1,"Windy":2,"Fog":3,"Stormy":4,"Sandstorms":5}
TRAFFIC_MAP = {"Low":0,"Medium":1,"High":2,"Jam":3}
CITY_MAP    = {"Semi-Urban":0,"Urban":1,"Metropolitian":2}
VEHICLE_MAP = {"bicycle":0,"electric_scooter":1,"scooter":2,"motorcycle":3}
ORDER_MAP   = {"Snack":0,"Drinks":1,"Buffet":2,"Meal":3}

df["weather_enc"]  = df["Weatherconditions"].map(WEATHER_MAP).fillna(0).astype(int)
df["traffic_enc"]  = df["Road_traffic_density"].map(TRAFFIC_MAP).fillna(1).astype(int)
df["city_enc"]     = df["City"].map(CITY_MAP).fillna(1).astype(int)
df["vehicle_enc"]  = df["Type_of_vehicle"].map(VEHICLE_MAP).fillna(2).astype(int)
df["order_enc"]    = df["Type_of_order"].map(ORDER_MAP).fillna(0).astype(int)
df["festival_enc"] = df["Festival"].map({"No":0,"Yes":1}).fillna(0).astype(int)

df = df.sort_values("Order_Date").reset_index(drop=True)

FEATURES = [
    "Delivery_person_Age","Delivery_person_Ratings","distance_km",
    "Vehicle_condition","multiple_deliveries","weather_enc",
    "traffic_enc","city_enc","vehicle_enc","order_enc",
    "festival_enc","order_hour","is_peak_hour","is_weekend"
]

df_clean = df[FEATURES + ["Time_taken(min)"]].dropna()
df_clean.to_csv("../data/train_clean.csv", index=False)
print(f"Saved {len(df_clean)} rows, {len(FEATURES)} features")
print("pickup_wait_min REMOVED - data leakage fix")

# Data quality stats
missing_pct = {}
for col in df.columns:
    if df[col].isnull().sum() > 0:
        missing_pct[col] = round(float(df[col].isnull().mean() * 100), 2)

artifacts = {
    "features": FEATURES,
    "peak_hours": peak_hours,
    "distance_cap": float(distance_cap),
    "overall_avg_delivery_min": float(round(overall_avg, 2)),
    "encodings": {
        "weather": WEATHER_MAP,
        "traffic": TRAFFIC_MAP,
        "city":    CITY_MAP,
        "vehicle": VEHICLE_MAP,
        "order":   ORDER_MAP
    },
    "feature_schema": {
        "numerical":   ["Delivery_person_Age","Delivery_person_Ratings","distance_km","Vehicle_condition","multiple_deliveries"],
        "categorical": ["weather_enc","traffic_enc","city_enc","vehicle_enc","order_enc","festival_enc"],
        "temporal":    ["order_hour","is_peak_hour","is_weekend"]
    },
    "data_quality": {
        "duplicate_rows": int(df.duplicated().sum()),
        "missing_pct":    missing_pct
    },
    "hour_baseline":     {str(k): int(v) for k, v in df.groupby("order_hour").size().items()},
    "hour_avg_delivery": {str(k): round(float(v), 2) for k, v in df.groupby("order_hour")["Time_taken(min)"].mean().items()},
    "traffic_avg_time":  {k: round(float(v), 2) for k, v in df.groupby("Road_traffic_density")["Time_taken(min)"].mean().items()},
    "weather_avg_time":  {k: round(float(v), 2) for k, v in df.groupby("Weatherconditions")["Time_taken(min)"].mean().items()},
    "city_stats": df.groupby("City").agg(
        total_orders=("Time_taken(min)","count"),
        avg_delivery_min=("Time_taken(min)","mean"),
        avg_distance_km=("distance_km","mean"),
        peak_hour_pct=("is_peak_hour","mean")
    ).reset_index().assign(
        avg_delivery_min=lambda x: x["avg_delivery_min"].round(2),
        avg_distance_km=lambda x: x["avg_distance_km"].round(2),
        peak_hour_pct=lambda x: (x["peak_hour_pct"]*100).round(1)
    ).to_dict(orient="records"),
    "festival_impact": {
        "no_festival_avg_min": round(float(df[df["Festival"]=="No"]["Time_taken(min)"].mean()), 2),
        "festival_avg_min":    round(float(df[df["Festival"]=="Yes"]["Time_taken(min)"].mean()), 2),
    },
    "multiple_deliveries_impact": {
        str(int(k)): round(float(v), 2)
        for k, v in df.groupby("multiple_deliveries")["Time_taken(min)"].mean().items()
    },
    "distance_buckets": {
        "0-3km":   round(float(df[df["distance_km"]<=3]["Time_taken(min)"].mean()), 2),
        "3-6km":   round(float(df[(df["distance_km"]>3)&(df["distance_km"]<=6)]["Time_taken(min)"].mean()), 2),
        "6-10km":  round(float(df[(df["distance_km"]>6)&(df["distance_km"]<=10)]["Time_taken(min)"].mean()), 2),
        "10-15km": round(float(df[(df["distance_km"]>10)&(df["distance_km"]<=15)]["Time_taken(min)"].mean()), 2),
        "15-21km": round(float(df[df["distance_km"]>15]["Time_taken(min)"].mean()), 2),
    },
    "vehicle_avg_time": {
        k: round(float(v), 2)
        for k, v in df.groupby("Type_of_vehicle")["Time_taken(min)"].mean().items()
    },
    "dataset_meta": {
        "total_records":    int(len(df_clean)),
        "unique_drivers":   int(df["Delivery_person_ID"].nunique()),
        "date_range_start": str(df["Order_Date"].min().date()),
        "date_range_end":   str(df["Order_Date"].max().date()),
        "dataset_days":     int((df["Order_Date"].max() - df["Order_Date"].min()).days),
    }
}

with open("../models/artifacts.json", "w") as f:
    json.dump(artifacts, f, indent=2)

print(f"Data quality — duplicates: {artifacts['data_quality']['duplicate_rows']}")
print(f"Feature schema saved: {list(artifacts['feature_schema'].keys())}")
print("artifacts.json saved")
print("Next: python model_training.py")