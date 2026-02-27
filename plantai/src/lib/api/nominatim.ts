export async function geocodeAddress(query: string): Promise<{
    displayName: string;
    lat: number;
    lng: number;
    state?: string;
    county?: string;
}[]> {
    if (!query || query.length < 3) return [];

    const encoded = encodeURIComponent(query);
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&addressdetails=1&countrycodes=us`,
        { headers: { 'User-Agent': 'PlantAI/1.0 (contact@plantai.app)' } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        state: item.address?.state || '',
        county: item.address?.county || '',
    }));
}
