'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, AnalysisData } from '@/lib/store';

const spring = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
type TimeBlock = 'morning' | 'midday' | 'afternoon';

interface DailyTask {
    timeBlock: TimeBlock;
    timeRange: string;
    title: string;
    detail: string;
    priority: Priority;
    reasoning: string;
    correlatesTo: string;
    icon: string;
}

interface WeekDay {
    label: string;
    short: string;
    focus: string;
    color: string;
}

// ── Plan Generation Logic ─────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function generateDailyPlan(analysis: AnalysisData, today: Date): DailyTask[] {
    const month = today.getMonth(); // 0-11
    const topCrop = analysis.cropMatrix[0]?.name ?? 'primary crop';
    const secondCrop = analysis.cropMatrix[1]?.name ?? 'secondary crop';
    const pH = analysis.soilData?.ph ?? 6.5;
    const zone = analysis.climateData?.hardinessZone ?? '7';
    const drainage = analysis.soilData?.drainage ?? 'Well drained';
    const growingDays = analysis.climateData?.growingDays ?? 180;
    const organicMatter = analysis.soilData?.organicMatter ?? 2;
    const monthlyTemps = analysis.climateData?.monthlyTemps ?? [];
    const currentMonthTemp = monthlyTemps[month];

    // Season buckets: 0-1 winter, 2-4 early spring, 5-7 summer, 8-10 fall, 11 late winter
    const isMidWinter = month === 12 || month <= 1;
    const isEarlySpring = month >= 2 && month <= 4;
    const isSummer = month >= 5 && month <= 7;
    const isFall = month >= 8 && month <= 10;

    const pHNote = pH < 6.2
        ? `soil pH is ${pH.toFixed(1)} — below optimal, lime application recommended`
        : pH > 7.2
            ? `soil pH is ${pH.toFixed(1)} — slightly alkaline, monitor micronutrient uptake`
            : `soil pH is optimal at ${pH.toFixed(1)}`;

    if (isMidWinter) {
        return [
            {
                timeBlock: 'morning',
                timeRange: '6:00 – 9:00 AM',
                title: 'Soil Health Assessment & Testing',
                detail: `Collect soil core samples from 12-inch depth across three field zones for laboratory pH and nutrient panel analysis.`,
                priority: 'HIGH',
                icon: '🧪',
                reasoning: `Zone ${zone} mid-winter is the ideal window for pre-season soil testing — frozen surface prevents compaction during sampling. Current ${pHNote}.`,
                correlatesTo: `→ Feeds into Agent Swarm Remediation Plan · Informs ${FULL_MONTH_NAMES[(month + 2) % 12]} amendment schedule`,
            },
            {
                timeBlock: 'midday',
                timeRange: '9:00 AM – 1:00 PM',
                title: 'Equipment Maintenance & Calibration',
                detail: `Full inspection of planting equipment, irrigation systems, and precision applicators. Calibrate spreader for ${topCrop} seed spacing.`,
                priority: 'HIGH',
                icon: '⚙️',
                reasoning: `Winter maintenance prevents costly delays at planting. ${topCrop} has a ${analysis.cropMatrix[0]?.score ?? 85}% suitability score — equipment readiness directly impacts yield.`,
                correlatesTo: `→ Prepares for ${FULL_MONTH_NAMES[(month + 2) % 12]} planting window · Aligns with Max Yield economic scenario`,
            },
            {
                timeBlock: 'afternoon',
                timeRange: '1:00 – 5:00 PM',
                title: 'Seed Inventory & Procurement Planning',
                detail: `Audit seed stocks for ${topCrop} and ${secondCrop}. Cross-reference with crop matrix scores and calculate input quantities for target acreage.`,
                priority: 'MEDIUM',
                icon: '📦',
                reasoning: `Growing season is ${growingDays} days. Seed orders placed now secure preferred variety availability and early-order pricing before spring demand peaks.`,
                correlatesTo: `→ Procurement Agent bill of materials · Crop compatibility matrix`,
            },
        ];
    }

    if (isEarlySpring) {
        return [
            {
                timeBlock: 'morning',
                timeRange: '6:30 – 10:00 AM',
                title: 'Cover Crop Termination Assessment',
                detail: `Walk field perimeter and map cover crop biomass density. Identify optimal termination timing (target: 2–3 weeks before ${topCrop} planting).`,
                priority: 'HIGH',
                icon: '🌱',
                reasoning: `${FULL_MONTH_NAMES[month]} in Zone ${zone} is the critical pre-plant window. Early termination allows cover crop residue to break down, improving soil structure for ${topCrop} root development.`,
                correlatesTo: `→ Soil remediation timeline · ${FULL_MONTH_NAMES[(month + 1) % 12]} planting schedule`,
            },
            {
                timeBlock: 'midday',
                timeRange: '10:00 AM – 2:00 PM',
                title: `Soil Moisture & Compaction Survey`,
                detail: `Use penetrometer readings at 50ft intervals to map compaction zones. Check soil moisture at 6" depth — target field capacity before tillage.`,
                priority: 'HIGH',
                icon: '💧',
                reasoning: `${drainage} soil in Zone ${zone} spring can retain excess moisture from snowmelt. Tillage at >80% field capacity causes structural damage that lasts the entire growing season.`,
                correlatesTo: `→ Amendment application readiness · Irrigation scheduling baseline`,
            },
            {
                timeBlock: 'afternoon',
                timeRange: '2:00 – 5:30 PM',
                title: 'Amendment Application Planning',
                detail: `Review soil test results and calculate amendment rates for each field zone. Prepare spreading equipment and schedule lime or fertilizer delivery.`,
                priority: 'MEDIUM',
                icon: '🧬',
                reasoning: `With ${pHNote}, amendments applied 4-6 weeks before planting allow full pH adjustment and nutrient availability for ${topCrop} establishment.`,
                correlatesTo: `→ Agent Swarm amendment plan · USDA EQIP grant application`,
            },
        ];
    }

    if (isSummer) {
        const tempNote = currentMonthTemp
            ? `avg high ${currentMonthTemp.max.toFixed(0)}°C / low ${currentMonthTemp.min.toFixed(0)}°C`
            : 'peak growing conditions';
        return [
            {
                timeBlock: 'morning',
                timeRange: '5:30 – 9:00 AM',
                title: 'Early Irrigation & Crop Scouting',
                detail: `Run irrigation cycle before peak heat. Scout ${topCrop} rows for pest pressure, disease indicators, and nutrient deficiency signs in lower leaves.`,
                priority: 'HIGH',
                icon: '🔍',
                reasoning: `${FULL_MONTH_NAMES[month]} conditions: ${tempNote}. Morning scouting at lower temperatures increases accuracy — pest activity and foliar symptoms are most visible before midday heat stress.`,
                correlatesTo: `→ NDVI health monitoring · Pest risk profile for ${topCrop}`,
            },
            {
                timeBlock: 'midday',
                timeRange: '9:00 AM – 1:00 PM',
                title: 'Precision Fertilizer Side-Dress',
                detail: `Apply nitrogen side-dress to ${topCrop} based on growth stage assessment. Target mid-rows to minimize volatilization during peak temperatures.`,
                priority: 'MEDIUM',
                icon: '⚗️',
                reasoning: `Organic matter at ${organicMatter.toFixed(1)}% provides baseline nutrition but mid-season N is critical for ${topCrop} yield at this growth stage. Apply before 1PM to avoid heat volatilization.`,
                correlatesTo: `→ Economic yield projection · ${FULL_MONTH_NAMES[(month + 2) % 12]} harvest readiness`,
            },
            {
                timeBlock: 'afternoon',
                timeRange: '4:00 – 7:00 PM',
                title: 'Yield Mapping & Data Logging',
                detail: `Update field notes with canopy height, internode spacing, and stand count. Flag any anomalous zones for targeted intervention.`,
                priority: 'LOW',
                icon: '📊',
                reasoning: `Real-time yield data from this growth stage predicts final harvest within 12% accuracy. Data supports Max Yield vs Low Maintenance scenario modeling for financial projections.`,
                correlatesTo: `→ Economic projections · Harvest logistics planning`,
            },
        ];
    }

    if (isFall) {
        return [
            {
                timeBlock: 'morning',
                timeRange: '6:00 – 10:00 AM',
                title: 'Harvest Readiness Inspection',
                detail: `Check moisture content of ${topCrop} at 5 field positions. Target harvest moisture for optimal storage and maximum market pricing.`,
                priority: 'HIGH',
                icon: '🌾',
                reasoning: `${FULL_MONTH_NAMES[month]} in Zone ${zone} brings the first frost risk around ${analysis.climateData?.firstFrost ?? 'mid-October'}. Moisture monitoring prevents post-harvest storage losses and locks in peak market prices.`,
                correlatesTo: `→ Revenue realization for economic scenarios · Cover crop seeding window`,
            },
            {
                timeBlock: 'midday',
                timeRange: '10:00 AM – 2:30 PM',
                title: 'Cover Crop Seed Drilling',
                detail: `Interseed winter cover mix (cereal rye + hairy vetch) into standing or recently harvested ${topCrop} rows at recommended seeding rate.`,
                priority: 'HIGH',
                icon: '🌿',
                reasoning: `Establishing cover crops immediately after harvest maximizes biomass before frost. Cover roots improve ${pHNote} soil structure over winter, reducing next year's amendment needs.`,
                correlatesTo: `→ Next cycle soil remediation baseline · USDA CSP program compliance`,
            },
            {
                timeBlock: 'afternoon',
                timeRange: '2:30 – 5:00 PM',
                title: 'Post-Harvest Soil Sampling',
                detail: `Pull post-harvest soil cores for nutrient depletion analysis. Compare N-P-K readings against pre-season baseline to calibrate next year's amendment plan.`,
                priority: 'MEDIUM',
                icon: '🧪',
                reasoning: `Post-harvest sampling closes the nutrient cycle loop. Comparing to pre-season levels with ${pHNote} reveals crop uptake efficiency and refines the Agent Swarm's remediation model for next season.`,
                correlatesTo: `→ Next season remediation plan · Grant application renewal`,
            },
        ];
    }

    // Default (should not hit for month 11)
    return [
        {
            timeBlock: 'morning',
            timeRange: '7:00 – 10:00 AM',
            title: 'Year-End Field Walk',
            detail: 'Comprehensive field inspection to document current conditions and identify winter preparation priorities.',
            priority: 'MEDIUM',
            icon: '🗺️',
            reasoning: `Late-season assessment in Zone ${zone} sets the baseline for next year's planning cycle.`,
            correlatesTo: '→ Annual planning cycle · Next season crop matrix',
        },
    ];
}

function generateWeekDays(today: Date, month: number): WeekDay[] {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const isSummer = month >= 5 && month <= 7;
    const isFall = month >= 8 && month <= 10;
    const isEarlySpring = month >= 2 && month <= 4;

    const weekFocuses = isSummer
        ? [
            { focus: 'Irrigation', color: '#38bdf8' },
            { focus: 'Scouting', color: '#4ade80' },
            { focus: 'Fertilize', color: '#c2956b' },
            { focus: 'Scouting', color: '#4ade80' },
            { focus: 'Data Log', color: '#8b5cf6' },
            { focus: 'Harvest Prep', color: '#fb923c' },
            { focus: 'Rest', color: '#4a5e47' },
        ]
        : isFall
            ? [
                { focus: 'Harvest', color: '#fb923c' },
                { focus: 'Harvest', color: '#fb923c' },
                { focus: 'Cover Crop', color: '#4ade80' },
                { focus: 'Sampling', color: '#c2956b' },
                { focus: 'Equipment', color: '#8b5cf6' },
                { focus: 'Market', color: '#38bdf8' },
                { focus: 'Rest', color: '#4a5e47' },
            ]
            : isEarlySpring
                ? [
                    { focus: 'Soil Check', color: '#c2956b' },
                    { focus: 'Amendment', color: '#fb923c' },
                    { focus: 'Tillage', color: '#8b5cf6' },
                    { focus: 'Planting', color: '#4ade80' },
                    { focus: 'Irrigation', color: '#38bdf8' },
                    { focus: 'Scouting', color: '#4ade80' },
                    { focus: 'Rest', color: '#4a5e47' },
                ]
                : [
                    { focus: 'Planning', color: '#8b5cf6' },
                    { focus: 'Equipment', color: '#c2956b' },
                    { focus: 'Seed Order', color: '#38bdf8' },
                    { focus: 'Training', color: '#4ade80' },
                    { focus: 'Planning', color: '#8b5cf6' },
                    { focus: 'Equipment', color: '#c2956b' },
                    { focus: 'Rest', color: '#4a5e47' },
                ];

    const todayDow = today.getDay();
    return Array.from({ length: 7 }, (_, i) => {
        const offset = i - todayDow;
        const date = new Date(today);
        date.setDate(today.getDate() + offset);
        return {
            label: dayNames[i],
            short: String(date.getDate()),
            ...weekFocuses[i],
        };
    });
}

// ── Priority Badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
    const colors: Record<Priority, { bg: string; text: string; border: string }> = {
        HIGH: { bg: 'rgba(251,146,60,0.1)', text: '#fb923c', border: 'rgba(251,146,60,0.3)' },
        MEDIUM: { bg: 'var(--color-primary-glow)', text: 'var(--color-primary)', border: 'rgba(74,222,128,0.3)' },
        LOW: { bg: 'var(--color-surface-2)', text: 'var(--color-text-muted)', border: 'var(--color-border)' },
    };
    const c = colors[priority];
    return (
        <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest"
            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontFamily: 'var(--font-mono)' }}>
            {priority}
        </span>
    );
}

// ── Time Block Card ───────────────────────────────────────────────────────────

function TaskCard({ task, index }: { task: DailyTask; index: number }) {
    const blockColors: Record<TimeBlock, string> = {
        morning: '#f59e0b',
        midday: '#4ade80',
        afternoon: '#38bdf8',
    };
    const color = blockColors[task.timeBlock];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 + index * 0.1 }}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-border)', background: 'rgba(17,22,18,0.85)' }}
        >
            {/* Time Block Header */}
            <div className="flex items-center gap-3 px-5 py-3" style={{
                background: `linear-gradient(135deg, ${color}0d, transparent)`,
                borderBottom: '1px solid var(--color-border)',
            }}>
                <span className="text-lg">{task.icon}</span>
                <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color, fontFamily: 'var(--font-mono)' }}>
                        {task.timeBlock.toUpperCase()} · {task.timeRange}
                    </div>
                </div>
                <PriorityBadge priority={task.priority} />
            </div>

            {/* Task Body */}
            <div className="px-5 py-4">
                <h3 className="text-base font-medium mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                    {task.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {task.detail}
                </p>

                {/* Reasoning */}
                <div className="rounded-lg px-4 py-3 mb-3" style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: `1px solid ${color}22`,
                    borderLeft: `3px solid ${color}88`,
                }}>
                    <div className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                        Why Today?
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {task.reasoning}
                    </p>
                </div>

                {/* Correlates To */}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Correlates with</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: 'var(--color-surface-2)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        {task.correlatesTo}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// ── Week Timeline ─────────────────────────────────────────────────────────────

function WeekTimeline({ days, todayDow }: { days: WeekDay[]; todayDow: number }) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.5 }}
            className="rounded-xl p-4 mt-6" style={{ background: 'rgba(17,22,18,0.85)', border: '1px solid var(--color-border)' }}>
            <div className="text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
                This Week's Focus Areas
            </div>
            <div className="grid grid-cols-7 gap-2">
                {days.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className="text-[10px]" style={{
                            color: i === todayDow ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: i === todayDow ? 700 : 400,
                        }}>{day.label}</div>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium"
                            style={{
                                background: i === todayDow ? 'var(--color-primary)' : 'var(--color-surface-2)',
                                color: i === todayDow ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                                fontFamily: 'var(--font-mono)',
                            }}>
                            {day.short}
                        </div>
                        <div className="w-2 h-2 rounded-full" style={{ background: i <= todayDow ? day.color : 'var(--color-border)' }} />
                        <div className="text-[9px] text-center" style={{ color: 'var(--color-text-muted)', lineHeight: 1.2 }}>
                            {day.focus}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DailyFarmPlan() {
    const { analysis, property, address } = useAppStore();

    const today = useMemo(() => new Date(), []);
    const month = today.getMonth();
    const todayDow = today.getDay();

    const tasks = useMemo(() => generateDailyPlan(analysis, today), [analysis, today]);
    const weekDays = useMemo(() => generateWeekDays(today, month), [today, month]);

    const currentMonthData = analysis.climateData?.monthlyTemps[month];
    const topCrop = analysis.cropMatrix[0]?.name;

    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={spring}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Today's Farm Plan
                        </div>
                        <div className="px-2 py-0.5 rounded text-[9px]" style={{
                            background: 'var(--color-primary-glow)',
                            color: 'var(--color-primary)',
                            border: '1px solid rgba(74,222,128,0.25)',
                            fontFamily: 'var(--font-mono)',
                        }}>
                            {MONTH_NAMES[month].toUpperCase()}
                        </div>
                    </div>
                    <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                        {dateStr}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {address?.displayName.split(',').slice(0, 2).join(',')} · {property.acreage} acres
                        {topCrop && ` · Leading crop: ${topCrop}`}
                    </p>
                </div>
            </div>

            {/* Weather Strip for Current Month */}
            {currentMonthData && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.08 }}
                    className="rounded-xl px-5 py-3 mb-6 flex items-center gap-6" style={{
                        background: 'rgba(17,22,18,0.7)',
                        border: '1px solid var(--color-border)',
                    }}>
                    <div className="flex-1 flex items-center gap-6">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                {FULL_MONTH_NAMES[month]} Avg
                            </div>
                            <div className="text-base" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                                {currentMonthData.min.toFixed(0)}° – {currentMonthData.max.toFixed(0)}°C
                            </div>
                        </div>
                        <div style={{ width: 1, height: 32, background: 'var(--color-border)' }} />
                        <div>
                            <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Precipitation</div>
                            <div className="text-base" style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                                {currentMonthData.precip.toFixed(0)} mm
                            </div>
                        </div>
                        <div style={{ width: 1, height: 32, background: 'var(--color-border)' }} />
                        <div>
                            <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Growing Season</div>
                            <div className="text-base" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                                {analysis.climateData?.growingDays ?? '—'} days/yr
                            </div>
                        </div>
                        <div style={{ width: 1, height: 32, background: 'var(--color-border)' }} />
                        <div>
                            <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Hardiness Zone</div>
                            <div className="text-base" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                                Zone {analysis.climateData?.hardinessZone ?? '—'}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Task Cards */}
            <div className="space-y-4">
                {tasks.map((task, i) => (
                    <TaskCard key={i} task={task} index={i} />
                ))}
            </div>

            {/* Weekly Timeline */}
            <WeekTimeline days={weekDays} todayDow={todayDow} />

            {/* Footer Note */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...spring, delay: 0.65 }}
                className="mt-4 px-4 py-3 rounded-lg text-xs" style={{
                    background: 'rgba(74,222,128,0.03)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                }}>
                Plan auto-generated from your soil analysis, climate profile, and crop compatibility matrix.
                Tasks correlate with Agent Swarm remediation phase and economic projections.
            </motion.div>
        </motion.div>
    );
}
