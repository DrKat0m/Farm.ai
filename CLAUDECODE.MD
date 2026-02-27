\# PlantAI MVP — Claude Code Specification



\## Project Vision



Build a visually stunning, fully functional web application for PlantAI — an agricultural intelligence platform that lets users locate their property on a map, draw their farm/garden boundary, and instantly receive a rich intelligence report: soil composition, climate profile, NDVI vegetation health, crop recommendations, and a 3D farm visualization — all grounded in real geospatial data.



The visual language is \*\*precision luxury\*\* — the spatial density of a Bloomberg Terminal married to the tactile refinement of Apple Maps. No emojis anywhere. Real photography and high-resolution imagery. Physics-based animations. Every interaction should feel like touching glass.



---



\## Tech Stack



```

Frontend        Next.js 14 (App Router) + TypeScript

Styling         Tailwind CSS + custom CSS variables

Maps            MapLibre GL JS + @mapbox/mapbox-gl-draw

3D              Three.js + React Three Fiber + @react-three/drei

Animations      Framer Motion + CSS custom properties

State           Zustand

Data fetching   TanStack Query (React Query)

Backend         FastAPI (Python 3.11)

Database        PostgreSQL + PostGIS (Docker)

HTTP client     Axios

```



---



\## Visual Design System



\### Typography

```css

--font-display: 'Canela', 'Playfair Display', Georgia, serif;       /\* headlines \*/

--font-body: 'Söhne', 'DM Sans', 'Inter', sans-serif;               /\* body text \*/

--font-mono: 'Berkeley Mono', 'JetBrains Mono', monospace;          /\* data values \*/

```



\### Color Palette

```css

--color-bg:           #0a0d0a;    /\* near-black with green undertone \*/

--color-surface:      #111612;    /\* card surfaces \*/

--color-surface-2:    #1a2019;    /\* elevated surfaces \*/

--color-border:       #2a3528;    /\* subtle borders \*/

--color-border-bright:#3d5239;    /\* active borders \*/



--color-primary:      #4ade80;    /\* electric green — primary accent \*/

--color-primary-dim:  #22c55e;    /\* dimmed green \*/

--color-primary-glow: rgba(74, 222, 128, 0.15);



--color-soil:         #c2956b;    /\* warm earth \*/

--color-soil-dim:     #8a6347;

--color-water:        #38bdf8;    /\* sky blue for water/NDVI \*/

--color-heat:         #fb923c;    /\* orange for heat/drought \*/



--color-text-primary: #f0f4f0;

--color-text-secondary:#8fa88a;

--color-text-muted:   #4a5e47;

```



\### Animation Principles

\- All transitions: `cubic-bezier(0.16, 1, 0.3, 1)` — Apple's spring curve

\- Default duration: 400ms for UI elements, 600ms for page transitions

\- Map flyto animations: 1200ms with easing

\- Data reveal: staggered 80ms delays between items

\- No abrupt cuts — everything breathes in and out

\- Use `will-change: transform` on animated elements

\- Hover states: subtle scale(1.02) + shadow deepening

\- Loading states: skeleton shimmer with gradient sweep



\### Imagery

\- Use Unsplash API for real farm/landscape photography in backgrounds

\- High-res texture overlays for cards (grain, noise)

\- Real satellite imagery tiles from MapTiler free tier

\- No placeholder boxes — always show real imagery or a beautiful skeleton



---



\## Application Architecture



```

/app

&nbsp; /page.tsx                 — Landing / onboarding flow

&nbsp; /map/page.tsx             — Main map interface

&nbsp; /analysis/\[id]/page.tsx   — Analysis results dashboard

&nbsp; /farm/\[id]/page.tsx       — 3D farm visualization



/components

&nbsp; /map

&nbsp;   MapCanvas.tsx           — Core MapLibre instance

&nbsp;   PropertyDraw.tsx        — Polygon drawing tool

&nbsp;   LayerControls.tsx       — NDVI / soil / moisture toggles

&nbsp;   PropertyPopup.tsx       — Info popup on map tap/click

&nbsp; /analysis

&nbsp;   SoilCard.tsx

&nbsp;   ClimateCard.tsx

&nbsp;   NDVICard.tsx

&nbsp;   CropMatrix.tsx

&nbsp;   EconomicDashboard.tsx

&nbsp; /farm

&nbsp;   FarmScene.tsx           — React Three Fiber scene

&nbsp;   CropModel.tsx           — Individual crop 3D model

&nbsp;   TerrainMesh.tsx         — Elevation-based terrain

&nbsp;   SunSimulator.tsx        — Real sun position

&nbsp; /ui

&nbsp;   GlassCard.tsx

&nbsp;   DataMetric.tsx

&nbsp;   AnimatedNumber.tsx

&nbsp;   ProgressRing.tsx

&nbsp;   Skeleton.tsx



/lib

&nbsp; /api

&nbsp;   usda.ts                 — USDA Soil Data Access

&nbsp;   openmeteo.ts            — Weather + climate

&nbsp;   noaa.ts                 — Frost dates

&nbsp;   nass.ts                 — Crop benchmarks

&nbsp;   droughtmonitor.ts       — Drought status

&nbsp;   ndvi.ts                 — Sentinel Hub NDVI

&nbsp; /spatial

&nbsp;   elevation.ts            — Elevation profile from coordinates

&nbsp;   h3.ts                   — Hexagonal spatial indexing

&nbsp;   turf.ts                 — Polygon area, centroid, bbox

&nbsp; /analysis

&nbsp;   cropScorer.ts           — Crop compatibility matrix

&nbsp;   irrigationHeatmap.ts    — Slope + soil → water flow

&nbsp;   economicModel.ts        — Yield projections, ROI

```



---



\## Screen 1: Landing / Onboarding



\*\*URL:\*\* `/`



\### Layout

Full-viewport split:

\- Left 55%: Real aerial farm photography (Unsplash, `?q=aerial+farm+agriculture+landscape`) as background with dark overlay gradient. Large serif headline over it.

\- Right 45%: Clean dark panel with the search/start interface.



\### Content

```

Headline (display font, 64px):

"Know your land

before you plant

a single seed."



Subheadline (body font, 18px, muted color):

"Enter your address. PlantAI pulls soil composition,

climate history, vegetation health, and crop intelligence

for your exact property — before you buy a single sensor."



CTA Button: "Analyze my land"

Secondary: "Watch 90-second demo"

```



\### Animation Sequence on Load

1\. Background image fades in over 800ms with subtle Ken Burns zoom (scale 1.0 → 1.04 over 8s, infinite)

2\. Left panel text slides up from y:30 with staggered 120ms delays per line

3\. Right panel slides in from x:40 with spring easing

4\. A subtle green glow pulses on the CTA button every 3s



\### Address Search Component

\- Full-width input with a thin green bottom border (not a box)

\- As user types, show autocomplete dropdown using OpenStreetMap Nominatim (free geocoding, no key required)

\- On selection: coordinate extracted, state saved, transition to Map screen

\- Input placeholder: "Street address, city, or coordinates"



---



\## Screen 2: Map Interface (Core Screen)



\*\*URL:\*\* `/map`



\### Layout

```

┌─────────────────────────────────────────────────────────┐

│  HEADER BAR (56px, frosted glass)                       │

│  PlantAI wordmark    \[Property: —]    \[Analyze] \[3D]    │

├──────────┬──────────────────────────────────────────────┤

│ LEFT     │                                              │

│ SIDEBAR  │         FULL MAP CANVAS                      │

│ (320px)  │                                              │

│          │                                              │

│ Property │                                              │

│ Info     │                                              │

│          │                                              │

│ Layer    │                                              │

│ Controls │                                              │

│          │                                              │

│ Draw     │                                              │

│ Tools    │                                              │

└──────────┴──────────────────────────────────────────────┘

```



\### Map Canvas (MapLibre GL JS)



\*\*Initialization:\*\*

```typescript

const map = new maplibregl.Map({

&nbsp; container: 'map',

&nbsp; style: 'https://api.maptiler.com/maps/hybrid/style.json?key=YOUR\_FREE\_KEY',

&nbsp; // MapTiler Hybrid = satellite + roads overlay, 100k free requests/month

&nbsp; center: \[userLng, userLat],  // from address lookup

&nbsp; zoom: 16,

&nbsp; pitch: 45,         // tilted 3D perspective by default

&nbsp; bearing: -15,

&nbsp; antialias: true

});

```



\*\*On map load:\*\*

\- Smooth flyTo animation to user's coordinate: `{ center, zoom: 17, pitch: 50, duration: 2000, essential: true }`

\- Map pitches to show 3D building extrusions for context

\- A pulsing green dot marks the searched address



\*\*What Renders on the Map:\*\*



1\. \*\*Property polygon\*\* (after user draws): semi-transparent green fill (#4ade80, 15% opacity), bright green stroke (2px), with a subtle animated dash pattern on the boundary

2\. \*\*NDVI overlay layer\*\* (toggle): Sentinel Hub WMS tiles showing vegetation health — red/orange for stressed, deep green for healthy — blended at 60% opacity over satellite

3\. \*\*Soil quality zones\*\*: Color-coded polygons from USDA data, shown when "Soil" layer is active

4\. \*\*Elevation contours\*\*: Thin white lines at 1m intervals when "Terrain" layer is active

5\. \*\*Irrigation flow arrows\*\*: Animated arrow glyphs showing water runoff direction based on slope analysis

6\. \*\*Tap/click popups\*\*: Any location tapped on the map opens a floating card (see below)



\### Drawing Tool (mapbox-gl-draw)



Custom styling for the draw tool:

```javascript

// Override default draw styles

const drawStyles = \[

&nbsp; // Polygon fill while drawing

&nbsp; { id: 'gl-draw-polygon-fill', paint: {

&nbsp;   'fill-color': '#4ade80',

&nbsp;   'fill-opacity': 0.1

&nbsp; }},

&nbsp; // Polygon stroke

&nbsp; { id: 'gl-draw-polygon-stroke', paint: {

&nbsp;   'line-color': '#4ade80',

&nbsp;   'line-width': 2,

&nbsp;   'line-dasharray': \[4, 2]

&nbsp; }},

&nbsp; // Vertex points

&nbsp; { id: 'gl-draw-point', paint: {

&nbsp;   'circle-color': '#4ade80',

&nbsp;   'circle-radius': 6,

&nbsp;   'circle-stroke-color': '#0a0d0a',

&nbsp;   'circle-stroke-width': 2

&nbsp; }}

];

```



Drawing UI:

\- Bottom-center floating toolbar: \[Draw Property] \[Edit] \[Clear] buttons

\- When drawing mode active: instruction toast appears top-center: "Click to place boundary points. Double-click to complete."

\- On polygon complete: brief celebration — boundary animates with a green glow pulse, acreage appears instantly, sidebar activates



\### Tap/Click Popup (CRITICAL FEATURE)



When user taps/clicks anywhere on the map (whether inside their drawn polygon or outside):



```typescript

map.on('click', (e) => {

&nbsp; const { lng, lat } = e.lngLat;

&nbsp; // Show a floating card at click position

&nbsp; showLocationPopup(lat, lng);

});

```



\*\*Popup card design:\*\*

\- Glassmorphism card (backdrop-filter: blur(20px), dark background 85% opacity)

\- Appears with scale(0.9)→scale(1) + opacity 0→1 animation, 300ms spring

\- Shows coordinate in DMS format

\- Shows soil type at that point (from USDA SDA, called on tap)

\- Shows elevation (from Open-Elevation API — free)

\- Shows NDVI value at that pixel (from Sentinel Hub)

\- "Add to property" button if point is outside current polygon

\- Closes on map click elsewhere or X button



\*\*Popup content layout:\*\*

```

┌─────────────────────────────┐

│ 40°47'N  77°51'W   ↗ 341m  │

├─────────────────────────────┤

│ SOIL                        │

│ Hagerstown silt loam        │

│ pH 6.8 · Well drained       │

├─────────────────────────────┤

│ VEGETATION HEALTH           │

│ ████████░░  NDVI 0.74       │

│ Healthy · Above average     │

├─────────────────────────────┤

│ \[ Add to analysis ]         │

└─────────────────────────────┘

```



\### Left Sidebar



\*\*Top section — Property Summary (visible after polygon drawn):\*\*

```

PROPERTY

────────────────

4.7 acres

State College, PA

Centre County



SOIL OVERVIEW

────────────────

Hagerstown silt loam

pH 6.8 — Slightly acidic

Organic matter: 3.2%

Drainage: Well drained



HARDINESS ZONE

────────────────

Zone 6b

Last frost: Apr 15

First frost: Oct 20

```



\*\*Layer Controls (bottom of sidebar):\*\*



Toggle switches with labels:

\- Satellite (always on)

\- NDVI Vegetation Health

\- Soil Zones

\- Elevation Contours  

\- Irrigation Flow

\- 3D Terrain



Each toggle animates the map layer on/off with 400ms opacity transition.



\*\*Draw Tools:\*\*

\- \[Draw Property Boundary] — primary action button

\- \[Edit Boundary]

\- \[Clear and Restart]



---



\## Data Pipeline — What Gets Called When



\### On address selection (before map loads):

```typescript

// 1. Geocode to coordinates (Nominatim — free, no key)

const coords = await nominatim.search(address);



// 2. Get USDA Hardiness Zone

const zone = await getHardinessZone(coords.lat, coords.lng);



// 3. Get Open-Meteo climate normals (30-year averages)

const climate = await openmeteo.getClimateNormals(coords.lat, coords.lng);



// 4. Get current drought status

const drought = await droughtmonitor.getStatus(coords.lat, coords.lng);

```



\### On polygon complete (after user draws boundary):

```typescript

// All called in parallel via Promise.all



// 1. USDA Soil Data Access — soil composition for polygon centroid

const soil = await usda.getSoilData(centroid.lat, centroid.lng);



// 2. NOAA CDO — frost dates for that location

const frostDates = await noaa.getFrostDates(centroid.lat, centroid.lng);



// 3. Open-Meteo — 16-day forecast + historical data

const weather = await openmeteo.getForecast(centroid.lat, centroid.lng);



// 4. NWS — active weather alerts for the grid point

const alerts = await nws.getAlerts(centroid.lat, centroid.lng);



// 5. USDA NASS — county-level crop benchmarks

const county = await nass.getCountyData(coords.state, coords.county);



// 6. Elevation profile — slope analysis for irrigation heatmap

const elevation = await openElevation.getProfile(polygonCoords);



// 7. Sentinel Hub NDVI (free trial) — vegetation health overlay

const ndvi = await sentinelhub.getNDVI(polygonBbox);



// 8. Compute derived data locally (no API call)

const irrigationMap = computeIrrigationFlow(elevation, soil.drainage);

const cropMatrix = scoreCrops(soil, climate, frostDates, county);

const economicProjection = modelEconomics(cropMatrix, polygonAcres);

```



Show a loading state during this (see Loading States section).



---



\## Screen 3: Analysis Dashboard



\*\*URL:\*\* `/analysis/\[id]`



Triggered by "Analyze" button in header after polygon is drawn. Full-page results dashboard.



\### Layout



```

┌─────────────────────────────────────────────────────────┐

│ HEADER: Property name · 4.7 acres · State College PA    │

├───────────┬─────────────────────────────────────────────┤

│ NAV       │                                             │

│ ─────     │   CONTENT AREA                              │

│ Overview  │                                             │

│ Soil      │                                             │

│ Climate   │                                             │

│ Crops     │                                             │

│ Economics │                                             │

│ 3D View   │                                             │

└───────────┴─────────────────────────────────────────────┘

```



\### Overview Tab



Three key metric cards at top (animated number counters on entry):

```

┌──────────────┐  ┌──────────────┐  ┌──────────────┐

│ SOIL HEALTH  │  │ GROWING DAYS │  │ YIELD POTENTIAL│

│              │  │              │  │               │

│     78       │  │    165       │  │  $8,400/yr    │

│   / 100      │  │   per year   │  │  est. revenue │

└──────────────┘  └──────────────┘  └──────────────┘

```



Below that: the NDVI satellite image of their drawn property (actual Sentinel-2 image, cropped to their polygon boundary), with a color legend.



Then: Top 3 recommended crops as large cards with:

\- Crop name in display font

\- Real crop photograph from Unsplash as card background

\- Suitability score (e.g., "94% match")

\- Key reason ("Ideal for Hagerstown silt loam, Zone 6b")

\- Estimated yield and revenue



\### Soil Tab



Full breakdown of USDA soil data:

\- Soil series name and description

\- Visual composition bar: clay / silt / sand percentages

\- pH gauge (semicircle visualization, needle pointing to value)

\- Drainage class with visual explanation

\- Organic matter percentage with context ("Top 30% for your region")

\- Water holding capacity

\- Recommended amendments



\### Climate Tab



12-month calendar visualization showing:

\- Each month as a column

\- Temperature range as a vertical bar (min/max)

\- Rainfall as a blue area below

\- Frost dates highlighted in white

\- Growing season highlighted in green

\- Current month highlighted



Plus: Current drought status widget and 16-day forecast mini-chart.



\### Crops Tab



Full crop compatibility matrix — sortable table:

```

Crop        | Soil Match | Climate | Water | Labor | Revenue | Score

────────────────────────────────────────────────────────────────────

Tomatoes    | ████████░░ | ████████ | Med   | Med   | $2,400  | 91

Sweet Corn  | ███████░░░ | ████████ | Low   | Low   | $1,800  | 87

Peppers     | ████████░░ | ███████░ | Med   | Med   | $3,100  | 85

...

```



Each row is clickable — expands to show companion plants, pest risks, rotation recommendations.



\### Economics Tab



\*\*THE PINNED FEATURE — make this impressive:\*\*



Top section: Three layout scenarios side by side

\- Layout A: Max Yield — projected $12,400/yr revenue

\- Layout B: Low Maintenance — projected $7,200/yr, 40% less labor

\- Layout C: Pest Resistant — projected $9,100/yr, lower input costs



Each scenario has:

\- Bar chart showing revenue breakdown by crop

\- Break-even timeline visualization

\- ROI percentage



Below: Community benchmarking card

```

REGIONAL BENCHMARK

──────────────────────────────────────────────────

Similar properties within 50 miles (H3 zone 8):

Average yield:     3.2 tons/acre

Your projection:   4.1 tons/acre   ↑ 28% above average



You are in the top 22% of properties in your region

for soil quality.

```



Below that: Grant eligibility flags

\- USDA EQIP — Conservation program (eligible based on acreage)

\- USDA CSP — Stewardship program

\- Each with estimated funding amount and application link



---



\## Screen 4: 3D Farm Visualization



\*\*URL:\*\* `/farm/\[id]`



Accessible from the "3D View" button in the header or analysis nav.



\### Scene Setup (React Three Fiber)



```typescript

<Canvas

&nbsp; camera={{ position: \[0, 15, 20], fov: 45 }}

&nbsp; shadows

&nbsp; gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}

>

&nbsp; <Environment preset="sunset" />  {/\* from drei \*/}

&nbsp; <TerrainMesh elevationData={elevationData} soilData={soilData} />

&nbsp; <CropLayout crops={recommendedCrops} layout={selectedLayout} />

&nbsp; <SunSimulator lat={coords.lat} lng={coords.lng} date={new Date()} />

&nbsp; <OrbitControls enableDamping dampingFactor={0.05} />

&nbsp; <fog attach="fog" color="#0a0d0a" near={40} far={80} />

</Canvas>

```



\### TerrainMesh

\- Build a PlaneGeometry displaced by real elevation data from the polygon

\- Apply soil-colored texture (brown/tan) with subtle grass texture overlay

\- Soil health zones color-coded subtly on terrain surface



\### CropLayout

\- Place GLTF crop models (from Poly Haven, CC0 free) at AI-recommended positions

\- Each crop is a clickable mesh — on click, shows a floating info card in 3D space (using drei's `<Html>`)

\- Models should be: tomato plant, corn stalk, pepper plant, basil, sunflower (download these GLTF files or use procedurally generated ones)

\- Crops animate a gentle sway with a sine wave on the y-rotation (wind simulation)



\### SunSimulator

\- Use SunCalc library (free) to get real sun position for lat/lng + time of day

\- DirectionalLight positioned at real sun angle

\- A visible sun sphere in the sky

\- UI slider: drag to change time of day → sun moves, shadows change in real time

\- Another slider: change date/season → sun arc changes, showing different shadow patterns



\### Layout Toggle

Three buttons overlay: \[Max Yield] \[Low Maintenance] \[Pest Resistant]

\- Switching layout: crops animate out (scale to 0, spring) then new layout animates in with staggered delays



\### Camera Controls

\- Default orbit controls with inertia

\- Preset camera positions: \[Top View] \[Perspective] \[Ground Level] \[North Side]

\- Each preset: smooth camera transition using `gsap` or Framer Motion's `useMotionValue`



---



\## Loading States



When data APIs are being called after polygon drawn, show:



A full-overlay loading experience (not a spinner):

```

Background: blurred map still visible behind



Centered card:

&nbsp; "Analyzing your property"



&nbsp; Progress items animate in one by one:

&nbsp; ✓  Location identified · State College, PA        \[done]

&nbsp; ●  Soil composition · USDA database...            \[loading pulse]

&nbsp; ○  Climate history · 30-year normals              \[pending]

&nbsp; ○  Vegetation health · Sentinel-2 satellite       \[pending]

&nbsp; ○  Crop compatibility matrix                      \[pending]

&nbsp; ○  Economic projections                           \[pending]



&nbsp; Each item shows a thin green progress line that fills left-to-right

&nbsp; when complete.



&nbsp; "Processing 847 environmental data points..."

&nbsp; (number counts up in real time)

```



---



\## API Implementations



\### USDA Soil Data Access

```typescript

// No API key required

export async function getSoilData(lat: number, lng: number) {

&nbsp; const query = `

&nbsp;   SELECT mapunit.muname, muaggatt.ph1to1h2o\_r, muaggatt.drclassdcd,

&nbsp;          muaggatt.om\_r, muaggatt.awc\_r, muaggatt.sandtotal\_r,

&nbsp;          muaggatt.silttotal\_r, muaggatt.claytotal\_r

&nbsp;   FROM mapunit

&nbsp;   INNER JOIN muaggatt ON mapunit.mukey = muaggatt.mukey

&nbsp;   INNER JOIN component ON mapunit.mukey = component.mukey

&nbsp;   INNER JOIN chorizon ON component.cokey = chorizon.cokey

&nbsp;   ORDER BY component.majcompflag DESC

&nbsp; `;

&nbsp; const response = await fetch(

&nbsp;   `https://sdmdataaccess.nrcs.usda.gov/Tabular/SDMTabularService/post.rest`,

&nbsp;   { method: 'POST', body: JSON.stringify({ query, format: 'JSON+COLUMNNAME' }) }

&nbsp; );

&nbsp; // Alternative: spatial query by lat/lng

&nbsp; const spatialUrl = `https://sdmdataaccess.nrcs.usda.gov/Spatial/SDMWGS84GEOGRAPHIC.wfs?SERVICE=WFS\&VERSION=1.1.0\&REQUEST=GetFeature\&TYPENAME=MapunitPolyExtended\&FILTER=<Filter><Contains><PropertyName>Geometry</PropertyName><Point><pos>${lat} ${lng}</pos></Point></Contains></Filter>`;

}

```



\### Open-Meteo (No API key)

```typescript

export async function getClimateData(lat: number, lng: number) {

&nbsp; // Current + forecast

&nbsp; const forecast = await fetch(

&nbsp;   `https://api.open-meteo.com/v1/forecast?latitude=${lat}\&longitude=${lng}` +

&nbsp;   `\&daily=temperature\_2m\_max,temperature\_2m\_min,precipitation\_sum,` +

&nbsp;   `windspeed\_10m\_max,et0\_fao\_evapotranspiration` +

&nbsp;   `\&timezone=auto\&forecast\_days=16`

&nbsp; );



&nbsp; // Historical 30-year normals

&nbsp; const historical = await fetch(

&nbsp;   `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}\&longitude=${lng}` +

&nbsp;   `\&start\_date=1993-01-01\&end\_date=2023-12-31` +

&nbsp;   `\&daily=temperature\_2m\_max,temperature\_2m\_min,precipitation\_sum` +

&nbsp;   `\&timezone=auto`

&nbsp; );

}

```



\### NWS Alerts (No API key)

```typescript

export async function getWeatherAlerts(lat: number, lng: number) {

&nbsp; // First get the grid point

&nbsp; const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lng}`);

&nbsp; const point = await pointRes.json();



&nbsp; // Then get alerts for that zone

&nbsp; const alertRes = await fetch(

&nbsp;   `https://api.weather.gov/alerts/active?zone=${point.properties.forecastZone}`

&nbsp; );

&nbsp; return alertRes.json();

}

```



\### Open-Elevation (Free, no key)

```typescript

export async function getElevationProfile(coordinates: \[number, number]\[]) {

&nbsp; const locations = coordinates.map((\[lng, lat]) => ({ latitude: lat, longitude: lng }));

&nbsp; const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {

&nbsp;   method: 'POST',

&nbsp;   headers: { 'Content-Type': 'application/json' },

&nbsp;   body: JSON.stringify({ locations })

&nbsp; });

&nbsp; return response.json();

}

```



\### Nominatim Geocoding (Free, no key)

```typescript

export async function geocodeAddress(address: string) {

&nbsp; const encoded = encodeURIComponent(address);

&nbsp; const res = await fetch(

&nbsp;   `https://nominatim.openstreetmap.org/search?q=${encoded}\&format=json\&limit=5`,

&nbsp;   { headers: { 'User-Agent': 'PlantAI/1.0 (contact@plantai.app)' } }

&nbsp;   // Nominatim requires a User-Agent header

&nbsp; );

&nbsp; return res.json();

}

```



\### USDA NASS Quick Stats (Free, requires free API key signup)

```typescript

export async function getCountyCropData(state: string, county: string) {

&nbsp; const res = await fetch(

&nbsp;   `https://quickstats.nass.usda.gov/api/api\_GET/?key=${NASS\_KEY}` +

&nbsp;   `\&source\_desc=SURVEY\&sector\_desc=CROPS\&group\_desc=FIELD CROPS` +

&nbsp;   `\&state\_name=${state}\&county\_name=${county}\&year=2023\&format=JSON`

&nbsp; );

&nbsp; return res.json();

}

```



---



\## Spatial Analysis (Local Computation, No API)



\### Irrigation Flow Heatmap

```typescript

import \* as turf from '@turf/turf';



export function computeIrrigationFlow(

&nbsp; elevationGrid: number\[]\[],

&nbsp; soilDrainage: string,

&nbsp; polygonGeoJSON: GeoJSON.Feature

) {

&nbsp; // D8 flow direction algorithm

&nbsp; // For each cell, determine which of 8 neighbors is lowest

&nbsp; // Accumulate flow counts downstream

&nbsp; // Map to color: blue = pooling (low flow), orange = high runoff

&nbsp; 

&nbsp; const drainageMultiplier = {

&nbsp;   'Well drained': 0.3,

&nbsp;   'Moderately well drained': 0.5,

&nbsp;   'Somewhat poorly drained': 0.7,

&nbsp;   'Poorly drained': 0.9,

&nbsp;   'Very poorly drained': 1.0

&nbsp; }\[soilDrainage] ?? 0.5;



&nbsp; // Returns GeoJSON with flow accumulation values for rendering as a map layer

}

```



\### Crop Scoring

```typescript

export function scoreCrops(

&nbsp; soil: SoilData,

&nbsp; climate: ClimateData,

&nbsp; frostDates: FrostData,

&nbsp; benchmarks: NASSData

): CropScore\[] {

&nbsp; const crops = CROP\_DATABASE; // local JSON of 50+ crops with requirements



&nbsp; return crops.map(crop => {

&nbsp;   const soilScore = matchSoilRequirements(crop.soil, soil);

&nbsp;   const climateScore = matchClimateRequirements(crop.climate, climate);

&nbsp;   const waterScore = matchWaterNeeds(crop.water, climate.precipitation);

&nbsp;   const marketScore = getMarketScore(crop.name, benchmarks);



&nbsp;   return {

&nbsp;     name: crop.name,

&nbsp;     score: (soilScore \* 0.35 + climateScore \* 0.30 + waterScore \* 0.20 + marketScore \* 0.15),

&nbsp;     projectedYield: calculateYield(crop, soil, climate),

&nbsp;     projectedRevenue: calculateRevenue(crop, projectedYield, benchmarks)

&nbsp;   };

&nbsp; }).sort((a, b) => b.score - a.score);

}

```



---



\## MapTiler Setup (Free Tier)



1\. Sign up at maptiler.com — free, 100,000 map loads/month

2\. Use the "Hybrid" map style (satellite + road overlay) — best for agriculture

3\. API key goes in `.env.local` as `NEXT\_PUBLIC\_MAPTILER\_KEY`

4\. Style URL: `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`



For local dev without a key, fall back to OpenStreetMap:

```typescript

const FALLBACK\_STYLE = {

&nbsp; version: 8,

&nbsp; sources: { osm: { type: 'raster', tiles: \['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 }},

&nbsp; layers: \[{ id: 'osm', type: 'raster', source: 'osm' }]

};

```



---



\## Environment Variables



```bash

\# .env.local



\# MapTiler (free tier — 100k requests/month)

NEXT\_PUBLIC\_MAPTILER\_KEY=your\_key\_here



\# NOAA Climate Data Online (free, signup required)

NOAA\_CDO\_KEY=your\_key\_here



\# USDA NASS Quick Stats (free, signup required)

NASS\_KEY=your\_key\_here



\# Sentinel Hub (free trial for NDVI)

SENTINEL\_HUB\_CLIENT\_ID=your\_id

SENTINEL\_HUB\_CLIENT\_SECRET=your\_secret



\# No key required: Open-Meteo, NWS, USDA SDA, Nominatim,

\# Open-Elevation, US Drought Monitor, Turf.js, H3

```



---



\## Docker Compose (Local Development)



```yaml

version: '3.8'

services:

&nbsp; db:

&nbsp;   image: timescale/timescaledb-ha:pg16-latest

&nbsp;   # includes PostgreSQL + PostGIS + TimescaleDB

&nbsp;   environment:

&nbsp;     POSTGRES\_DB: plantai

&nbsp;     POSTGRES\_USER: plantai

&nbsp;     POSTGRES\_PASSWORD: plantai

&nbsp;   ports:

&nbsp;     - "5432:5432"

&nbsp;   volumes:

&nbsp;     - postgres\_data:/var/lib/postgresql/data

&nbsp;     - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql



&nbsp; api:

&nbsp;   build: ./api

&nbsp;   ports:

&nbsp;     - "8000:8000"

&nbsp;   environment:

&nbsp;     DATABASE\_URL: postgresql://plantai:plantai@db:5432/plantai

&nbsp;   depends\_on:

&nbsp;     - db

&nbsp;   volumes:

&nbsp;     - ./api:/app



&nbsp; web:

&nbsp;   build: ./web

&nbsp;   ports:

&nbsp;     - "3000:3000"

&nbsp;   environment:

&nbsp;     NEXT\_PUBLIC\_API\_URL: http://localhost:8000

&nbsp;   volumes:

&nbsp;     - ./web:/app



volumes:

&nbsp; postgres\_data:

```



---



\## Database Schema



```sql

-- Enable extensions

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE EXTENSION IF NOT EXISTS h3;



-- Properties table with spatial geometry

CREATE TABLE properties (

&nbsp; id          UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; created\_at  TIMESTAMPTZ DEFAULT NOW(),

&nbsp; name        TEXT,

&nbsp; boundary    GEOMETRY(POLYGON, 4326),  -- PostGIS polygon

&nbsp; centroid    GEOMETRY(POINT, 4326),

&nbsp; area\_acres  FLOAT,

&nbsp; h3\_index\_8  TEXT,   -- regional benchmarking cell

&nbsp; h3\_index\_12 TEXT,   -- local cell

&nbsp; address     TEXT,

&nbsp; state       TEXT,

&nbsp; county      TEXT

);



-- Analysis results

CREATE TABLE analyses (

&nbsp; id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; property\_id   UUID REFERENCES properties(id),

&nbsp; created\_at    TIMESTAMPTZ DEFAULT NOW(),

&nbsp; soil\_data     JSONB,

&nbsp; climate\_data  JSONB,

&nbsp; ndvi\_data     JSONB,

&nbsp; crop\_matrix   JSONB,

&nbsp; economics     JSONB,

&nbsp; irrigation\_map JSONB

);



-- Spatial index for fast geographic queries

CREATE INDEX properties\_boundary\_idx ON properties USING GIST (boundary);

CREATE INDEX properties\_h3\_idx ON properties (h3\_index\_8);

```



---



\## Key Packages to Install



```bash

\# Frontend (Next.js)

npm install maplibre-gl @mapbox/mapbox-gl-draw

npm install three @react-three/fiber @react-three/drei

npm install framer-motion

npm install zustand @tanstack/react-query

npm install @turf/turf h3-js

npm install suncalc  # sun position — free, no API



\# Backend (Python/FastAPI)

pip install fastapi uvicorn sqlalchemy asyncpg

pip install geoalchemy2 shapely

pip install httpx  # async HTTP for API calls

pip install pandas numpy  # crop scoring computation

```



---



\## Build Order for Claude Code



Execute in this sequence for a working MVP:



1\. \*\*Docker Compose + database schema\*\* — get the infrastructure running

2\. \*\*Address search + Nominatim geocoding\*\* — user can type an address and get coordinates

3\. \*\*MapLibre map canvas\*\* — satellite map centered on coordinates, basic UI shell

4\. \*\*Property polygon drawing tool\*\* — user can draw their boundary

5\. \*\*Tap/click popup on any map location\*\* — shows coordinate + soil info card

6\. \*\*USDA + Open-Meteo data pipeline\*\* — fires when polygon is complete

7\. \*\*Loading state UI\*\* — the animated progress screen

8\. \*\*Analysis dashboard (Overview + Soil + Climate tabs)\*\*

9\. \*\*Crop matrix + Economics dashboard\*\* (the pinned features)

10\. \*\*NDVI + irrigation heatmap map layers\*\*

11\. \*\*3D farm visualization with sun simulation\*\*

12\. \*\*Polish: animations, transitions, typography refinement\*\*



---



\## Critical UX Moments to Nail



\*\*The Magic Moment:\*\* User types their address → map flies to their property with a smooth 2-second animation → they can immediately see their actual farm from satellite. This must feel cinematic.



\*\*The Draw Completion:\*\* After the last polygon point is placed and the shape closes → brief green glow pulse on the boundary → acreage counter ticks up → loading analysis begins. Should feel like a satisfying confirmation.



\*\*The Tap Popup:\*\* Tap anywhere on the map, especially inside the drawn polygon → a card instantly appears (under 100ms) with real data for that exact coordinate. This demonstrates the intelligence of the system. No location should feel unknown.



\*\*The Analysis Reveal:\*\* As each data source resolves, the dashboard populates piece by piece with animated number counters and slide-in cards. Never show a blank state — always be revealing something.



\*\*The 3D Moment:\*\* Switching from 2D map to 3D farm — transition should feel like lifting off the ground. Camera moves from bird's-eye → angled perspective shot of the 3D terrain with actual crops placed where the AI recommends them.



