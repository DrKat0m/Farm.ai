'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import dynamic from 'next/dynamic';

const FarmScene = dynamic(() => import('@/components/farm/FarmScene'), { ssr: false });

const spring = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

export default function FarmPage() {
    const router = useRouter();
    const { analysis, coordinates, property, address } = useAppStore();
    const [layout, setLayout] = useState('max-yield');
    const [hour, setHour] = useState(14);
    const [dayOfYear, setDayOfYear] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        return Math.floor((now.getTime() - start.getTime()) / 86400000);
    });

    const layouts = [
        { id: 'max-yield', label: 'Max Yield' },
        { id: 'low-maint', label: 'Low Maintenance' },
        { id: 'pest-resist', label: 'Pest Resistant' },
    ];

    const cameraPresets = [
        { id: 'perspective', label: 'Perspective' },
        { id: 'top', label: 'Top View' },
        { id: 'ground', label: 'Ground Level' },
    ];

    if (!analysis.cropMatrix.length) {
        return (
            <div className="w-screen h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                <div className="text-center">
                    <p style={{ color: 'var(--color-text-secondary)' }}>No analysis data. Complete a property analysis first.</p>
                    <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 rounded-full text-sm"
                        style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}>Start over</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <header className="frosted-header flex items-center justify-between px-6 shrink-0 z-30" style={{ height: 56 }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/map')} className="text-sm uppercase tracking-[0.2em] font-semibold"
                        style={{ color: 'var(--color-primary)' }}>PlantAI</button>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        3D Visualization — {address?.displayName.split(',').slice(0, 2).join(',')}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => router.push('/map')} className="px-4 py-1.5 rounded-lg text-xs"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>Map</button>
                    <button onClick={() => router.push(`/analysis/${analysis.id}`)} className="px-4 py-1.5 rounded-lg text-xs"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>Analysis</button>
                </div>
            </header>

            {/* 3D Scene */}
            <div className="flex-1 relative">
                <FarmScene
                    crops={analysis.cropMatrix}
                    layout={layout}
                    lat={coordinates?.lat || 40.79}
                    lng={coordinates?.lng || -77.86}
                    hour={hour}
                    dayOfYear={dayOfYear}
                    acreage={property.acreage || 5}
                />

                {/* Layout Toggle */}
                <motion.div
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1 p-1 rounded-xl"
                    style={{ background: 'rgba(17, 22, 18, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid var(--color-border)' }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                >
                    {layouts.map(l => (
                        <button key={l.id} onClick={() => setLayout(l.id)}
                            className="px-4 py-2 rounded-lg text-xs transition-all"
                            style={{
                                background: layout === l.id ? 'var(--color-primary)' : 'transparent',
                                color: layout === l.id ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                                fontWeight: layout === l.id ? 600 : 400,
                            }}>{l.label}</button>
                    ))}
                </motion.div>

                {/* Sun / Time Controls */}
                <motion.div
                    className="absolute bottom-6 left-6 z-20 p-5 rounded-xl w-72"
                    style={{ background: 'rgba(17, 22, 18, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid var(--color-border)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.2 }}
                >
                    {/* Time of Day */}
                    <div className="mb-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Time of Day</span>
                            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                                {Math.floor(hour).toString().padStart(2, '0')}:{Math.round((hour % 1) * 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                        <input
                            type="range" min={5} max={20} step={0.25} value={hour}
                            onChange={(e) => setHour(parseFloat(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{ background: 'var(--color-border)', accentColor: 'var(--color-primary)' }}
                        />
                    </div>

                    {/* Day of Year */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Season</span>
                            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                                Day {dayOfYear}
                            </span>
                        </div>
                        <input
                            type="range" min={0} max={365} step={1} value={dayOfYear}
                            onChange={(e) => setDayOfYear(parseInt(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{ background: 'var(--color-border)', accentColor: 'var(--color-primary)' }}
                        />
                    </div>
                </motion.div>

                {/* Info Panel */}
                <motion.div
                    className="absolute bottom-6 right-6 z-20 p-5 rounded-xl w-64"
                    style={{ background: 'rgba(17, 22, 18, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid var(--color-border)' }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: 0.3 }}
                >
                    <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                        Active Layout: {layouts.find(l => l.id === layout)?.label}
                    </div>
                    <div className="space-y-2">
                        {analysis.cropMatrix.slice(0, 4).map(crop => (
                            <div key={crop.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
                                <span className="text-xs flex-1" style={{ color: 'var(--color-text-secondary)' }}>{crop.name}</span>
                                <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{crop.score}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
