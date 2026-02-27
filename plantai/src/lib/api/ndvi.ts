// Simulated NDVI — in production this would use Sentinel Hub
// Returns a value between 0 and 1
export function getNDVIValue(lat: number, lng: number): number {
    // Generate a realistic NDVI based on location and season
    const month = new Date().getMonth();
    const latFactor = Math.abs(lat);

    // Higher NDVI in growing season, lower in winter
    const seasonalBoost = Math.sin((month - 2) * Math.PI / 6) * 0.15;

    // Southern areas tend to have more year-round vegetation
    const latBoost = latFactor < 35 ? 0.1 : latFactor < 45 ? 0 : -0.05;

    // Base NDVI with some coordinate-based variation
    const base = 0.55 + (Math.sin(lat * 10) * Math.cos(lng * 10)) * 0.15;

    return Math.max(0.1, Math.min(0.95, base + seasonalBoost + latBoost));
}

export function getNDVILabel(value: number): { label: string; color: string } {
    if (value >= 0.7) return { label: 'Healthy vegetation', color: '#4ade80' };
    if (value >= 0.5) return { label: 'Moderate vegetation', color: '#facc15' };
    if (value >= 0.3) return { label: 'Sparse vegetation', color: '#fb923c' };
    return { label: 'Bare/stressed', color: '#ef4444' };
}
