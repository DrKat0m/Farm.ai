import type { SoilData, ClimateData, CropScore } from '../store';
import cropsData from '../data/crops.json';

interface CropEntry {
    name: string;
    category: string;
    soil: { phMin: number; phMax: number; drainagePreferred: string; organicMatterMin: number };
    climate: { minZone: string; maxZone: string; growingDaysMin: number; frostSensitive: boolean };
    water: string;
    labor: string;
    yieldPerAcre: number;
    pricePerLb: number;
    companions: string[];
    pests: string[];
    rotation: string[];
}

const zoneOrder = [
    '1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b', '5a', '5b',
    '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b'
];

function zoneToIndex(zone: string): number {
    return zoneOrder.indexOf(zone.toLowerCase());
}

function matchSoilRequirements(cropSoil: CropEntry['soil'], soil: SoilData): number {
    let score = 0;

    // pH match (0-40 points)
    if (soil.ph >= cropSoil.phMin && soil.ph <= cropSoil.phMax) {
        score += 40;
    } else {
        const phDist = Math.min(
            Math.abs(soil.ph - cropSoil.phMin),
            Math.abs(soil.ph - cropSoil.phMax)
        );
        score += Math.max(0, 40 - phDist * 15);
    }

    // Drainage match (0-30 points)
    if (soil.drainage.toLowerCase().includes(cropSoil.drainagePreferred.toLowerCase())) {
        score += 30;
    } else {
        score += 15;
    }

    // Organic matter (0-30 points)
    if (soil.organicMatter >= cropSoil.organicMatterMin) {
        score += 30;
    } else {
        score += Math.max(0, 30 - (cropSoil.organicMatterMin - soil.organicMatter) * 15);
    }

    return score / 100;
}

function matchClimateRequirements(cropClimate: CropEntry['climate'], climate: ClimateData): number {
    let score = 0;

    // Zone match (0-50 points)
    const zoneIdx = zoneToIndex(climate.hardinessZone);
    const minIdx = zoneToIndex(cropClimate.minZone);
    const maxIdx = zoneToIndex(cropClimate.maxZone);

    if (zoneIdx >= minIdx && zoneIdx <= maxIdx) {
        // In range — bonus for being in the middle
        const range = maxIdx - minIdx;
        const pos = zoneIdx - minIdx;
        const centeredness = 1 - Math.abs(pos / range - 0.5) * 2;
        score += 35 + centeredness * 15;
    } else {
        const dist = Math.min(
            Math.abs(zoneIdx - minIdx),
            Math.abs(zoneIdx - maxIdx)
        );
        score += Math.max(0, 35 - dist * 10);
    }

    // Growing days (0-50 points)
    if (climate.growingDays >= cropClimate.growingDaysMin) {
        score += 50;
    } else {
        const deficit = cropClimate.growingDaysMin - climate.growingDays;
        score += Math.max(0, 50 - deficit * 2);
    }

    return score / 100;
}

export function scoreCrops(soil: SoilData, climate: ClimateData): CropScore[] {
    return (cropsData as CropEntry[]).map((crop) => {
        const soilMatch = matchSoilRequirements(crop.soil, soil);
        const climateMatch = matchClimateRequirements(crop.climate, climate);

        const waterScore = crop.water === 'Low' ? 0.9 : crop.water === 'Medium' ? 0.7 : 0.5;

        const score = Math.round(
            (soilMatch * 0.35 + climateMatch * 0.30 + waterScore * 0.20 + 0.7 * 0.15) * 100
        );

        const yieldLbs = crop.yieldPerAcre * (score / 100);
        const revenue = Math.round(yieldLbs * crop.pricePerLb);

        const reasons: string[] = [];
        if (soilMatch > 0.7) reasons.push(`Well-suited for ${soil.name}`);
        if (climateMatch > 0.7) reasons.push(`Thrives in Zone ${climate.hardinessZone}`);
        if (soilMatch <= 0.5) reasons.push(`Soil pH may need adjustment`);

        return {
            name: crop.name,
            score,
            soilMatch: Math.round(soilMatch * 100),
            climateMatch: Math.round(climateMatch * 100),
            waterNeed: crop.water,
            laborNeed: crop.labor,
            projectedYield: Math.round(yieldLbs),
            projectedRevenue: revenue,
            reason: reasons.join('. ') || `Compatible with local conditions`,
            companionPlants: crop.companions,
            pestRisks: crop.pests,
            rotationTips: crop.rotation,
        };
    }).sort((a, b) => b.score - a.score);
}
