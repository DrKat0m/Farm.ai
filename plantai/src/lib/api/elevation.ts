export async function getElevation(lat: number, lng: number): Promise<number> {
    try {
        const response = await fetch(
            `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
        );
        if (!response.ok) throw new Error('Elevation API error');
        const data = await response.json();
        return data.results?.[0]?.elevation ?? estimateElevation(lat, lng);
    } catch {
        return estimateElevation(lat, lng);
    }
}

export async function getElevationProfile(
    coordinates: [number, number][]
): Promise<number[]> {
    try {
        const locations = coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
        }));
        const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locations }),
        });
        if (!response.ok) throw new Error('Elevation API error');
        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.results.map((r: any) => r.elevation);
    } catch {
        return coordinates.map(([lng, lat]) => estimateElevation(lat, lng));
    }
}

function estimateElevation(lat: number, lng: number): number {
    // Very rough US elevation estimate
    const baseLng = Math.abs(lng);
    if (baseLng > 105) return 200 + Math.abs(lat - 40) * 20; // West coast
    if (baseLng > 95) return 800 + Math.abs(lat - 38) * 30;  // Great Plains
    if (baseLng > 82) return 300 + Math.abs(lat - 36) * 15;  // Midwest
    return 150 + Math.abs(lat - 38) * 10;                     // East coast
}
