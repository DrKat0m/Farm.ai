'use client';

interface CitationPillProps {
    sourceId: number;
    onClick?: () => void;
}

export default function CitationPill({ sourceId, onClick }: CitationPillProps) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-110"
            style={{
                width: 18,
                height: 18,
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                background: 'rgba(74, 222, 128, 0.15)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                boxShadow: '0 0 6px rgba(74, 222, 128, 0.2)',
                marginLeft: 4,
                verticalAlign: 'super',
                lineHeight: 1,
            }}
        >
            {sourceId}
        </button>
    );
}
