import httpx
import asyncio
import random

TIMEOUT_SECONDS = 10.0

async def fetch_open_elevation(client: httpx.AsyncClient, lat: float, lng: float):
    # Open-Elevation API: https://api.open-elevation.com/api/v1/lookup?locations=lat,lng
    url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lng}"
    try:
        response = await client.get(url, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        data = response.json()
        if data.get("results") and len(data["results"]) > 0:
            return data["results"][0].get("elevation", None)
    except Exception as e:
        print(f"Error fetching Open-Elevation: {e}")
    return None

async def fetch_open_meteo_forecast(client: httpx.AsyncClient, lat: float, lng: float):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=16"
    try:
        response = await client.get(url, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching Open-Meteo Forecast: {e}")
    return {"error": "Failed to fetch forecast"}

async def fetch_open_meteo_historical(client: httpx.AsyncClient, lat: float, lng: float):
    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lng}&start_date=1993-01-01&end_date=2023-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto"
    try:
        response = await client.get(url, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching Open-Meteo Historical: {e}")
    return {"error": "Failed to fetch historical data"}

def generate_crop_matrix(forecast_data):
    # 5 crops: Tomatoes, Corn, Peppers, Basil, Sunflowers
    base_crops = {
        "Tomatoes": {"base_score": 85, "base_revenue": 15000},
        "Corn": {"base_score": 75, "base_revenue": 8000},
        "Peppers": {"base_score": 80, "base_revenue": 18000},
        "Basil": {"base_score": 90, "base_revenue": 25000},
        "Sunflowers": {"base_score": 70, "base_revenue": 5000},
    }
    
    # Add slight random variance 
    # Use forecast data just for visual difference (e.g., checking if max temp > 20)
    variance_factor = 1.0
    if isinstance(forecast_data, dict) and "daily" in forecast_data:
        daily_max = forecast_data["daily"].get("temperature_2m_max", [])
        if daily_max and any(temp is not None and temp > 25 for temp in daily_max):
            variance_factor = 1.1 # Warmer climate boost for these crops
    
    results = []
    for crop, stats in base_crops.items():
        # Random variance: +/- 5 for score
        score_variance = random.uniform(-5, 5)
        # Random variance: +/- 5% for revenue
        revenue_variance = random.uniform(0.95, 1.05)
        
        score = min(100, max(0, int(stats["base_score"] + score_variance)))
        revenue = int(stats["base_revenue"] * revenue_variance * variance_factor)
        
        results.append({
            "crop": crop,
            "suitability_score": score,
            "estimated_yield_revenue_per_acre": revenue
        })
    
    # Sort by score descending
    results.sort(key=lambda x: x["suitability_score"], reverse=True)
    return results

def calculate_economic_projection(crop_matrix, area_acres: float):
    # Base on the top crop
    if not crop_matrix:
        return {}
    
    top_crop_revenue = crop_matrix[0]["estimated_yield_revenue_per_acre"]
    base_total_revenue = top_crop_revenue * area_acres
    
    return {
        "max_yield": {
            "description": "Intensive farming maximizing output.",
            "estimated_revenue": round(base_total_revenue * 1.2, 2)
        },
        "low_maintenance": {
            "description": "Minimal intervention, lower cost.",
            "estimated_revenue": round(base_total_revenue * 0.7, 2)
        },
        "pest_resistant": {
            "description": "Focus on robust varieties, moderate output.",
            "estimated_revenue": round(base_total_revenue * 0.9, 2)
        }
    }
