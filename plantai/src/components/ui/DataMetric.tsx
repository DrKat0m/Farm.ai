'use client';

interface DataMetricProps {
    label: string;
    value: string | number;
    sublabel?: string;
    color?: string;
    className?: string;
}

export default function DataMetric({
    label,
    value,
    sublabel,
    color,
    className = '',
}: DataMetricProps) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <span
                className="text-xs uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}
            >
                {label}
            </span>
            <span
                className="text-lg font-medium"
                style={{
                    color: color || 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                }}
            >
                {value}
            </span>
            {sublabel && (
                <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    {sublabel}
                </span>
            )}
        </div>
    );
}
