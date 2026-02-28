import { useAppStore } from './store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SwarmSoilInput {
    mu_name: string;
    ph_range: number[];
    organic_matter_pct: number;
    drainage: string;
}

export async function executeSwarm(soilData: SwarmSoilInput, areaAcres: number): Promise<void> {
    const store = useAppStore.getState();

    store.resetSwarm();
    store.setSwarmStatus('running');
    store.setCurrentAgent(1);

    // ── Agent 1: Soil Remediation ─────────────────────────────────────────────
    const r1 = await fetch(`${API_BASE}/api/agent/remediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soil_data: soilData, area_acres: areaAcres }),
    });
    if (!r1.ok) throw new Error(`Remediation agent failed: ${r1.statusText}`);
    const remediation = await r1.json();
    store.setRemediationResult(remediation);
    store.setCurrentAgent(2);

    // ── Agent 2: Procurement ──────────────────────────────────────────────────
    const r2 = await fetch(`${API_BASE}/api/agent/procurement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amendment_plan: remediation.amendment_plan, area_acres: areaAcres }),
    });
    if (!r2.ok) throw new Error(`Procurement agent failed: ${r2.statusText}`);
    const procurement = await r2.json();
    store.setProcurementResult(procurement);
    store.setCurrentAgent(3);

    // ── Agent 3: Finance ──────────────────────────────────────────────────────
    const r3 = await fetch(`${API_BASE}/api/agent/finance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_cost: procurement.total_cost, soil_data: soilData }),
    });
    if (!r3.ok) throw new Error(`Finance agent failed: ${r3.statusText}`);
    const finance = await r3.json();
    store.setFinanceResult(finance);

    store.setSwarmStatus('complete');
}
