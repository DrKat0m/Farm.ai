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

    try {
        // ── Agent 1: Soil Remediation ─────────────────────────────────────────
        const r1 = await fetch(`${API_BASE}/api/agent/remediation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ soil_data: soilData, area_acres: areaAcres }),
        });
        if (!r1.ok) {
            const detail = await r1.text().catch(() => r1.statusText);
            throw new Error(`Remediation agent failed (${r1.status}): ${detail}`);
        }
        const remediation = await r1.json();
        store.setRemediationResult(remediation);
        store.setCurrentAgent(2);

        // ── Agent 2: Procurement ──────────────────────────────────────────────
        const r2 = await fetch(`${API_BASE}/api/agent/procurement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amendment_plan: remediation.amendment_plan, area_acres: areaAcres }),
        });
        if (!r2.ok) {
            const detail = await r2.text().catch(() => r2.statusText);
            throw new Error(`Procurement agent failed (${r2.status}): ${detail}`);
        }
        const procurement = await r2.json();
        store.setProcurementResult(procurement);
        store.setCurrentAgent(3);

        // ── Agent 3: Finance ──────────────────────────────────────────────────
        const r3 = await fetch(`${API_BASE}/api/agent/finance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total_cost: procurement.total_cost, soil_data: soilData }),
        });
        if (!r3.ok) {
            const detail = await r3.text().catch(() => r3.statusText);
            throw new Error(`Finance agent failed (${r3.status}): ${detail}`);
        }
        const finance = await r3.json();
        store.setFinanceResult(finance);

        store.setSwarmStatus('complete');
    } catch (error) {
        // Reset swarm to idle so user can retry
        store.setSwarmStatus('idle');
        store.setCurrentAgent(0);
        throw error;
    }
}
