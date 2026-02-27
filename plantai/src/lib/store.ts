import { create } from 'zustand';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface AddressResult {
    displayName: string;
    lat: number;
    lng: number;
    state?: string;
    county?: string;
}

export interface SoilData {
    name: string;
    ph: number;
    organicMatter: number;
    drainage: string;
    sand: number;
    silt: number;
    clay: number;
    awc: number;
    description?: string;
}

export interface ClimateData {
    monthlyTemps: { month: string; min: number; max: number; precip: number }[];
    avgAnnualTemp: number;
    annualPrecip: number;
    growingDays: number;
    hardinessZone: string;
    lastFrost: string;
    firstFrost: string;
}

export interface CropScore {
    name: string;
    score: number;
    soilMatch: number;
    climateMatch: number;
    waterNeed: string;
    laborNeed: string;
    projectedYield: number;
    projectedRevenue: number;
    reason: string;
    companionPlants: string[];
    pestRisks: string[];
    rotationTips: string[];
}

export interface EconomicScenario {
    name: string;
    description: string;
    totalRevenue: number;
    laborReduction: number;
    crops: { name: string; revenue: number; acres: number }[];
    breakEvenMonths: number;
    roi: number;
}

export interface AnalysisData {
    id: string;
    soilData: SoilData | null;
    climateData: ClimateData | null;
    cropMatrix: CropScore[];
    economics: EconomicScenario[];
    ndviValue: number | null;
    elevation: number | null;
    weatherAlerts: string[];
    droughtStatus: string | null;
}

export interface PropertyData {
    polygon: GeoJSON.Feature | null;
    acreage: number;
    centroid: Coordinates | null;
}

interface LoadingStep {
    label: string;
    sublabel: string;
    status: 'pending' | 'loading' | 'done' | 'error';
}

interface AppState {
    // Location
    address: AddressResult | null;
    coordinates: Coordinates | null;
    setAddress: (addr: AddressResult) => void;

    // Property
    property: PropertyData;
    setProperty: (p: PropertyData) => void;

    // Analysis
    analysis: AnalysisData;
    setAnalysis: (a: Partial<AnalysisData>) => void;

    // Loading
    isAnalyzing: boolean;
    loadingSteps: LoadingStep[];
    setIsAnalyzing: (v: boolean) => void;
    updateLoadingStep: (index: number, status: LoadingStep['status']) => void;

    // Map layers
    activeLayers: Record<string, boolean>;
    toggleLayer: (layer: string) => void;

    // UI
    activeTab: string;
    setActiveTab: (tab: string) => void;

    // Reset
    reset: () => void;
}

const defaultLoadingSteps: LoadingStep[] = [
    { label: 'Location identified', sublabel: '', status: 'pending' },
    { label: 'Soil composition', sublabel: 'USDA database', status: 'pending' },
    { label: 'Climate history', sublabel: '30-year normals', status: 'pending' },
    { label: 'Vegetation health', sublabel: 'Sentinel-2 satellite', status: 'pending' },
    { label: 'Crop compatibility matrix', sublabel: '', status: 'pending' },
    { label: 'Economic projections', sublabel: '', status: 'pending' },
];

const defaultAnalysis: AnalysisData = {
    id: '',
    soilData: null,
    climateData: null,
    cropMatrix: [],
    economics: [],
    ndviValue: null,
    elevation: null,
    weatherAlerts: [],
    droughtStatus: null,
};

export const useAppStore = create<AppState>((set) => ({
    address: null,
    coordinates: null,
    setAddress: (addr) => set({ address: addr, coordinates: { lat: addr.lat, lng: addr.lng } }),

    property: { polygon: null, acreage: 0, centroid: null },
    setProperty: (p) => set({ property: p }),

    analysis: defaultAnalysis,
    setAnalysis: (a) => set((state) => ({ analysis: { ...state.analysis, ...a } })),

    isAnalyzing: false,
    loadingSteps: [...defaultLoadingSteps],
    setIsAnalyzing: (v) => set({ isAnalyzing: v, loadingSteps: v ? defaultLoadingSteps.map(s => ({ ...s })) : [] }),
    updateLoadingStep: (index, status) =>
        set((state) => {
            const steps = [...state.loadingSteps];
            if (steps[index]) steps[index] = { ...steps[index], status };
            return { loadingSteps: steps };
        }),

    activeLayers: {
        satellite: true,
        ndvi: false,
        soil: false,
        elevation: false,
        irrigation: false,
        terrain3d: false,
    },
    toggleLayer: (layer) =>
        set((state) => ({
            activeLayers: { ...state.activeLayers, [layer]: !state.activeLayers[layer] },
        })),

    activeTab: 'overview',
    setActiveTab: (tab) => set({ activeTab: tab }),

    reset: () =>
        set({
            address: null,
            coordinates: null,
            property: { polygon: null, acreage: 0, centroid: null },
            analysis: defaultAnalysis,
            isAnalyzing: false,
            loadingSteps: [],
            activeTab: 'overview',
        }),
}));
