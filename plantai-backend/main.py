from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
import httpx
import asyncio
from shapely.geometry import Polygon

from services import (
    fetch_open_elevation,
    fetch_open_meteo_forecast,
    fetch_open_meteo_historical,
    generate_crop_matrix,
    calculate_economic_projection
)

app = FastAPI(title="PlantAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PointRequest(BaseModel):
    lat: float
    lng: float

class PolygonRequest(BaseModel):
    coordinates: List[List[float]]
    area_acres: float

@app.post("/api/point-info")
async def get_point_info(request: PointRequest):
    async with httpx.AsyncClient() as client:
        elevation = await fetch_open_elevation(client, request.lat, request.lng)
    
    # Mock data as requested
    soil_type = "Hagerstown silt loam, pH 6.8"
    ndvi = 0.74
    
    return {
        "elevation": elevation,
        "soil_type": soil_type,
        "ndvi": ndvi,
        "lat": request.lat,
        "lng": request.lng
    }

@app.post("/api/analyze")
async def analyze_polygon(request: PolygonRequest):
    if len(request.coordinates) < 3:
        raise HTTPException(status_code=400, detail="Polygon must have at least 3 points")
        
    try:
        # Shapely wants (x, y) which is (lng, lat)
        poly = Polygon(request.coordinates)
        centroid = poly.centroid
        c_lng, c_lat = centroid.x, centroid.y
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid polygon coordinates: {e}")

    async with httpx.AsyncClient() as client:
        # Fetch APIs concurrently
        forecast_task = fetch_open_meteo_forecast(client, c_lat, c_lng)
        historical_task = fetch_open_meteo_historical(client, c_lat, c_lng)
        
        forecast_data, historical_data = await asyncio.gather(forecast_task, historical_task)
    
    # Mock deeply nested data
    mock_soil_data = {
        "mu_name": "Cecil sandy loam",
        "taxonomy": "Fine, kaolinitic, thermic Typic Kanhapludults",
        "drainage": "Well drained",
        "ph_range": [5.5, 6.5],
        "organic_matter_pct": 1.2
    }
    
    mock_nws_alerts = [
        {
            "event": "Heat Advisory",
            "severity": "Moderate",
            "description": "High temperatures expected."
        }
    ]
    
    mock_sentinel_data = {
        "mean_ndvi": 0.68,
        "cloud_cover": "15%",
        "date_acquired": "2023-10-15T14:30:00Z"
    }
    
    # Crop Scoring Engine
    crop_matrix = generate_crop_matrix(forecast_data)
    
    # Economic Projection
    economic_projection = calculate_economic_projection(crop_matrix, request.area_acres)
    
    return {
        "centroid": {"lat": round(c_lat, 6), "lng": round(c_lng, 6)},
        "area_acres": request.area_acres,
        "weather_forecast": forecast_data,
        "weather_historical": historical_data,
        "soil_data": mock_soil_data,
        "nws_alerts": mock_nws_alerts,
        "sentinel_satellite_data": mock_sentinel_data,
        "crop_matrix": crop_matrix,
        "economic_projections": economic_projection
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
