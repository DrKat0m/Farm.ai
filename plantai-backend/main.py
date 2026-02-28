from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import httpx
import asyncio
import json
import re
from shapely.geometry import Polygon

from google import genai as google_genai

from services import (
    fetch_open_elevation,
    fetch_open_meteo_forecast,
    fetch_open_meteo_historical,
    generate_crop_matrix,
    calculate_economic_projection
)

GEMINI_API_KEY = "AIzaSyA1XjuBKDNWfHHnBEYUGiBmXmuukWky5aU"
gemini_client = google_genai.Client(api_key=GEMINI_API_KEY)


def parse_gemini_json(text: str) -> dict:
    """Extract JSON from Gemini response, handling markdown code blocks."""
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    raw = match.group(1) if match else text.strip()
    return json.loads(raw)


app = FastAPI(title="Farm.ai Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Existing Models ───────────────────────────────────────────────────────────

class PointRequest(BaseModel):
    lat: float
    lng: float

class PolygonRequest(BaseModel):
    coordinates: List[List[float]]
    area_acres: float

# ── Agent Models ──────────────────────────────────────────────────────────────

class SoilDataInput(BaseModel):
    mu_name: str
    ph_range: List[float]
    organic_matter_pct: float
    drainage: str

class RemediationRequest(BaseModel):
    soil_data: SoilDataInput
    area_acres: float

class ProcurementRequest(BaseModel):
    amendment_plan: dict
    area_acres: float

class FinanceRequest(BaseModel):
    total_cost: float
    soil_data: dict

# ── Chat & Recommendation Models ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    context: Optional[dict] = None  # Full analysis result

class RecommendationRequest(BaseModel):
    lat: float
    lng: float

# ── Existing Endpoints ────────────────────────────────────────────────────────

@app.post("/api/point-info")
async def get_point_info(request: PointRequest):
    async with httpx.AsyncClient() as client:
        elevation = await fetch_open_elevation(client, request.lat, request.lng)

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
        poly = Polygon(request.coordinates)
        centroid = poly.centroid
        c_lng, c_lat = centroid.x, centroid.y
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid polygon coordinates: {e}")

    async with httpx.AsyncClient() as client:
        forecast_task = fetch_open_meteo_forecast(client, c_lat, c_lng)
        historical_task = fetch_open_meteo_historical(client, c_lat, c_lng)
        forecast_data, historical_data = await asyncio.gather(forecast_task, historical_task)

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

    crop_matrix = generate_crop_matrix(forecast_data)
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

# ── Agent Endpoints ───────────────────────────────────────────────────────────

@app.post("/api/agent/remediation")
async def agent_remediation(request: RemediationRequest):
    """Agent 1: Soil Remediation — analyzes soil and creates amendment plan."""
    soil = request.soil_data
    prompt = f"""Act as a Soil Remediation Agent for precision agriculture. You are analyzing soil data to determine the optimal amendment strategy.

Soil data:
- Name: {soil.mu_name}
- pH range: {soil.ph_range[0]} to {soil.ph_range[1]}
- Organic matter: {soil.organic_matter_pct}%
- Drainage: {soil.drainage}
- Field area: {request.area_acres} acres

Return ONLY a valid JSON object with exactly these fields:
{{
  "status_log": ["<thought step 1>", "<thought step 2>", "<thought step 3>"],
  "amendment_plan": {{
    "fertilizer_type": "<specific fertilizer blend name>",
    "estimated_tons": <number>
  }}
}}

Make the status_log entries sound like real AI reasoning steps (e.g. "Analyzing pH deficit against optimal range 6.2-6.8..."). The amendment_plan should be scientifically appropriate for the soil conditions. No markdown, no extra text, only the JSON object."""

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash', contents=prompt
        )
        result = parse_gemini_json(response.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/api/agent/procurement")
async def agent_procurement(request: ProcurementRequest):
    """Agent 2: Procurement — builds bill of materials from amendment plan."""
    prompt = f"""Act as a Procurement Agent for agricultural supply chain management. You are sourcing materials based on a soil amendment plan.

Amendment plan received from Remediation Agent:
{json.dumps(request.amendment_plan, indent=2)}

Field area: {request.area_acres} acres

Return ONLY a valid JSON object with exactly these fields:
{{
  "status_log": ["<sourcing step 1>", "<sourcing step 2>", "<sourcing step 3>"],
  "bill_of_materials": [
    {{"name": "<item name>", "quantity": "<quantity with unit>", "estimated_cost": <number>}},
    {{"name": "<item name>", "quantity": "<quantity with unit>", "estimated_cost": <number>}},
    {{"name": "<item name>", "quantity": "<quantity with unit>", "estimated_cost": <number>}}
  ],
  "total_cost": <number>
}}

The status_log should reflect real procurement reasoning (supplier lookup, pricing, logistics). The bill_of_materials should include the main amendment material, delivery/spreading services, and soil testing. Ensure total_cost equals the sum of all estimated_cost values. No markdown, no extra text, only the JSON object."""

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash', contents=prompt
        )
        result = parse_gemini_json(response.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/api/agent/finance")
async def agent_finance(request: FinanceRequest):
    """Agent 3: Finance — drafts grant application based on total cost."""
    soil_name = request.soil_data.get('mu_name', 'agricultural land')
    prompt = f"""Act as a Financial Grant Agent specializing in USDA agricultural funding programs. You are drafting a grant application for soil remediation funding.

Financial data:
- Total remediation cost: ${request.total_cost:,.2f}
- Soil type: {soil_name}
- Soil conditions: {json.dumps(request.soil_data)}

Return ONLY a valid JSON object with exactly these fields:
{{
  "status_log": ["<financial analysis step 1>", "<financial analysis step 2>", "<financial analysis step 3>"],
  "grant_name": "USDA EQIP",
  "drafted_application": "<Sentence 1 introducing the applicant and the specific soil remediation need.> <Sentence 2 describing the amendment plan and its environmental benefit, explicitly stating the total cost of ${request.total_cost:,.2f}.> <Sentence 3 formally requesting the grant funding and citing expected agricultural outcomes.>"
}}

The status_log should reflect real grant analysis steps (eligibility assessment, cost-benefit analysis, application drafting). The drafted_application must be exactly 3 sentences and must explicitly mention the total cost of ${request.total_cost:,.2f}. No markdown, no extra text, only the JSON object."""

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash', contents=prompt
        )
        result = parse_gemini_json(response.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


# ── Chat Endpoint ─────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """AI Agronomist chat — answers questions about the user's property data."""
    context_str = ""
    if request.context:
        context_str = f"""You have access to the following property analysis data:
{json.dumps(request.context, indent=2, default=str)}
"""

    history_str = ""
    for msg in request.history[-10:]:
        history_str += f"{msg.role}: {msg.content}\n"

    prompt = f"""You are an expert AI Agronomist working for Farm.ai, a precision agriculture platform.
You provide concise, data-driven answers about soil health, crop selection, climate conditions, and farm economics.

{context_str}

Conversation so far:
{history_str}

User question: {request.message}

Respond directly and concisely (2-4 sentences). Reference specific numbers from the data when relevant.
If asked about something not in the data, say so honestly. Do not use markdown formatting."""

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash', contents=prompt
        )
        return {"reply": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


# ── Recommendations Endpoint ──────────────────────────────────────────────────

import random
import math

@app.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """Returns mock GeoJSON FeatureCollection of high-yield parcels near the input coordinates."""
    parcels = []
    offsets = [
        (0.008, 0.005), (-0.006, 0.009), (0.012, -0.004), (-0.010, -0.007)
    ]
    parcel_names = [
        "Riverside Agricultural Plot", "Hilltop Farmstead",
        "Valley View Parcel", "Sunrise Meadow Tract"
    ]
    for i, (dlat, dlng) in enumerate(offsets):
        lat = request.lat + dlat + random.uniform(-0.001, 0.001)
        lng = request.lng + dlng + random.uniform(-0.001, 0.001)
        yield_score = random.randint(82, 98)
        soil_match = random.randint(78, 96)
        size = round(random.uniform(5, 45), 1)

        # Generate a simple rectangular polygon around the point
        spread = 0.002 + random.uniform(0, 0.001)
        coords = [
            [lng - spread, lat - spread * 0.7],
            [lng + spread, lat - spread * 0.7],
            [lng + spread, lat + spread * 0.7],
            [lng - spread, lat + spread * 0.7],
            [lng - spread, lat - spread * 0.7],
        ]

        parcels.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [coords]},
            "properties": {
                "name": parcel_names[i],
                "projected_yield": yield_score,
                "soil_match_score": soil_match,
                "acreage": size,
                "distance_miles": round(math.sqrt(dlat**2 + dlng**2) * 69, 1),
            }
        })

    return {
        "type": "FeatureCollection",
        "features": parcels
    }


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
