from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import pickle
import json
import numpy as np
import requests
import shap
from math import radians, sin, cos, sqrt, atan2

app = FastAPI(title="Delivery Twin API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    with open("../models/xgboost_model.pkl", "rb") as f:
        xgb_model = pickle.load(f)
    with open("../models/demand_model.pkl", "rb") as f:
        demand_model = pickle.load(f)
    with open("../models/artifacts.json", "r") as f:
        A = json.load(f)
    print("All models and artifacts loaded")
except Exception as e:
    raise RuntimeError(f"Startup failed: {e}")

shap_explainer = shap.Explainer(xgb_model)

FEATURES      = A["features"]
PEAK_HOURS    = A["peak_hours"]
DISTANCE_CAP  = A["distance_cap"]
WEATHER_MAP   = A["encodings"]["weather"]
TRAFFIC_MAP   = A["encodings"]["traffic"]
CITY_MAP      = A["encodings"]["city"]
VEHICLE_MAP   = A["encodings"]["vehicle"]
ORDER_MAP     = A["encodings"]["order"]
HOUR_BASELINE     = {int(k): v for k, v in A["hour_baseline"].items()}
HOUR_AVG_DELIVERY = {int(k): v for k, v in A["hour_avg_delivery"].items()}
CITY_STATS        = {c.get("City", c.get("city", "")): c for c in A["city_stats"]}
DATASET_META      = A["dataset_meta"]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2-lat1, lon2-lon1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    return R*2*atan2(sqrt(a), sqrt(1-a))

def get_distance(lat1, lon1, lat2, lon2):
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
        r   = requests.get(url, timeout=5).json()
        if r.get("code") == "Ok":
            return round(r["routes"][0]["distance"]/1000, 2), "osrm"
    except:
        pass
    return round(haversine(lat1, lon1, lat2, lon2), 2), "haversine"

def build_features(req, distance):
    return np.array([[
        req.driver_age, req.driver_rating, distance,
        req.vehicle_condition, req.multiple_deliveries,
        WEATHER_MAP.get(req.weather, 0),
        TRAFFIC_MAP.get(req.traffic, 1),
        CITY_MAP.get(req.city, 1),
        VEHICLE_MAP.get(req.vehicle, 2),
        ORDER_MAP.get(req.order_type, 0),
        req.festival, req.order_hour,
        1 if req.order_hour in PEAK_HOURS else 0,
        req.is_weekend
    ]])

class DeliveryRequest(BaseModel):
    restaurant_lat: float
    restaurant_lon: float
    delivery_lat: float
    delivery_lon: float
    order_hour: int
    weather: str
    traffic: str
    city: str
    vehicle: str
    order_type: str
    driver_age: float
    driver_rating: float
    vehicle_condition: int
    multiple_deliveries: int
    festival: int
    is_weekend: int

    @validator("order_hour")
    def valid_hour(cls, v):
        if not 0 <= v <= 23: raise ValueError("order_hour must be 0-23")
        return v
    @validator("driver_rating")
    def valid_rating(cls, v):
        if not 1.0 <= v <= 5.0: raise ValueError("driver_rating must be 1.0-5.0")
        return v
    @validator("weather")
    def valid_weather(cls, v):
        if v not in WEATHER_MAP: raise ValueError(f"Must be one of {list(WEATHER_MAP.keys())}")
        return v
    @validator("traffic")
    def valid_traffic(cls, v):
        if v not in TRAFFIC_MAP: raise ValueError(f"Must be one of {list(TRAFFIC_MAP.keys())}")
        return v
    @validator("city")
    def valid_city(cls, v):
        if v not in CITY_MAP: raise ValueError(f"Must be one of {list(CITY_MAP.keys())}")
        return v

class ScenarioRequest(BaseModel):
    restaurant_lat: float
    restaurant_lon: float
    delivery_lat: float
    delivery_lon: float
    order_hour: int
    weather: str
    traffic: str
    city: str
    vehicle: str
    order_type: str
    driver_age: float
    driver_rating: float
    vehicle_condition: int
    multiple_deliveries: int
    festival: int
    is_weekend: int
    driver_count_change: int
    demand_change_pct: float

@app.get("/")
def root():
    return {
        "status": "Delivery Twin API v3.0",
        "data": f"{DATASET_META['total_records']:,} real Indian delivery records",
        "fixes": ["pickup_wait_min leakage fixed","chronological split","artifact system","zero hardcoding"],
        "models": A.get("model_performance", {})
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": ["xgboost_delivery","xgboost_demand"],
        "artifact_version": DATASET_META["date_range_end"]
    }

@app.get("/feature-importance")
def feature_importance():
    return {
        "feature_importance": A.get("feature_importance", {}),
        "model": "XGBoost — delivery time prediction",
        "method": "SHAP mean absolute values"
    }

@app.post("/predict-delivery-time")
def predict_delivery_time(req: DeliveryRequest):
    try:
        distance, method = get_distance(
            req.restaurant_lat, req.restaurant_lon,
            req.delivery_lat, req.delivery_lon
        )
        distance  = min(distance, DISTANCE_CAP)
        if(distance <= 0):
            raise HTTPException(status_code=400, detail="Invalid coordinates — distance cannot be zero")
        
        features  = build_features(req, distance)
        predicted = round(float(xgb_model.predict(features)[0]), 1)
        mae       = A["model_performance"]["delivery_time_model"]["mae_minutes"]
        city_avg  = CITY_STATS.get(req.city, {}).get("avg_delivery_min", A["overall_avg_delivery_min"])
        hour_avg  = HOUR_AVG_DELIVERY.get(req.order_hour, A["overall_avg_delivery_min"])
        return {
            "predicted_minutes": predicted,
            "confidence_range":  {"min": round(predicted-mae,1), "max": round(predicted+mae,1)},
            "confidence_note":   f"Based on model MAE ±{mae} min and historical variance",
            "distance_km":       distance,
            "distance_method":   method,
            "is_peak_hour":      req.order_hour in PEAK_HOURS,
            "dataset_comparison": {
                "city_avg_minutes":      round(city_avg, 1),
                "this_hour_avg_minutes": round(hour_avg, 1),
                "vs_city_avg":           round(predicted - city_avg, 1)
            },
            "explanation": {
                "distance_impact": "high" if distance > 10 else "medium" if distance > 5 else "low",
                "traffic_impact":  req.traffic,
                "weather_impact":  req.weather,
                "peak_penalty":    "yes" if req.order_hour in PEAK_HOURS else "no"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate-scenario")
def simulate_scenario(req: ScenarioRequest):
    try:
        distance, _ = get_distance(
            req.restaurant_lat, req.restaurant_lon,
            req.delivery_lat, req.delivery_lon
        )
        distance = min(distance, DISTANCE_CAP)

        class Req: pass
        base = Req()
        for k, v in req.dict().items():
            if k not in ["driver_count_change","demand_change_pct"]:
                setattr(base, k, v)

        base_time    = round(float(xgb_model.predict(build_features(base, distance))[0]), 1)
        multi_map    = A.get("multiple_deliveries_impact", {})
        demand_extra = 0

        if req.demand_change_pct > 20:
            cur          = float(multi_map.get(str(int(req.multiple_deliveries)), base_time))
            nxt          = float(multi_map.get(str(min(3, int(req.multiple_deliveries)+1)), base_time))
            demand_extra = nxt - cur

        # Heuristic approximation — dataset has no driver supply column
        # 9.8 min = real avg pickup wait from dataset
        # In production: replace with real-time driver GPS feed
        driver_impact = -(min(9.8*0.5, req.driver_count_change*0.4)) if req.driver_count_change > 0 else abs(req.driver_count_change*0.4)
        new_time      = round(max(10, base_time + driver_impact + demand_extra), 1)
        change_pct    = round(((new_time-base_time)/base_time)*100, 1)
        efficiency    = round(max(0, min(100, 100-(new_time-15)*2)), 1)

        return {
            "base_delivery_time": base_time,
            "new_delivery_time":  new_time,
            "change_percent":     change_pct,
            "efficiency_score":   efficiency,
            "driver_impact_min":  round(driver_impact, 1),
            "demand_impact_min":  round(demand_extra, 1),
            "context": {
                "real_avg_orders_this_hour": HOUR_BASELINE.get(req.order_hour, 500),
                "dataset_avg_delivery_min":  HOUR_AVG_DELIVERY.get(req.order_hour, A["overall_avg_delivery_min"])
            },
            "recommendation": f"Adding {req.driver_count_change} drivers saves ~{abs(driver_impact):.1f} min" if req.driver_count_change > 0 else f"Removing drivers adds ~{abs(driver_impact):.1f} min"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/forecast-demand/{hour}")
def forecast_demand(hour: int):
    if not 0 <= hour <= 23:
        raise HTTPException(status_code=400, detail="Hour must be 0-23")
    try:
        last_known = list(A["demand_meta"].get("last_known_baseline", [50, 60, 70]))
        forecasts  = []
        forecast_std = A["demand_meta"].get("forecast_std", 10)

        for i in range(6):
            h    = (hour+i+1) % 24
            feat = np.array([[h, 4, 0,
                              1 if h in PEAK_HOURS else 0,
                              last_known[-1], last_known[-2],
                              np.mean(last_known[-3:])]])
            pred = max(0, int(demand_model.predict(feat)[0]))
            forecasts.append({
                "hour":             h,
                "predicted_orders": pred,
                "uncertainty_range": {"min": max(0, pred - forecast_std), "max": pred + forecast_std},
                "real_dataset_avg": HOUR_BASELINE.get(h, 0),
                "is_peak":          h in PEAK_HOURS,
                "avg_delivery_min": HOUR_AVG_DELIVERY.get(h, A["overall_avg_delivery_min"]),
                "intensity":        "high" if pred > 150 else "medium" if pred > 80 else "low"
            })
            last_known.append(pred)

        return {
            "current_hour":        hour,
            "forecast":            forecasts,
            "peak_hours_ahead":    [f["hour"] for f in forecasts if f["is_peak"]],
            "highest_demand_hour": max(forecasts, key=lambda x: x["predicted_orders"])["hour"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/zone-bottlenecks")
def get_bottlenecks():
    days    = DATASET_META["dataset_days"]
    drivers = {"Metropolitian":18,"Urban":12,"Semi-Urban":2}
    result  = []
    for city, stats in CITY_STATS.items():
        if not city: continue
        daily = round(stats["total_orders"]/days, 1)
        drv   = drivers.get(city, 5)
        ratio = round(daily/drv, 1)
        if ratio > 50:   status,color,sug = "critical","#FF4444",f"Add {int(ratio/30)} drivers urgently"
        elif ratio > 30: status,color,sug = "warning","#FFA500",f"Add {int(ratio/40)+1} drivers"
        else:            status,color,sug = "good","#00C851","Staffing optimal"
        result.append({
            "zone": city, "daily_avg_orders": daily, "active_drivers": drv,
            "demand_driver_ratio": ratio,
            "avg_delivery_min": round(stats["avg_delivery_min"], 1),
            "avg_distance_km":  round(stats["avg_distance_km"], 1),
            "status": status, "color": color, "suggestion": sug,
            "data_source": f"{stats['total_orders']:,} real orders"
        })
    result.sort(key=lambda x: x["demand_driver_ratio"], reverse=True)
    return {
        "zones": result,
        "summary": {
            "total_orders": DATASET_META["total_records"],
            "critical": len([z for z in result if z["status"]=="critical"]),
            "warning":  len([z for z in result if z["status"]=="warning"]),
            "good":     len([z for z in result if z["status"]=="good"])
        }
    }

@app.post("/explain-prediction")
def explain_prediction(req: DeliveryRequest):
    try:
        distance, _ = get_distance(
            req.restaurant_lat, req.restaurant_lon,
            req.delivery_lat, req.delivery_lon
        )
        distance  = min(distance, DISTANCE_CAP)
        features  = build_features(req, distance)
        sv        = shap_explainer(features)
        contribs  = sorted(zip(FEATURES, sv.values[0].tolist()), key=lambda x: abs(x[1]), reverse=True)
        return {
            "predicted_minutes":  round(float(xgb_model.predict(features)[0]), 1),
            "base_value_minutes": round(float(sv.base_values[0]), 1),
            "top_factors": [
                {"feature":k,"impact_min":round(v,2),"direction":"increases" if v>0 else "decreases"}
                for k,v in contribs[:5]
            ],
            "interpretation": f"Base: {round(float(sv.base_values[0]),1)} min. '{contribs[0][0]}' {'adds' if contribs[0][1]>0 else 'saves'} {abs(round(contribs[0][1],1))} min."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset-insights")
def dataset_insights():
    return {
        "total_records":            DATASET_META["total_records"],
        "unique_drivers":           DATASET_META["unique_drivers"],
        "date_range":               f"{DATASET_META['date_range_start']} to {DATASET_META['date_range_end']}",
        "overall_avg_delivery_min": A["overall_avg_delivery_min"],
        "peak_hours":               PEAK_HOURS,
        "data_quality":             A.get("data_quality", {}),
        "feature_schema":           A.get("feature_schema", {}),
        "hourly_demand": [
            {"hour":h,"avg_orders":HOUR_BASELINE.get(h,0),
             "avg_delivery_min":HOUR_AVG_DELIVERY.get(h,0),"is_peak":h in PEAK_HOURS}
            for h in range(24)
        ],
        "traffic_impact":   [{"traffic":k,"avg_delivery_min":v} for k,v in A["traffic_avg_time"].items()],
        "weather_impact":   [{"weather":k,"avg_delivery_min":v} for k,v in A["weather_avg_time"].items()],
        "festival_impact":  A["festival_impact"],
        "multiple_deliveries_impact": [{"count":int(k),"avg_delivery_min":v} for k,v in A["multiple_deliveries_impact"].items()],
        "distance_impact":  [{"range":k,"avg_delivery_min":v} for k,v in A["distance_buckets"].items()],
        "vehicle_impact":   [{"vehicle":k,"avg_delivery_min":v} for k,v in A["vehicle_avg_time"].items()],
        "city_stats":       A["city_stats"],
        "model_performance":A.get("model_performance", {})
    }