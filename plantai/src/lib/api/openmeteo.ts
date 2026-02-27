import type { ClimateData } from '../store';

export async function getClimateData(lat: number, lng: number): Promise<ClimateData> {
    try {
        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
            `&timezone=auto&forecast_days=16`;

        const forecastRes = await fetch(url);
        if (!forecastRes.ok) throw new Error('Open-Meteo error');
        const forecast = await forecastRes.json();

        // Build monthly data from climate estimates based on latitude
        const monthlyTemps = buildMonthlyClimate(lat, forecast);
        const annualPrecip = monthlyTemps.reduce((s, m) => s + m.precip, 0);
        const avgAnnualTemp = monthlyTemps.reduce((s, m) => s + (m.min + m.max) / 2, 0) / 12;

        // Estimate hardiness zone from minimum winter temperature
        const minWinterTemp = Math.min(...monthlyTemps.slice(0, 3).concat(monthlyTemps.slice(10)).map(m => m.min));
        const hardinessZone = estimateHardinessZone(minWinterTemp);
        const frostDates = estimateFrostDates(lat, monthlyTemps);

        return {
            monthlyTemps,
            avgAnnualTemp: Math.round(avgAnnualTemp * 10) / 10,
            annualPrecip: Math.round(annualPrecip),
            growingDays: frostDates.growingDays,
            hardinessZone,
            lastFrost: frostDates.lastFrost,
            firstFrost: frostDates.firstFrost,
        };
    } catch {
        return generateFallbackClimate(lat);
    }
}

function buildMonthlyClimate(lat: number, forecast: { daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_sum?: number[] } }) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const latFactor = Math.abs(lat);

    // Use forecast data to calibrate, then estimate full year
    const recentMax = forecast.daily?.temperature_2m_max?.slice(0, 7) || [];
    const recentMin = forecast.daily?.temperature_2m_min?.slice(0, 7) || [];
    const currentAvgMax = recentMax.length > 0 ? recentMax.reduce((a: number, b: number) => a + b, 0) / recentMax.length : 20;
    const currentAvgMin = recentMin.length > 0 ? recentMin.reduce((a: number, b: number) => a + b, 0) / recentMin.length : 5;
    const currentMonth = new Date().getMonth();

    // Temperature curve based on latitude and current conditions
    const tempCurve = [
        -0.5, -0.3, 0.2, 0.5, 0.75, 0.95, 1.0, 0.95, 0.75, 0.5, 0.2, -0.3
    ];

    const summerMax = latFactor > 40 ? 28 : latFactor > 30 ? 33 : 36;
    const winterMin = latFactor > 40 ? -8 : latFactor > 30 ? -2 : 5;

    // Calibrate with actual forecast
    const calibOffset = currentAvgMax - (winterMin + (summerMax - winterMin) * tempCurve[currentMonth]);

    return months.map((month, i) => {
        const factor = tempCurve[i];
        const max = Math.round((winterMin + 10 + (summerMax - winterMin) * factor + calibOffset * 0.3) * 10) / 10;
        const min = Math.round((winterMin + (currentAvgMin - winterMin) * factor) * 10) / 10;
        const precip = Math.round((40 + Math.sin((i + 3) * Math.PI / 6) * 30 + (latFactor < 35 ? 20 : 0)) * 10) / 10;
        return { month, min, max, precip };
    });
}

function estimateHardinessZone(minWinterTempC: number): string {
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
    if (f < -5) return '5b';
    if (f < 0) return '6a';
    if (f < 5) return '6b';
    if (f < 10) return '7a';
    if (f < 15) return '7b';
    if (f < 20) return '8a';
    if (f < 25) return '8b';
    if (f < 30) return '9a';
    if (f < 35) return '9b';
    if (f < 40) return '10a';
    return '10b';
}

function estimateFrostDates(lat: number, monthly: { month: string; min: number }[]) {
    const latFactor = Math.abs(lat);

    // Approximate frost dates based on latitude
    let lastFrost: string;
    let firstFrost: string;
    let growingDays: number;

    if (latFactor > 45) {
        lastFrost = 'May 10';
        firstFrost = 'Sep 25';
        growingDays = 138;
    } else if (latFactor > 40) {
        lastFrost = 'Apr 20';
        firstFrost = 'Oct 15';
        growingDays = 178;
    } else if (latFactor > 35) {
        lastFrost = 'Apr 5';
        firstFrost = 'Oct 28';
        growingDays = 206;
    } else if (latFactor > 30) {
        lastFrost = 'Mar 15';
        firstFrost = 'Nov 15';
        growingDays = 245;
    } else {
        lastFrost = 'Feb 20';
        firstFrost = 'Dec 5';
        growingDays = 288;
    }

    // Adjust if monthly data shows warmer/cooler than expected
    const winterAvgMin = (monthly[0].min + monthly[1].min + monthly[11].min) / 3;
    if (winterAvgMin > 5) growingDays = Math.min(365, growingDays + 30);
    if (winterAvgMin < -10) growingDays = Math.max(90, growingDays - 20);

    return { lastFrost, firstFrost, growingDays };
}

function generateFallbackClimate(lat: number): ClimateData {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const latFactor = Math.abs(lat);
    const monthlyTemps = months.map((month, i) => {
        const factor = Math.sin((i - 1) * Math.PI / 6);
        return {
            month,
            min: Math.round((latFactor > 40 ? -5 : 5) + factor * 15),
            max: Math.round((latFactor > 40 ? 5 : 18) + factor * 15),
            precip: Math.round(50 + Math.sin((i + 3) * Math.PI / 6) * 30),
        };
    });

    return {
        monthlyTemps,
        avgAnnualTemp: latFactor > 40 ? 10 : 18,
        annualPrecip: 900,
        growingDays: latFactor > 40 ? 160 : 220,
        hardinessZone: latFactor > 40 ? '5b' : '7b',
        lastFrost: 'Apr 15',
        firstFrost: 'Oct 20',
    };
}
