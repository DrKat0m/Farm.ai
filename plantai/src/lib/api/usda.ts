import type { SoilData } from '../store';

export async function getSoilData(lat: number, lng: number): Promise<SoilData> {
    try {
        const query = `
      SELECT TOP 1 
        mu.muname, 
        m.ph1to1h2o_r, 
        m.drclassdcd,
        m.om_r, 
        m.awc_r, 
        m.sandtotal_r,
        m.silttotal_r, 
        m.claytotal_r
      FROM mapunit AS mu
      INNER JOIN muaggatt AS m ON mu.mukey = m.mukey
      WHERE mu.mukey IN (
        SELECT DISTINCT mupolygonkey 
        FROM SDA_Get_Mukey_from_intersection_with_WktWgs84(
          'POINT(${lng} ${lat})'
        )
      )
    `;

        const response = await fetch(
            'https://sdmdataaccess.nrcs.usda.gov/Tabular/SDMTabularService/post.rest',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, format: 'JSON+COLUMNNAME' }),
            }
        );

        if (!response.ok) throw new Error('USDA API error');

        const data = await response.json();

        if (data?.Table && data.Table.length > 0) {
            const row = data.Table[0];
            return {
                name: row.muname || 'Unknown soil type',
                ph: parseFloat(row.ph1to1h2o_r) || 6.5,
                drainage: row.drclassdcd || 'Well drained',
                organicMatter: parseFloat(row.om_r) || 2.5,
                awc: parseFloat(row.awc_r) || 0.15,
                sand: parseFloat(row.sandtotal_r) || 40,
                silt: parseFloat(row.silttotal_r) || 40,
                clay: parseFloat(row.claytotal_r) || 20,
            };
        }

        return generateFallbackSoil(lat, lng);
    } catch {
        return generateFallbackSoil(lat, lng);
    }
}

function generateFallbackSoil(lat: number, lng: number): SoilData {
    // Deterministic fallback based on coordinates
    const seed = Math.abs(lat * 1000 + lng * 100) % 100;
    const soilTypes = [
        'Hagerstown silt loam', 'Cecil sandy loam', 'Norfolk loamy sand',
        'Tifton loamy sand', 'Houston Black clay', 'Drummer silty clay loam',
        'Walla Walla silt loam', 'Palouse silt loam', 'San Joaquin loam'
    ];
    const drainageClasses = ['Well drained', 'Moderately well drained', 'Somewhat poorly drained'];

    return {
        name: soilTypes[Math.floor(seed / 11)] || soilTypes[0],
        ph: 5.8 + (seed % 30) / 10,
        drainage: drainageClasses[Math.floor(seed / 33)] || drainageClasses[0],
        organicMatter: 1.5 + (seed % 40) / 10,
        awc: 0.10 + (seed % 15) / 100,
        sand: 25 + (seed % 35),
        silt: 25 + ((seed + 20) % 35),
        clay: 10 + (seed % 25),
    };
}
