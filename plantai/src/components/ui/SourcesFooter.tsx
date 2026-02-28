'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DATA_SOURCES } from '@/lib/apiClient';

export default function SourcesFooter() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className="mt-8 rounded-xl overflow-hidden"
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
            }}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-white/[0.02]"
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{
                            background: 'var(--color-primary)',
                            boxShadow: '0 0 6px rgba(74, 222, 128, 0.4)',
                        }}
                    />
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                        Sources & Factuality
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                        background: 'rgba(74, 222, 128, 0.1)',
                        color: 'var(--color-primary)',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        {DATA_SOURCES.length} databases
                    </span>
                </div>
                <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    ▼
                </motion.span>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-4 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                            <div className="pt-4">
                                <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                                    Government & Scientific Data
                                </div>
                                {DATA_SOURCES.filter(s => ['soil', 'climate'].includes(s.category)).map(source => (
                                    <div key={source.id} className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] shrink-0"
                                            style={{
                                                background: 'rgba(74, 222, 128, 0.15)',
                                                color: 'var(--color-primary)',
                                                border: '1px solid rgba(74, 222, 128, 0.3)',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 600,
                                            }}>
                                            {source.id}
                                        </span>
                                        <a href={source.url} target="_blank" rel="noopener noreferrer"
                                            className="text-xs hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
                                            {source.name}
                                        </a>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4">
                                <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                                    Satellite & Economic Data
                                </div>
                                {DATA_SOURCES.filter(s => ['satellite', 'crop', 'economic'].includes(s.category)).map(source => (
                                    <div key={source.id} className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] shrink-0"
                                            style={{
                                                background: 'rgba(74, 222, 128, 0.15)',
                                                color: 'var(--color-primary)',
                                                border: '1px solid rgba(74, 222, 128, 0.3)',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 600,
                                            }}>
                                            {source.id}
                                        </span>
                                        <a href={source.url} target="_blank" rel="noopener noreferrer"
                                            className="text-xs hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
                                            {source.name}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-5 pb-4">
                            <div className="text-[10px] px-3 py-2 rounded-lg" style={{
                                background: 'rgba(74, 222, 128, 0.06)',
                                color: 'var(--color-text-muted)',
                                borderLeft: '2px solid var(--color-primary)',
                            }}>
                                All data points are sourced from U.S. government databases and open scientific APIs. Results are AI-processed for crop suitability matching and economic projections.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
