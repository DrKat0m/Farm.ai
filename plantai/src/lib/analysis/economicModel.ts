import type { CropScore, EconomicScenario } from '../store';

export function generateEconomicScenarios(
    cropMatrix: CropScore[],
    acreage: number
): EconomicScenario[] {
    if (cropMatrix.length === 0 || acreage <= 0) return [];

    const topCrops = cropMatrix.slice(0, 8);

    // Scenario A: Max Yield
    const maxYieldCrops = topCrops.slice(0, 4);
    const maxYieldRevenue = maxYieldCrops.reduce((sum, c) => {
        const share = acreage / maxYieldCrops.length;
        return sum + Math.round(c.projectedRevenue * share);
    }, 0);

    // Scenario B: Low Maintenance (prefer low labor/water)
    const lowMaintCrops = [...topCrops]
        .sort((a, b) => {
            const laborScore = (c: CropScore) => c.laborNeed === 'Low' ? 3 : c.laborNeed === 'Medium' ? 2 : 1;
            return laborScore(b) - laborScore(a);
        })
        .slice(0, 4);
    const lowMaintRevenue = lowMaintCrops.reduce((sum, c) => {
        const share = acreage / lowMaintCrops.length;
        return sum + Math.round(c.projectedRevenue * share * 0.85);
    }, 0);

    // Scenario C: Pest Resistant (prefer fewer pests, higher soil match)
    const pestResCrops = [...topCrops]
        .sort((a, b) => {
            const pestScore = (c: CropScore) => (100 - c.pestRisks.length * 10) + c.soilMatch;
            return pestScore(b) - pestScore(a);
        })
        .slice(0, 4);
    const pestResRevenue = pestResCrops.reduce((sum, c) => {
        const share = acreage / pestResCrops.length;
        return sum + Math.round(c.projectedRevenue * share * 0.92);
    }, 0);

    return [
        {
            name: 'Max Yield',
            description: 'Optimized for maximum production output',
            totalRevenue: maxYieldRevenue,
            laborReduction: 0,
            crops: maxYieldCrops.map(c => ({
                name: c.name,
                revenue: Math.round(c.projectedRevenue * (acreage / maxYieldCrops.length)),
                acres: Math.round((acreage / maxYieldCrops.length) * 10) / 10,
            })),
            breakEvenMonths: Math.max(6, Math.round(24 - maxYieldRevenue / 1000)),
            roi: Math.round((maxYieldRevenue / (acreage * 2000)) * 100),
        },
        {
            name: 'Low Maintenance',
            description: '40% less labor with automated-friendly crops',
            totalRevenue: lowMaintRevenue,
            laborReduction: 40,
            crops: lowMaintCrops.map(c => ({
                name: c.name,
                revenue: Math.round(c.projectedRevenue * (acreage / lowMaintCrops.length) * 0.85),
                acres: Math.round((acreage / lowMaintCrops.length) * 10) / 10,
            })),
            breakEvenMonths: Math.max(8, Math.round(30 - lowMaintRevenue / 800)),
            roi: Math.round((lowMaintRevenue / (acreage * 1500)) * 100),
        },
        {
            name: 'Pest Resistant',
            description: 'Lower input costs with disease-resistant varieties',
            totalRevenue: pestResRevenue,
            laborReduction: 15,
            crops: pestResCrops.map(c => ({
                name: c.name,
                revenue: Math.round(c.projectedRevenue * (acreage / pestResCrops.length) * 0.92),
                acres: Math.round((acreage / pestResCrops.length) * 10) / 10,
            })),
            breakEvenMonths: Math.max(7, Math.round(26 - pestResRevenue / 900)),
            roi: Math.round((pestResRevenue / (acreage * 1800)) * 100),
        },
    ];
}
