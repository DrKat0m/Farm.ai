import axios from 'axios';
import type { AnalysisData, SoilData, ClimateData, CropScore, EconomicScenario } from './store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Raw backend response types ───────────────────────────────────────────────

export interface PointInfoResponse {
    lat: number;
    lng: number;
    elevation: number | null;
    soil_type: string;  // e.g. "Hagerstown silt loam, pH 6.8"
    ndvi: number;
}

export interface AnalyzeResponse {
    centroid: { lat: number; lng: number };
    area_acres: number;
    weather_forecast: WeatherDaily;
    weather_historical: WeatherDaily;
    soil_data: BackendSoilData;
    nws_alerts: NWSAlert[];
    sentinel_satellite_data: SentinelData;
    crop_matrix: BackendCropEntry[];
    economic_projections: BackendEconomics;
}

interface WeatherDaily {
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
    };
}

interface BackendSoilData {
    mu_name: string;
    taxonomy: string;
    drainage: string;
    ph_range: [number, number];
    organic_matter_pct: number;
}

interface NWSAlert {
    event: string;
    severity: string;
    description: string;
}

interface SentinelData {
    mean_ndvi: number;
    cloud_cover: string;
    date_acquired: string;
}

interface BackendCropEntry {
    crop: string;
    suitability_score: number;
    estimated_yield_revenue_per_acre: number;
}

interface BackendEconomics {
    max_yield:       { description: string; estimated_revenue: number };
    low_maintenance: { description: string; estimated_revenue: number };
    pest_resistant:  { description: string; estimated_revenue: number };
}

// ─── API call functions ────────────────────────────────────────────────────────

export async function fetchPointInfo(lat: number, lng: number): Promise<PointInfoResponse> {
    const { data } = await axios.post<PointInfoResponse>(`${BASE_URL}/api/point-info`, { lat, lng });
    return data;
}

export async function fetchAnalysis(
    coordinates: [number, number][],
    area_acres: number
): Promise<AnalyzeResponse> {
    const { data } = await axios.post<AnalyzeResponse>(`${BASE_URL}/api/analyze`, {
        coordinates,
        area_acres,
    });
    return data;
}

// ─── Main transformation function ─────────────────────────────────────────────

export function mapBackendToAnalysis(
    backend: AnalyzeResponse,
    acreage: number,
    analysisId: string
): AnalysisData {
    return {
        id: analysisId,
        soilData:      mapSoilData(backend.soil_data),
        climateData:   mapClimateData(backend.weather_historical),
        cropMatrix:    mapCropMatrix(backend.crop_matrix, acreage),
        economics:     mapEconomics(backend.economic_projections, backend.crop_matrix, acreage),
        ndviValue:     backend.sentinel_satellite_data.mean_ndvi,
        elevation:     null,  // /analyze does not return elevation
        weatherAlerts: backend.nws_alerts.map(a => `${a.event} (${a.severity}): ${a.description}`),
        droughtStatus: null,
    };
}

// ─── Transformation helpers ───────────────────────────────────────────────────

function mapSoilData(raw: BackendSoilData): SoilData {
    const ph = (raw.ph_range[0] + raw.ph_range[1]) / 2;
    return {
        name:          raw.mu_name,
        ph:            Math.round(ph * 10) / 10,
        organicMatter: raw.organic_matter_pct,
        drainage:      raw.drainage,
        // Backend does not expose texture fractions — use agronomic midpoint defaults
        sand:  40,
        silt:  35,
        clay:  25,
        awc:   0.18,
        description: raw.taxonomy,
    };
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function mapClimateData(historical: WeatherDaily): ClimateData {
    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = historical.daily;

    // Bucket accumulators indexed 0..11
    const buckets = Array.from({ length: 12 }, () => ({
        maxSum: 0, minSum: 0, precipSum: 0, count: 0,
    }));

    for (let i = 0; i < time.length; i++) {
        const month = new Date(time[i]).getMonth();
        const b = buckets[month];
        b.maxSum   += temperature_2m_max[i]  ?? 0;
        b.minSum   += temperature_2m_min[i]  ?? 0;
        b.precipSum += precipitation_sum[i]  ?? 0;
        b.count++;
    }

    const monthlyTemps = MONTH_NAMES.map((month, i) => {
        const b = buckets[i];
        const n = b.count || 1;
        const avgMax   = b.maxSum   / n;
        const avgMin   = b.minSum   / n;
        // Convert avg daily mm to monthly total mm
        const avgPrecip = (b.precipSum / n) * DAYS_IN_MONTH[i];
        return {
            month,
            max:    Math.round(avgMax   * 10) / 10,
            min:    Math.round(avgMin   * 10) / 10,
            precip: Math.round(avgPrecip * 10) / 10,
        };
    });

    const avgAnnualTemp = Math.round(
        (monthlyTemps.reduce((s, m) => s + (m.max + m.min) / 2, 0) / 12) * 10
    ) / 10;

    const annualPrecip = Math.round(monthlyTemps.reduce((s, m) => s + m.precip, 0));

    // Hardiness zone from coldest winter month min temp
    const winterMonths = [monthlyTemps[0], monthlyTemps[1], monthlyTemps[10], monthlyTemps[11]];
    const minWinterTemp = Math.min(...winterMonths.map(m => m.min));
    const hardinessZone = deriveHardinessZone(minWinterTemp);

    // Growing days: months where avg low > 0°C
    const growingDays = monthlyTemps.reduce((s, m, i) => {
        return m.min > 0 ? s + DAYS_IN_MONTH[i] : s;
    }, 0);

    const { lastFrost, firstFrost } = deriveFrostDates(monthlyTemps);

    return {
        monthlyTemps,
        avgAnnualTemp,
        annualPrecip,
        growingDays,
        hardinessZone,
        lastFrost,
        firstFrost,
    };
}

function deriveHardinessZone(minWinterTempC: number): string {
    const f = minWinterTempC * 9 / 5 + 32;
    if (f < -50) return '1a';
    if (f < -45) return '1b';
    if (f < -40) return '2a';
    if (f < -35) return '2b';
    if (f < -30) return '3a';
    if (f < -25) return '3b';
    if (f < -20) return '4a';
    if (f < -15) return '4b';
    if (f < -10) return '5a';
    if (f <  -5) return '5b';
    if (f <   0) return '6a';
    if (f <   5) return '6b';
    if (f <  10) return '7a';
    if (f <  15) return '7b';
    if (f <  20) return '8a';
    if (f <  25) return '8b';
    if (f <  30) return '9a';
    if (f <  35) return '9b';
    if (f <  40) return '10a';
    return '10b';
}

function deriveFrostDates(monthlyTemps: { month: string; min: number }[]): {
    lastFrost: string;
    firstFrost: string;
} {
    // Last spring frost: latest month in Jan–Jun where avg min ≤ 0°C
    let lastFrostMonth = 2;  // default March
    for (let i = 0; i <= 5; i++) {
        if (monthlyTemps[i].min <= 0) lastFrostMonth = i;
    }

    // First autumn frost: earliest month in Jul–Dec where avg min ≤ 0°C
    let firstFrostMonth = 9;  // default October
    for (let i = 11; i >= 6; i--) {
        if (monthlyTemps[i].min <= 0) firstFrostMonth = i;
    }

    return {
        lastFrost:  `${MONTH_NAMES[lastFrostMonth]} 15`,
        firstFrost: `${MONTH_NAMES[firstFrostMonth]} 15`,
    };
}

function mapCropMatrix(crops: BackendCropEntry[], acreage: number): CropScore[] {
    return [...crops]
        .sort((a, b) => b.suitability_score - a.suitability_score)
        .map(c => {
            const score = c.suitability_score;
            const projectedRevenue = Math.round(c.estimated_yield_revenue_per_acre * acreage);
            const projectedYield   = Math.round(projectedRevenue / 0.25);  // lbs at $0.25/lb proxy

            let waterNeed = 'Moderate';
            let laborNeed = 'Moderate';
            if (score >= 80) { waterNeed = 'Low';  laborNeed = 'Low';  }
            if (score <  50) { waterNeed = 'High'; laborNeed = 'High'; }

            let reason = 'Moderate suitability, consider soil amendments';
            if (score >= 80) reason = 'Excellent soil and climate match';
            else if (score >= 60) reason = 'Good compatibility with local conditions';

            return {
                name:           c.crop,
                score,
                soilMatch:      Math.round(score * 0.95),
                climateMatch:   Math.round(score * 0.90),
                waterNeed,
                laborNeed,
                projectedYield,
                projectedRevenue,
                reason,
                companionPlants: [],
                pestRisks:       [],
                rotationTips:    [],
            };
        });
}

function mapEconomics(
    econ: BackendEconomics,
    cropEntries: BackendCropEntry[],
    acreage: number
): EconomicScenario[] {
    const scenarios = [
        { name: 'Max Yield',       data: econ.max_yield,       roi: 22, breakEvenMonths: 18, laborReduction: 0  },
        { name: 'Low Maintenance', data: econ.low_maintenance, roi: 14, breakEvenMonths: 24, laborReduction: 20 },
        { name: 'Pest Resistant',  data: econ.pest_resistant,  roi: 18, breakEvenMonths: 20, laborReduction: 10 },
    ];

    // Distribute each scenario's revenue across top-4 crops proportionally by score
    const topCrops = [...cropEntries]
        .sort((a, b) => b.suitability_score - a.suitability_score)
        .slice(0, 4);
    const totalScore = topCrops.reduce((s, c) => s + c.suitability_score, 0) || 1;

    return scenarios.map(({ name, data, roi, breakEvenMonths, laborReduction }) => {
        const totalRevenue = Math.round(data.estimated_revenue);
        const crops = topCrops.map(c => {
            const share   = c.suitability_score / totalScore;
            return {
                name:    c.crop,
                revenue: Math.round(totalRevenue * share),
                acres:   Math.round(share * acreage * 10) / 10,
            };
        });

        return {
            name,
            description: data.description,
            totalRevenue,
            laborReduction,
            crops,
            breakEvenMonths,
            roi,
        };
    });
}
