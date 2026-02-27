export async function getWeatherAlerts(lat: number, lng: number): Promise<string[]> {
    try {
        const pointRes = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`, {
            headers: { 'User-Agent': 'PlantAI/1.0 (contact@plantai.app)' },
        });
        if (!pointRes.ok) return [];
        const point = await pointRes.json();

        const zoneId = point.properties?.forecastZone?.split('/').pop();
        if (!zoneId) return [];

        const alertRes = await fetch(
            `https://api.weather.gov/alerts/active?zone=${zoneId}`,
            { headers: { 'User-Agent': 'PlantAI/1.0 (contact@plantai.app)' } }
        );
        if (!alertRes.ok) return [];

        const alerts = await alertRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (alerts.features || []).map((f: any) => f.properties?.headline || '').filter(Boolean);
    } catch {
        return [];
    }
}
